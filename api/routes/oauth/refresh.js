import { Octokit } from 'octokit';
import { CommonData } from '../../utils/common';
import createRouteDefinition from '../../utils/createRouteDefinition';
import DBProvider from '../../utils/DBProvider';
import { getCookie, refreshAccessToken, userOctokitWithRetry } from '../../utils/toolkit';

export default createRouteDefinition(
	async (request, path, ghClientSecret, ghClientId) => {
		let scopes = [];

		const reqHeaders = request.headers.get('Cookie') || '';

		const currentAccessToken = getCookie(reqHeaders, 'access_token');
		let accessToken = currentAccessToken;
		let accessTokenAge;

		const currentRefreshToken = getCookie(reqHeaders, 'refresh_token');
		let refreshToken = currentRefreshToken;
		let refreshTokenAge;

		const failedResponseHeaders = new Headers(CommonData.CORS_HEADERS);
		failedResponseHeaders.append('Location', '/');

		// Remove them
		failedResponseHeaders.append('Set-Cookie', `access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0;`);
		failedResponseHeaders.append('Set-Cookie', `refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0;`);

		let authResult;
		try {
			authResult = await userOctokitWithRetry('GET /user', {
				octokit: new Octokit({ auth: accessToken })
			}, 2, async (octokitInstance) => {
				const refreshRequest = await refreshAccessToken(ghClientSecret, ghClientId, refreshToken);

				if (refreshRequest) {
					// Objects are passed by reference, so we should be able to directly modify it for the fetch function; however, this is difficult to test
					octokitInstance.octokit = new Octokit({ auth: refreshRequest.accessToken });
					accessToken = refreshRequest.accessToken;
					accessTokenAge = refreshRequest.accessTokenAge;
					refreshToken = refreshRequest.refreshToken;
					refreshTokenAge = refreshRequest.refreshTokenAge;
					return true;
				}

				accessToken = null;
				refreshToken = null;
				return false;
			});
		} catch (e) {
			//dbg console.log(e);
			return new Response(`Unauthenticated: ${e}`, {
				headers: failedResponseHeaders,
				status: 401
			})
		}

		if (!refreshToken && !accessToken) {
			return new Response(`Unauthenticated: No refresh/access tokens`, {
				headers: failedResponseHeaders,
				status: 401
			})
		}

		if (authResult.headers['x-oauth-scopes']) {
			scopes = authResult.headers['x-oauth-scopes'].split(',');
		}

		for (const scope of DBProvider.SCOPES) {
			const topLevelScope = scope.split(':')[0];

			if (!(scopes.includes(scope) || scopes.includes(topLevelScope))) {
				return new Response('Invalid Scopes', {
					headers: CommonData.CORS_HEADERS,
					status: 400
				});
			}
		}

		const responseHeaders = new Headers(CommonData.CORS_HEADERS);
		responseHeaders.append('Location', '/');

		/*
			There's no way to get the current Max-Age of a cookie as the server (we're in /api right now), so the *Age variables would be null.
			So we only send the Set-Cookie headers if the cookies changed, meaning we refreshed and successfully set the *Age variables.
		*/
		if (accessToken !== currentAccessToken)
			responseHeaders.append('Set-Cookie', `access_token=${accessToken}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${accessTokenAge}`);
		if (refreshToken !== currentRefreshToken)
			responseHeaders.append('Set-Cookie', `refresh_token=${refreshToken}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${refreshTokenAge}`);

		return new Response(JSON.stringify(authResult.data), {
			headers: responseHeaders,
			status: 200
		})
	}
)