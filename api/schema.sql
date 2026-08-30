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