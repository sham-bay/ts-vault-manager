import { RequestResolver, createCacheStore } from '@shambay/cached-http-resolver';
import type { RedisResolverConfig } from '../types/resolver.js';

/**
 * Creates a RequestResolver backed by a Redis cache.
 * Use this when the cache must be shared across multiple processes or instances.
 *
 * Requires `ioredis` to be installed as a peer dependency.
 */
export function createRedisResolver(config: RedisResolverConfig): RequestResolver {
	const { maxRetries = 3, baseDelay = 1000, useExponential = true, redis, keyPrefix } = config;

	const cache = createCacheStore('redis', {
		redis,
		...(keyPrefix && { keyPrefix })
	});

	return new RequestResolver(cache, {
		maxRetries,
		baseDelay,
		useExponential
	});
}
