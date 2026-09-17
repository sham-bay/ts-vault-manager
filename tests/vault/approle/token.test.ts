import { describe, it, expect, vi } from 'vitest';
import { getVaultToken } from '../../../src/vault/approle/token.js';
import { createMockResolver } from '../../helpers/mock-resolver.js';
import type { VaultConfig } from '../../../src/types/vault.js';

const baseConfig: VaultConfig = {
	vaultAddress: 'https://vault.test:8200',
	rolePath: 'approle',
	roleId: 'role-123',
	secretId: 'secret-456'
};

const successResponse = {
	auth: { client_token: 'tok', lease_duration: 3600 }
};

describe('vault/approle/getVaultToken', () => {
	it('sends a POST to the AppRole login endpoint', async () => {
		const { resolver, calls } = createMockResolver({ respond: successResponse });

		await getVaultToken(resolver, baseConfig);

		expect(calls).toHaveLength(1);
		expect(calls[0].url).toBe('https://vault.test:8200/v1/auth/approle/login');
		expect(calls[0].init.method).toBe('POST');
		expect(calls[0].init.headers).toEqual({ 'Content-Type': 'application/json' });
		expect(JSON.parse(calls[0].init.body as string)).toEqual({
			role_id: 'role-123',
			secret_id: 'secret-456'
		});
	});

	it('returns the client_token from the response', async () => {
		const { resolver } = createMockResolver({ respond: successResponse });
		await expect(getVaultToken(resolver, baseConfig)).resolves.toBe('tok');
	});

	it('scopes cache keys by roleId', async () => {
		const { resolver, calls } = createMockResolver({ respond: successResponse });
		await getVaultToken(resolver, baseConfig);

		expect(calls[0].options.cacheKey).toBe('vault_token_role-123');
		expect(calls[0].options.requestKey).toBe('vault_token_request_role-123');
	});

	it('uses refreshBufferSeconds = 300 by default', async () => {
		const { resolver, calls } = createMockResolver({ respond: successResponse });
		await getVaultToken(resolver, baseConfig);
		expect(calls[0].options.refreshBufferSeconds).toBe(300);
	});

	it('allows overriding refreshBufferSeconds', async () => {
		const { resolver, calls } = createMockResolver({ respond: successResponse });
		await getVaultToken(resolver, baseConfig, { refreshBufferSeconds: 60 });
		expect(calls[0].options.refreshBufferSeconds).toBe(60);
	});

	describe('ttlResolver', () => {
		it('returns lease_duration when positive', async () => {
			const { resolver, calls } = createMockResolver({ respond: successResponse });
			await getVaultToken(resolver, baseConfig);

			expect(calls[0].options.ttlResolver!({ auth: { lease_duration: 1800 } })).toBe(1800);
		});

		it('falls back to 3300 when lease_duration is missing', async () => {
			const { resolver, calls } = createMockResolver({ respond: successResponse });
			await getVaultToken(resolver, baseConfig);

			expect(calls[0].options.ttlResolver!({ auth: {} })).toBe(3300);
		});

		it('falls back when lease_duration is zero or negative', async () => {
			const { resolver, calls } = createMockResolver({ respond: successResponse });
			await getVaultToken(resolver, baseConfig);

			expect(calls[0].options.ttlResolver!({ auth: { lease_duration: 0 } })).toBe(3300);
			expect(calls[0].options.ttlResolver!({ auth: { lease_duration: -1 } })).toBe(3300);
		});

		it('honors a custom fallbackTtlSeconds', async () => {
			const { resolver, calls } = createMockResolver({ respond: successResponse });
			await getVaultToken(resolver, baseConfig, { fallbackTtlSeconds: 7200 });

			expect(calls[0].options.ttlResolver!({ auth: {} })).toBe(7200);
		});
	});

	it('throws when client_token is missing', async () => {
		const { resolver } = createMockResolver({
			respond: { auth: { lease_duration: 3600 } }
		});

		await expect(getVaultToken(resolver, baseConfig)).rejects.toThrow(
			'Vault response missing client_token'
		);
	});

	it('uses caller-provided hooks when supplied', async () => {
		const onBefore = vi.fn();
		const onAfter = vi.fn();
		const onError = vi.fn();

		const { resolver, calls } = createMockResolver({ respond: successResponse });
		await getVaultToken(resolver, baseConfig, { onBefore, onAfter, onError });

		expect(calls[0].options.onBefore).toBe(onBefore);
		expect(calls[0].options.onAfter).toBe(onAfter);
		expect(calls[0].options.onError).toBe(onError);
	});
});
