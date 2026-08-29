import { D1Database } from '@cloudflare/workers-types';
import { createOAuthAppAuth } from '@octokit/auth-oauth-app';
import { Octokit } from "octokit";

/**
 * @typedef {{
 * username: string,
 * displayName: string,
 * id: Number,
 * connections: ('github')[],
 * publicConnections: ('github')[],
 * email: string?,
 * creationDate: string
 * }} User
 * @type {User}
 */
export const User = {};

/**
 * @typedef {{
 * id: Number,
 * github_name: string?,
 * github_id: Number?,
 * is_gh_connection_public: 0 | 1,
 * username: string,
 * display_name: string,
 * email: string?,
 * creation_date: string
 * }} DBUser
 * @type {DBUser}
 */
export const DBUser = {};

export default class DBProvider {
	static #DB;
	static #OCTOKIT;
	static #SCOPES = ['user:email'];

	/**
	 * @type {D1Database}
	 */
	static get DB() {
		return DBProvider.#DB;
	}

	/**
	 * @returns {Octokit}
	 */
	static get OCTOKIT() {
		return DBProvider.#OCTOKIT;
	}

	static get SCOPES() {
		return DBProvider.#SCOPES;
	}

	static async initOctokit(clientId, clientSecret) {
		DBProvider.#OCTOKIT = new Octokit({ authStrategy: createOAuthAppAuth, auth: { clientId, clientSecret } });
	}

	static initUserOctokit(accessToken) {
		return new Octokit({ auth: accessToken });
	}

	/**
	 * @param {DBUser} databaseRow 
	 */
	static parseAppUserFromDBUser(databaseRow) {
		/**
		 * @type {User}
		 */
		let userData = {}

		console.log('Parsing', databaseRow)
		// Connections, for when we allow more than one
		userData.connections = []
		if (databaseRow.github_id) userData.connections.push('github');

		userData.creationDate = databaseRow.creation_date;
		userData.username = databaseRow.username;
		userData.displayName = databaseRow.display_name;
		userData.email = databaseRow.email;
		userData.id = databaseRow.id;

		userData.publicConnections = [];
		if (databaseRow.is_gh_connection_public) userData.publicConnections.push('github');

		return userData;
	}

	/**
	 * 
	 * @param {D1Database} DB 
	 */
	static init(DB) {
		DBProvider.#DB = DB;
	}
}