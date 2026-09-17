import type { RequestResolver } from '@shambay/cached-http-resolver';
import type { DatabaseCredsOptions } from '../../types/request.js';
import { DEFAULT_FALLBACK_TTL_SECONDS, DEFAULT_REFRESH_BUFFER_SECONDS } from '../constants.js';
import { createLogger } from '../../shared/logger.js';

const log = createLogger('Vault');

/** Shape of the Vault dynamic database credentials response. */
interface DatabaseCredsResponse {
	data: { username: string; password: string };
	lease_duration?: number;
}

/**
 * Default hooks and fallback values used when the caller
 * does not provide any per-call options.
 */
const defaultOptions: Required<DatabaseCredsOptions> = {
	refreshBufferSeconds: DEFAULT_REFRESH_BUFFER_SECONDS,
	fallbackTtlSeconds: DEFAULT_FALLBACK_TTL_SECONDS,
	onBefore: () => {},
	onAfter: () => {},
	onError: (error, attempt) => {
		log.error(`[DB] Attempt ${attempt} failed:`, error.message);
	}
};

/**
 * Fetches dynamic PostgreSQL credentials from Vault and builds a connection URL.
 *
 * @param resolver      - RequestResolver used to perform the HTTP request
 * @param vaultAddress  - Vault base address
 * @param token         - Vault access token
 * @param databaseRole  - Name of the database role in Vault
 * @param host          - Database host
 * @param port          - Database port
 * @param databaseName  - Database name
 * @param options       - Optional per-call overrides (buffer, fallback TTL, hooks)
 */
export async function getPostgresUrl(
	resolver: RequestResolver,
	vaultAddress: string,
	token: string,
	databaseRole: string,
	host: string,
	port: number,
	databaseName: string,
	options: DatabaseCredsOptions = {}
): Promise<string> {
	const { refreshBufferSeconds, fallbackTtlSeconds, onBefore, onAfter, onError } = {
		...defaultOptions,
		...options
	};

	const url = `${vaultAddress}/v1/database/creds/${databaseRole}`;
	const cacheKey = `db_creds_${databaseRole}`;

	const data = await resolver.request<DatabaseCredsResponse>(
		url,
		{ headers: { 'X-Vault-Token': token } },
		{
			cacheKey,
			requestKey: cacheKey,
			refreshBufferSeconds,
			ttlResolver: (responseData) => {
				const lease = (responseData as DatabaseCredsResponse | undefined)?.lease_duration;
				if (typeof lease === 'number' && lease > 0) {
					return lease;
				}
				return fallbackTtlSeconds;
			},
			onBefore,
			onAfter,
			onError
		}
	);

	return `postgresql://${data.data.username}:${data.data.password}@${host}:${port}/${databaseName}`;
}
