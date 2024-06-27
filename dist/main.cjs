var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.js
var main_exports = {};
__export(main_exports, {
  Snowflake: () => Snowflake,
  SnowflakeError: () => SnowflakeError,
  SnowflakeFactory: () => SnowflakeFactory,
  SnowflakeIncrementOverflowError: () => SnowflakeIncrementOverflowError
});
module.exports = __toCommonJS(main_exports);

// src/errors.js
var SnowflakeError = class extends Error {
};
var SnowflakeIncrementOverflowError = class extends SnowflakeError {
  constructor() {
    super("Cannot create snowflake due to increment overflow.");
  }
};

// src/utils/array-buffer-hex.js
function arrayBufferToHex(buffer) {
  let result = "";
  for (const value of new Uint8Array(buffer)) {
    if (value < 16) {
      result += "0";
    }
    result += value.toString(16);
  }
  return result;
}
function hexToArrayBuffer(hex) {
  const uint8_array = new Uint8Array(hex.length / 2);
  for (let index_hex = 0, index_array = 0; index_hex < hex.length; index_hex += 2, index_array++) {
    uint8_array[index_array] = Number.parseInt(
      hex.slice(
        index_hex,
        index_hex + 2
      ),
      16
    );
  }
  return uint8_array.buffer;
}

// src/utils/base62.js
var import_base_x = __toESM(require("base-x"), 1);
var base62 = (0, import_base_x.default)("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");

