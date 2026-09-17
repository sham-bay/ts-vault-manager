import { RequestResolver, createCacheStore } from '@shambay/cached-http-resolver';
import type { MemoryResolverConfig } from '../types/resolver.js';

/**
 * Creates a RequestResolver backed by an in-memory cache.
 * Suitable for single-process usage where the cache does not need to be shared.
 */
export function createMemoryResolver(
	config: MemoryResolverConfig = { cache: 'memory' }
): RequestResolver {
	const { maxRetries = 3, baseDelay = 1000, useExponential = true } = config;

	const cache = createCacheStore('memory');

	return new RequestResolver(cache, {
		maxRetries,
		baseDelay,
		useExponential
	});
}
