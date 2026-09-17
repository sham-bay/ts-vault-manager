// Vault domain types
export type { VaultManagerActions, VaultConfig, VaultDynamicDatabaseRole } from './vault.js';

// Per-call request options and hooks
export type {
	VaultRequestHooks,
	VaultTokenOptions,
	DatabaseCredsOptions,
	KvSecretOptions
} from './request.js';

// Resolver configuration
export type {
	ResolverRetryOptions,
	MemoryResolverConfig,
	RedisResolverConfig,
	ResolverFactoryConfig
} from './resolver.js';
