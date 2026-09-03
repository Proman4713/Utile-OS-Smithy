import {
	createContext,
	useState
} from "react";

export const PackageContext = createContext();

/**
 * @typedef {{ name: string, source: string, version: string, maintainer: string, component: "main" | "universe" | "upstream", suite: string, section: string, description: string, filename: string, architecture: "amd64" | "arm64", buildArchitecture: string }} ArchivePackage
 * @type {ArchivePackage}
 */
export const ArchivePackage = {};

export const architectures = ['amd64'];
export const suites = ['abstract'];
export const components = ['main', 'universe', 'upstream'];

export const loadArchivePackages = async () => {
	let data = {
		/**
		 * @type {ArchivePackage[]}
		 */
		packages: []
	};

	for (const suite of suites) {
		for (const architecture of architectures) {
			for (const component of components) {
				const response = await fetch(`${import.meta.env.VITE_APP_ARCHIVE_URL}/dists/${suite}/${component}/binary-${architecture}/Packages`);
				if (!response.ok) return { failed: true };

				const htmlContent = await response.text();
				const packages = htmlContent.split('\n\n').map(stanza => {
					const lines = stanza.split('\n');

					const metadata = {};
					lines.forEach(line => {
						const [key, ...val] = line.split(': ');
						if (key) metadata[key] = val.join(': '); // The value could have a colon in it
					});
					return metadata;
				}).filter(p => p.Package);

				for (const pkg of packages) {
					data.packages.push({
						architecture,
						component,
						suite,

						buildArchitecture: pkg.Architecture,
						description: pkg.Description,
						filename: pkg.Filename,
						name: pkg.Package,
						section: pkg.Section,
						version: pkg.Version,
						maintainer: pkg.Maintainer,
						originalMaintainer: pkg['Original-Maintainer'],
						source: pkg.Source || pkg.Package // If the package source is the same name as the package, the Source field is omitted
					})
				}
			}
		}
	}

	data.packages.sort((a, b) => {
		// Sort by section then by name
		(a.section - b.section) || (a.name - b.name)
	})
	return data;
}

export function PackageProvider({
	children
}) {

	return (
		<PackageContext.Provider value={{
			
		}}>
			{children}
		</PackageContext.Provider>
	);
}