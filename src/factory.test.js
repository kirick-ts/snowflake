
/* global describe, test, expect */

import { SnowflakeFactory } from './factory.js';

const SERVER_ID = Math.trunc(Math.random() * 16);
const WORKER_ID = Math.trunc(Math.random() * 16);

const snowflakeFactory = new SnowflakeFactory({
	server_id: SERVER_ID,
	worker_id: WORKER_ID,
});

function checkParsed(state, ts) {
	expect(state.timestamp).toBeGreaterThanOrEqual(ts);
	expect(state.timestamp).toBeLessThanOrEqual(ts + 1);
	expect(state.server_id).toBe(SERVER_ID);
	expect(state.worker_id).toBe(WORKER_ID);
}

describe('types', () => {
	test('ArrayBuffer', () => {
		const ts = Date.now();

		const snowflake = snowflakeFactory.create();

		expect(snowflake).toBeInstanceOf(ArrayBuffer);
		expect(snowflake.byteLength).toBe(8);

		checkParsed(
			snowflakeFactory.parse(snowflake),
			ts,
		);
	});

	test('Buffer', () => {
		const ts = Date.now();

		const snowflake = snowflakeFactory.create('buffer');

		expect(snowflake).toBeInstanceOf(Buffer);
		expect(snowflake.byteLength).toBe(8);

		checkParsed(
			snowflakeFactory.parse(snowflake),
			ts,
		);
	});

	test('bigint', () => {
		const ts = Date.now();

		const snowflake = snowflakeFactory.create('bigint');

		expect(typeof snowflake).toBe('bigint');
		expect(snowflake).toBeGreaterThan(0n);
		expect(snowflake).toBeLessThan(2n ** 64n);

		checkParsed(
			snowflakeFactory.parse(
				snowflake,
				'bigint',
			),
			ts,
		);
	});

	test('decimal', () => {
		const ts = Date.now();

		const snowflake = snowflakeFactory.create('decimal');

		expect(typeof snowflake).toBe('string');
		expect(snowflake).toMatch(/^\d+$/);

		checkParsed(
			snowflakeFactory.parse(
				snowflake,
				'decimal',
			),
			ts,
		);
	});

	test('hex', () => {
		const ts = Date.now();

		const snowflake = snowflakeFactory.create('hex');

		expect(typeof snowflake).toBe('string');
		expect(snowflake).toMatch(/^[\da-f]+$/);
		expect(snowflake.length).toBe(16);

		checkParsed(
			snowflakeFactory.parse(
				snowflake,
				'hex',
			),
			ts,
		);
	});

	test('62', () => {
		const ts = Date.now();

		const snowflake = snowflakeFactory.create('62');

		expect(typeof snowflake).toBe('string');
		expect(snowflake).toMatch(/^[\dA-Za-z]+$/);
		expect(snowflake.length).toBe(10);

		checkParsed(
			snowflakeFactory.parse(
				snowflake,
				'62',
			),
			ts,
		);
	});
});

describe('compare', () => {
	for (const encoding of [ 'bigint', 'decimal', 'hex', '62' ]) {
		test(encoding, async () => {
			for (const _ of Array.from({ length: 100_000 })) { // eslint-disable-line no-unused-vars
				// eslint-disable-next-line no-await-in-loop
				const snowflake1 = await snowflakeFactory.createSafe('bigint');
				// eslint-disable-next-line no-await-in-loop
				const snowflake2 = await snowflakeFactory.createSafe('bigint');

				expect(snowflake1).not.toBe(snowflake2);
				expect(snowflake1).toBeLessThan(snowflake2);
			}
		});
	}
});
