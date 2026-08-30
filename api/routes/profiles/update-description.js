import { CommonData } from '../../utils/common';
import createRouteDefinition from '../../utils/createRouteDefinition';
import DBProvider, { DBUser } from '../../utils/DBProvider';
import { getCookie } from '../../utils/toolkit';

export default createRouteDefinition(
	async (request, path) => {
		const newDescription = await request.text();

		// TODO: Adapt to multiple OAuth providers
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


		const updatedDatabaseUser = await DBProvider.DB
			.prepare('UPDATE users SET description = ? WHERE github_id = ? RETURNING *')
			.bind(newDescription, userGHId)
			.first();
		const updatedUser = DBProvider.parseAppUserFromDBUser(updatedDatabaseUser);

		return new Response(JSON.stringify(updatedUser), {
			headers: CommonData.CORS_HEADERS,
			status: 200
		});
	},
	'POST'
)