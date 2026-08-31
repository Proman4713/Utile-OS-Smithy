import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AccountContext } from '../../contexts/AccountManagement';
import { data } from 'react-router';
import { Button, Chip, Col, Form, Icon, ICONS, Input, List, Modal, Row, Switch, Textarea, useNotify } from '@canonical/react-components';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import truncateText from '../../utils/truncateText';
import { faPencil } from '@fortawesome/free-solid-svg-icons';

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
	const notify = useNotify();

	//^ Description Editing
	const [isEditingDescription, setIsEditingDescription] = useState(false);
	const [temporaryDescription, setTemporaryDescription] = useState(requestedUserData.description || '');

	const updateDescription = useCallback(async () => {
		const response = await fetch('/api/profiles/update-description', {
			body: temporaryDescription,
			method: 'POST'
		});

		if (!response.ok) {
			notify.failure(`Failed to update description`, null, await response.text());
			return;
		}

		setRequestedUserData(await response.json());
		setIsEditingDescription(false);
	}, [notify, temporaryDescription]);

	//^ GPG Key Editing
	const fingerprintFieldRef = useRef(null);
	const fingerprintConfirmFieldRef = useRef(null);
	const [isAddingGPGKey, setIsAddingGPGKey] = useState(false);
	const [isRemovingGPGKey, setIsRemovingGPGKey] = useState(false);
	const [isUploadingGPGKey, setIsUploadingGPGKey] = useState(false);
	const [isRequestingGPGRemoval, setIsRequestingGPGRemoval] = useState(false);

	const [GPGFingerprintToRemove, setGPGFingerprintToRemove] = useState('');
	const [newGPGFingerprint, setNewGPGFingerprint] = useState('');
	const [fingerprintRemovalConfirmation, setFingerprintRemovalConfirmation] = useState('');

	const isFingerprintValid = useMemo(() => {
		return [40, 64].includes(newGPGFingerprint.length) && /^[0-9a-fA-F]*$/.test(newGPGFingerprint);
	}, [newGPGFingerprint]);

	const isRemovalFingerprintValid = useMemo(() => {
		return fingerprintRemovalConfirmation === GPGFingerprintToRemove;
	}, [GPGFingerprintToRemove, fingerprintRemovalConfirmation]);

	const addGPGKey = useCallback(async () => {
		setIsUploadingGPGKey(true);
		const response = await fetch('/api/profiles/add-fingerprint', {
			body: newGPGFingerprint,
			method: 'POST'
		});

		if (!response.ok) {
			notify.failure('Failed to add OpenPGP key', null, await response.text());
			setIsUploadingGPGKey(false);
			setNewGPGFingerprint('');
			setIsAddingGPGKey(false);
			return;
		}

		notify.success('Added OpenPGP key successfully!');

		setRequestedUserData(prev => {
			return {
				...prev,
				gpgKeys: [
					...prev.gpgKeys,
					newGPGFingerprint.toUpperCase()
				]
			}
		});
		setIsUploadingGPGKey(false);
		setNewGPGFingerprint('');
		setIsAddingGPGKey(false);
	}, [newGPGFingerprint, notify]);

	const removeGPGKey = useCallback(async () => {
		setIsRequestingGPGRemoval(true);
		const response = await fetch('/api/profiles/remove-fingerprint', {
			body: GPGFingerprintToRemove,
			method: 'POST'
		});

		if (!response.ok) {
			notify.failure('Failed to remove OpenPGP key', null, await response.text());
			setIsRequestingGPGRemoval(false);
			setFingerprintRemovalConfirmation('');
			setIsRemovingGPGKey(false);
			return;
		}

		notify.info('Removed OpenPGP key successfully.');

		setRequestedUserData(prev => {
			return {
				...prev,
				gpgKeys: prev.gpgKeys.filter(k => k !== GPGFingerprintToRemove)
			}
		});
		setIsRequestingGPGRemoval(false);
		setFingerprintRemovalConfirmation('');
		setGPGFingerprintToRemove('');
		setIsRemovingGPGKey(false);
	}, [GPGFingerprintToRemove, notify]);

	return (
		<>
			<meta property='og:title' content={requestedUserData.displayName} />
			<meta property='twitter:title' content={requestedUserData.displayName} />
			<meta property='og:description' content={truncateText(requestedUserData.description, 180) || 'No description.'} />
			<meta name='description' content={truncateText(requestedUserData.description, 180) || 'No description.'} />

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
								<Chip
									value={requestedUserData.role[0].toUpperCase() + requestedUserData.role.slice(1)}
									appearance='information'
									isReadOnly
								/>

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

								<>
									<p style={{ margin: 0 }} className='flex-row justify-space-between'>
										OpenPGP public keys:
										{/* <FontAwesomeIcon
											icon={faPencil}
											style={{ padding: 4, backgroundColor: '#FFFFFF44' }}
										/> */}
										{isMe
										&& <Chip
											value={'Add'}
											iconName={ICONS.plus}
											appearance='positive'
											className='u-no-margin--bottom'
											onClick={() => setIsAddingGPGKey(true)}
										/>}
									</p>
									<List
										items={requestedUserData.gpgKeys.length
											? requestedUserData.gpgKeys.map((key, i) => (
												<span key={i} className='flex-row justify-space-between'>
													<a target='_blank' rel='noreferrer' href={`https://keyserver.ubuntu.com/pks/lookup?fingerprint=on&op=index&search=0x${key.toLowerCase()}`}>{key}</a>
													{isMe
													&& <Icon
														name={ICONS.minus}
														className='modify-btn'
														onClick={() => { setGPGFingerprintToRemove(key); setIsRemovingGPGKey(true); }}
													/>}
												</span>
											))
											: ['None registered']
										}
									/>
								</>,

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
			{isAddingGPGKey
			&& <Modal
				title='Add OpenPGP Key'
				close={() => { setNewGPGFingerprint(''); setFingerprintRemovalConfirmation(''); setIsAddingGPGKey(false); }}
				buttonRow={<>
					<Button
						appearance='positive'
						disabled={(!isFingerprintValid) || isUploadingGPGKey}
						hasIcon={isUploadingGPGKey}
						onClick={addGPGKey}
					>
						{isUploadingGPGKey && <Icon name={`${ICONS.spinner} u-animation--spin`} style={{ marginRight: '0.25em', marginLeft: -1 }} />}
						Submit
					</Button>
				</>}
				focusRef={fingerprintFieldRef}
			>
				<p>
					To add an OpenPGP/GPG key to Smithy, it must be registered on <a href='https://keyserver.ubuntu.com/' target='_blank' rel='noreferrer'>keyserver.ubuntu.com</a>. Make sure you enter the right fingerprint.
				</p>
				<Form onSubmit={ev => { ev.preventDefault();  addGPGKey(); }}>
					{/* To prevent unnecessary re-renders */}
					<React.Fragment key=".0">
						<Input
							id='openpgp_fingerprint'
							label='Fingerprint'
							placeholder='6FDCDB25DD68F9C257DD6B6AAD2B8A9E1D1C31B2'
							type='text'
							ref={fingerprintFieldRef}
							required
							value={newGPGFingerprint}
							onChange={e => setNewGPGFingerprint(e.target.value)}
							error={!isFingerprintValid && newGPGFingerprint}
							help={
								(isFingerprintValid || !newGPGFingerprint)
									? 'Run `gpg --list-keys` to see your available keys and their fingerprints.'
									: 'Fingerprint must be either 40 or 64 characters long and must only contain valid hex characters.'
							}
							disabled={isUploadingGPGKey}
						/>
					</React.Fragment>
				</Form>
			</Modal>}

			{isRemovingGPGKey
			&& <Modal
				title='Are you sure you want to remove this GPG key?'
				close={() => { setGPGFingerprintToRemove(''); setIsRemovingGPGKey(false); }}
				buttonRow={<>
					<Button
						appearance='negative'
						disabled={(!isRemovalFingerprintValid) || isRequestingGPGRemoval}
						hasIcon={isRequestingGPGRemoval}
						onClick={removeGPGKey}
					>
						{isRequestingGPGRemoval && <Icon name={`${ICONS.spinner} u-animation--spin`} style={{ marginRight: '0.25em', marginLeft: -1 }} />}
						Delete
					</Button>
				</>}
				focusRef={fingerprintConfirmFieldRef}
			>
				<p>
					You won&apos;t be able to add this key again, even if it remains valid on <a href='https://keyserver.ubuntu.com/' target='_blank' rel='noreferrer'>keyserver.ubuntu.com</a>. Fingerprint: {GPGFingerprintToRemove}. Please type it out below:
				</p>
				<Form onSubmit={ev => { ev.preventDefault(); removeGPGKey(); }}>
					{/* To prevent unnecessary re-renders */}
					<React.Fragment key=".0">
						<Input
							id='openpgp_fingerprint'
							label='Fingerprint'
							placeholder={GPGFingerprintToRemove}
							type='text'
							ref={fingerprintConfirmFieldRef}
							required
							value={fingerprintRemovalConfirmation}
							onChange={e => setFingerprintRemovalConfirmation(e.target.value)}
							error={!isRemovalFingerprintValid && fingerprintRemovalConfirmation}
							help={
								(isRemovalFingerprintValid || !fingerprintRemovalConfirmation)
									? 'This action can\'t be undone for security reasons.'
									: 'Fingerprints must match. Try converting it to upper case.'
							}
							disabled={isRequestingGPGRemoval}
						/>
					</React.Fragment>
				</Form>
			</Modal>}
		</>
	);
}