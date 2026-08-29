import { CommonData } from '../../utils/common';
import createRouteDefinition from '../../utils/createRouteDefinition';
import { getCookie } from '../../utils/toolkit';

export default createRouteDefinition(
	async (request, path, ghClientSecret, ghClientId) => {
		const cookieHeader = request.headers.get('Cookie') || '';

		const accessToken = getCookie(cookieHeader, 'access_token');
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