import { Button, Col, Row } from '@canonical/react-components';
import { Link } from 'react-router';

/**
 * @type {import('react-router').MetaFunction}
 */
export const meta = () => [
	{ title: 'Smithy — Utile OS' }
];

export default function Home() {
	return (
		<>
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
						<Button appearance='base'>
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
						{/* Funny how 'we' have NO users lol, still gotta call them amazing */}
						<p>The Utile OS Smithy is easy to use for our maintainers <i>and</i> amazing end users. It&apos;s a functional interface for all of our software packages and bug reports.</p>
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