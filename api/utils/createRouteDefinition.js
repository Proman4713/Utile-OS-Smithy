/**
 * Creates new route definition.
 * @param {(request: Request, path: string, ghClientSecret: string, ghClientId: string, ...args: (string)[]) => Promise<Response>} execute The request handler
 * @param {"GET"|"POST"|"PUT"|"DELETE"} method the http method used
 * @returns {{ execute: Promise<Response> }} The new route definition
 */
export default (execute, method = "GET") => ({
	/**
	 * 
	 * @param {Request} request The incoming request
	 * @param {string} path The endpoint
	 * @param {string} ghClientSecret GitHub OAuth App client secret
	 * @param {string} ghClientId GitHub OAuth App client ID
	 * @param {...(string)} args - Additional string arguments.
	 * @returns {Promise<Response>}
	 */
	execute: (request, path, ghClientSecret, ghClientId, ...args) => {
		if (request.method !== method) {
			return new Response(null, {
				status: 405,
				statusText: "Method Not Allowed"
			})
		}
		return execute(request, path, ghClientSecret, ghClientId, ...args);
	}
})