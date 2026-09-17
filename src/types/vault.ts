/**
 * Supported Vault manager actions.
 * - `pg_url`       — fetch dynamic PostgreSQL credentials and build a connection URL
 * - `value_by_key` — read a secret from Vault KV v2 by path
 */
export type VaultManagerActions = 'pg_url' | 'value_by_key';

/**
 * Configuration required to authenticate against Vault via AppRole.
 */
export interface VaultConfig {
	/** Base address of the Vault server (e.g. `https://vault.example.com:8200`) */
	vaultAddress: string;
	/** AppRole mount path (e.g. `approle`) */
	rolePath: string;
	/** AppRole Role ID */
	roleId: string;
	/** AppRole Secret ID */
	secretId: string;
}

/**
 * Describes a dynamic database role and the target database
 * used to assemble a connection URL.
 */
export interface VaultDynamicDatabaseRole {
	/** Name of the database role in Vault */
	role: string;
	/** Database host */
	host: string;
	/** Database port */
	port: number;
	/** Database name */
	name: string;
}
