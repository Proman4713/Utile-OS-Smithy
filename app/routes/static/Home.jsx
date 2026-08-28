import { Button, Col, Row } from '@canonical/react-components';

/**
 * @type {import('react-router').MetaFunction}
 */
export const meta = () => [
	{ title: 'Utile OS Launchpad' }
];

export default function Home() {
	return (
		<>
			<div className='p-section--hero'>
				<div className='row--25-75'>
					<div className='col'>
						<div className='p-section--shallow'>
							<h1>Utile OS Launchpad</h1>
							<h2>Manage Utile OS's package archives.</h2>
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
						<p>The Utile OS XYZ is easy to use for our maintainers <i>and</i> amazing end users.</p> {/* Funny how 'we' have NO users lol, still gotta call them amazing */}
					</Col>
					<Col size={6}>
						<h2>Built on Canonical's Vanilla Framework</h2>
						<h3>Beautiful for maintainers and users.</h3>
					</Col>
				</Row>
			</div>
		</>
	);
}