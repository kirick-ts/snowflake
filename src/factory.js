
import {
	SnowflakeError,
	SnowflakeIncrementOverflowError } from './errors.js';
import { Snowflake }                  from './snowflake.js';
import { asyncTimeout }               from './utils/async-timeout.js';

export class SnowflakeFactory {
	#server_id;
	#worker_id;

	#increment = 0;
	#increment_timestamp = 0;
	#increment_max;

	#snowflake_options;

	constructor({
		bits: {
			server_id: bits_server_id = 7,
			worker_id: bits_worker_id = 5,
		} = {},
		server_id = 0,
		worker_id = 0,
	} = {}) {
		this.#server_id = server_id;
		this.#worker_id = worker_id;

		const server_id_mask = (2 ** bits_server_id) - 1;
		const worker_id_bits = bits_worker_id;
		const worker_id_mask = (2 ** bits_worker_id) - 1;

		if (
			server_id < 0
			|| server_id > server_id_mask
			|| !Number.isInteger(server_id)
		) {
			throw new SnowflakeError(`Invalid server_id: ${server_id} (possible values: from 0 to ${server_id_mask} inclusive)`);
		}

		if (
			worker_id < 0
			|| worker_id > worker_id_mask
			|| !Number.isInteger(worker_id)
		) {
			throw new SnowflakeError(`Invalid worker_id: ${worker_id} (possible values: from 0 to ${worker_id_mask} inclusive)`);
		}

		const increment_bit_offset = bits_server_id + bits_worker_id;
		this.#increment_max = (2 ** (22 - increment_bit_offset)) - 1;

		this.#snowflake_options = {
			server_id_mask,
			worker_id_bits,
			worker_id_mask,
			increment_bit_offset,
			number_server_id_worker_id: (server_id << bits_worker_id) | worker_id,
		};
	}

	/**
	 * Creates new Snowflake.
	 * @throws {SnowflakeError}
	 * @throws {SnowflakeIncrementOverflowError} If increment has reached maximum value. Try again in next millisecond.
	 * @returns {Snowflake} New Snowflake instance.
	 */
	create() {
		const timestamp = Date.now();

		if (timestamp < this.#increment_timestamp) {
			throw new SnowflakeError(`Cannot create snowflake: Date.now() has returned (probably) invalid value ${timestamp}, but previously we got ${this.#increment_timestamp}, is code running on time machine?`);
		}

		if (timestamp > this.#increment_timestamp) {
			this.#increment = 0;
			this.#increment_timestamp = timestamp;
		}
		else if (this.#increment > this.#increment_max) {
			throw new SnowflakeIncrementOverflowError();
		}

		return new Snowflake(
			timestamp,
			this.#increment++,
			this.#server_id,
			this.#worker_id,
			this.#snowflake_options,
		);
	}

	/**
	 * Asynchronously creates new Snowflake. Tries to avoid SnowflakeIncrementOverflowError by waiting for next millisecond.
	 * @async
	 * @throws {SnowflakeError}
	 * @throws {SnowflakeIncrementOverflowError} If increment has reached maximum value after 100 tries. Try again in next millisecond.
	 * @returns {Promise<Snowflake>} New Snowflake instance.
	 */
	async createSafe() {
		for (let try_id = 0; try_id < 100; try_id++) {
			try {
				return this.create();
			}
			catch (error) {
				if (error instanceof SnowflakeIncrementOverflowError) {
					// eslint-disable-next-line no-await-in-loop
					await asyncTimeout();
				}
			}
		}

		throw new SnowflakeIncrementOverflowError();
	}

	/**
	 * Parses Snowflake from ArrayBuffer, Buffer, bigint or string.
	 * @param {ArrayBuffer | Buffer | bigint | string} snowflake Snowflake to parse.
	 * @param {"decimal" | "hex" | "binary"} [encoding] Encoding of snowflake string. Required if snowflake is string.
	 * @throws {SnowflakeError}
	 * @returns {Snowflake} Parsed Snowflake instance.
	 */
	parse(snowflake, encoding) {
		return new Snowflake(
			snowflake,
			encoding,
			this.#snowflake_options,
		);
	}
}
