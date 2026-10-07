/* eslint-disable jsdoc/require-jsdoc */

import { describe, expect, test } from 'vitest';
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

		testSnowflake(snowflakeFactory.parse(array_buffer), timestamp);
	});

	test('Uint8Array', () => {
		const bytes = snowflake.toUint8Array();

		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(bytes.byteLength).toBe(8);

		const parsed = snowflakeFactory.parse(bytes);

		testSnowflake(parsed, timestamp);
		expect(parsed.toBigInt()).toBe(snowflake.toBigInt());
	});

	for (const type of ['Uint8Array', 'Buffer']) {
		test(`${type} subarray`, () => {
			const bytes =
				type === 'Buffer'
					? Buffer.alloc(16, 255)
					: new Uint8Array(16).fill(255);
			const view = bytes.subarray(4, 12);
			view.set(snowflake.toUint8Array());

			const parsed = snowflakeFactory.parse(view);

			testSnowflake(parsed, timestamp);
			expect(parsed.toUint8Array()).toEqual(snowflake.toUint8Array());

			view.fill(0);

			expect(parsed.toBigInt()).toBe(snowflake.toBigInt());
			expect(parsed.toUint8Array()).toEqual(snowflake.toUint8Array());
		});
	}

	test('Buffer', () => {
		const buffer = snowflake.toBuffer();

		expect(buffer).toBeInstanceOf(Buffer);
		expect(buffer.byteLength).toBe(8);

		testSnowflake(snowflakeFactory.parse(buffer), timestamp);
	});

	test('bigint', () => {
		const result = snowflake.toBigInt();

		expect(typeof result).toBe('bigint');
		expect(result).toBeGreaterThan(0n);
		expect(result).toBeLessThan(2n ** 64n);

		testSnowflake(snowflakeFactory.parse(result), timestamp);
	});

	test('decimal', () => {
		const result = snowflake.toDecimal();

		expect(typeof result).toBe('string');
		expect(result).toMatch(/^\d+$/u);

		testSnowflake(snowflakeFactory.parse(result, 'decimal'), timestamp);
	});

	test('hex', () => {
		const result = snowflake.toHex();

		expect(typeof result).toBe('string');
		expect(result).toMatch(/^[\da-f]+$/u);
		expect(result.length).toBe(16);

		testSnowflake(snowflakeFactory.parse(result, 'hex'), timestamp);
	});

	test('base62', () => {
		const result = snowflake.toBase62();

		expect(typeof result).toBe('string');
		expect(result).toMatch(/^[\dA-Za-z]+$/u);
		expect(result.length).toBe(10);

		testSnowflake(snowflakeFactory.parse(result, 'base62'), timestamp);
	});
});

const snowflakes = [snowflakeFactory.create(), snowflakeFactory.create()];
while (snowflakes.length < 10) {
	// oxlint-disable-next-line no-await-in-loop
	await asyncTimeout(snowflakes.length);

	snowflakes.push(snowflakeFactory.create(), snowflakeFactory.create());
}

describe('compare', () => {
	for (const method of ['toBigInt', 'toDecimal', 'toHex', 'toBase62']) {
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
