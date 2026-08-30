import { CommonData } from '../../utils/common';
import createRouteDefinition from '../../utils/createRouteDefinition';
import DBProvider, { DBUser } from '../../utils/DBProvider';
import { getCookie } from '../../utils/toolkit';

export default createRouteDefinition(
	async (request, path) => {
		const username = request.headers.get('username');

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

		const requestedUserData = DBProvider.parseAppUserFromDBUser(requestedDatabaseUser);

		let areSameUser = false;

		// TODO: Make this work with multiple OAuth providers, we should probably have a cookie independent of GitHub
		const userAccessToken = getCookie(request.headers.get('cookie'), 'access_token');
		if (userAccessToken) {
			const userOctokit = DBProvider.initUserOctokit(userAccessToken);

			const userData = await userOctokit.request('GET /user');
			if (userData.status === 200) {
				/*
					TODO: We could just compare userData.data.id and requestedDatabaseUser.github_id, but we 're making the additional request to have this ready
					TODO:	for porting to multiple OAuth providers at one point
				*/

				/**
				 * @type {DBUser}
				 */
				const databaseUser = await DBProvider.DB
					.prepare('SELECT * FROM users WHERE github_id = ?')
					.bind(userData.data.id)
					.first();
				
				if (databaseUser.id === requestedDatabaseUser.id) {
					areSameUser = true;
				}
			}
		}

		if (!areSameUser) {
			const filteredUserData = requestedUserData;
			delete filteredUserData.connections; // Only publicConnections should be shown
			delete filteredUserData.email; // Obviously

			return new Response(JSON.stringify(filteredUserData), {
				headers: CommonData.CORS_HEADERS,
				status: 200
			})
		}

		// They're the same user, happily return everything
		return new Response(JSON.stringify(requestedUserData), {
			headers: CommonData.CORS_HEADERS,
			status: 200
		})
	},
	'GET'
)