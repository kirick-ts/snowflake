
/**
 * @typedef {import('./factory.js').SnowflakeFactoryOptions} SnowflakeFactoryOptions
 */
/**
 * @typedef {object} SnowflakeDescription
 * @property {number} timestamp - Timestamp in milliseconds when Snowflake was created.
 * @property {number} server_id - Server ID where Snowflake was created.
 * @property {number} worker_id - Worker ID where Snowflake was created.
 * @property {number} increment - Increment of Snowflake.
 */

import { SnowflakeError } from './errors.js';
import {
	arrayBufferToHex,
	hexToArrayBuffer }    from './utils/array-buffer-hex.js';
import { base62 }         from './utils/base62.js';

const EPOCH = 1_640_995_200_000; // Jan 1, 2022
const NUMBER_TS_RIGHT = 2 ** 10; // 10 bits to the right number, 32 bits will remain on the left side

export class Snowflake {
	/**
	 * Timestamp in milliseconds when Snowflake was created.
	 * @type {number}
	 * @readonly
	 */
	timestamp;
	/**
	 * Server ID where Snowflake was created.
	 * @type {number}
	 * @readonly
	 */
	server_id;
	/**
	 * Worker ID where Snowflake was created.
	 * @type {number}
	 * @readonly
	 */
	worker_id;
	/**
	 * Increment of Snowflake.
	 * @type {number}
	 * @readonly
	 */
	increment;

	/** @type {ArrayBuffer} */
	#array_buffer;
	/** @type {DataView} */
	#data_view;

	/**
	 * @param {ArrayBuffer} array_buffer -
	 * @param {DataView} data_view -
	 * @param {SnowflakeDescription} description -
	 */
	constructor(
		array_buffer,
		data_view,
		{
			timestamp,
			server_id,
			worker_id,
			increment,
		},
	) {
		this.#array_buffer = array_buffer;
		this.#data_view = data_view;

		this.timestamp = timestamp;
		this.server_id = server_id;
		this.worker_id = worker_id;
		this.increment = increment;
	}

	/**
	 * Create a new Snowflake from values.
	 * @param {SnowflakeDescription} snowflake_description -
	 * @param {SnowflakeFactoryOptions} options Options for encoding.
	 * @returns {Snowflake} New Snowflake instance.
	 */
	static fromValues(
		{
			timestamp,
			server_id,
			worker_id,
			increment,
		},
		{
			increment_bit_offset,
			number_server_id_worker_id,
		},
	) {
		const timestamp_epoch = timestamp - EPOCH;

		const array_buffer = new ArrayBuffer(8);
		const data_view = new DataView(array_buffer);

		// timestamp
		data_view.setUint32(
			0,
			Math.floor(timestamp_epoch / NUMBER_TS_RIGHT),
		);

		data_view.setUint32(
			4,
			((timestamp_epoch % NUMBER_TS_RIGHT) << 22)
				| (increment << increment_bit_offset)
				| number_server_id_worker_id,
		);

		return new Snowflake(
			array_buffer,
			data_view,
			{
				timestamp,
				server_id,
				worker_id,
				increment,
			},
		);
	}

	/**
	 * Create a new Snowflake from values.
	 * @param {ArrayBuffer | Buffer | bigint | string} snowflake -
	 * @param {string} encoding -
	 * @param {SnowflakeFactoryOptions} options Options for encoding.
	 * @returns {Snowflake} New Snowflake instance.
	 */
	static fromSnowflake(
		snowflake,
		encoding,
		{
			server_id_mask,
			worker_id_bits,
			worker_id_mask,
			increment_bit_offset,
		},
	) {
		/** @type {ArrayBuffer | null} */
		let array_buffer = null;
		/** @type {DataView | null} */
		let data_view = null;
		if (snowflake instanceof ArrayBuffer) {
			array_buffer = snowflake;
		}
		else if (Buffer.isBuffer(snowflake)) {
			array_buffer = snowflake.buffer.slice(
				snowflake.byteOffset,
				snowflake.byteOffset + snowflake.byteLength,
			);
		}
		else if (typeof snowflake === 'bigint') {
			array_buffer = new ArrayBuffer(8);

			data_view = new DataView(array_buffer);
			data_view.setBigUint64(
				0,
				snowflake,
			);
		}
		else if (typeof snowflake === 'string') {
			switch (encoding) {
				case 'decimal':
					array_buffer = new ArrayBuffer(8);

					data_view = new DataView(array_buffer);
					data_view.setBigUint64(
						0,
						BigInt(snowflake),
					);
					break;
				case 'hex':
					array_buffer = hexToArrayBuffer(snowflake);
					break;
				case 'base62':
					array_buffer = base62.decode(snowflake).buffer;
					break;
				// no default
			}
		}

		if (array_buffer === null) {
			throw new SnowflakeError(`Unknown encoding: ${encoding}`);
		}
		if (data_view === null) {
			data_view = new DataView(array_buffer);
		}

		const number_right = data_view.getUint32(4);

		return new Snowflake(
			array_buffer,
			data_view,
			{
				timestamp: (data_view.getUint32(0) * NUMBER_TS_RIGHT) + (number_right >>> 22) + EPOCH,
				server_id: (number_right >>> worker_id_bits) & server_id_mask,
				worker_id: number_right & worker_id_mask,
				increment: (number_right << 10 >>> 10 >>> increment_bit_offset),
			},
		);
	}

	/**
	 * Snowflake as ArrayBuffer.
	 * @returns {ArrayBuffer} -
	 */
	toArrayBuffer() {
		return this.#array_buffer;
	}

	/**
	 * Snowflake as Uint8Array.
	 * @returns {Uint8Array} -
	 */
	toUint8Array() {
		return new Uint8Array(
			this.#array_buffer,
		);
	}

	/**
	 * Snowflake as Node.JS Buffer.
	 * @returns {Buffer} -
	 */
	toBuffer() {
		return Buffer.from(
			this.#array_buffer,
		);
	}

	/**
	 * Snowflake as BigInt.
	 * @returns {bigint} -
	 */
	toBigInt() {
		return this.#data_view.getBigUint64(0);
	}

	/**
	 * Snowflake as decimal string.
	 * @returns {string} -
	 */
	toDecimal() {
		return this.toBigInt().toString();
	}

	/**
	 * Snowflake as hex string.
	 * @returns {string} -
	 */
	toHex() {
		return arrayBufferToHex(
			this.#array_buffer,
		);
	}

	/**
	 * Snowflake as base62 string.
	 * @returns {string} -
	 */
	toBase62() {
		return base62.encode(
			this.toUint8Array(),
		);
	}
}
