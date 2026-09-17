import { describe, it, expect } from 'vitest';
import { createMemoryResolver } from '../../src/resolver/memory.js';

describe('resolver smoke tests', () => {
	it('createMemoryResolver returns a working resolver instance', () => {
		const resolver = createMemoryResolver();
		expect(resolver).toBeDefined();
		expect(typeof resolver.request).toBe('function');
	});
});
