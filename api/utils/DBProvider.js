import { createOAuthAppAuth } from '@octokit/auth-oauth-app';
import { Octokit } from "octokit";

export default class DBProvider {
	static #DB;
	static #OCTOKIT;
	static #SCOPES = ['user:email'];

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

	async initUserOctokit(accessToken) {
		return new Octokit({ auth: accessToken });
	}

	static async init() {
		// TODO
		// DBProvider.#DB = ;
	}
}