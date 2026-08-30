import { createOAuthAppAuth } from '@octokit/auth-oauth-app';
import { Octokit } from "octokit";

/**
 * @typedef {{
 * username: string,
 * displayName: string,
 * description: string?,
 * id: Number,
 * connections: ({ type: 'github', displayName: string })[],
 * publicConnections: ({ type: 'github', displayName: string })[],
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
 * description: string?,
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
	 * @type {import('@cloudflare/workers-types').D1Database}
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
		if (databaseRow.github_id) userData.connections.push({ type: 'github', displayName: databaseRow.github_name });

		userData.creationDate = databaseRow.creation_date;
		userData.username = databaseRow.username;
		userData.displayName = databaseRow.display_name;
		userData.description = databaseRow.description;
		userData.email = databaseRow.email;
		userData.id = databaseRow.id;

		userData.publicConnections = [];
		if (databaseRow.is_gh_connection_public) userData.publicConnections.push({ type: 'github', displayName: databaseRow.github_name });

		return userData;
	}

	/**
	 * 
	 * @param {import('@cloudflare/workers-types').D1Database} DB 
	 */
	static init(DB) {
		DBProvider.#DB = DB;
	}
}