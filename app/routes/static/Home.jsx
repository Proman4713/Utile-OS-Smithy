import { Button, Col, Row } from '@canonical/react-components';
import { Link, useNavigate } from 'react-router';

/**
 * @type {import('react-router').MetaFunction}
 */
export const meta = () => [
	{ title: 'Smithy — Utile OS' }
];

export default function Home() {
	const navigate = useNavigate();

	return (
		<>
			<meta property="og:title" content="Homepage" />
			<meta property="twitter:title" content="Homepage" />
			<meta property="og:description" content="Utile OS's package archive management service." />
			<meta name="description" content="Utile OS's package archive management service." />

			<div className='p-section--hero'>
				<div className='row--25-75'>
					<div className='col'>
						<div className='p-section--shallow'>
							<h1>The utile (as in useful) Smithy</h1>
							<h2>Utile OS&apos;s package archive management service.</h2>
						</div>
						<Button appearance='positive'>
							Upload
						</Button>
						<Button>
							Build
						</Button>
						<Button appearance='base' onClick={() => navigate('/archives')}>
							View Packages
						</Button>
					</div>
				</div>
			</div>
			<div className='p-section'>
				<Row>
					<hr />
					<Col size={6}>
						<h2>Built on the Vanilla UI framework</h2>
						<p>Smithy is easy to use for our maintainers <i>and</i> aspiring contributors. It&apos;s a functional interface for all of our software packages, developer documentation, and technical bug reports.</p>
					</Col>
					<Col size={6}>
						<h2>Designed for scalability</h2>
						<p>While our approaches may change at any point, this interface is pragmatically designed to present information as best as it can, no matter what happens on the back end</p>
					</Col>
				</Row>
			</div>
			<div className='p-section'>
				<Row>
					<hr />
					<div className='col'>
						<h2>Start smithing</h2>
						<p>&lsquo;Smithy&lsquo; is a word for &lsquo;forge&lsquo;, just like &lsquo;utile&lsquo; is a word for &lsquo;useful&lsquo;. Get started smithing some packages for Utile OS by <Link to="#">becoming a maintainer.</Link></p>
					</div>
				</Row>
			</div>
		</>
	);
}