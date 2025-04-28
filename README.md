# @kirick/snowflake

[![npm version](https://img.shields.io/npm/v/@kirick/snowflake.svg)](https://www.npmjs.com/package/@kirick/snowflake)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Generator of unique & sortable IDs based on the [Snowflake IDs](https://en.wikipedia.org/wiki/Snowflake_ID) algorithm.

## Features

- 🔄 **Distributed**: Generate IDs across multiple servers without coordination
- 📊 **Sortable**: IDs are time-ordered for easy sorting with default JS operators and indexing
- 🔄 **Multiple formats**: Use Snowflakes as ArrayBuffer, Buffer, BigInt, as well as decimal, hexadecimal, and base62 strings
- 🔍 **TypeScript**: Fully typed API for improved developer experience
- 🛠️ **Customizable**: Configure server/worker bits to suit your infrastructure

## How It Works

Snowflake IDs are 64-bit values structured as follows:

```
+-----------+--------+--------+-----------+
| timestamp | server | worker | increment |
| 42 bits   | 7 bits | 5 bits | 10 bits   |
+-----------+--------+--------+-----------+
```

The actual bit allocation for `server` and `worker` can be adjusted using the `bits` option in the constructor.

- **Timestamp**: Milliseconds since January 1, 2022
- **Server ID**: Identifies the server instance
- **Worker ID**: Identifies the worker process on the server
- **Increment**: Sequence number for IDs generated in the same millisecond

## Installation

```bash
bun install @kirick/snowflake
# or
pnpm install @kirick/snowflake
# or
npm install @kirick/snowflake
```

## Usage

### Basic Usage

```typescript
import { SnowflakeFactory } from '@kirick/snowflake';

// Create a factory with custom server and worker IDs
const factory = new SnowflakeFactory({
  server_id: 3,
  worker_id: 2
});

// Generate a new snowflake ID
const snowflake = factory.create();

// Convert to different formats
console.log(snowflake.toDecimal()); // "197388558662189056"
console.log(snowflake.toHex());     // "02be35da5e810042"
console.log(snowflake.toBase62());  // "3fMxtObVhma"
console.log(snowflake.toBigInt());  // 197388558662189056n

// Extract components
console.log(snowflake.timestamp); // 1690123456789
console.log(snowflake.server_id); // 3
console.log(snowflake.worker_id); // 2
console.log(snowflake.increment); // 0
```

### Custom Bit Allocation

Customize how bits are allocated between server ID, worker ID, and increment counter to match your specific infrastructure needs. This feature allows you to optimize the Snowflake algorithm for different scaling patterns:

- **Horizontal Scaling**: Allocate more bits to server ID when deploying across many physical servers or cloud instances;
- **Vertical Scaling**: Allocate more bits to worker ID when running many workers on fewer, more powerful machines;
- **High-Frequency Generation**: Reduce server/worker bits to allow for more increments per millisecond when generating many IDs on a single node.

The total available bits for customization is fixed at 22 bits (the remaining 42 bits are reserved for the timestamp). Increasing one value means decreasing another, allowing you to make tradeoffs based on your architecture.

```typescript
import { SnowflakeFactory } from '@kirick/snowflake';

// Customize bit allocation for different scaling needs
const factory = new SnowflakeFactory({
  bits: {
    server_id: 10, // 10 bits = up to 1024 servers
    worker_id: 6   // 6 bits = up to 64 workers per server
    // there are 5 bits left for increment counter
    // so, 32 snowflakes can be created per millisecond per worker per server
  },
  server_id: 42,
  worker_id: 7
});
```
