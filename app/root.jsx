import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import './app.scss';
import { useEffect, useState } from 'react';
import { applyTheme, CodeSnippet, Col, Navigation, Row } from '@canonical/react-components';
import logo from './assets/SVGs/logo-transparent.svg'

import hljs from 'highlight.js';
import javascript from 'highlight.js/lib/languages/javascript';
import 'highlight.js/styles/github-dark.css';
import JSXParse from 'html-react-parser';

hljs.registerLanguage('javascript', javascript);

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
					<meta content="Utile OS Launchpad" property="twitter:title" />
					<meta content="/logo_original.png" property="twitter:image" />

					{/* Open Graph */}
					<meta content="Utile OS Launchpad" property="og:site_name" />

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

export default function App() {
	useEffect(() => {
		applyTheme('dark')
	}, []);

	return (
		<>
			<Navigation
				items={[
					{
						label: 'Home',
						url: '/'
					}, {
						label: 'Packages',
						url: '#'
					}, {
						label: 'Archives',
						url: '#'
					}, {
						label: 'Maintainers',
						url: '#'
					}, {
						label: 'Bugs',
						url: '#'
					}
				]}
				logo={<img src={logo} height='32px' alt='Logo' loading='lazy' />}
			/>
			<Outlet />
		</>
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

	const [highlightedCode, setHighlightedCode] = useState('');

	useEffect(() => {
		if (stack) setHighlightedCode(JSXParse(hljs.highlight(stack, { language: 'javascript' }).value));
	}, [stack]);

	return (
		<div className='p-section'>
			<Row>
				<Col>
					<h1>{message}</h1>
					<p>{details}</p>
					{stack && <CodeSnippet
						blocks={[
							{
								title: 'Error Stack',
								code: highlightedCode
							}
						]}
					/>}
				</Col>
			</Row>
		</div>
	)
}