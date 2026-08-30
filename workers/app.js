import {
	createRequestHandler
} from 'react-router';
import { CommonData } from '../api/utils/common';
import DBProvider from '../api/utils/DBProvider';

const requestHandler = createRequestHandler(
	() => import('virtual:react-router/server-build'),
	import.meta.env.MODE,
);

export default {
	async fetch(request, env, ctx) {
		if (new URL(request.url).pathname.startsWith('/api')) {
			if (request.method === "OPTIONS") {
				return new Response("OK", {
					headers: CommonData.CORS_HEADERS
				});
			} else if (['POST', 'GET', 'PUT', 'DELETE'].includes(request.method)) {
				return await runWorker(request, env);
			} else {
				return new Response("Method not allowed", {
					status: 405,
					headers: CommonData.CORS_HEADERS
				});
			}
		}
		return requestHandler(request);
	},
};

// We need this because we have Vite, and that doesn't work with injecting variables directly into imports
const modules = import.meta.glob("../api/routes/**/*.js");

/** 
 *
 * @param {Request} request - the incoming request object
 * @param {{ GH_CLIENT_ID: string, GH_CLIENT_SECRET: string, DB: import('@cloudflare/workers-types').D1Database }} env 
 * @return {Promise<Response>} the response object containing the result of the database operation or an error message
 */
async function runWorker(request, env) {
	await DBProvider.initOctokit(env.GH_CLIENT_ID, env.GH_CLIENT_SECRET);
	DBProvider.init(env.DB);

	const url = new URL(request.url);
	let path = url.pathname.slice(1);

	if (path.endsWith("/")) {
		path = path.slice(0, -1);
	}
	path = path.replace('api/', '');
	console.log(`../api/routes/${path}.js`)

	let pathModule;
	try {
		pathModule = await modules[`../api/routes/${path}.js`]();
	} catch (e) {
		console.log(`Error importing module: ${e}`)
		pathModule = null;
	}

	if (pathModule?.default?.execute) {
		const response = await pathModule.default.execute(request, path, env.GH_CLIENT_SECRET, env.GH_CLIENT_ID);
		return response;
	}
	else {
		return new Response("Invalid endpoint", {
			status: 400,
			headers: CommonData.CORS_HEADERS
		});
	}
}