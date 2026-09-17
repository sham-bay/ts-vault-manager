import type { RequestResolver } from '@shambay/cached-http-resolver';

/**
 * Hooks for observing the lifecycle of a Vault request.
 * All hooks are optional.
 */
export interface VaultRequestHooks {
	/** Called right before a request is sent. */
	onBefore?: (url: string) => void;
	/** Called after a successful response. */
	onAfter?: (response: unknown, data: unknown) => void;
	/** Called when a request attempt fails. */
	onError?: (error: Error, attempt: number) => void;
}

/**
 * Per-call options for Vault token retrieval.
 */
export interface VaultTokenOptions extends VaultRequestHooks {
	/**
	 * Refresh the token this many seconds before it expires.
	 * Default: 300 (5 minutes).
	 */
	refreshBufferSeconds?: number;
	/**
	 * Fallback TTL in seconds used when Vault does not return
	 * a valid `lease_duration`. Default: 3300.
	 */
	fallbackTtlSeconds?: number;
}

/**
 * Per-call options for dynamic database credentials.
 */
export interface DatabaseCredsOptions extends VaultRequestHooks {
	/** Refresh the credentials this many seconds before they expire. Default: 300. */
	refreshBufferSeconds?: number;
	/** Fallback TTL in seconds when `lease_duration` is missing. Default: 3300. */
	fallbackTtlSeconds?: number;
}

/**
 * Per-call options for KV v2 secret reads.
 */
export interface KvSecretOptions extends VaultRequestHooks {
	/** Whether to cache the result. Default: true. */
	useCache?: boolean;
	/** Explicit cache TTL in seconds. If omitted, the cache store default is used. */
	cacheTTL?: number;
	/** Refresh the value this many seconds before it expires. Default: 300. */
	refreshBufferSeconds?: number;
}
