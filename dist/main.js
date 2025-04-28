import basex from "base-x";

//#region src/errors.ts
var SnowflakeError = class extends Error {};
var SnowflakeIncrementOverflowError = class extends SnowflakeError {
	constructor() {
		super("Cannot create snowflake due to increment overflow.");
	}
};

//#endregion
//#region src/utils/array-buffer-hex.ts
/**
* Convert an ArrayBuffer to a hex string.
* @param buffer - ArrayBuffer to convert.
* @returns Hex string.
*/
function arrayBufferToHex(buffer) {
	let result = "";
	for (const value of new Uint8Array(buffer)) {
		if (value < 16) result += "0";
		result += value.toString(16);
	}
	return result;
}
/**
* Convert a hex string to an ArrayBuffer.
* @param hex - Hex string to convert.
* @returns ArrayBuffer.
*/
function hexToArrayBuffer(hex) {
	const uint8_array = new Uint8Array(hex.length / 2);
	for (let index_hex = 0, index_array = 0; index_hex < hex.length; index_hex += 2, index_array++) uint8_array[index_array] = Number.parseInt(hex.slice(index_hex, index_hex + 2), 16);
	return uint8_array.buffer;
}

//#endregion
//#region src/utils.ts
const base62 = basex("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");
/**
* Wrapper for setTimeout.
* @param delay - The delay in milliseconds.
* @returns A promise that resolves after the specified delay.
*/
function asyncTimeout(delay = 0) {
	return new Promise((resolve) => {
		setTimeout(resolve, delay);
	});
}

