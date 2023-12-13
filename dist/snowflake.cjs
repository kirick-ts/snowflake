var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
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

// node_modules/.pnpm/base-x@4.0.0/node_modules/base-x/src/index.js
var require_src = __commonJS({
  "node_modules/.pnpm/base-x@4.0.0/node_modules/base-x/src/index.js"(exports, module2) {
    "use strict";
    function base(ALPHABET) {
      if (ALPHABET.length >= 255) {
        throw new TypeError("Alphabet too long");
      }
      var BASE_MAP = new Uint8Array(256);
      for (var j = 0; j < BASE_MAP.length; j++) {
        BASE_MAP[j] = 255;
      }
      for (var i = 0; i < ALPHABET.length; i++) {
        var x = ALPHABET.charAt(i);
        var xc = x.charCodeAt(0);
        if (BASE_MAP[xc] !== 255) {
          throw new TypeError(x + " is ambiguous");
        }
        BASE_MAP[xc] = i;
      }
      var BASE = ALPHABET.length;
      var LEADER = ALPHABET.charAt(0);
      var FACTOR = Math.log(BASE) / Math.log(256);
      var iFACTOR = Math.log(256) / Math.log(BASE);
      function encode(source) {
        if (source instanceof Uint8Array) {
        } else if (ArrayBuffer.isView(source)) {
          source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
        } else if (Array.isArray(source)) {
          source = Uint8Array.from(source);
        }
        if (!(source instanceof Uint8Array)) {
          throw new TypeError("Expected Uint8Array");
        }
        if (source.length === 0) {
          return "";
        }
        var zeroes = 0;
        var length = 0;
        var pbegin = 0;
        var pend = source.length;
        while (pbegin !== pend && source[pbegin] === 0) {
          pbegin++;
          zeroes++;
        }
        var size = (pend - pbegin) * iFACTOR + 1 >>> 0;
        var b58 = new Uint8Array(size);
        while (pbegin !== pend) {
          var carry = source[pbegin];
          var i2 = 0;
          for (var it1 = size - 1; (carry !== 0 || i2 < length) && it1 !== -1; it1--, i2++) {
            carry += 256 * b58[it1] >>> 0;
            b58[it1] = carry % BASE >>> 0;
            carry = carry / BASE >>> 0;
          }
          if (carry !== 0) {
            throw new Error("Non-zero carry");
          }
          length = i2;
          pbegin++;
        }
        var it2 = size - length;
        while (it2 !== size && b58[it2] === 0) {
          it2++;
        }
        var str = LEADER.repeat(zeroes);
        for (; it2 < size; ++it2) {
          str += ALPHABET.charAt(b58[it2]);
        }
        return str;
      }
      function decodeUnsafe(source) {
        if (typeof source !== "string") {
          throw new TypeError("Expected String");
        }
        if (source.length === 0) {
          return new Uint8Array();
        }
        var psz = 0;
        var zeroes = 0;
        var length = 0;
        while (source[psz] === LEADER) {
          zeroes++;
          psz++;
        }
        var size = (source.length - psz) * FACTOR + 1 >>> 0;
        var b256 = new Uint8Array(size);
        while (source[psz]) {
          var carry = BASE_MAP[source.charCodeAt(psz)];
          if (carry === 255) {
            return;
          }
          var i2 = 0;
          for (var it3 = size - 1; (carry !== 0 || i2 < length) && it3 !== -1; it3--, i2++) {
            carry += BASE * b256[it3] >>> 0;
            b256[it3] = carry % 256 >>> 0;
            carry = carry / 256 >>> 0;
          }
          if (carry !== 0) {
            throw new Error("Non-zero carry");
          }
          length = i2;
          psz++;
        }
        var it4 = size - length;
        while (it4 !== size && b256[it4] === 0) {
          it4++;
        }
        var vch = new Uint8Array(zeroes + (size - it4));
        var j2 = zeroes;
        while (it4 !== size) {
          vch[j2++] = b256[it4++];
        }
        return vch;
      }
      function decode(string) {
        var buffer = decodeUnsafe(string);
        if (buffer) {
          return buffer;
        }
        throw new Error("Non-base" + BASE + " character");
      }
      return {
        encode,
        decodeUnsafe,
        decode
      };
    }
    module2.exports = base;
  }
});

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

// src/utils/async-timeout.js
async function asyncTimeout(delay) {
  return new Promise((resolve) => {
    setTimeout(
      resolve,
      delay
    );
  });
}

// src/utils/base62.js
var import_base_x = __toESM(require_src(), 1);
var base62 = (0, import_base_x.default)("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");

