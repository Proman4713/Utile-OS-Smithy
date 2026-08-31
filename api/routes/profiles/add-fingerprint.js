import { CommonData } from '../../utils/common';
import createRouteDefinition from '../../utils/createRouteDefinition';
import DBProvider, { DBUser } from '../../utils/DBProvider';
import { getCookie } from '../../utils/toolkit';

export default createRouteDefinition(
	async (request, path) => {
		const newFingerprint = await request.text();

		// Check that key exists
		const keyserverResult = await fetch(`https://keyserver.ubuntu.com/pks/lookup?fingerprint=on&op=index&search=0x${newFingerprint.toLowerCase()}`);
		if (!keyserverResult.ok) {
			return new Response('OpenPGP key not found on keyserver.ubuntu.com', {
				headers: CommonData.CORS_HEADERS,
				status: keyserverResult.status
			});
		}

		// TODO: Adapt to multiple OAuth providers and abstract away this code
		const userAccessToken = getCookie(request.headers.get('cookie'), 'access_token');
		if (!userAccessToken) {
			// The worst thing about standard HTTP responses is that I have to remember to use American spelling
			return new Response('Unauthorized', {
				headers: CommonData.CORS_HEADERS,
				status: 401
			});
		}

		const userOctokit = DBProvider.initUserOctokit(userAccessToken);
		let userGHId;
		
		try {
			userGHId = (await userOctokit.request('GET /user')).data.id;
		} catch (error) {
			return new Response(error.response.data.message, {
				headers: CommonData.CORS_HEADERS,
				status: error.status
			})
		}

		/**
		 * @type {DBUser}
		 */
		const databaseUser = await DBProvider.DB
			.prepare('SELECT * FROM users WHERE github_id = ?')
			.bind(userGHId)
			.first();

		try {
			await DBProvider.DB
				.prepare('INSERT INTO gpg_keys (user_id, openpgp_fingerprint) VALUES(?, ?)')
				.bind(databaseUser.id, newFingerprint.toUpperCase())
				.run();
		} catch (error) {
			const message = error?.message || '';

			if (message.includes('UNIQUE constraint failed')) {
				return new Response('OpenPGP key has been registered previously on Smithy.', {
					headers: CommonData.CORS_HEADERS,
					status: 409
				});
			}

			if (message.includes('CHECK constraint failed')) {
				return new Response('Invalid OpenPGP fingerprint.', {
					headers: CommonData.CORS_HEADERS,
					status: 409
				});
			}

			throw error; // Anything we couldn't deal with
		}

		return new Response('OpenPGP key registered.', {
			headers: CommonData.CORS_HEADERS,
			status: 200
		});
	},
	'POST'
)