import { RequestResolver } from '@shambay/cached-http-resolver';
import { createMemoryResolver } from './memory.js';
import { createRedisResolver } from './redis.js';
import type { ResolverFactoryConfig } from '../types/resolver.js';

/**
 * Factory that creates a RequestResolver based on the provided configuration.
 *
 * @example
 * // In-memory cache (default)
 * const resolver = createResolver({ cache: 'memory' });
 *
 * @example
 * // Redis-backed cache
 * const resolver = createResolver({
 *   cache: 'redis',
 *   redis: { host: 'localhost', port: 6379 },
 *   keyPrefix: 'vault:',
 * });
 */
export function createResolver(
	config: ResolverFactoryConfig = { cache: 'memory' }
): RequestResolver {
	switch (config.cache) {
		case 'redis':
			return createRedisResolver(config);
		case 'memory':
		default:
			return createMemoryResolver(config);
	}
}
