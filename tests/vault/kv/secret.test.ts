import { describe, it, expect, vi } from 'vitest';
import { getValueByKey } from '../../../src/vault/kv/secret.js';
import { createMockResolver } from '../../helpers/mock-resolver.js';

interface MySecret {
	apiKey: string;
}

const successResponse = {
	data: {
		data: { apiKey: 'k-123' } satisfies MySecret,
		metadata: { version: 1 }
	}
};

describe('vault/kv/getValueByKey', () => {
	it('returns the nested data payload', async () => {
		const { resolver } = createMockResolver({ respond: successResponse });

		const secret = await getValueByKey<MySecret>(
			resolver,
			'https://vault.test:8200',
			'tok',
			'myapp/config'
		);

		expect(secret).toEqual({ apiKey: 'k-123' });
	});

	it('uses the path in URL and cache key', async () => {
		const { resolver, calls } = createMockResolver({ respond: successResponse });

		await getValueByKey(resolver, 'https://vault.test:8200', 'tok', 'myapp/config');

		expect(calls[0].url).toBe('https://vault.test:8200/v1/kv/data/myapp/config');
		expect(calls[0].options.cacheKey).toBe('vault_kv_myapp/config');
		expect(calls[0].options.requestKey).toBe('vault_kv_myapp/config');
	});

	it('caches by default with the default refresh buffer', async () => {
		const { resolver, calls } = createMockResolver({ respond: successResponse });

		await getValueByKey(resolver, 'https://vault.test:8200', 'tok', 'p');

		expect(calls[0].options.cacheKey).toBeDefined();
		expect(calls[0].options.refreshBufferSeconds).toBe(300);
	});

	it('skips cache options when useCache: false', async () => {
		const { resolver, calls } = createMockResolver({ respond: successResponse });

		await getValueByKey(resolver, 'https://vault.test:8200', 'tok', 'p', { useCache: false });

		expect(calls[0].options).not.toHaveProperty('cacheKey');
		expect(calls[0].options).not.toHaveProperty('requestKey');
		expect(calls[0].options).not.toHaveProperty('cacheTTL');
		expect(calls[0].options).not.toHaveProperty('refreshBufferSeconds');
	});

	it('forwards a custom cacheTTL', async () => {
		const { resolver, calls } = createMockResolver({ respond: successResponse });

		await getValueByKey(resolver, 'https://vault.test:8200', 'tok', 'p', { cacheTTL: 60 });

		expect(calls[0].options.cacheTTL).toBe(60);
	});

	it('honors custom hooks', async () => {
		const onBefore = vi.fn();
		const onError = vi.fn();
		const { resolver, calls } = createMockResolver({ respond: successResponse });

		await getValueByKey(resolver, 'https://vault.test:8200', 'tok', 'p', { onBefore, onError });

		expect(calls[0].options.onBefore).toBe(onBefore);
		expect(calls[0].options.onError).toBe(onError);
	});
});
