
import {
	test,
	expect }           from 'vitest';
import { randomBytes } from 'node:crypto';
import {
	arrayBufferToHex,
	hexToArrayBuffer } from './array-buffer-hex.js';

test('convert ArrayBuffer to hex string', async () => {
	for (const _ of Array.from({ length: 10_000 })) { // eslint-disable-line no-unused-vars
		const buffer = randomBytes(8);

		expect(
			arrayBufferToHex(buffer.buffer),
		).toBe(
			buffer.toString('hex'),
		);
	}
});

test('convert hex string to ArrayBuffer', async () => {
	for (const _ of Array.from({ length: 10_000 })) { // eslint-disable-line no-unused-vars
		const buffer = randomBytes(8);

		expect(
			hexToArrayBuffer(
				buffer.toString('hex'),
			),
		).toEqual(
			buffer.buffer,
		);
	}
});
