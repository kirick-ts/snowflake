
/* global describe, test, expect */

import { SnowflakeFactory } from './factory.js';
import { Snowflake }        from './snowflake.js';
import { asyncTimeout }     from './utils/async-timeout.js';

const SERVER_ID = Math.trunc(Math.random() * 16);
const WORKER_ID = Math.trunc(Math.random() * 16);

const snowflakeFactory = new SnowflakeFactory({
	server_id: SERVER_ID,
	worker_id: WORKER_ID,
});

function testSnowflake(snowflake, timestamp) {
	expect(snowflake).toBeInstanceOf(Snowflake);
	expect(snowflake.timestamp).toBeGreaterThanOrEqual(timestamp);
	expect(snowflake.timestamp).toBeLessThanOrEqual(timestamp + 1);
	expect(typeof snowflake.increment).toBe('number');
	expect(snowflake.increment).toBeGreaterThanOrEqual(0);
	expect(snowflake.server_id).toBe(SERVER_ID);
	expect(snowflake.worker_id).toBe(WORKER_ID);
}

describe('types', () => {
	const timestamp = Date.now();
	const snowflake = snowflakeFactory.create();

	test('Snowflake', () => {
		testSnowflake(snowflake, timestamp);
	});

	test('ArrayBuffer', () => {
		const { array_buffer } = snowflake;

		expect(array_buffer).toBeInstanceOf(ArrayBuffer);
		expect(array_buffer.byteLength).toBe(8);

		testSnowflake(
			snowflakeFactory.parse(array_buffer),
			timestamp,
		);
	});

	test('Buffer', () => {
		const { buffer } = snowflake;

		expect(buffer).toBeInstanceOf(Buffer);
		expect(buffer.byteLength).toBe(8);

		testSnowflake(
			snowflakeFactory.parse(buffer),
			timestamp,
		);
	});

	test('bigint', () => {
		expect(typeof snowflake.bigint).toBe('bigint');
		expect(snowflake.bigint).toBeGreaterThan(0n);
		expect(snowflake.bigint).toBeLessThan(2n ** 64n);

		testSnowflake(
			snowflakeFactory.parse(
				snowflake.bigint,
				'bigint',
			),
			timestamp,
		);
	});

	test('decimal', () => {
		expect(typeof snowflake.decimal).toBe('string');
		expect(snowflake.decimal).toMatch(/^\d+$/);

		testSnowflake(
			snowflakeFactory.parse(
				snowflake.decimal,
				'decimal',
			),
			timestamp,
		);
	});

	test('hex', () => {
		expect(typeof snowflake.hex).toBe('string');
		expect(snowflake.hex).toMatch(/^[\da-f]+$/);
		expect(snowflake.hex.length).toBe(16);

		testSnowflake(
			snowflakeFactory.parse(
				snowflake.hex,
				'hex',
			),
			timestamp,
		);
	});

	test('base62', () => {
		expect(typeof snowflake.base62).toBe('string');
		expect(snowflake.base62).toMatch(/^[\dA-Za-z]+$/);
		expect(snowflake.base62.length).toBe(10);

		testSnowflake(
			snowflakeFactory.parse(
				snowflake.base62,
				'base62',
			),
			timestamp,
		);
	});
});

const snowflakes = [
	snowflakeFactory.create(),
	snowflakeFactory.create(),
];
while (snowflakes.length < 10) {
	// eslint-disable-next-line no-await-in-loop
	await asyncTimeout(
		snowflakes.length,
	);

	snowflakes.push(
		snowflakeFactory.create(),
		snowflakeFactory.create(),
	);
}

describe('compare', () => {
	for (const encoding of [ 'bigint', 'decimal', 'hex', 'base62' ]) {
		test(encoding, () => {
			for (let index = 1; index < snowflakes.length; index++) {
				const snowflake1 = snowflakes[index - 1];
				const snowflake2 = snowflakes[index];

				const is_less = snowflake1[encoding] < snowflake2[encoding];

				expect(is_less).toBe(true);
			}
		});
	}
});
