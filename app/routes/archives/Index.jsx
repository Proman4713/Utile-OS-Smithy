import { Col, MainTable, MultiSelect, Row, SearchBox } from '@canonical/react-components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

/**
 * @typedef {{ name: string, version: string, component: "main" | "universe" | "upstream", suite: string, section: string, description: string, filename: string, architecture: "amd64" | "arm64" }} ArchivePackage
 * @type {ArchivePackage}
 */
const ArchivePackage = {};

const architectures = ['amd64'];
const suites = ['abstract'];
const components = ['main', 'universe', 'upstream'];

/**
 * @type {import('react-router').MetaFunction}
 */
export const meta = () => [
	{ title: 'Archives — Smithy — Utile OS' }
];

export async function loader() {
	let data = {
		architectures,
		suites,
		components,
		/**
		 * @type {ArchivePackage[]}
		 */
		packages: []
	};

	for (const suite of data.suites) {
		for (const architecture of data.architectures) {
			for (const component of data.components) {
				const response = await fetch(`${import.meta.env.VITE_APP_ARCHIVE_URL}/dists/${suite}/${component}/binary-${architecture}/Packages`);
				if (!response.ok) return { failed: true };

				const htmlContent = await response.text();
				const packages = htmlContent.split('\n\n').map(block => {
					const lines = block.split('\n');
					const obj = { _component: component };
					lines.forEach(line => {
						const [key, ...val] = line.split(': ');
						if (key) obj[key] = val.join(': ');
					});
					return obj;
				}).filter(p => p.Package);

				for (const pkg of packages) {
					data.packages.push({
						architecture,
						component,
						suite,

						description: pkg.Description,
						filename: pkg.Filename,
						name: pkg.Package,
						section: pkg.Section,
						version: pkg.Version
					})
				}
			}
		}
	}

	return data;
}

export default function Index({ loaderData }) {
	const [searchParams, setSearchParams] = useSearchParams();
	const [query, setQuery] = useState(searchParams.get('q') || '');

	const handleSearch = useCallback(() => {
		setSearchParams(`?q=${query}`)
	}, [query]);

	return (
		<>
			<div className='p-section--hero'>
				<div className='row--25-75'>
					<div className='col'>
						<div className='p-section--shallow'>
							<h1>Archives</h1>
							<h2>Utile OS&apos;s Debian package archives.</h2>
							<p>There are currently <b>{loaderData.packages.length}</b> packages in the Utile OS archives.</p>
						</div>
						<form onSubmit={ev => {
							ev.preventDefault();
							handleSearch();
						}}>
							<SearchBox
								externallyControlled
								searchButtonType='submit'
								placeholder='Search Packages...'
								value={query}
								onChange={(val) => setQuery(val)}
								onSearch={handleSearch}
							/>
						</form>
					</div>
				</div>
			</div>
			<div className='p-section'>
				<Row>
					<Col size={3}>
						<h2>Search Results:</h2>
					</Col>
					{/* <Col size={2}>
						<MultiSelect
							help={<span>Suites</span>}
							items={suites.map(comp => ({
								label: comp,
								value: comp
							}))}
							onItemsUpdate={() => { }}
							selectedItems={[{
								label: 'abstract',
								value: 'abstract'
							}]}
							variant='condensed'
						/>
					</Col>
					<Col size={2}>
						<MultiSelect
							help={<span>Architectures</span>}
							items={architectures.map(comp => ({
								label: comp,
								value: comp
							}))}
							onItemsUpdate={() => { }}
							selectedItems={architectures.map(comp => ({
								label: comp,
								value: comp
							}))}
							variant='condensed'
						/>
					</Col>
					<Col size={2}>
						<MultiSelect
							help={<span>Components</span>}
							items={components.map(comp => ({
								label: comp,
								value: comp
							}))}
							onItemsUpdate={() => { }}
							selectedItems={components.map(comp => ({
								label: comp,
								value: comp
							}))}
							variant='condensed'
						/>
					</Col> */}
				</Row>
				<Row>
					{/* <MainTable
						headers={[]}
					/> */}
					{loaderData.packages.map((pkg, i) => (
						<h3 key={i}>{pkg.name}</h3>
					))}
				</Row>
			</div>
		</>
	);
}