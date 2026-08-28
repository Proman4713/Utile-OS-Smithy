import { index, route } from "@react-router/dev/routes";

/**
 * @type {import('@react-router/dev/routes').RouteConfig}
 */
export default [
	index('routes/static/Home.jsx'),
	route('/archives', 'routes/archives/Index.jsx'),
	route('/archives/:suite/:component/:name', 'routes/archives/Package.jsx')
];