// src/factory.js
var EPOCH = 16409952e5;
var NUMBER_TS_RIGHT = 2 ** 10;
var SnowflakeFactory = class {
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
      worker_id: bits_worker_id = 5
    } = {},
    server_id = 0,
    worker_id = 0
  } = {}) {
    this.#server_id_mask = 2 ** bits_server_id - 1;
    this.#worker_id_bits = bits_worker_id;
    this.#worker_id_mask = 2 ** bits_worker_id - 1;
    if (server_id < 0 || server_id > this.#server_id_mask || !Number.isInteger(server_id)) {
      throw new SnowflakeError(`Invalid server_id: ${server_id} (possible values: from 0 to ${this.#server_id_mask} inclusive)`);
    }
    if (worker_id < 0 || worker_id > this.#worker_id_mask || !Number.isInteger(worker_id)) {
      throw new SnowflakeError(`Invalid worker_id: ${worker_id} (possible values: from 0 to ${this.#worker_id_mask} inclusive)`);
    }
    this.#increment_bit_offset = bits_server_id + bits_worker_id;
    this.#increment_max = 2 ** (22 - this.#increment_bit_offset) - 1;
    this.#number_server_id_worker_id = server_id << bits_worker_id | worker_id;
  }
  create(encoding) {
    const ts_epoch = Date.now() - EPOCH;
    if (ts_epoch < this.#increment_ts_epoch) {
      throw new SnowflakeError(`Cannot create snowflake: Date.now() has returned (probably) invalid value ${ts_epoch}, but previously we got ${this.#increment_ts_epoch}, is code running on time machine?`);
    }
    if (ts_epoch > this.#increment_ts_epoch) {
      this.#increment = 0;
      this.#increment_ts_epoch = ts_epoch;
    } else if (this.#increment > this.#increment_max) {
      throw new SnowflakeIncrementOverflowError();
    }
    const array_buffer = new ArrayBuffer(8);
    const data_view = new DataView(array_buffer);
    data_view.setUint32(
      0,
      Math.floor(ts_epoch / NUMBER_TS_RIGHT)
    );
    data_view.setUint32(
      4,
      ts_epoch % NUMBER_TS_RIGHT << 22 | this.#increment << this.#increment_bit_offset | this.#number_server_id_worker_id
    );
    this.#increment++;
    switch (encoding) {
      case null:
      case void 0:
        return array_buffer;
      case "buffer":
        return Buffer.from(array_buffer);
      case "bigint":
        return data_view.getBigUint64(0);
      case "decimal":
      case 10:
        return String(
          data_view.getBigUint64(0)
        );
      case "hex":
      case 16:
        return arrayBufferToHex(array_buffer);
      case "62":
      case 62:
        return base62.encode(
          new Uint8Array(array_buffer)
        );
      default:
        throw new Error(`Unknown encoding: ${encoding}`);
    }
  }
  async createSafe(encoding) {
    while (true) {
      try {
        return this.create(encoding);
      } catch (error) {
        if (error instanceof SnowflakeIncrementOverflowError) {
          await asyncTimeout();
        }
      }
    }
  }
  parse(snowflake, encoding) {
    let array_buffer;
    if (snowflake instanceof ArrayBuffer) {
      array_buffer = snowflake;
    } else if (Buffer.isBuffer(snowflake)) {
      array_buffer = snowflake.buffer;
    } else if (typeof snowflake === "bigint") {
      array_buffer = new ArrayBuffer(8);
      const data_view2 = new DataView(array_buffer);
      data_view2.setBigUint64(
        0,
        snowflake
      );
    } else if (typeof snowflake === "string") {
      switch (encoding) {
        case "decimal":
        case 10:
          {
            array_buffer = new ArrayBuffer(8);
            const data_view2 = new DataView(array_buffer);
            data_view2.setBigUint64(
              0,
              BigInt(snowflake)
            );
          }
          break;
        case "hex":
          array_buffer = hexToArrayBuffer(snowflake);
          break;
        case "62":
        case 62:
          array_buffer = base62.decode(snowflake).buffer;
          break;
      }
    }
    if (array_buffer === void 0) {
      throw new SnowflakeError(`Unknown encoding: ${encoding}`);
    }
    const data_view = new DataView(array_buffer);
    const number_right = data_view.getUint32(4);
    return {
      timestamp: data_view.getUint32(0) * NUMBER_TS_RIGHT + (number_right >>> 22) + EPOCH,
      increment: number_right << 10 >>> 10 >>> this.#increment_bit_offset,
      server_id: number_right >>> this.#worker_id_bits & this.#server_id_mask,
      worker_id: number_right & this.#worker_id_mask
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SnowflakeError,
  SnowflakeFactory,
  SnowflakeIncrementOverflowError
});
