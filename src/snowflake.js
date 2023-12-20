
import { SnowflakeError } from './errors.js';
import {
	arrayBufferToHex,
	hexToArrayBuffer }    from './utils/array-buffer-hex.js';
import { base62 }         from './utils/base62.js';

const EPOCH = 1_640_995_200_000; // Jan 1, 2022
const NUMBER_TS_RIGHT = 2 ** 10; // 10 bits to the right number, 32 bits will remain on the left side

export class Snowflake {
	#timestamp;
	#increment;
	#server_id;
	#worker_id;

	#array_buffer;
	#uint8_array;
	#bigint;
	#hex;
	#base62;

	constructor(...args) {
		switch (args.length) {
			case 5:
				this.#fromValues(...args);
				break;
			case 3:
				this.#fromSnowflake(...args);
				break;
			default:
				throw new TypeError('Invalid arguments given.');
		}
	}

	// eslint-disable-next-line max-params
	#fromValues(
		timestamp,
		increment,
		server_id,
		worker_id,
		{
			increment_bit_offset,
			number_server_id_worker_id,
		},
	) {
		const timestamp_epoch = timestamp - EPOCH;

		this.#array_buffer = new ArrayBuffer(8);
		const data_view = new DataView(this.#array_buffer);

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

		this.#timestamp = timestamp;
		this.#increment = increment;
		this.#server_id = server_id;
		this.#worker_id = worker_id;
	}

	#fromSnowflake(
		snowflake,
		encoding,
		{
			server_id_mask,
			worker_id_bits,
			worker_id_mask,
			increment_bit_offset,
		},
	) {
		if (snowflake instanceof ArrayBuffer) {
			this.#array_buffer = snowflake;
		}
		else if (Buffer.isBuffer(snowflake)) {
			this.#array_buffer = snowflake.buffer.slice(
				snowflake.offset,
				snowflake.offset + snowflake.byteLength,
			);
		}
		else if (typeof snowflake === 'bigint') {
			this.#array_buffer = new ArrayBuffer(8);

			const data_view = new DataView(this.#array_buffer);
			data_view.setBigUint64(
				0,
				snowflake,
			);
		}
		else if (typeof snowflake === 'string') {
			switch (encoding) {
				case 'decimal': {
					this.#array_buffer = new ArrayBuffer(8);

					const data_view = new DataView(this.#array_buffer);
					data_view.setBigUint64(
						0,
						BigInt(snowflake),
					);
				} break;
				case 'hex':
					this.#array_buffer = hexToArrayBuffer(snowflake);
					break;
				case 'base62':
					this.#array_buffer = base62.decode(snowflake).buffer;
					break;
				// no default
			}
		}

		if (this.#array_buffer === undefined) {
			throw new SnowflakeError(`Unknown encoding: ${encoding}`);
		}

		const data_view = new DataView(this.#array_buffer);

		const number_right = data_view.getUint32(4);

		this.#timestamp = (data_view.getUint32(0) * NUMBER_TS_RIGHT) + (number_right >>> 22) + EPOCH;
		this.#increment = (number_right << 10 >>> 10 >>> increment_bit_offset);
		this.#server_id = (number_right >>> worker_id_bits) & server_id_mask;
		this.#worker_id = number_right & worker_id_mask;
	}

	/**
	 * Timestamp in milliseconds when Snowflake was created.
	 * @type {number}
	 * @readonly
	 */
	get timestamp() {
		return this.#timestamp;
	}

	/**
	 * Increment of Snowflake.
	 * @type {number}
	 * @readonly
	 */
	get increment() {
		return this.#increment;
	}

	/**
	 * Server ID where Snowflake was created.
	 * @type {number}
	 * @readonly
	 */
	get server_id() {
		return this.#server_id;
	}

	/**
	 * Worker ID where Snowflake was created.
	 * @type {number}
	 * @readonly
	 */
	get worker_id() {
		return this.#worker_id;
	}

	/**
	 * ArrayBuffer representation of this Snowflake.
	 * @type {ArrayBuffer}
	 * @readonly
	 */
	get array_buffer() {
		return this.#array_buffer;
	}

	/**
	 * Uint8Array representation of this Snowflake.
	 * @type {Uint8Array}
	 * @readonly
	 */
	get uint8_array() {
		if (!this.#uint8_array) {
			this.#uint8_array = new Uint8Array(this.#array_buffer);
		}

		return this.#uint8_array;
	}

	/**
	 * Node.JS Buffer representation of this Snowflake.
	 * @type {Buffer}
	 * @readonly
	 */
	get buffer() {
		return Buffer.from(
			this.#array_buffer,
		);
	}

	/**
	 * BigInt representation of this Snowflake.
	 * @type {bigint}
	 * @readonly
	 */
	get bigint() {
		if (!this.#bigint) {
			this.#bigint = new DataView(this.#array_buffer).getBigUint64(0);
		}

		return this.#bigint;
	}

	/**
	 * This Snowflake as decimal string.
	 * @type {string}
	 * @readonly
	 */
	get decimal() {
		return this.bigint.toString();
	}

	/**
	 * This Snowflake as hex string.
	 * @type {string}
	 * @readonly
	 */
	get hex() {
		if (!this.#hex) {
			this.#hex = arrayBufferToHex(this.#array_buffer);
		}

		return this.#hex;
	}

	/**
	 * This Snowflake as base62 string.
	 * @type {string}
	 * @readonly
	 */
	get base62() {
		if (!this.#base62) {
			this.#base62 = base62.encode(this.uint8_array);
		}

		return this.#base62;
	}
}
