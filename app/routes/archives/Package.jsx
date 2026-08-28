import { data, useParams } from 'react-router';
import { ArchivePackage, loadArchivePackages } from '../../contexts/PackageManagement';
import { useMemo, useState } from 'react';
import { Button, Col, List, MainTable, Row } from '@canonical/react-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import Codeblock from '../../components/UI/Codeblock';

/**
 * @type {import('react-router').MetaFunction}
 */
export const meta = ({ params }) => [
	{ title: `${params.name} — Smithy — Utile OS` }
];

/**
 * @type {import('react-router').LoaderFunction}
 */
export async function loader({ params }) {
	const { name, suite, component } = params;
	const archive = await loadArchivePackages();

	if (archive.failed) {
		throw Error('Failed to fetch package archives');
	}

	/**
	 * @type {ArchivePackage[]}
	 */
	const packageMatches = archive.packages.filter(pkg => pkg.name === name && pkg.suite === suite && pkg.component === component);

	if (!packageMatches.length) {
		throw data('Package Not Found', { status: 404, statusText: 'Package Not Found' })
	}

	return {packageMatches};
}

export default function Package({ loaderData }) {
	const { suite, component, name } = useParams();

	const targetArchitectures = useMemo(() => {
		const foundArchs = new Set();
		const foundFilenames = new Set();

		for (const match of loaderData.packageMatches) {
			foundArchs.add(match.architecture);
			foundFilenames.add(match.filename);
		}
		
		const archArray = [...foundArchs];

		return [...foundFilenames].map((filename, idx) => ({
			architecture: archArray[idx],
			filename
		}))
	}, [loaderData.packageMatches]);

	const description = useMemo(() => {
		return loaderData.packageMatches[0].description;
	}, [loaderData.packageMatches]);

	const [expandedRow, setExpandedRow] = useState(null);

	return (
		<>
			<div className='p-section--hero'>
				<div className='row--25-75'>
					<div className='col'>
						<List
							items={[
								suite,
								component,
								...(loaderData.packageMatches[0].source ? [`source: ${loaderData.packageMatches[0].source}`] : [])
							]}
							middot
							className='u-no-margin--bottom'
						/>
						<div className='p-section--shallow'>
							<h1>{name}:{targetArchitectures.map((arch, i) => (
								<a key={i} href={`${import.meta.env.VITE_APP_ARCHIVE_URL}/${arch.filename}`}>
									{arch.architecture}
								</a>
							))} ({loaderData.packageMatches[0].buildArchitecture})</h1>
							<h2>{description}</h2>
							<List
								split
								divided
								items={[
									// TODO: Should the maintainer be retrieved from the database rather than the package info?
									<span key={0}>
										Maintainer:&nbsp;
										<a href={`mailto:${loaderData.packageMatches[0].maintainer.split('<')[1].replace('>', '')}`}>
											{loaderData.packageMatches[0].maintainer?.split(' <')[0]}
										</a>
									</span>,
									<span key={1}>Latest Version: {loaderData.packageMatches[0].version}</span>,
									<span key={2}>Tarball: <a href=''>{null}</a></span>,
									<span key={3}>Upstream Tarball: {null ? <a href=''>{null}</a> : 'N/A'}</span>,
								]}
							/>
						</div>
					</div>
				</div>
			</div>
			<div className='p-section'>
				<Row>
					<hr />
					<Col size={12}>
						<MainTable
							paginate={20}
							expanding
							headers={[
								{
									content: 'Version'
								}, {
									content: 'Created'
								}, {
									content: 'Published'
								}, {
									content: 'Maintainer'
								}, {
									content: null
								}
							]}
							rows={[
								{
									columns: [
										{
											// TODO: This should obviously come from a database of history, not from this
											content: loaderData.packageMatches[0].version,
											role: 'rowheader'
										}, {
											content: null
										}, {
											content: null
										}, {
											content: <a href={null}>{null}</a>
										}, {
											content: <>
												<Button
													appearance='base'
													onClick={() => setExpandedRow(0)}
												>
													<FontAwesomeIcon icon={faChevronDown} />
												</Button>
											</>,
											className: 'u-align--right'
										}
									],
									expanded: expandedRow === 0,
									expandedContent: <Row>
										<Col size={12}>
											{/* // TODO: From .changes */}
											<h4>Changelog</h4>
											<Codeblock
												language='plaintext'
												code='base-files (14ubuntu6.2) resolute; urgency=medium

* /etc/issue{,.net}, /etc/{lsb,os}-release: bump version to 26.04.1
    (LP: #2164885)

 -- Oliver Reiche <oliver.reiche@canonical.com>  Mon, 24 Aug 2026 12:33:48 +0200'
											/>
										</Col>
									</Row>
								}
							]}
						/>
					</Col>
				</Row>
			</div>
		</>
	);
}