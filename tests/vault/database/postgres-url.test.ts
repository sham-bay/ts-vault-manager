import { describe, it, expect, vi } from 'vitest';
import { getPostgresUrl } from '../../../src/vault/database/postgres-url.js';
import { createMockResolver } from '../../helpers/mock-resolver.js';

const successResponse = {
	data: { username: 'u', password: 'p' },
	lease_duration: 600
};

describe('vault/database/getPostgresUrl', () => {
	it('builds a postgresql URL from the credentials', async () => {
		const { resolver } = createMockResolver({ respond: successResponse });

		const url = await getPostgresUrl(
			resolver,
			'https://vault.test:8200',
			'tok',
			'my-role',
			'db.local',
			5432,
			'appdb'
		);

		expect(url).toBe('postgresql://u:p@db.local:5432/appdb');
	});

	it('sends the token header', async () => {
		const { resolver, calls } = createMockResolver({ respond: successResponse });

		await getPostgresUrl(resolver, 'https://vault.test:8200', 'tok', 'my-role', 'h', 5432, 'db');

		expect(calls[0].init.headers).toEqual({ 'X-Vault-Token': 'tok' });
		expect(calls[0].url).toBe('https://vault.test:8200/v1/database/creds/my-role');
	});

	it('uses the role name as cache key', async () => {
		const { resolver, calls } = createMockResolver({ respond: successResponse });

		await getPostgresUrl(resolver, 'https://vault.test:8200', 'tok', 'my-role', 'h', 5432, 'db');

		expect(calls[0].options.cacheKey).toBe('db_creds_my-role');
		expect(calls[0].options.requestKey).toBe('db_creds_my-role');
	});

	it('propagates the lease_duration through ttlResolver', async () => {
		const { resolver, calls } = createMockResolver({ respond: successResponse });

		await getPostgresUrl(resolver, 'https://vault.test:8200', 'tok', 'my-role', 'h', 5432, 'db');

		expect(calls[0].options.ttlResolver!({ lease_duration: 900 })).toBe(900);
	});

	it('falls back to 3300 when lease_duration is missing', async () => {
		const { resolver, calls } = createMockResolver({ respond: successResponse });

		await getPostgresUrl(resolver, 'https://vault.test:8200', 'tok', 'my-role', 'h', 5432, 'db');

		expect(calls[0].options.ttlResolver!({})).toBe(3300);
	});

	it('honors a custom onError hook', async () => {
		const onError = vi.fn();
		const { resolver, calls } = createMockResolver({ respond: successResponse });

		await getPostgresUrl(resolver, 'https://vault.test:8200', 'tok', 'my-role', 'h', 5432, 'db', {
			onError
		});

		expect(calls[0].options.onError).toBe(onError);
	});
});
