/**
 * Common retry/backoff options shared by all resolvers.
 */
export interface ResolverRetryOptions {
	/** Maximum number of retry attempts (default: 3) */
	maxRetries?: number;
	/** Base delay between retries in milliseconds (default: 1000) */
	baseDelay?: number;
	/** Whether to use exponential backoff (default: true) */
	useExponential?: boolean;
}

/**
 * Configuration for an in-memory cache resolver.
 */
export interface MemoryResolverConfig extends ResolverRetryOptions {
	cache: 'memory';
}

/**
 * Configuration for a Redis-backed cache resolver.
 * `redis` accepts the same options as `ioredis` (host, port, password, etc.).
 */
export interface RedisResolverConfig extends ResolverRetryOptions {
	cache: 'redis';
	/** ioredis connection options */
	redis: {
		host?: string;
		port?: number;
		password?: string;
		db?: number;
		[key: string]: unknown;
	};
	/** Optional prefix for all cache keys */
	keyPrefix?: string;
}

/**
 * Union of all supported resolver configurations.
 * Discriminated by the `cache` field.
 */
export type ResolverFactoryConfig = MemoryResolverConfig | RedisResolverConfig;
