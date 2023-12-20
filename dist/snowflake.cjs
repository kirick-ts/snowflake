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
var Snowflake = class {
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
        throw new TypeError("Invalid arguments given.");
    }
  }
  // eslint-disable-next-line max-params
  #fromValues(timestamp, increment, server_id, worker_id, {
    increment_bit_offset,
    number_server_id_worker_id
  }) {
    const timestamp_epoch = timestamp - EPOCH;
    this.#array_buffer = new ArrayBuffer(8);
    const data_view = new DataView(this.#array_buffer);
    data_view.setUint32(
      0,
      Math.floor(timestamp_epoch / NUMBER_TS_RIGHT)
    );
    data_view.setUint32(
      4,
      timestamp_epoch % NUMBER_TS_RIGHT << 22 | increment << increment_bit_offset | number_server_id_worker_id
    );
    this.#timestamp = timestamp;
    this.#increment = increment;
    this.#server_id = server_id;
    this.#worker_id = worker_id;
  }
  #fromSnowflake(snowflake, encoding, {
    server_id_mask,
    worker_id_bits,
    worker_id_mask,
    increment_bit_offset
  }) {
    if (snowflake instanceof ArrayBuffer) {
      this.#array_buffer = snowflake;
    } else if (Buffer.isBuffer(snowflake)) {
      this.#array_buffer = snowflake.buffer.slice(
        snowflake.offset,
        snowflake.offset + snowflake.byteLength
      );
    } else if (typeof snowflake === "bigint") {
      this.#array_buffer = new ArrayBuffer(8);
      const data_view2 = new DataView(this.#array_buffer);
      data_view2.setBigUint64(
        0,
        snowflake
      );
    } else if (typeof snowflake === "string") {
      switch (encoding) {
        case "decimal":
          {
            this.#array_buffer = new ArrayBuffer(8);
            const data_view2 = new DataView(this.#array_buffer);
            data_view2.setBigUint64(
              0,
              BigInt(snowflake)
            );
          }
          break;
        case "hex":
          this.#array_buffer = hexToArrayBuffer(snowflake);
          break;
        case "base62":
          this.#array_buffer = base62.decode(snowflake).buffer;
          break;
      }
    }
    if (this.#array_buffer === void 0) {
      throw new SnowflakeError(`Unknown encoding: ${encoding}`);
    }
    const data_view = new DataView(this.#array_buffer);
    const number_right = data_view.getUint32(4);
    this.#timestamp = data_view.getUint32(0) * NUMBER_TS_RIGHT + (number_right >>> 22) + EPOCH;
    this.#increment = number_right << 10 >>> 10 >>> increment_bit_offset;
    this.#server_id = number_right >>> worker_id_bits & server_id_mask;
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
      this.#array_buffer
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
};

// src/utils/async-timeout.js
async function asyncTimeout(delay) {
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
    return new Snowflake(
      timestamp,
      this.#increment++,
      this.#server_id,
      this.#worker_id,
      this.#snowflake_options
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
      } catch (error) {
        if (error instanceof SnowflakeIncrementOverflowError) {
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
      this.#snowflake_options
    );
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SnowflakeError,
  SnowflakeFactory,
  SnowflakeIncrementOverflowError
});
