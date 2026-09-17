import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted тоже поднимается, но выполняется ДО vi.mock.
// Всё, что объявлено внутри, доступно в фабриках vi.mock.
const { mockCreateMemory, mockCreateRedis } = vi.hoisted(() => ({
	mockCreateMemory: vi.fn().mockReturnValue({ __kind: 'memory' }),
	mockCreateRedis: vi.fn().mockReturnValue({ __kind: 'redis' })
}));

vi.mock('../../src/resolver/memory.js', () => ({
	createMemoryResolver: mockCreateMemory
}));
vi.mock('../../src/resolver/redis.js', () => ({
	createRedisResolver: mockCreateRedis
}));

import { createResolver } from '../../src/resolver/factory.js';

describe('resolver/factory', () => {
	beforeEach(() => {
		mockCreateMemory.mockClear();
		mockCreateRedis.mockClear();
	});

	it('defaults to memory when no config provided', () => {
		const result = createResolver();
		expect(mockCreateMemory).toHaveBeenCalledTimes(1);
		expect(mockCreateRedis).not.toHaveBeenCalled();
		expect(result).toEqual({ __kind: 'memory' });
	});

	it('dispatches to memory when cache === "memory"', () => {
		createResolver({ cache: 'memory' });
		expect(mockCreateMemory).toHaveBeenCalledWith({ cache: 'memory' });
		expect(mockCreateRedis).not.toHaveBeenCalled();
	});

	it('dispatches to redis when cache === "redis"', () => {
		const config = { cache: 'redis' as const, redis: { host: 'localhost' } };
		createResolver(config);
		expect(mockCreateRedis).toHaveBeenCalledWith(config);
		expect(mockCreateMemory).not.toHaveBeenCalled();
	});
});
