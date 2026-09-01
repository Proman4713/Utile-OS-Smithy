import { CommonData } from '../../utils/common';
import createRouteDefinition from '../../utils/createRouteDefinition';
import DBProvider, { DBUser } from '../../utils/DBProvider';
import { getCookie } from '../../utils/toolkit';

export default createRouteDefinition(
	async (request, path) => {
		const username = request.headers.get('username');
		console.log(`Fetching profile for ${username}`);

		/**
		 * @type {DBUser}
		 */
		const requestedDatabaseUser = await DBProvider.DB
			.prepare('SELECT * FROM users WHERE username = ?')
			.bind(username)
			.first();
		
		if (!requestedDatabaseUser) {
			return new Response('Requested User Not Found', {
				headers: CommonData.CORS_HEADERS,
				status: 404
			})
		}

		const { results: requestedDatabaseUserGPGKeys } = await DBProvider.DB
			.prepare('SELECT openpgp_fingerprint FROM gpg_keys WHERE user_id = ? AND status = "valid"')
			.bind(requestedDatabaseUser.id)
			.run();

		const requestedUserData = DBProvider.parseAppUserFromDBUser(requestedDatabaseUser, requestedDatabaseUserGPGKeys);

		let areSameUser = false;

		// TODO: Make this work with multiple OAuth providers, we should probably have a cookie independent of GitHub
		const userAccessToken = getCookie(request.headers.get('cookie'), 'access_token');
		// If there's no access token, they should still be able to view profiles; areSameUser would never be true
		if (userAccessToken) {
			const userOctokit = DBProvider.initUserOctokit(userAccessToken);

			const userGHData = await userOctokit.request('GET /user');
			if (userGHData.status === 200) {
				/*
					TODO: We could just compare userGHData.data.id and requestedDatabaseUser.github_id, but we 're making the additional request to have this ready
					TODO:	for porting to multiple OAuth providers at one point
				*/

				/**
				 * @type {DBUser}
				 */
				const databaseUser = await DBProvider.DB
					.prepare('SELECT id FROM users WHERE github_id = ?')
					.bind(userGHData.data.id)
					.first();
				
				if (databaseUser.id === requestedDatabaseUser.id) {
					areSameUser = true;
				}
			}
		}

		if (!areSameUser) {
			delete requestedUserData.connections; // Only publicConnections should be shown
			delete requestedUserData.email; // Obviously
		}

		//dbg console.log(`Returning profile for ${username}`, requestedUserData.displayName, requestedUserData.gpgKeys);

		// They're the same user, happily return everything
		return new Response(JSON.stringify(requestedUserData), {
			headers: CommonData.CORS_HEADERS,
			status: 200
		})
	},
	'GET'
)