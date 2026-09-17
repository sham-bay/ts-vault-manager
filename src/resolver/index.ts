/**
 * Public entry point for resolver factories.
 * Re-exports the unified factory plus the concrete memory/redis factories.
 */
export { createResolver } from './factory.js';
export { createMemoryResolver } from './memory.js';
export { createRedisResolver } from './redis.js';
