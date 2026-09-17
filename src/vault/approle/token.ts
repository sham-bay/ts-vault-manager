import type { RequestResolver } from '@shambay/cached-http-resolver';
import type { VaultConfig } from '../../types/vault.js';
import type { VaultTokenOptions } from '../../types/request.js';
import { DEFAULT_REFRESH_BUFFER_SECONDS, DEFAULT_FALLBACK_TTL_SECONDS } from '../constants.js';
import { createLogger } from '../../shared/logger.js';

const log = createLogger('Vault');

/** Shape of the Vault AppRole login response. */
interface VaultTokenResponse {
	auth: {
		client_token: string;
		lease_duration: number;
	};
}

/**
 * Default hooks and fallback values used when the caller
 * does not provide any per-call options.
 */
const defaultOptions: Required<VaultTokenOptions> = {
	refreshBufferSeconds: DEFAULT_REFRESH_BUFFER_SECONDS,
	fallbackTtlSeconds: DEFAULT_FALLBACK_TTL_SECONDS,
	onBefore: (url) => log.debug(`Requesting token from ${url}`),
	onAfter: (_response, data) => {
		const lease = (data as VaultTokenResponse | undefined)?.auth?.lease_duration;
		log.debug(`Token obtained, lease_duration: ${lease}`);
	},
	onError: (error, attempt) => {
		log.error(`Attempt ${attempt} failed: ${error.message}`);
	}
};

/**
 * Retrieves a Vault token via AppRole authentication.
 * The token is cached and proactively refreshed before it expires.
 *
 * @param resolver - RequestResolver used to perform the HTTP request
 * @param config   - Vault configuration (address, rolePath, roleId, secretId)
 * @param options  - Optional per-call overrides (buffer, fallback TTL, hooks)
 */
export async function getVaultToken(
	resolver: RequestResolver,
	config: VaultConfig,
	options: VaultTokenOptions = {}
): Promise<string> {
	const { refreshBufferSeconds, fallbackTtlSeconds, onBefore, onAfter, onError } = {
		...defaultOptions,
		...options
	};

	const { vaultAddress, rolePath, roleId, secretId } = config;
	const url = `${vaultAddress}/v1/auth/${rolePath}/login`;

	const data = await resolver.request<VaultTokenResponse>(
		url,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ role_id: roleId, secret_id: secretId })
		},
		{
			cacheKey: `vault_token_${roleId}`,
			requestKey: `vault_token_request_${roleId}`,
			refreshBufferSeconds,
			ttlResolver: (responseData) => {
				const lease = (responseData as VaultTokenResponse | undefined)?.auth?.lease_duration;
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

	const token = data.auth?.client_token;
	if (!token) {
		throw new Error('Vault response missing client_token');
	}
	return token;
}
