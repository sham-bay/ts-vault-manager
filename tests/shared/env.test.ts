import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getEnv, getEnvRequired } from '../../src/shared/env.js';

describe('shared/env', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe('getEnv', () => {
		it('returns the value when the variable is set', () => {
			process.env.TEST_KEY = 'hello';
			expect(getEnv('TEST_KEY')).toBe('hello');
		});

		it('returns undefined when the variable is missing', () => {
			delete process.env.MISSING_KEY;
			expect(getEnv('MISSING_KEY')).toBeUndefined();
		});

		it('returns the fallback when the variable is missing', () => {
			delete process.env.MISSING_KEY;
			expect(getEnv('MISSING_KEY', 'default')).toBe('default');
		});

		it('prefers the actual value over the fallback', () => {
			process.env.TEST_KEY = 'real';
			expect(getEnv('TEST_KEY', 'default')).toBe('real');
		});
	});

	describe('getEnvRequired', () => {
		it('returns the value when set', () => {
			process.env.TEST_KEY = 'hello';
			expect(getEnvRequired('TEST_KEY')).toBe('hello');
		});

		it('throws when missing', () => {
			delete process.env.MISSING_KEY;
			expect(() => getEnvRequired('MISSING_KEY')).toThrow(
				'Missing required environment variable: MISSING_KEY'
			);
		});

		it('throws when empty', () => {
			process.env.EMPTY_KEY = '';
			expect(() => getEnvRequired('EMPTY_KEY')).toThrow();
		});
	});
});
