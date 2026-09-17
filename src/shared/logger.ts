/**
 * Minimal dependency-free logger used across the package.
 *
 * Consumers can control verbosity globally via {@link setLogLevel}.
 * Default level is `'silent'`, which matches the pre-logger behavior
 * (console.log / console.error on Vault operations).
 */

/**
 * Logging verbosity. Each level includes all levels above it:
 * - `silent` — no output at all
 * - `error`  — errors only
 * - `warn`   — errors and warnings
 * - `info`   — errors, warnings, informational messages
 * - `debug`  — everything, including request lifecycle details
 */
export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

const LEVEL_RANK: Record<LogLevel, number> = {
	silent: 0,
	error: 1,
	warn: 2,
	info: 3,
	debug: 4
};

let currentLevel: LogLevel = 'silent';

/**
 * Sets the global log level for all loggers created via {@link createLogger}.
 */
export function setLogLevel(level: LogLevel): void {
	currentLevel = level;
}

/**
 * Returns the current global log level.
 */
export function getLogLevel(): LogLevel {
	return currentLevel;
}

/**
 * Public logger interface. Each method accepts a message and
 * optional additional arguments forwarded to the console.
 */
export interface Logger {
	error(message: string, ...args: unknown[]): void;
	warn(message: string, ...args: unknown[]): void;
	info(message: string, ...args: unknown[]): void;
	debug(message: string, ...args: unknown[]): void;
}

function shouldLog(level: Exclude<LogLevel, 'silent'>): boolean {
	return LEVEL_RANK[level] <= LEVEL_RANK[currentLevel];
}

/**
 * Creates a namespaced logger. The namespace is prepended to every
 * message, e.g. `createLogger('Vault')` produces `[Vault] ...`.
 *
 * @example
 * const log = createLogger('Vault');
 * log.info('Token obtained');
 * // → [Vault] Token obtained
 */
export function createLogger(namespace: string): Logger {
	const prefix = `[${namespace}]`;

	return {
		error: (message, ...args) => {
			if (shouldLog('error')) {
				console.error(prefix, message, ...args);
			}
		},
		warn: (message, ...args) => {
			if (shouldLog('warn')) {
				console.warn(prefix, message, ...args);
			}
		},
		info: (message, ...args) => {
			if (shouldLog('info')) {
				console.log(prefix, message, ...args);
			}
		},
		debug: (message, ...args) => {
			if (shouldLog('debug')) {
				console.log(prefix, message, ...args);
			}
		}
	};
}
