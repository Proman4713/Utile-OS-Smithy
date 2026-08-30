import { CommonData } from '../../utils/common';
import createRouteDefinition from '../../utils/createRouteDefinition';
import DBProvider from '../../utils/DBProvider';

export default createRouteDefinition(
	async (request, path, ghClientSecret, ghClientId) => {
		const sessionCode = new URL(request.url).searchParams.get('code');

		//dbg console.log(ghClientId, ghClientSecret)
		// TODO: Figure out how on earth this is supposed to be done with our Octokit instance (my luck with documentation will never be matched)
		const result = await fetch('https://github.com/login/oauth/access_token', {
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				client_id: ghClientId,
				client_secret: ghClientSecret,
				code: sessionCode
			}),
			method: 'POST'
		});

		const jsonRes = await result.json();

		if (jsonRes.error) {
			return new Response(`Error processing request: ${jsonRes.error_description} (${jsonRes.error})`, {
				headers: CommonData.CORS_HEADERS,
				status: 500
			})
		}

		const responseHeaders = new Headers(CommonData.CORS_HEADERS);
		responseHeaders.append('Location', '/');

		console.log(jsonRes);
		responseHeaders.append('Set-Cookie', `access_token=${jsonRes.access_token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${jsonRes.expires_in}`);
		responseHeaders.append('Set-Cookie', `refresh_token=${jsonRes.refresh_token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${jsonRes.refresh_token_expires_in}`);

		return new Response(null, {
			headers: responseHeaders,
			status: 302
		});
	},
	"GET"
)