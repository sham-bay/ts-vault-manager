# @shambay/vault-manager

Vault client with built-in caching, deduplication, and proactive data refresh.

Based on [`@shambay/cached-http-resolver`](https://www.npmjs.com/package/@shambay/cached-http-resolver).

> Repository: [`ts-vault-manager`](https://github.com/<your-username>/ts-vault-manager)

## Installation

```bash
npm install @shambay/vault-manager

# optional for Redis:
npm install ioredis

# optional for dotenv:
npm install dotenv
```

## Quick Start

### Create a resolver

For a simple application, use the in-memory resolver:

```typescript
import { createResolver } from '@shambay/vault-manager';

const resolver = createResolver({
	cache: 'memory'
});
```

For applications running multiple instances, use Redis as a shared cache:

```typescript
const resolver = createResolver({
	cache: 'redis',
	redis: {
		host: 'localhost',
		port: 6379
	},
	keyPrefix: 'vault:',
	maxRetries: 5
});
```

You can also use the concrete factories directly:

```typescript
import {
	createMemoryResolver,
	createRedisResolver
} from '@shambay/vault-manager';

const memory = createMemoryResolver({
	cache: 'memory'
});

const redis = createRedisResolver({
	cache: 'redis',
	redis: {
		host: 'redis'
	}
});
```

### Configure Vault

The library uses Vault AppRole authentication:

```typescript
const config = {
	vaultAddress: 'https://vault.example.com:8200',
	rolePath: 'approle',
	roleId: process.env.VAULT_ROLE_ID!,
	secretId: process.env.VAULT_SECRET_ID!
};
```

### Request a value from Vault

Use `vaultRequest` to authenticate with Vault and execute an action.

The action determines the required arguments and return type:

```typescript
import { vaultRequest } from '@shambay/vault-manager';

const pgUrl = await vaultRequest(
	config,
	'pg_url',
	[
		'db-role',
		'localhost',
		5432,
		'mydb'
	],
	resolver
);

console.log(pgUrl);
```

For `pg_url`, the arguments are:

```text
role, host, port, name
```

The return type is inferred as `string`.

The resolver caches the Vault token and handles retries and proactive token refresh automatically.

### Request a value by key

The `value_by_key` action accepts a Vault path and key:

```typescript
const value = await vaultRequest(
	config,
	'value_by_key',
	[
		'my-secret',
		'apiKey'
	],
	resolver
);

console.log(value);
```

The return type is also inferred as `string`.

### Using the default resolver

If you don't need to configure a resolver explicitly, create an in-memory resolver with the default settings:

```typescript
import { createResolver, vaultRequest } from '@shambay/vault-manager';

const resolver = createResolver();

const pgUrl = await vaultRequest(
	config,
	'pg_url',
	[
		'db-role',
		'localhost',
		5432,
		'mydb'
	],
	resolver
);
```

### Override token options

You can customize Vault token behavior for an individual request using `VaultTokenOptions`:

```typescript
import type { VaultTokenOptions } from '@shambay/vault-manager';

const tokenOptions: VaultTokenOptions = {
	refreshBufferSeconds: 60,
	fallbackTtlSeconds: 300,

	onBefore: (url) => {
		log.debug(`Requesting Vault token from ${url}`);
	},

	onAfter: (_response, data) => {
		const lease = (data as VaultTokenResponse | undefined)
			?.auth?.lease_duration;

		log.debug(`Token obtained, lease_duration: ${lease}`);
	},

	onError: (error, attempt) => {
		log.error(`Attempt ${attempt} failed: ${error.message}`);
	}
};

const pgUrl = await vaultRequest(
	config,
	'pg_url',
	[
		'db-role',
		'localhost',
		5432,
		'mydb'
	],
	resolver,
	tokenOptions
);
```

Only the options you provide are overridden. The remaining options keep their default values.

For example, to change only the refresh buffer:

```typescript
const pgUrl = await vaultRequest(
	config,
	'pg_url',
	[
		'db-role',
		'localhost',
		5432,
		'mydb'
	],
	resolver,
	{
		refreshBufferSeconds: 120
	}
);
```

### Extend the default hooks

The token hooks can be used to integrate Vault requests with your application's logging, metrics, or tracing:

```typescript
const logger = custom logger;

const tokenOptions: VaultTokenOptions = {
	onBefore: (url) => {
		logger.debug({ url }, 'Requesting Vault token');
	},

	onAfter: (_response, data) => {
		const leaseDuration =
			(data as VaultTokenResponse | undefined)
				?.auth?.lease_duration;

		metrics.vaultTokenRequests.inc();

		logger.debug(
			{ leaseDuration },
			'Vault token obtained'
		);
	},

	onError: (error, attempt) => {
		metrics.vaultTokenErrors.inc();

		logger.warn(
			{ error, attempt },
			'Vault token request failed'
		);
	}
};

const pgUrl = await vaultRequest(
	config,
	'pg_url',
	[
		'db-role',
		'localhost',
		5432,
		'mydb'
	],
	resolver,
	tokenOptions
);
```

This allows you to extend the default token behavior with application-specific logging, monitoring, or tracing without replacing the library's token caching, retry, or refresh logic.

## API Reference

### `vaultRequest<A>(config, action, args, resolver, options?)`

Entry point for executing Vault manager actions.

```typescript
vaultRequest<A extends VaultManagerActions>(
	config: VaultConfig,
	action: A,
	args: VaultActionArgs[A],
	resolver: RequestResolver,
	options?: VaultTokenOptions
): Promise<VaultActionResult[A]>
```

| Parameter  | Type                 | Description                                                                 |
| ---------- | -------------------- | --------------------------------------------------------------------------- |
| `config`   | `VaultConfig`        | Vault AppRole configuration: `{ vaultAddress, rolePath, roleId, secretId }` |
| `action`   | `A`                  | Vault manager action                                                        |
| `args`     | `VaultActionArgs[A]` | Arguments required by the selected action                                   |
| `resolver` | `RequestResolver`    | Resolver used for caching and executing requests                            |
| `options`  | `VaultTokenOptions?` | Optional per-request token configuration                                    |

The `action` determines both the required arguments and the return type.

Supported actions:

```typescript
type VaultManagerActions = 'pg_url' | 'value_by_key';
```

#### `pg_url`

Arguments:

```typescript
type PgUrlArgs = [
	role: string,
	host: string,
	port: number,
	name: string
];
```

Example:

```typescript
const pgUrl = await vaultRequest(
	config,
	'pg_url',
	[
		'db-role',
		'localhost',
		5432,
		'mydb'
	],
	resolver
);
```

The return type is `string`.

#### `value_by_key`

Arguments:

```typescript
type ValueByKeyArgs = [
	path: string,
	key: string
];
```

Example:

```typescript
const value = await vaultRequest(
	config,
	'value_by_key',
	[
		'myapp/config',
		'apiKey'
	],
	resolver
);
```

The return type is `string`.


