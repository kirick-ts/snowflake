/* eslint-disable no-bitwise */

import { SnowflakeError } from './errors.js';
import type { SnowflakeFactoryOptions } from './factory.js';
import {
	arrayBufferToHex,
	hexToArrayBuffer,
} from './utils/array-buffer-hex.js';
import { base62 } from './utils.js';

type SnowflakeData = {
	timestamp: number,
	server_id: number,
	worker_id: number,
	increment: number,
};

const EPOCH = 1_640_995_200_000; // Jan 1, 2022
const NUMBER_TS_RIGHT = 2 ** 10; // 10 bits to the right number, 32 bits will remain on the left side

export class Snowflake {
	/** Timestamp in milliseconds when Snowflake was created. */
	readonly timestamp: SnowflakeData['timestamp'];
	/** Server ID where Snowflake was created. */
	readonly server_id: SnowflakeData['server_id'];
	/** Worker ID where Snowflake was created. */
	readonly worker_id: SnowflakeData['worker_id'];
	/** Increment of Snowflake. */
	readonly increment: SnowflakeData['increment'];
	private array_buffer: ArrayBuffer;
	private data_view: DataView;

	/**
	 * @param array_buffer -
	 * @param data_view -
	 * @param data -
	 */
	constructor(
		array_buffer: ArrayBuffer,
		data_view: DataView,
		data: SnowflakeData,
	) {
		this.array_buffer = array_buffer;
		this.data_view = data_view;

		this.timestamp = data.timestamp;
		this.server_id = data.server_id;
		this.worker_id = data.worker_id;
		this.increment = data.increment;
	}

	/**
	 * Create a new Snowflake from values.
	 * @param data -
	 * @param factory_options -
	 * @returns -
	 */
	static fromValues(
		data: SnowflakeData,
		factory_options: SnowflakeFactoryOptions,
	): Snowflake {
		const timestamp_epoch = data.timestamp - EPOCH;

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
				| (data.increment << factory_options.increment_bit_offset)
				| factory_options.number_server_id_worker_id,
		);

		return new Snowflake(
			array_buffer,
			data_view,
			data,
		);
	}

	/**
	 * Create a new Snowflake from values.
	 * @param snowflake -
	 * @param encoding -
	 * @param factory_options -
	 * @returns New Snowflake instance.
	 */
	static fromSnowflake(
		snowflake: ArrayBuffer | Buffer | bigint | string,
		encoding: 'decimal' | 'hex' | 'base62' | undefined,
		factory_options: SnowflakeFactoryOptions,
	): Snowflake {
		let array_buffer: ArrayBuffer | null = null;
		let data_view: DataView | null = null;

		if (snowflake instanceof ArrayBuffer) {
			array_buffer = snowflake;
		}
		else if (Buffer.isBuffer(snowflake)) {
			array_buffer = snowflake.buffer.slice(
				snowflake.byteOffset,
				snowflake.byteOffset + snowflake.byteLength,
			) as ArrayBuffer;
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
					array_buffer = base62.decode(snowflake).buffer as ArrayBuffer;
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
				server_id: (number_right >>> factory_options.worker_id_bits) & factory_options.server_id_mask,
				worker_id: number_right & factory_options.worker_id_mask,
				increment: (number_right << 10 >>> 10 >>> factory_options.increment_bit_offset),
			},
		);
	}

	/**
	 * Snowflake as ArrayBuffer.
	 * @returns -
	 */
	toArrayBuffer(): ArrayBuffer {
		return this.array_buffer;
	}

	/**
	 * Snowflake as Uint8Array.
	 * @returns -
	 */
	toUint8Array(): Uint8Array {
		return new Uint8Array(this.array_buffer);
	}

	/**
	 * Snowflake as Node.JS Buffer.
	 * @returns -
	 */
	toBuffer(): Buffer {
		return Buffer.from(this.array_buffer);
	}

	/**
	 * Snowflake as BigInt.
	 * @returns -
	 */
	toBigInt(): bigint {
		return this.data_view.getBigUint64(0);
	}

	/**
	 * Snowflake as decimal string.
	 * @returns -
	 */
	toDecimal(): string {
		return this.toBigInt().toString();
	}

	/**
	 * Snowflake as hex string.
	 * @returns -
	 */
	toHex(): string {
		return arrayBufferToHex(this.array_buffer);
	}

	/**
	 * Snowflake as base62 string.
	 * @returns -
	 */
	toBase62(): string {
		return base62.encode(
			this.toUint8Array(),
		);
	}
}
