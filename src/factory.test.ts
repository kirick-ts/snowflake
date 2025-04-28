/* eslint-disable jsdoc/require-jsdoc */

import {
	describe,
	test,
	expect,
} from 'vitest';
import { SnowflakeFactory } from './factory.js';
import { Snowflake } from './snowflake.js';
import { asyncTimeout } from './utils.js';

const SERVER_ID = Math.trunc(Math.random() * 16);
const WORKER_ID = Math.trunc(Math.random() * 16);

const snowflakeFactory = new SnowflakeFactory({
	server_id: SERVER_ID,
	worker_id: WORKER_ID,
});

function testSnowflake(snowflake: Snowflake, timestamp: number) {
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
		const array_buffer = snowflake.toArrayBuffer();

		expect(array_buffer).toBeInstanceOf(ArrayBuffer);
		expect(array_buffer.byteLength).toBe(8);

		testSnowflake(
			snowflakeFactory.parse(array_buffer),
			timestamp,
		);
	});

	test('Buffer', () => {
		const buffer = snowflake.toBuffer();

		expect(buffer).toBeInstanceOf(Buffer);
		expect(buffer.byteLength).toBe(8);

		testSnowflake(
			snowflakeFactory.parse(buffer),
			timestamp,
		);
	});

	test('bigint', () => {
		const result = snowflake.toBigInt();

		expect(typeof result).toBe('bigint');
		expect(result).toBeGreaterThan(0n);
		expect(result).toBeLessThan(2n ** 64n);

		testSnowflake(
			snowflakeFactory.parse(result),
			timestamp,
		);
	});

	test('decimal', () => {
		const result = snowflake.toDecimal();

		expect(typeof result).toBe('string');
		expect(result).toMatch(/^\d+$/);

		testSnowflake(
			snowflakeFactory.parse(
				result,
				'decimal',
			),
			timestamp,
		);
	});

	test('hex', () => {
		const result = snowflake.toHex();

		expect(typeof result).toBe('string');
		expect(result).toMatch(/^[\da-f]+$/);
		expect(result.length).toBe(16);

		testSnowflake(
			snowflakeFactory.parse(
				result,
				'hex',
			),
			timestamp,
		);
	});

	test('base62', () => {
		const result = snowflake.toBase62();

		expect(typeof result).toBe('string');
		expect(result).toMatch(/^[\dA-Za-z]+$/);
		expect(result.length).toBe(10);

		testSnowflake(
			snowflakeFactory.parse(
				result,
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
	for (const method of [
		'toBigInt',
		'toDecimal',
		'toHex',
		'toBase62',
	]) {
		test(method, () => {
			for (let index = 1; index < snowflakes.length; index++) {
				const snowflake1 = snowflakes[index - 1];
				const snowflake2 = snowflakes[index];

				const is_less = snowflake1[method]() < snowflake2[method]();

				expect(is_less).toBe(true);
			}
		});
	}
});
