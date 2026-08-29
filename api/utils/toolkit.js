import { Octokit } from 'octokit';
import DBProvider from './DBProvider';

export const getCookie = (header='', name='') => {
	const match = header.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
	return match ? decodeURIComponent(match[2]) : null;
};

const DOWNLOAD_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export const fetchWithRetry = async (url, options = {}, retries = DOWNLOAD_RETRIES, beforeRetry = () => true) => {
	let lastError;
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const response = await fetch(url, options);
			if (!response.ok) {
				lastError = new Error(`Request failed: ${response.status} ${response.statusText}`);
				//dbg console.warn(`Attempt ${attempt}/${retries} failed: ${lastError.message}`);
			} else {
				return response;
			}
		} catch (error) {
			lastError = error;
			//dbg console.warn(`Attempt ${attempt}/${retries} failed: ${error.message}`);
		}

		if (attempt < retries) {
			if (beforeRetry()) await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
			else break;
		}
	}
	throw lastError || new Error('Failed to fetch after retries');
}

/**
 * 
 * @type {typeof DBProvider.OCTOKIT.request}
 * @param {Number} retries
 * @param {(options: {}) => boolean} beforeRetry
 */
export const appOctokitWithRetry = async (route, options = {}, retries = DOWNLOAD_RETRIES, beforeRetry = () => true) => {
	let lastError;
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const response = await DBProvider.OCTOKIT.request(route, options);
			if (response.status !== 200) {
				lastError = new Error(`Request failed: ${response.status} ${response.statusText}`);
				//dbg console.warn(`Attempt ${attempt}/${retries} failed: ${lastError.message}`);
			} else {
				return response;
			}
		} catch (error) {
			lastError = error;
			//dbg console.warn(`Attempt ${attempt}/${retries} failed: ${error.message}`);
		}

		if (attempt < retries) {
			const doRetry = beforeRetry(options);
			if (doRetry) await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
			else break;
		}
	}
	throw lastError || new Error('Failed to fetch after retries');
}

/**
 * 
 * @type {typeof DBProvider.OCTOKIT.request}
 * @param {{ octokit: Octokit }} octokitInstance
 * @param {Number} retries
 * @param {(octokitInstance: { octokit: Octokit }) => boolean} beforeRetry
 */
export const userOctokitWithRetry = async (route, octokitInstance = { octokit: null }, retries = DOWNLOAD_RETRIES, beforeRetry = () => true) => {
	let lastError;
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const response = await octokitInstance.octokit.request(route);
			if (response.status !== 200) {
				lastError = new Error(`Request failed: ${response.status} ${response.statusText}`);
				//dbg console.warn(`Attempt ${attempt}/${retries} failed: ${lastError.message}`);
			} else {
				return response;
			}
		} catch (error) {
			lastError = error;
			//dbg console.warn(`Attempt ${attempt}/${retries} failed: ${error.message}`);
		}

		if (attempt < retries) {
			const doRetry = beforeRetry(octokitInstance);
			if (doRetry) await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
			else break;
		}
	}
	throw lastError || new Error('Failed to fetch after retries');
}

export const refreshAccessToken = async (ghClientSecret, ghClientId, refreshToken) => {
	const result = await fetch('https://github.com/login/oauth/access_token', {
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			client_id: ghClientId,
			client_secret: ghClientSecret,
			grant_type: 'refresh_token',
			refresh_token: refreshToken
		}),
		method: 'POST'
	});

	const parsedResult = await result.json();
	const newAccessToken = parsedResult.access_token;

	if (!newAccessToken) return false;

	return { accessToken: newAccessToken, accessTokenAge: parsedResult.expires_in, refreshToken: parsedResult.refresh_token, refreshTokenAge: parsedResult.refresh_token_expires_in };
}