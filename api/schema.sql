-- A list of all the one-time queries that have been run on the database
CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	github_name TEXT,
	github_id INTEGER UNIQUE NOT NULL, -- The NOT NULL constraint could be dropped once we have multiple login providers
	is_gh_connection_public INTEGER NOT NULL DEFAULT 0 CHECK (is_gh_connection_public IN (0,1)),
	username TEXT UNIQUE NOT NULL COLLATE NOCASE,
	display_name TEXT NOT NULL,
	email TEXT UNIQUE COLLATE NOCASE,
	creation_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
ALTER TABLE users ADD COLUMN description TEXT;
-- Spectator: any random account creator, quite like myself on Launchpad.
-- Maintainer: Just a quick way to check if the user has maintainership rights to *any* package before making further checks.
-- Reviewer: A status that says that: If this user maintains a package, they can also review uploads
-- Admin: Controls all of the above
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'spectator' CHECK (role IN ('spectator', 'maintainer', 'reviewer', 'admin'));
UPDATE users SET role = 'admin' WHERE id = 1; -- First user, i.e. Proman4713

PRAGMA foreign_keys = ON; -- Foreign keys are enforced by default in D1
CREATE TABLE IF NOT EXISTS gpg_keys (
	id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	user_id INTEGER NOT NULL,
	--							The NOT here is reversed by the ^ inside the glob, which means we make sure it does NOT have any characters NOT a valid hex char
	openpgp_fingerprint TEXT UNIQUE NOT NULL COLLATE NOCASE CHECK (openpgp_fingerprint NOT GLOB '*[^0-9a-fA-F]*' AND length(openpgp_fingerprint) IN (40, 64)),
	status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'revoked')), -- revoked can either mean the user deleted it from their account or it was revoked on keyserver.ubuntu.com, the latter case would be found out at upload-time if we failed to verify the signature due to a revocation certificate

	creation_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX idx_gpg_keys_user_id ON gpg_keys(user_id);

CREATE TABLE IF NOT EXISTS source_packages (
	name TEXT PRIMARY KEY UNIQUE NOT NULL,
	current_deb_control TEXT NOT NULL,
	current_deb_changelog TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS source_package_maintainership (
	id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	source_package_name TEXT NOT NULL,
	user_id INTEGER NOT NULL, -- Maintainer
	granter_id INTEGER NOT NULL, -- Reviewer/Admin who granted access; Reviewers should already be maintainers of this source package to grant anyone else
	grant_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

	status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'revoked')),
	revoker_id INTEGER,
	revocation_date TEXT,

	FOREIGN KEY (source_package_name) REFERENCES source_packages(name),
	FOREIGN KEY (user_id) REFERENCES users(id),
	FOREIGN KEY (granter_id) REFERENCES users(id),
	FOREIGN KEY (revoker_id) REFERENCES users(id)
);
CREATE UNIQUE INDEX idx_spm_active -- Prevent duplicates
	ON source_package_maintainership(source_package_name, user_id)
	WHERE status = 'ongoing';
CREATE INDEX idx_spm_user_id ON source_package_maintainership(user_id);
CREATE INDEX idx_spm_package ON source_package_maintainership(source_package_name);

-- The latest version of the package should be fetched from the first row here sorted by upload_date
CREATE TABLE IF NOT EXISTS source_package_uploads (
	id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	user_id INTEGER NOT NULL, -- Uploader
	date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	gpg_key_id INTEGER NOT NULL, -- The key that signed the package

	source_package_name TEXT NOT NULL,
	version TEXT NOT NULL,
	-- debian/control needs to be checked to ensure a newer version than the latest on the archives and enforce Debian versioning conventions (e.g., prevent the upload
	--	from being created if there is a revision number but not .orig.tar.xz, or if the .tar.xz names don't match conventions), so there should be no need to
	--	keep track of the .tar.xz names as long as we have the version.
	FOREIGN KEY (user_id) REFERENCES users(id),
	FOREIGN KEY (gpg_key_id) REFERENCES gpg_keys(id),
	FOREIGN KEY (source_package_name) REFERENCES source_packages(name),

	UNIQUE(source_package_name, version)
);
CREATE INDEX idx_spu_uploader ON source_package_uploads(user_id);
CREATE INDEX idx_spu_gpg_key_id ON source_package_uploads(gpg_key_id);
CREATE INDEX idx_spu_date ON source_package_uploads(source_package_name, date DESC);

CREATE TABLE IF NOT EXISTS source_package_builds (
	id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	acceptor_id INTEGER NOT NULL, -- The reviewer or admin that allowed the upload to be built and released to the archives
	source_package_upload_id INTEGER NOT NULL, -- Which upload was allowed
	status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'building', 'success', 'failure')),
	date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

	FOREIGN KEY (acceptor_id) REFERENCES users(id),
	FOREIGN KEY (source_package_upload_id) REFERENCES source_package_uploads(id)
);
CREATE INDEX idx_spb_upload_id ON source_package_builds(source_package_upload_id); -- We may have an upload and want to know its build history
CREATE INDEX idx_spb_acceptor_id ON source_package_builds(acceptor_id);

ALTER TABLE source_package_uploads ADD COLUMN suite TEXT NOT NULL;
ALTER TABLE source_package_uploads ADD COLUMN section TEXT NOT NULL;
ALTER TABLE source_packages DROP COLUMN current_deb_control; -- The archives already give us all the information we currently need
ALTER TABLE gpg_keys ADD COLUMN revocation_date TEXT;