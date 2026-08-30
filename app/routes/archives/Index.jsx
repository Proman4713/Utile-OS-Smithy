import { Button, Card, Col, MultiSelect, Row, SearchBox } from '@canonical/react-components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import Fuse from 'fuse.js';
import { architectures, ArchivePackage, components, loadArchivePackages, suites } from '../../contexts/PackageManagement';

/**
 * @type {import('react-router').MetaFunction}
 */
export const meta = () => [
	{ title: 'Archives — Smithy — Utile OS' }
];

/**
 * @type {import('react-router').LoaderFunction}
 * @param {import('react-router').LoaderFunctionArgs} param0
 */
export async function loader() {
	return await loadArchivePackages();
}

export default function Index({ loaderData }) {
	const [searchParams, setSearchParams] = useSearchParams();
	const [searchText, setSearchText] = useState(searchParams.get('q') || '');
	const [filteredSuites, setFilteredSuites] = useState(
		searchParams.get('suites')?.split(',').map(suite => ({ label: suite, value: suite })) ||
		[{
			label: suites[suites.length - 1],
			value: suites[suites.length - 1]
		}] // Latest by default
	);
	const [filteredComponents, setFilteredComponents] = useState(
		searchParams.get('components')?.split(',').map(component => ({ label: component, value: component })) ||
		components.map(component => ({ label: component, value: component })) // All by default
	);

	const handleSearch = useCallback(() => {
		setSearchParams(`?q=${searchText}&suites=${filteredSuites.map(k => k.value).join(',')}&components=${filteredComponents.map(k => k.value).join(',')}`);
	}, [filteredComponents, filteredSuites, searchText, setSearchParams]);

	const [isMounted, setIsMounted] = useState(false);
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsMounted(true); // MultiSelect uses ContextualMenu, which uses window, so we need to delay its rendering until mounting
	}, []);

	const clearOrSelectAll = useCallback((items, mode='suites') => {
		// Clear button
		if (items.length === 0) {
			// One suite must always be active
			mode === 'suites'
				? setFilteredSuites([filteredSuites[0]])
				: setFilteredComponents([filteredComponents[0]]);
			return;
		}
		// Select all
		(mode === 'suites'
			? setFilteredSuites
			: setFilteredComponents)(
				prev => {
					const notSelected = (mode === 'suites'
						? suites
						: components)
							.filter(item => !prev.some(k => k.value === item))
							.map(item => ({ label: item, value: item }));

					return [...prev, ...notSelected]
				}
			);
	}, [filteredComponents, filteredSuites]);

	//^ Searching
	const packageFuse = useMemo(() => new Fuse(loaderData.packages, { keys: ['name'], includeScore: true, includeMatches: true }), [loaderData]);
	const searchResults = useMemo(() => {
		const query = searchParams.get('q');
		if (query) {
			const packageMatches = packageFuse.search(query)
				.map(r => r.item);

			return packageMatches;
		}
		return [];
	}, [packageFuse, searchParams]);
	const isSearchActive = !!searchParams.get('q');

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
						<div className='row'>
							<Col size={5}>
								<form onSubmit={ev => {
									ev.preventDefault();
									handleSearch();
								}}>
									<SearchBox
										externallyControlled
										searchButtonType='submit'
										placeholder='Search Packages...'
										value={searchText}
										onChange={(val) => setSearchText(val)}
										onSearch={handleSearch}
									/>
								</form>
							</Col>
							{isMounted
							&& <Col size={2}>
								<MultiSelect
									help={<span>Suites (at least one)</span>}
									items={suites.map(suite => ({
										label: suite,
										value: suite
									}))}
									onDeselectItem={item => {
										const newArray = filteredSuites.filter(k => k.value !== item.value);
										if (newArray.length <= 0) return; // At least one must be active
										setFilteredSuites(newArray);
									}}
									onSelectItem={item => {
										setFilteredSuites([...filteredSuites, item])
									}}
									onItemsUpdate={clearOrSelectAll}
									selectedItems={filteredSuites}
									variant='condensed'
								/>
							</Col>}
							{isMounted
							&& <Col size={2}>
								<MultiSelect
									help={<span>Components (at least one)</span>}
									items={components.map(comp => ({
										label: comp,
										value: comp
									}))}
									onDeselectItem={item => {
										const newArray = filteredComponents.filter(k => k.value !== item.value);
										if (newArray.length <= 0) return;
										setFilteredComponents(newArray);
									}}
									onSelectItem={item => {
										setFilteredComponents([...filteredComponents, item])
									}}
									onItemsUpdate={items => clearOrSelectAll(items, 'comps')}
									selectedItems={filteredComponents}
									variant='condensed'
								/>
							</Col>}
						</div>
					</div>
				</div>
			</div>
			<div className='p-section'>
				<Row>
					<Col size={12}>
						<h2>Packages:</h2>
					</Col>
				</Row>
				<Row>
					{(isSearchActive ? searchResults : loaderData.packages)
						.filter(pkg => filteredSuites.some(k => k.value === pkg.suite))
						.filter(pkg => filteredComponents.some(k => k.value === pkg.component))
						.map((pkg, i) => (
							<Card
								key={i}
								title={
									<span>
										<Link to={`/archives/${pkg.suite}/${pkg.component}/${pkg.name}`}>{pkg.name}</Link> ({pkg.version}) <span style={{ opacity: 0.3 }}>[{pkg.component}]</span>
									</span>
								}
							>
								<span style={{ display: 'block' }}>{pkg.description} — {pkg.section}</span>
								<Button
									appearance='positive'
									style={{ marginTop: 16 }}
									onClick={() => window.open(`${import.meta.env.VITE_APP_ARCHIVE_URL}/${pkg.filename}`, '_blank')}
								>
									Download
								</Button>
							</Card>
						))
					}
				</Row>
			</div>
		</>
	);
}