
# snowflake-js
Easy-to-use generator of unique &amp; sortable IDs.

Snowflake contains 64 bits of data:
- timestamp uses 42 bits;
- by default, server ID uses 7 bits;
- by default, worker ID uses 5 bits;
- increment uses what is left — by default it is 10 bits.

Snowflakes converted to `BitInt`, decimal string, hex string and base-62 string are sortable. It means that Snowflakes created with the same `server_id` and `worker_id` will be sorted in the same order as they were created. Snowflakes created on different servers and/or different workers are sortable only by the timestamp — with the precision of 1 millisecond.

## Installation

```bash
bun install @kirick/snowflake
pnpm install @kirick/snowflake
npm install @kirick/snowflake
```

## API

### SnowflakeFactory

#### `constructor(options: SnowflakeFactoryOptions): SnowflakeFactory`

First of all, you need to define Server ID and Worker ID. You should do it yourself, because it depends on your project. For example, you can use environment variables.

Then, create `SnowflakeFactory`.

```js
import { SnowflakeFactory } from '@kirick/snowflake';

const snowflakeFactory = new SnowflakeFactory({
    serverId: process.env.SERVER_ID,
    workerId: process.env.WORKER_ID,
});
```

By default, Snowflake uses **7** bits for `server_id` (limiting `server_id` to **128**) and **5** bits for `worker_id` (limiting `worker_id` to **32**). To change this, pass `bits` property to `SnowflakeFactoryOptions`.

```js
const snowflakeFactory = new SnowflakeFactory({
    serverId: process.env.SERVER_ID,
    workerId: process.env.WORKER_ID,
    bits: {
        server_id: 10,
        worker_id: 10,
    },
});
```

Remember that total number of bits for `server_id` and `worker_id` is limited by **22**. By increasing number of bits for `server_id` and `worker_id` you decrease number of bits for `increment` and decrease number of Snowflakes that can be created per millisecond. In example above, number of bits left for `increment` is only `64 - 42 - 10 - 10 = 2`, which means that only **4** Snowflakes can be created per millisecond.

It is possible to set bits of `server_id` and/or `worker_id` to **0**. For example, it may be convenient to remove `server_id` for Kubernetes pods.

#### `create(): Snowflake`

Synchronously creates Snowflake.

```js
const snowflake = snowflakeFactory.create();
```

Number of Snowflakes that can be created per millisecond is limited by **1024** by default. If you reach this limit, `create` method will throw an `SnowflakeIncrementOverflowError`. To avoid that error, use asynchronous `createSafe` method.

You can adjust limit of Snowflakes per millisecond in the constructor, changing `bits` property of `SnowflakeFactoryOptions`.

#### `async createSafe(): Snowflake`

Asynchronously creates Snowflake, trying to avoid `SnowflakeIncrementOverflowError`.

Each time it gets `SnowflakeIncrementOverflowError`, it waits until the next millisecond and then tries to generate a new Snowflake.

```js
const snowflake = await snowflakeFactory.createSafe();
```

#### `parse(value: ArrayBuffer | Buffer | BigInt | string, encoding? = "decimal", "hex", "base62"): Snowflake`

Parses Snowflake from `ArrayBuffer`, `Buffer`, `BigInt` or `string`.

When passing `value` as `string`, you should specify `encoding`.

```js
// from ArrayBuffer
const snowflake = snowflakeFactory.parse(
    new Uint8Array([
        3, 149, 51, 166,
        3, 192,  0,   0
    ]).buffer,
);

// from Buffer
const snowflake = snowflakeFactory.parse(
    Buffer.from([
        3, 149, 51, 166,
        3, 192,  0,   0
    ]),
);

// from BigInt
const snowflake = snowflakeFactory.parse(258169341764173824n);

// from decimal string
const snowflake = snowflakeFactory.parse(
    '258169341764173824',
    'decimal',
);

// from hex string
const snowflake = snowflakeFactory.parse(
    '039533a603c00000',
    'hex',
);

// from base62 string
const snowflake = snowflakeFactory.parse(
    'J4Pw2NnsAK',
    'base62',
);
```

### Snowflake

#### `readonly timestamp: number`

Returns timestamp in milliseconds when Snowflake was created.

#### `readonly server_id: number`

Returns server ID where Snowflake was created.

#### `readonly worker_id: number`

Returns worker ID where Snowflake was created.

#### `readonly increment: number`

Returns increment of Snowflake.

#### `readonly array_buffer: ArrayBuffer`

Returns Snowflake as `ArrayBuffer`.

```js
const snowflake = snowflakeFactory.create();
snowflake.array_buffer;
// ArrayBuffer(8) { [Uint8Contents]: <03 95 33 a6 03 c0 00 00> }
```

#### `readonly buffer: Buffer`

Returns Snowflake as `Buffer`.

```js
const snowflake = snowflakeFactory.create();
snowflake.buffer;
// <Buffer 03 95 33 a6 03 c0 00 00>
```

#### `readonly bigint: BigInt`

Returns Snowflake as `BigInt`.

```js
const snowflake = snowflakeFactory.create();
snowflake.bigint;
// 258169341764173824n
```

#### `readonly decimal: string`

Returns Snowflake as base 10 (decimal) `string`.

```js
const snowflake = snowflakeFactory.create();
snowflake.decimal;
// '258169341764173824'
```

#### `readonly hex: string`

Returns Snowflake as base 16 (hex) `string`.

```js
const snowflake = snowflakeFactory.create();
snowflake.hex;
// '039533a603c00000'
```

#### `readonly base62: string`

Returns Snowflake as base 62 `string`.

```js
const snowflake = snowflakeFactory.create();
snowflake.base62;
// 'J4Pw2NnsAK'
```
