import type { RequestResolver } from '@shambay/cached-http-resolver';
import type { KvSecretOptions } from '../../types/request.js';
import { DEFAULT_REFRESH_BUFFER_SECONDS } from '../constants.js';
import { createLogger } from '../../shared/logger.js';

const log = createLogger('KV');

interface KvResponse<T> {
	data: {
		data: T;
		metadata: unknown;
	};
}

/**
 * Default hooks and fallback values used when the caller
 * does not provide any per-call options.
 *
 * Note: `useCache` and `cacheTTL` are handled separately below,
 * since they depend on whether caching is enabled at all.
 */
const defaultOptions: Required<Pick<KvSecretOptions, 'refreshBufferSeconds' | 'useCache'>> &
	Omit<KvSecretOptions, 'refreshBufferSeconds' | 'useCache'> = {
	useCache: true,
	refreshBufferSeconds: DEFAULT_REFRESH_BUFFER_SECONDS,
	onBefore: (url) => log.debug(`Fetching ${url}`),
	onAfter: () => {},
	onError: (error, attempt) => log.error(`Attempt ${attempt} failed:`, error.message)
};

/**
 * Reads a secret from Vault KV v2 by path.
 *
 * @param resolver     - RequestResolver used to perform the HTTP request
 * @param vaultAddress - Vault base address
 * @param token        - Vault access token
 * @param path         - Secret path (e.g. `myapp/config`)
 * @param options      - Optional per-call overrides (cache, TTL, hooks)
 */
export async function getValueByKey<T>(
	resolver: RequestResolver,
	vaultAddress: string,
	token: string,
	path: string,
	options: KvSecretOptions = {}
): Promise<T> {
	const { useCache, cacheTTL, refreshBufferSeconds, onBefore, onAfter, onError } = {
		...defaultOptions,
		...options
	};

	const url = `${vaultAddress}/v1/kv/data/${path}`;

	const rawResponse = await resolver.request<KvResponse<T>>(
		url,
		{ headers: { 'X-Vault-Token': token } },
		{
			...(useCache && {
				cacheKey: `vault_kv_${path}`,
				requestKey: `vault_kv_${path}`,
				cacheTTL,
				refreshBufferSeconds
			}),
			onBefore,
			onAfter,
			onError
		}
	);

	return rawResponse.data.data;
}
