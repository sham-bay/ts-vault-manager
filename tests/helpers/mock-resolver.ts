import { vi, type Mock } from 'vitest';
import type { RequestResolver } from '@shambay/cached-http-resolver';

export interface CapturedCall {
	url: string;
	init: RequestInit;
	options: {
		cacheKey?: string;
		requestKey?: string;
		refreshBufferSeconds?: number;
		cacheTTL?: number;
		ttlResolver?: (data: unknown) => number;
		onBefore?: (url: string) => void;
		onAfter?: (response: unknown, data: unknown) => void;
		onError?: (error: Error, attempt: number) => void;
	};
}

export interface MockResolverOptions<T = unknown> {
	/** Static response or a function that derives it from the URL. */
	respond?: T | ((url: string) => T);
	/** Number of initial calls that should throw before succeeding. */
	failCount?: number;
	/** Error thrown for the failing calls (defaults to a generic Error). */
	failError?: Error;
}

export interface MockResolver {
	resolver: RequestResolver;
	request: Mock;
	calls: CapturedCall[];
}

/**
 * Creates a fake RequestResolver for unit tests.
 * Records every call so tests can assert on URL, init and options.
 */
export function createMockResolver<T = unknown>(opts: MockResolverOptions<T> = {}): MockResolver {
	const calls: CapturedCall[] = [];

	const request = vi.fn(
		async (url: string, init: RequestInit, options: CapturedCall['options']) => {
			calls.push({ url, init, options });

			if (opts.failCount && calls.length <= opts.failCount) {
				throw opts.failError ?? new Error('mock failure');
			}

			if (typeof opts.respond === 'function') {
				return (opts.respond as (url: string) => T)(url);
			}
			return opts.respond;
		}
	);

	return {
		resolver: { request } as unknown as RequestResolver,
		request,
		calls
	};
}
