/**
 * Optional environment variable reading.
 * Does not require dotenv — if the variables are already set in
 * process.env, they will be used as-is.
 * If you want to load a .env file, install dotenv separately
 * and call `import 'dotenv/config'` in your application.
 */
export function getEnv(key: string, fallback?: string): string | undefined {
	return process.env[key] ?? fallback;
}

/**
 * Reads a required environment variable.
 * Throws if the variable is missing or empty.
 */
export function getEnvRequired(key: string): string {
	const value = getEnv(key);
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
}
