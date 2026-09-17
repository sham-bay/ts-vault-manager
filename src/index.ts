import type { RequestResolver } from '@shambay/cached-http-resolver';
import { createResolver } from './resolver/index.js';
import { getVaultToken, getPostgresUrl, getValueByKey } from './vault/index.js';
import type { VaultManagerActions, VaultConfig } from './types/vault.js';
import type { VaultTokenOptions } from './types/request.js';

// ---- Public types ----
export type {
	VaultManagerActions,
	VaultConfig,
	VaultDynamicDatabaseRole,
	VaultRequestHooks,
	VaultTokenOptions,
	DatabaseCredsOptions,
	KvSecretOptions,
	ResolverRetryOptions,
	MemoryResolverConfig,
	RedisResolverConfig,
	ResolverFactoryConfig
} from './types/index.js';

// ---- Resolver ----
export { createResolver, createMemoryResolver, createRedisResolver } from './resolver/index.js';

// ---- Vault operations ----
export { getVaultToken, getPostgresUrl, getValueByKey } from './vault/index.js';

// ---- Shared utilities ----
export { getEnv, getEnvRequired } from './shared/env.js';
export { createLogger, setLogLevel, getLogLevel } from './shared/logger.js';
export type { LogLevel, Logger } from './shared/logger.js';

// ---- Vault constants ----
export { DEFAULT_REFRESH_BUFFER_SECONDS, DEFAULT_FALLBACK_TTL_SECONDS } from './vault/constants.js';

const functionMap: Record<
	VaultManagerActions,
	(
		resolver: RequestResolver,
		vaultAddress: string,
		token: string,
		...args: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
	) => Promise<unknown>
> = {
	pg_url: getPostgresUrl,
	value_by_key: getValueByKey
};

/**
 * Arguments required by each Vault manager action.
 *
 * The tuple type keeps the argument order and types specific to each action.
 */
type VaultActionArgs = {
	pg_url: [role: string, host: string, port: number, name: string];

	value_by_key: [path: string, key: string];
};

/**
 * Return type associated with each Vault manager action.
 *
 * The result type is inferred from the selected action.
 */
type VaultActionResult = {
	pg_url: string;
	value_by_key: string;
};

/**
 * Universal entry point for Vault requests.
 */
export async function vaultRequest<A extends VaultManagerActions>(
	config: VaultConfig,
	action: A,
	args: VaultActionArgs[A],
	resolver: RequestResolver,
	options?: VaultTokenOptions
): Promise<VaultActionResult[A]> {
	const token = await getVaultToken(resolver, config, options);
	return (await functionMap[action](resolver, config.vaultAddress, token, ...args)) as VaultActionResult[A];
}

// export async function vaultRequest<T>(
// 	config: VaultConfig,
// 	func: VaultManagerActions,
// 	resolver: RequestResolver,
// 	options?: VaultTokenOptions,
// 	...args: unknown[]
// ): Promise<T> {
// 	const token = await getVaultToken(resolver, config, options);

// 	return (await functionMap[func](resolver, config.vaultAddress, token, ...args)) as T;
// }
