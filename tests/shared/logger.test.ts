import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger, setLogLevel, getLogLevel } from '../../src/shared/logger.js';

describe('shared/logger', () => {
	let logSpy: ReturnType<typeof vi.spyOn>;
	let warnSpy: ReturnType<typeof vi.spyOn>;
	let errorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		setLogLevel('info');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('defaults to the info level', () => {
		expect(getLogLevel()).toBe('info');
	});

	it('prefixes messages with the namespace', () => {
		const log = createLogger('Vault');
		log.info('hello');
		expect(logSpy).toHaveBeenCalledWith('[Vault]', 'hello');
	});

	it('forwards additional arguments', () => {
		const log = createLogger('Vault');
		log.error('failed', { code: 42 });
		expect(errorSpy).toHaveBeenCalledWith('[Vault]', 'failed', { code: 42 });
	});

	describe('level filtering', () => {
		it('silent suppresses every level', () => {
			setLogLevel('silent');
			const log = createLogger('X');
			log.error('e');
			log.warn('w');
			log.info('i');
			log.debug('d');
			expect(errorSpy).not.toHaveBeenCalled();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(logSpy).not.toHaveBeenCalled();
		});

		it('error allows only errors', () => {
			setLogLevel('error');
			const log = createLogger('X');
			log.error('e');
			log.warn('w');
			log.info('i');
			log.debug('d');
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(warnSpy).not.toHaveBeenCalled();
			expect(logSpy).not.toHaveBeenCalled();
		});

		it('info allows error, warn, info', () => {
			setLogLevel('info');
			const log = createLogger('X');
			log.error('e');
			log.warn('w');
			log.info('i');
			log.debug('d');
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(logSpy).toHaveBeenCalledTimes(1);
		});

		it('debug shows everything', () => {
			setLogLevel('debug');
			const log = createLogger('X');
			log.error('e');
			log.warn('w');
			log.info('i');
			log.debug('d');
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(logSpy).toHaveBeenCalledTimes(2);
		});
	});
});
