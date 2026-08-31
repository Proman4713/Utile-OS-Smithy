import { CommonData } from '../../utils/common';
import createRouteDefinition from '../../utils/createRouteDefinition';
import DBProvider, { DBUser } from '../../utils/DBProvider';
import { getCookie } from '../../utils/toolkit';

export default createRouteDefinition(
	async (request, path) => {
		const fingerprintToRemove = await request.text();

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

		// Although each fingerprint is unique, we don't trust if someone won't sent a deletion request for a key other than theirs
		const  {meta } = await DBProvider.DB
			.prepare(`UPDATE gpg_keys SET status = "revoked", revocation_date = "${new Date().toISOString()}" WHERE user_id = ? AND openpgp_fingerprint = ?`)
			.bind(databaseUser.id, fingerprintToRemove.toUpperCase())
			.run();

		if (meta.changes === 0) {
			return new Response('OpenPGP key not found.', {
				headers: CommonData.CORS_HEADERS,
				status: 404
			});
		}

		return new Response('OpenPGP key removed.', {
			headers: CommonData.CORS_HEADERS,
			status: 200
		});
	},
	'POST'
)