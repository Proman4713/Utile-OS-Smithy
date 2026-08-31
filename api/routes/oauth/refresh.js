import { Octokit } from 'octokit';
import { CommonData } from '../../utils/common';
import createRouteDefinition from '../../utils/createRouteDefinition';
import DBProvider, { DBUser, User } from '../../utils/DBProvider';
import { getCookie, refreshAccessToken, userOctokitWithRetry } from '../../utils/toolkit';

// TODO: Change this to somehow load the correct OAuth method depending on the provided cookies?
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

		console.log('Attempting to get user data');
		let authResult;
		try {
			authResult = await userOctokitWithRetry('GET /user', {
				octokit: DBProvider.initUserOctokit(accessToken)
			}, 2, async (octokitInstance) => {
				console.log('Getting user data failed, refreshing token');
				const refreshRequest = await refreshAccessToken(ghClientSecret, ghClientId, refreshToken);

				if (refreshRequest) {
					console.log('Creating new octokit instance after refreshing:', refreshRequest.accessToken);
					// Objects are passed by reference, so we should be able to directly modify it for the fetch function; however, this is difficult to test
					octokitInstance.octokit = DBProvider.initUserOctokit(refreshRequest.accessToken);
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
			console.log('Refresh failed, clearing cookies', e);
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

		/**
		 * @type {User}
		 */
		let userData;

		/**
		 * @type {{ results: DBUser[] }}
		 */
		const { results } = await DBProvider.DB
			.prepare('SELECT * FROM users WHERE github_id = ?')
			.bind(authResult.data.id)
			.run();

		/*
			A user was never created on our database for this GitHub connection, create one
			TODO: This means we automatically assume a user never existed, not that perhaps the user is only adding a new connection. Again, this needs to be changed
			TODO:	once we decide to allow multiple OAuth integrations
		*/
		if (results.length === 0) {
			/**
			 * @type {DBUser}
			 */
			const createdUser = await DBProvider.DB
				.prepare(`INSERT INTO users (github_name, github_id, username, display_name, email) VALUES(?, ?, ?, ?, ${authResult.data.email ? '?' : 'NULL'}) RETURNING *`)
				.bind(
					authResult.data.name,
					authResult.data.id,
					authResult.data.name.toLowerCase(),
					authResult.data.name,
					...(authResult.data.email ? [authResult.data.email] : [])
				)
				.first();
			userData = DBProvider.parseAppUserFromDBUser(createdUser, []); // Just created, no GPG keys
		} else {
			const { results: requestedDatabaseUserGPGKeys } = await DBProvider.DB
						.prepare('SELECT openpgp_fingerprint FROM gpg_keys WHERE user_id = ? AND status = "valid"')
						.bind(results[0].id)
						.run();

			// github_id is a UNIQUE column, so there will only be one result anyway
			userData = DBProvider.parseAppUserFromDBUser(results[0], requestedDatabaseUserGPGKeys);

			// Update database name to match if the user changed their username
			if (results[0].github_name !== authResult.data.name) {
				await DBProvider.DB
					.prepare('UPDATE users SET github_name = ? WHERE github_id = ?')
					.bind(authResult.data.name, authResult.data.id)
					.run();
			}
		}

		return new Response(JSON.stringify(userData), {
			headers: responseHeaders,
			status: 200
		})
	}
)