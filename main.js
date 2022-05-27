
/* eslint-disable no-bitwise */

const base62 = require('base-x')('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');

const EPOCH = 1640995200_000; // Jan 1, 2022
const NUMBER_TS_RIGHT = 2 ** 10; // 10 bits to the right number, 32 bits will remain on the left side

class SnowflakeGenerator {
	constructor ({
		bit_count: {
			server_id: bits_server_id = 7,
			worker_id: bits_worker_id = 5,
		} = {},
		server_id = 0,
		worker_id = 0,
	} = {}) {
		// this._SERVER_ID_BITS = bits_server_id;
		this._SERVER_ID_MASK = (2 ** bits_server_id) - 1;
		this._WORKER_ID_BITS = bits_worker_id;
		this._WORKER_ID_MASK = (2 ** bits_worker_id) - 1;

		if (
			server_id < 0
			|| server_id > this._SERVER_ID_MASK
			|| !Number.isInteger(server_id)
		) {
			throw new Error(`Invalid server_id: ${server_id} (possible values: from 0 to ${this._SERVER_ID_MASK} inclusive)`);
		}

		if (
			worker_id < 0
			|| worker_id > this._WORKER_ID_MASK
			|| !Number.isInteger(worker_id)
		) {
			throw new Error(`Invalid worker_id: ${worker_id} (possible values: from 0 to ${this._WORKER_ID_MASK} inclusive)`);
		}

		this._INCREMENT_BIT_OFFSET = bits_server_id + bits_worker_id;
		this._INCREMENT_MAX = (2 ** (22 - this._INCREMENT_BIT_OFFSET)) - 1;
		this._NUMBER_SERVER_ID_WORKER_ID = (server_id << bits_worker_id) | worker_id;

		this._increment = 0;
		this._increment_ts_epoch = 0;

		// this._history = [];
	}

	create (encoding = null) {
		// const history_slice = [];

		const ts_epoch = Date.now() - EPOCH;

		if (ts_epoch < this._increment_ts_epoch) {
			console.error('INVALID TIME', ts_epoch, this._increment_ts_epoch);
			throw new Error(`Cannot create snowflake: Date.now() has returned (probably) invalid value ${ts_epoch}, but previously we got ${this._increment_ts_epoch}, is code running on time machine?`);
		}

		if (ts_epoch > this._increment_ts_epoch) {
			this._increment = 0;
			this._increment_ts_epoch = ts_epoch;
		}
		else if (this._increment > this._INCREMENT_MAX) {
			throw new Error('Cannot create snowflake due to increment overflow.');
		}

		const buffer = Buffer.allocUnsafe(8);

		// timestamp
		buffer.writeInt32BE(
			Math.floor(ts_epoch / NUMBER_TS_RIGHT),
			0,
		);

		buffer.writeInt32BE(
			((ts_epoch % NUMBER_TS_RIGHT) << 22)
				| (this._increment << this._INCREMENT_BIT_OFFSET)
				| this._NUMBER_SERVER_ID_WORKER_ID,
			4,
		);

		// console.log('data', ts_epoch + EPOCH, this._increment);

		this._increment++;

		switch (encoding) {
			case null:
				return buffer;
			case 'bigint':
				return buffer.readBigUInt64BE(0);
			case 'decimal':
				return String(buffer.readBigUInt64BE(0));
			case 'hex':
				return buffer.toString('hex');
			case '62':
				return base62.encode(buffer);
			default:
				throw new Error(`Unknown encoding: ${encoding}`);
		}
	}

	async createStrict (encoding) {
		// eslint-disable-next-line no-constant-condition
		while (true) {
			try {
				return this.create(encoding);
			}
			catch {
				await new Promise(resolve => {
					setTimeout(resolve, 0);
				});
			}
		}
	}

	parse (snowflake, encoding = null) {
		let buffer;

		if (Buffer.isBuffer(snowflake)) {
			buffer = snowflake;
		}
		else if (typeof snowflake === 'bigint') {
			buffer = Buffer.allocUnsafe(8);
			buffer.writeBigUInt64BE(snowflake);
		}
		else if (typeof snowflake === 'string') {
			switch (encoding) {
				case 'decimal': {
					buffer = Buffer.allocUnsafe(8);
					buffer.writeBigUInt64BE(
						BigInt(snowflake),
					);
				} break;
				case 'hex': {
					buffer = Buffer.from(
						snowflake,
						'hex',
					);
				} break;
				case '62': {
					buffer = Buffer.from(
						base62.decode(snowflake),
					);
				} break;
				// no default
			}
		}

		if (!buffer) {
			throw new Error(`Unknown encoding: ${encoding}`);
		}

		const number_right = buffer.readInt32BE(4);

		return {
			ts: (buffer.readUInt32BE(0) * NUMBER_TS_RIGHT) + (number_right >>> 22) + EPOCH,
			increment: (number_right << 10 >>> 10 >>> this._INCREMENT_BIT_OFFSET),
			server_id: (number_right >>> this._WORKER_ID_BITS) & this._SERVER_ID_MASK,
			worker_id: number_right & this._WORKER_ID_MASK,
		};
	}

	static _analyzeBits (number) {
		number >>>= 0;

		const number_string = number.toString(2);
		const bits = [[], [], [], []];
		for (let i = 0; i <= 31; i++) {
			bits[Math.floor((31 - i) / 8)].unshift(
				number_string[number_string.length - 1 - i] ?? 0,
			);
		}

		return bits.map(a => a.join('')).join('_');
	}
}

module.exports = SnowflakeGenerator;