//#endregion
//#region src/snowflake.ts
const EPOCH = 16409952e5;
const NUMBER_TS_RIGHT = 2 ** 10;
var Snowflake = class Snowflake {
	/** Timestamp in milliseconds when Snowflake was created. */
	timestamp;
	/** Server ID where Snowflake was created. */
	server_id;
	/** Worker ID where Snowflake was created. */
	worker_id;
	/** Increment of Snowflake. */
	increment;
	array_buffer;
	data_view;
	/**
	* @param array_buffer -
	* @param data_view -
	* @param data -
	*/
	constructor(array_buffer, data_view, data) {
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
	static fromValues(data, factory_options) {
		const timestamp_epoch = data.timestamp - EPOCH;
		const array_buffer = new ArrayBuffer(8);
		const data_view = new DataView(array_buffer);
		data_view.setUint32(0, Math.floor(timestamp_epoch / NUMBER_TS_RIGHT));
		data_view.setUint32(4, timestamp_epoch % NUMBER_TS_RIGHT << 22 | data.increment << factory_options.increment_bit_offset | factory_options.number_server_id_worker_id);
		return new Snowflake(array_buffer, data_view, data);
	}
	/**
	* Create a new Snowflake from values.
	* @param snowflake -
	* @param encoding -
	* @param factory_options -
	* @returns New Snowflake instance.
	*/
	static fromSnowflake(snowflake, encoding, factory_options) {
		let array_buffer = null;
		let data_view = null;
		if (snowflake instanceof ArrayBuffer) array_buffer = snowflake;
		else if (Buffer.isBuffer(snowflake)) array_buffer = snowflake.buffer.slice(snowflake.byteOffset, snowflake.byteOffset + snowflake.byteLength);
		else if (typeof snowflake === "bigint") {
			array_buffer = new ArrayBuffer(8);
			data_view = new DataView(array_buffer);
			data_view.setBigUint64(0, snowflake);
		} else if (typeof snowflake === "string") switch (encoding) {
			case "decimal":
				array_buffer = new ArrayBuffer(8);
				data_view = new DataView(array_buffer);
				data_view.setBigUint64(0, BigInt(snowflake));
				break;
			case "hex":
				array_buffer = hexToArrayBuffer(snowflake);
				break;
			case "base62":
				array_buffer = base62.decode(snowflake).buffer;
				break;
		}
		if (array_buffer === null) throw new SnowflakeError(`Unknown encoding: ${encoding}`);
		if (data_view === null) data_view = new DataView(array_buffer);
		const number_right = data_view.getUint32(4);
		return new Snowflake(array_buffer, data_view, {
			timestamp: data_view.getUint32(0) * NUMBER_TS_RIGHT + (number_right >>> 22) + EPOCH,
			server_id: number_right >>> factory_options.worker_id_bits & factory_options.server_id_mask,
			worker_id: number_right & factory_options.worker_id_mask,
			increment: number_right << 10 >>> 10 >>> factory_options.increment_bit_offset
		});
	}
	/**
	* Snowflake as ArrayBuffer.
	* @returns -
	*/
	toArrayBuffer() {
		return this.array_buffer;
	}
	/**
	* Snowflake as Uint8Array.
	* @returns -
	*/
	toUint8Array() {
		return new Uint8Array(this.array_buffer);
	}
	/**
	* Snowflake as Node.JS Buffer.
	* @returns -
	*/
	toBuffer() {
		return Buffer.from(this.array_buffer);
	}
	/**
	* Snowflake as BigInt.
	* @returns -
	*/
	toBigInt() {
		return this.data_view.getBigUint64(0);
	}
	/**
	* Snowflake as decimal string.
	* @returns -
	*/
	toDecimal() {
		return this.toBigInt().toString();
	}
	/**
	* Snowflake as hex string.
	* @returns -
	*/
	toHex() {
		return arrayBufferToHex(this.array_buffer);
	}
	/**
	* Snowflake as base62 string.
	* @returns -
	*/
	toBase62() {
		return base62.encode(this.toUint8Array());
	}
};

//#endregion
//#region src/factory.ts
var SnowflakeFactory = class {
	server_id;
	worker_id;
	increment = 0;
	increment_timestamp = 0;
	increment_max;
	options;
	constructor({ bits: { server_id: bits_server_id = 7, worker_id: bits_worker_id = 5 } = {}, server_id = 0, worker_id = 0 } = {}) {
		this.server_id = server_id;
		this.worker_id = worker_id;
		const server_id_mask = 2 ** bits_server_id - 1;
		const worker_id_bits = bits_worker_id;
		const worker_id_mask = 2 ** bits_worker_id - 1;
		if (server_id < 0 || server_id > server_id_mask || !Number.isInteger(server_id)) throw new SnowflakeError(`Invalid server_id: ${server_id} (possible values: from 0 to ${server_id_mask} inclusive)`);
		if (worker_id < 0 || worker_id > worker_id_mask || !Number.isInteger(worker_id)) throw new SnowflakeError(`Invalid worker_id: ${worker_id} (possible values: from 0 to ${worker_id_mask} inclusive)`);
		const increment_bit_offset = bits_server_id + bits_worker_id;
		this.increment_max = 2 ** (22 - increment_bit_offset) - 1;
		this.options = {
			server_id_mask,
			worker_id_bits,
			worker_id_mask,
			increment_bit_offset,
			number_server_id_worker_id: server_id << bits_worker_id | worker_id
		};
	}
	/**
	* Creates new Snowflake.
	* @throws {SnowflakeError}
	* @throws {SnowflakeIncrementOverflowError} If increment has reached maximum value. Try again in next millisecond.
	* @returns -
	*/
	create() {
		const timestamp = Date.now();
		if (timestamp < this.increment_timestamp) throw new SnowflakeError(`Cannot create snowflake: Date.now() has returned (probably) invalid value ${timestamp}, but previously we got ${this.increment_timestamp}, is code running on time machine?`);
		if (timestamp > this.increment_timestamp) {
			this.increment = 0;
			this.increment_timestamp = timestamp;
		} else if (this.increment > this.increment_max) throw new SnowflakeIncrementOverflowError();
		return Snowflake.fromValues({
			timestamp,
			server_id: this.server_id,
			worker_id: this.worker_id,
			increment: this.increment++
		}, this.options);
	}
	/**
	* Asynchronously creates new Snowflake, avoiding SnowflakeIncrementOverflowError by waiting for next millisecond.
	* @returns New Snowflake instance.
	*/
	async createSafe() {
		for (;;) try {
			return this.create();
		} catch (error) {
			if (error instanceof SnowflakeIncrementOverflowError) await asyncTimeout();
		}
	}
	parse(snowflake, encoding) {
		return Snowflake.fromSnowflake(snowflake, encoding, this.options);
	}
};

//#endregion
export { Snowflake, SnowflakeError, SnowflakeFactory, SnowflakeIncrementOverflowError };