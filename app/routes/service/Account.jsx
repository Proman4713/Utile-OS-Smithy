import { useCallback, useContext, useMemo, useState } from 'react';
import { AccountContext } from '../../contexts/AccountManagement';
import { data } from 'react-router';
import { Chip, Col, ICONS, List, Row, Switch, Textarea, useNotify } from '@canonical/react-components';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * @type {import('react-router').MetaFunction}
 */
export const meta = ({ params, loaderData }) => [
	{ title: `${loaderData.displayName} — Smithy — Utile OS` }
]

/**
 * @type {import('react-router').LoaderFunction}
 * @param {import('react-router').LoaderFunctionArgs} param0
 */
export async function loader({ request, params }) {
	const cookieHeader = request.headers.get('Cookie') || '';
	const rootURL = new URL(request.url).origin;

	const result = await fetch(`${rootURL}/api/profiles/get`, {
		headers: {
			'Cookie': cookieHeader,
			username: params.username
		}
	});
	if (!result.ok) throw data(result.statusText, { status: result.status })
	const userData = await result.json();
	
	return userData;
}

export default function Account({ params, loaderData }) {
	const { userData } = useContext(AccountContext);
	const [isPreview, setIsPreview] = useState(false);
	const isMe = useMemo(() => userData.username === params.username && !isPreview, [isPreview, params.username, userData.username]);

	/*
		TODO: I can't @type this since the mock type is on the back-end, and importing it here would cause issues, perhaps we could find a solution
		TODO:	at one point that doesn't require copy-pasting (even if I wanted to use TypeScript, could I use types declared outside of app/ without
		TODO:	issues?)
	*/ 
	const [requestedUserData, setRequestedUserData] = useState(loaderData);

	const [isEditingDescription, setIsEditingDescription] = useState(false);
	const [temporaryDescription, setTemporaryDescription] = useState(requestedUserData.description || '');
	const notify = useNotify();

	const updateDescription = useCallback(async () => {
		const response = await fetch('/api/profiles/update-description', {
			body: temporaryDescription,
			method: 'POST'
		});

		if (!response.ok) {
			notify.failure(`Failed to update description`, await response.text());
			return;
		}

		setRequestedUserData(await response.json());
		setIsEditingDescription(false);
	}, [notify, temporaryDescription]);

	return (
		<>
			<div className='p-section--hero'>
				<div className='row--25-75'>
					<div className='col'>
						<div className='p-section--shallow'>
							<div className='flex-row justify-space-between'>
								<h1>
									{requestedUserData.displayName} (ID: {requestedUserData.id})
								</h1>
								{(isMe || isPreview) // Only show it when we're the user, but also if we're in preview so it isn't hidden
								&& <Switch
									label={isPreview ? 'Public View' : 'Normal View'}
									checked={isPreview}
									onChange={e => setIsPreview(e.target.checked)}
								/>}
							</div>
							<div className='flex-row'>
								{isMe
								&& <Chip
									value={isEditingDescription ? 'Cancel' : 'Edit Description'}
									iconName={isEditingDescription ? ICONS.error : ICONS.plus}
									onClick={() => {
										if (isEditingDescription) {
											setIsEditingDescription(false);
											setTemporaryDescription(requestedUserData.description || '');
											return;
										}
										setIsEditingDescription(true);
									}}
									appearance='caution'
								/>}

								{isMe && isEditingDescription
								&& <Chip
									value={'Update'}
									iconName={ICONS.success}
									onClick={updateDescription}
									appearance='positive'
									disabled={temporaryDescription === requestedUserData.description}
								/>}
							</div>

							<div>
								{(!isEditingDescription || !isMe) // Added for preview mode while editing
								&& <p style={{ whiteSpace: 'preserve' }}>
									{requestedUserData.description || 'No description.'}
								</p>}

								{/* Only if it's us and we're editing */}
								{(isMe && isEditingDescription)
								&& <Textarea style={{ minHeight: 100, maxHeight: 200, resize: 'vertical' }}
									value={temporaryDescription}
									onChange={e => setTemporaryDescription(e.target.value)}
								/>}
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className='section-row'>
				<Row>
					<hr />
					<Col>
						<h2>User Info</h2>
						<List
							split
							divided
							items={[
								`Username: ${requestedUserData.username}`,

								// Private email
								...(isMe ? [
									<span key={1}>
										Email: {requestedUserData.email || 'No Email Specified'}
										{/* // TODO: Editing the email */}
									</span>
								] : []),

								// Connections
								<>
									<p style={{ margin: 0 }}>Connections:</p>
									<List
										items={(isMe ? requestedUserData.connections : requestedUserData.publicConnections).map((connection, i) => {
											let icon = faQuestion;
											let url = null;

											switch (connection.type) {
												case 'github':
													icon = faGithub;
													url = `https://github.com/${connection.displayName}`;
													break;
											
												default:
													break;
											}

											return (
												<span key={i}>
													<FontAwesomeIcon icon={icon} style={{ fontSize: '1rem' }} />&nbsp;
													<a href={url}>{connection.displayName}</a>
												</span>
											)
										})}
									/>
								</>,

								`Member since: ${new Date(requestedUserData.creationDate).toLocaleDateString('en-ZA')}`,

								`OpenPGP public keys: None`,

								// Some social mechanics probably not soon to come
								<>
									<p style={{ margin: 0 }}>Recent uploads:</p>
									<List
										items={[].map((upload, i) => {
											
										})}
									/>
								</>,
							]}
						/>
					</Col>
				</Row>
			</div>
		</>
	);
}