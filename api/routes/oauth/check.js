import { CommonData } from '../../utils/common';
import createRouteDefinition from '../../utils/createRouteDefinition';
import { getCookie } from '../../utils/toolkit';

export default createRouteDefinition(
	async (request, path, ghClientSecret, ghClientId) => {
		const cookieHeader = request.headers.get('Cookie') || '';

		//dbg console.log(ghClientSecret, ghClientId)
		/*
			If the user has both the refresh token *and* the access token, then the 'GET /user' request in /oauth/refresh will work on the first try and we won't
			have to generate a new one, and if the user only has the refresh token, then that request will fail and the token will be generated on the second try.
			If the user has neither, we have nothing to work with, so they're unauthenticated.

			The GitHub docs at https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authenticating-to-the-rest-api-with-an-oauth-app had the primary check
			be for the access token, which is incorrect in production when dealing with expiring cookies.
		*/
		const accessToken = getCookie(cookieHeader, 'refresh_token');
		if (accessToken) {
			return new Response('Authenticated', {
				headers: CommonData.CORS_HEADERS,
				status: 200
			})
		} else {
			return new Response('Unauthenticated', {
				headers: CommonData.CORS_HEADERS,
				status: 401
			})
		}
	},
	'GET'
)