// src/snowflake.js
var EPOCH = 16409952e5;
var NUMBER_TS_RIGHT = 2 ** 10;
var Snowflake = class _Snowflake {
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
  constructor(array_buffer, data_view, {
    timestamp,
    server_id,
    worker_id,
    increment
  }) {
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
  static fromValues({
    timestamp,
    server_id,
    worker_id,
    increment
  }, {
    increment_bit_offset,
    number_server_id_worker_id
  }) {
    const timestamp_epoch = timestamp - EPOCH;
    const array_buffer = new ArrayBuffer(8);
    const data_view = new DataView(array_buffer);
    data_view.setUint32(
      0,
      Math.floor(timestamp_epoch / NUMBER_TS_RIGHT)
    );
    data_view.setUint32(
      4,
      timestamp_epoch % NUMBER_TS_RIGHT << 22 | increment << increment_bit_offset | number_server_id_worker_id
    );
    return new _Snowflake(
      array_buffer,
      data_view,
      {
        timestamp,
        server_id,
        worker_id,
        increment
      }
    );
  }
  /**
   * Create a new Snowflake from values.
   * @param {ArrayBuffer | Buffer | bigint | string} snowflake -
   * @param {string} encoding -
   * @param {SnowflakeFactoryOptions} options Options for encoding.
   * @returns {Snowflake} New Snowflake instance.
   */
  static fromSnowflake(snowflake, encoding, {
    server_id_mask,
    worker_id_bits,
    worker_id_mask,
    increment_bit_offset
  }) {
    let array_buffer = null;
    let data_view = null;
    if (snowflake instanceof ArrayBuffer) {
      array_buffer = snowflake;
    } else if (Buffer.isBuffer(snowflake)) {
      array_buffer = snowflake.buffer.slice(
        snowflake.byteOffset,
        snowflake.byteOffset + snowflake.byteLength
      );
    } else if (typeof snowflake === "bigint") {
      array_buffer = new ArrayBuffer(8);
      data_view = new DataView(array_buffer);
      data_view.setBigUint64(
        0,
        snowflake
      );
    } else if (typeof snowflake === "string") {
      switch (encoding) {
        case "decimal":
          array_buffer = new ArrayBuffer(8);
          data_view = new DataView(array_buffer);
          data_view.setBigUint64(
            0,
            BigInt(snowflake)
          );
          break;
        case "hex":
          array_buffer = hexToArrayBuffer(snowflake);
          break;
        case "base62":
          array_buffer = base62.decode(snowflake).buffer;
          break;
      }
    }
    if (array_buffer === null) {
      throw new SnowflakeError(`Unknown encoding: ${encoding}`);
    }
    if (data_view === null) {
      data_view = new DataView(array_buffer);
    }
    const number_right = data_view.getUint32(4);
    return new _Snowflake(
      array_buffer,
      data_view,
      {
        timestamp: data_view.getUint32(0) * NUMBER_TS_RIGHT + (number_right >>> 22) + EPOCH,
        server_id: number_right >>> worker_id_bits & server_id_mask,
        worker_id: number_right & worker_id_mask,
        increment: number_right << 10 >>> 10 >>> increment_bit_offset
      }
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
      this.#array_buffer
    );
  }
  /**
   * Snowflake as Node.JS Buffer.
   * @returns {Buffer} -
   */
  toBuffer() {
    return Buffer.from(
      this.#array_buffer
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
      this.#array_buffer
    );
  }
  /**
   * Snowflake as base62 string.
   * @returns {string} -
   */
  toBase62() {
    return base62.encode(
      this.toUint8Array()
    );
  }
};

// src/utils/async-timeout.js
async function asyncTimeout(delay = 0) {
  return new Promise((resolve) => {
    setTimeout(
      resolve,
      delay
    );
  });
}

// src/factory.js
var SnowflakeFactory = class {
  #server_id;
  #worker_id;
  #increment = 0;
  #increment_timestamp = 0;
  #increment_max;
  /** @type {SnowflakeFactoryOptions} */
  #snowflake_options;
  constructor({
    bits: {
      server_id: bits_server_id = 7,
      worker_id: bits_worker_id = 5
    } = {},
    server_id = 0,
    worker_id = 0
  } = {}) {
    this.#server_id = server_id;
    this.#worker_id = worker_id;
    const server_id_mask = 2 ** bits_server_id - 1;
    const worker_id_bits = bits_worker_id;
    const worker_id_mask = 2 ** bits_worker_id - 1;
    if (server_id < 0 || server_id > server_id_mask || !Number.isInteger(server_id)) {
      throw new SnowflakeError(`Invalid server_id: ${server_id} (possible values: from 0 to ${server_id_mask} inclusive)`);
    }
    if (worker_id < 0 || worker_id > worker_id_mask || !Number.isInteger(worker_id)) {
      throw new SnowflakeError(`Invalid worker_id: ${worker_id} (possible values: from 0 to ${worker_id_mask} inclusive)`);
    }
    const increment_bit_offset = bits_server_id + bits_worker_id;
    this.#increment_max = 2 ** (22 - increment_bit_offset) - 1;
    this.#snowflake_options = {
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
    } else if (this.#increment > this.#increment_max) {
      throw new SnowflakeIncrementOverflowError();
    }
    return Snowflake.fromValues(
      {
        timestamp,
        server_id: this.#server_id,
        worker_id: this.#worker_id,
        increment: this.#increment++
      },
      this.#snowflake_options
    );
  }
  /**
   * Asynchronously creates new Snowflake, avoiding SnowflakeIncrementOverflowError by waiting for next millisecond.
   * @async
   * @throws {SnowflakeError}
   * @returns {Promise<Snowflake>} New Snowflake instance.
   */
  async createSafe() {
    for (; ; ) {
      try {
        return this.create();
      } catch (error) {
        if (error instanceof SnowflakeIncrementOverflowError) {
          await asyncTimeout();
        }
      }
    }
  }
  /**
   * Parses Snowflake from ArrayBuffer, Buffer, bigint or string.
   * @param {ArrayBuffer | Buffer | bigint | string} snowflake Snowflake to parse.
   * @param {"decimal" | "hex" | "binary"} [encoding] Encoding of snowflake string. Required if snowflake is string.
   * @throws {SnowflakeError}
   * @returns {Snowflake} Parsed Snowflake instance.
   */
  parse(snowflake, encoding) {
    return Snowflake.fromSnowflake(
      snowflake,
      encoding,
      this.#snowflake_options
    );
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Snowflake,
  SnowflakeError,
  SnowflakeFactory,
  SnowflakeIncrementOverflowError
});
