
import {
	SnowflakeError,
	SnowflakeIncrementOverflowError } from './errors.js';
import {
	arrayBufferToHex,
	hexToArrayBuffer }                from './utils/array-buffer-hex.js';
import { asyncTimeout } from './utils/async-timeout.js';
import { base62 }                     from './utils/base62.js';

const EPOCH = 1_640_995_200_000; // Jan 1, 2022
const NUMBER_TS_RIGHT = 2 ** 10; // 10 bits to the right number, 32 bits will remain on the left side

export class SnowflakeFactory {
	// #server_id_bits;
	#server_id_mask;

	#worker_id_bits;
	#worker_id_mask;

	#increment_bit_offset;
	#increment = 0;
	#increment_ts_epoch = 0;
	#increment_max;

	#number_server_id_worker_id;

	constructor({
		bit_count: {
			server_id: bits_server_id = 7,
			worker_id: bits_worker_id = 5,
		} = {},
		server_id = 0,
		worker_id = 0,
	} = {}) {
		// this.#server_id_bits = bits_server_id;
		this.#server_id_mask = (2 ** bits_server_id) - 1;
		this.#worker_id_bits = bits_worker_id;
		this.#worker_id_mask = (2 ** bits_worker_id) - 1;

		if (
			server_id < 0
			|| server_id > this.#server_id_mask
			|| !Number.isInteger(server_id)
		) {
			throw new SnowflakeError(`Invalid server_id: ${server_id} (possible values: from 0 to ${this.#server_id_mask} inclusive)`);
		}

		if (
			worker_id < 0
			|| worker_id > this.#worker_id_mask
			|| !Number.isInteger(worker_id)
		) {
			throw new SnowflakeError(`Invalid worker_id: ${worker_id} (possible values: from 0 to ${this.#worker_id_mask} inclusive)`);
		}

		this.#increment_bit_offset = bits_server_id + bits_worker_id;
		this.#increment_max = (2 ** (22 - this.#increment_bit_offset)) - 1;
		this.#number_server_id_worker_id = (server_id << bits_worker_id) | worker_id;
	}

	create(encoding) {
		const ts_epoch = Date.now() - EPOCH;

		if (ts_epoch < this.#increment_ts_epoch) {
			throw new SnowflakeError(`Cannot create snowflake: Date.now() has returned (probably) invalid value ${ts_epoch}, but previously we got ${this.#increment_ts_epoch}, is code running on time machine?`);
		}

		if (ts_epoch > this.#increment_ts_epoch) {
			this.#increment = 0;
			this.#increment_ts_epoch = ts_epoch;
		}
		else if (this.#increment > this.#increment_max) {
			throw new SnowflakeIncrementOverflowError();
		}

		const array_buffer = new ArrayBuffer(8);
		const data_view = new DataView(array_buffer);

		// timestamp
		data_view.setUint32(
			0,
			Math.floor(ts_epoch / NUMBER_TS_RIGHT),
		);

		data_view.setUint32(
			4,
			((ts_epoch % NUMBER_TS_RIGHT) << 22)
				| (this.#increment << this.#increment_bit_offset)
				| this.#number_server_id_worker_id,
		);

		this.#increment++;

		switch (encoding) {
			case null:
			case undefined:
				return array_buffer;
			case 'buffer':
				return Buffer.from(array_buffer);
			case 'bigint':
				return data_view.getBigUint64(0);
			case 'decimal':
			case 10:
				return String(
					data_view.getBigUint64(0),
				);
			case 'hex':
			case 16:
				return arrayBufferToHex(array_buffer);
			case '62':
			case 62:
				return base62.encode(
					new Uint8Array(array_buffer),
				);
			default:
				throw new Error(`Unknown encoding: ${encoding}`);
		}
	}

	async createSafe(encoding) {
		// eslint-disable-next-line no-constant-condition
		while (true) {
			try {
				return this.create(encoding);
			}
			catch (error) {
				if (error instanceof SnowflakeIncrementOverflowError) {
					// eslint-disable-next-line no-await-in-loop
					await asyncTimeout();
				}
			}
		}
	}

	parse(snowflake, encoding) {
		let array_buffer;

		if (snowflake instanceof ArrayBuffer) {
			array_buffer = snowflake;
		}
		else if (Buffer.isBuffer(snowflake)) {
			array_buffer = snowflake.buffer;
		}
		else if (typeof snowflake === 'bigint') {
			array_buffer = new ArrayBuffer(8);

			const data_view = new DataView(array_buffer);
			data_view.setBigUint64(
				0,
				snowflake,
			);
		}
		else if (typeof snowflake === 'string') {
			switch (encoding) {
				case 'decimal':
				case 10: {
					array_buffer = new ArrayBuffer(8);

					const data_view = new DataView(array_buffer);
					data_view.setBigUint64(
						0,
						BigInt(snowflake),
					);
				} break;
				case 'hex':
					array_buffer = hexToArrayBuffer(snowflake);
					break;
				case '62':
				case 62:
					array_buffer = base62.decode(snowflake).buffer;
					break;
				// no default
			}
		}

		if (array_buffer === undefined) {
			throw new SnowflakeError(`Unknown encoding: ${encoding}`);
		}

		const data_view = new DataView(array_buffer);

		const number_right = data_view.getUint32(4);

		return {
			timestamp: (data_view.getUint32(0) * NUMBER_TS_RIGHT) + (number_right >>> 22) + EPOCH,
			increment: (number_right << 10 >>> 10 >>> this.#increment_bit_offset),
			server_id: (number_right >>> this.#worker_id_bits) & this.#server_id_mask,
			worker_id: number_right & this.#worker_id_mask,
		};
	}
}
