import { describe, it, expect, vi } from 'vitest';
import { vaultRequest } from '../src/index.js';
import { createMockResolver } from './helpers/mock-resolver.js';
import type { VaultConfig } from '../src/types/vault.js';

const baseConfig: VaultConfig = {
	vaultAddress: 'https://vault.test:8200',
	rolePath: 'approle',
	roleId: 'role-123',
	secretId: 'secret-456'
};

describe('vaultRequest', () => {
	it('fetches the token first, then calls the action', async () => {
		const { resolver, calls } = createMockResolver({
			respond: (url) => {
				if (url.includes('/v1/auth/')) {
					return { auth: { client_token: 'tok', lease_duration: 3600 } };
				}
				if (url.includes('/v1/database/creds/')) {
					return { data: { username: 'u', password: 'p' }, lease_duration: 600 };
				}
				throw new Error(`unexpected url: ${url}`);
			}
		});

		const url = await vaultRequest(
			baseConfig,
			'pg_url',
			['my-role', 'db.local', 5432, 'appdb'],
			resolver
		);

		expect(url).toBe('postgresql://u:p@db.local:5432/appdb');
		expect(calls).toHaveLength(2);
		expect(calls[0].url).toContain('/v1/auth/approle/login');
		expect(calls[1].url).toContain('/v1/database/creds/my-role');
	});

	it('routes "value_by_key" to the KV module', async () => {
		const { resolver, calls } = createMockResolver({
			respond: (url) => {
				if (url.includes('/v1/auth/')) {
					return { auth: { client_token: 'tok', lease_duration: 3600 } };
				}
				return { data: { data: { hello: 'world' }, metadata: {} } };
			}
		});

		const value = await vaultRequest(
			baseConfig,
			'value_by_key',
			['myapp/config', 'hello'],
			resolver,
		);

		expect(value).toEqual({ hello: 'world' });
		expect(calls[1].url).toContain('/v1/kv/data/myapp/config');
	});

	it('propagates token options to the token fetch', async () => {
		const onError = vi.fn();
		const { resolver, calls } = createMockResolver({
			respond: (url) => {
				if (url.includes('/v1/auth/')) {
					return { auth: { client_token: 'tok', lease_duration: 3600 } };
				}
				return { data: { data: { hello: 'world' }, metadata: {} } };
			}
		});

		await vaultRequest(
			baseConfig,
			'value_by_key',
			['myapp/config', 'hello'],
			resolver,
			{ refreshBufferSeconds: 10, onError },
		);

		expect(calls[0].options.refreshBufferSeconds).toBe(10);
		expect(calls[0].options.onError).toBe(onError);
	});
});
