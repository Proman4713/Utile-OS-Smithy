import {
	data,
	isRouteErrorResponse,
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLocation,
	useNavigate,
} from "react-router";

import './app.scss';
import { useContext, useEffect, useState } from 'react';
import { applyTheme, CodeSnippet, Col, Navigation, Row } from '@canonical/react-components';
import logo from './assets/SVGs/logo-transparent.svg'

import { PackageProvider } from './contexts/PackageManagement';
import Codeblock from './components/UI/Codeblock';
import { AccountContext } from './contexts/AccountManagement';

/**
 * @type {import("react-router").LinksFunction}
 */
export const links = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&family=Ubuntu+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Inclusive+Sans:ital,wght@0,300..700;1,300..700&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
	{ rel: "icon", href: "/favicon.ico" },
	{ rel: "apple-touch-icon", href: "/logo192.png" }
];

export function Layout({ children }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />

				{/* Embed Data */}
					{/* Twitter, not X */}
					<meta content="summary" property="twitter:card" />
					<meta content="The Utile OS Smithy" property="twitter:title" />
					<meta content="/logo_original.png" property="twitter:image" />

					{/* Open Graph */}
					<meta content="The Utile OS Smithy" property="og:site_name" />

					<meta content="/logo_original.png" property="og:image" />
					<meta name="theme-color" content="#1A5E63" />

					{/* <meta content="https://" property="og:url" /> */}
					<meta property="og:type" content="website" />

					{/* Miscellaneous */}
					<meta name="author" content="Utile OS" />
				{/* End Embed Data */}

				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

// Needs to be in a wrapper component to use the auth context
function AppNavBar() {
	const navigate = useNavigate();
	const location = useLocation();
	const { isAuthenticated, userData } = useContext(AccountContext);

	return (
		<Navigation
			items={[
				{
					label: 'Archives',
					url: '/archives',
					isSelected: location.pathname.startsWith('/archives')
				}, {
					label: 'Maintainers',
					url: '#'
				}, {
					label: 'User Support',
					url: '#'
				}, {
					label: 'User Wiki',
					url: '#'
				}, {
					label: 'Developer Docs',
					url: '#'
				}
			]}
			itemsRight={[{
				alignRight: true,
				label: isAuthenticated ? userData.displayName : 'Log In',
				[!isAuthenticated ? 'url' : null]: `https://github.com/login/oauth/authorize?scope=user:email+offline_access&client_id=${import.meta.env.VITE_APP_GH_CLIENT_ID}`,
				[isAuthenticated ? 'items' : null]: [{
					label: 'Account',
					url: `/account/${userData.username}`
				}, {
					label: 'Log Out',
					url: '#',
					onclick: () => {}
				}]
			}]}
			logo={<img style={{ cursor: 'pointer' }} onClick={() => navigate('/')} src={logo} height='32px' alt='Logo' loading='lazy' />}

			generateLink={({ url, label, ...props }) => {
				if (url.startsWith('http')) {
					return (
						<a href={url} {...props}>
							{label}
						</a>
					)
				}

				return (
					<Link to={url} {...props}>
						{label}
					</Link>
				)
			}}
		/>
	)
}

/**
 * @type {import('react-router').LoaderFunction}
 * @param {import('react-router').LoaderFunctionArgs} param0 
 */
export async function loader({ request }) {
	/*
		TODO: Multiple OAuth methods. I would use the custom authentication flow I made for other projects (that didn't need to rely on any
		TODO:	external OAuth), but I think I should start fresh with Smithy.

		! I will NOT have my loaders serve as the API, or this codebase will become as 'readable' as sign language
	*/

	const cookieHeader = request.headers.get('Cookie') || '';
	const rootURL = new URL(request.url).origin;
	let authenticated;
	let userData;

	console.log('Checking auth and refreshing', rootURL)
	const checkResult = await fetch(`${rootURL}/api/oauth/check`, {
		headers: {
			'Cookie': cookieHeader
		}
	});
	if (checkResult.status === 200) authenticated = true;
	else authenticated = false;

	console.log(`/api/oauth/check`, checkResult.status, checkResult.statusText, await checkResult.text())

	if (!authenticated) {
		return;
	} else {
		const refreshResult = await fetch(`${rootURL}/api/oauth/refresh`, {
			headers: {
				'Cookie': cookieHeader
			}
		});
		console.log(`/api/oauth/refresh`, refreshResult.status)
		
		authenticated = refreshResult.ok;
		if (refreshResult.ok) {
			const responseData = await refreshResult.json();
			console.log(`refresh result`, responseData)
			console.log(responseData);
			userData = responseData;
		} else {
			// Make the cookie headers work
			const forwardedCookies = refreshResult.headers.get('Set-Cookie');

			console.log(`Returning failed refresh`)
			return data(await refreshResult.text(), {
				headers: forwardedCookies ? { 'Set-Cookie': forwardedCookies } : {}
			})
		}
	}

	return { authenticated, userData }
}

/*
	Since our authentication is same-site, we used loaders to eliminate content flickers for the end user, but then the loader would rerun on every navigation,
	which is redundant and rate limit–inducing behaviour. We disable revalidation for the root path unless a form action triggered it.
*/
export function shouldRevalidate({ currentUrl, nextUrl, formAction, defaultShouldRevalidate }) {
	if (!formAction) return false;
	return defaultShouldRevalidate;
}

export default function App({ loaderData }) {
	useEffect(() => {
		applyTheme('dark');
	}, []);

	return (
		// in case the loader never returns something due to refresh failure
		<AccountContext.Provider value={{ isAuthenticated: loaderData.authenticated || false, userData: loaderData.userData || {} }}>
			<PackageProvider>
				<AppNavBar />
				<Outlet />
				<hr />
				<footer className='l-footer--sticky p-strip'>
					<div className='l-docs__subgrid'>
						<div className='l-docs__sidebar u-fixed-width'>
							<p>Licensed GPLv3</p>
						</div>
						<div className='l-docs__main'>
							<Row>
								<nav className='col-3' aria-label='Footer'>
									<ul className='p-list'>
										<li className='p-list__item'>
											<a href='https://github.com/Proman4713/Utile-OS'>OS Build Repository</a>
										</li>
										<li className='p-list__item'>
											<a href='https://github.com/Proman4713/Utile-OS-Debian'>Package Sources</a>
										</li>
										<li className='p-list__item'>
											<a href='https://github.com/Proman4713/Utile-OS-Smithy'>Smithy Source</a>
										</li>
									</ul>
								</nav>
								<Col size={9}>
									<p>Smithy is part of the <a href='https://utile-os-web.mailworker.workers.dev/about'>Utile OS project</a>, a minimum-friction Linux desktop. <a href='https://buymeacoffee.com/codeswallop'>Support it if you can</a>.</p>
								</Col>
							</Row>
						</div>
					</div>
				</footer>
			</PackageProvider>
		</AccountContext.Provider>
	);
}

export function ErrorBoundary({ error }) {
	let message = 'We have a problem :(';
	let details = 'An unexpected error occurred.';
	let stack;

	if (isRouteErrorResponse(error)) {
		message = `Error ${error.status}`;
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	useEffect(() => {
		applyTheme('dark');
	}, []);

	return (
		<div className='p-section'>
			<Row>
				<Col>
					<h1>{message}</h1>
					<p>{details}</p>
					{stack && <Codeblock
						code={stack}
						title='Error Stack'
					/>}
				</Col>
			</Row>
		</div>
	)
}