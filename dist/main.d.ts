//#region src/snowflake.d.ts
type SnowflakeData = {
  timestamp: number;
  server_id: number;
  worker_id: number;
  increment: number;
};
declare class Snowflake {
  /** Timestamp in milliseconds when Snowflake was created. */
  readonly timestamp: SnowflakeData["timestamp"];
  /** Server ID where Snowflake was created. */
  readonly server_id: SnowflakeData["server_id"];
  /** Worker ID where Snowflake was created. */
  readonly worker_id: SnowflakeData["worker_id"];
  /** Increment of Snowflake. */
  readonly increment: SnowflakeData["increment"];
  private array_buffer;
  private data_view;
  /**
  * @param array_buffer -
  * @param data_view -
  * @param data -
  */
  constructor(array_buffer: ArrayBuffer, data_view: DataView, data: SnowflakeData);
  /**
  * Create a new Snowflake from values.
  * @param data -
  * @param factory_options -
  * @returns -
  */
  static fromValues(data: SnowflakeData, factory_options: SnowflakeFactoryOptions): Snowflake;
  /**
  * Create a new Snowflake from values.
  * @param snowflake -
  * @param encoding -
  * @param factory_options -
  * @returns New Snowflake instance.
  */
  static fromSnowflake(snowflake: ArrayBuffer | Buffer | bigint | string, encoding: "decimal" | "hex" | "base62" | undefined, factory_options: SnowflakeFactoryOptions): Snowflake;
  /**
  * Snowflake as ArrayBuffer.
  * @returns -
  */
  toArrayBuffer(): ArrayBuffer;
  /**
  * Snowflake as Uint8Array.
  * @returns -
  */
  toUint8Array(): Uint8Array;
  /**
  * Snowflake as Node.JS Buffer.
  * @returns -
  */
  toBuffer(): Buffer;
  /**
  * Snowflake as BigInt.
  * @returns -
  */
  toBigInt(): bigint;
  /**
  * Snowflake as decimal string.
  * @returns -
  */
  toDecimal(): string;
  /**
  * Snowflake as hex string.
  * @returns -
  */
  toHex(): string;
  /**
  * Snowflake as base62 string.
  * @returns -
  */
  toBase62(): string;
} //#endregion
//#region src/factory.d.ts
type SnowflakeFactoryOptions = {
  /** Bitmask for Server ID (maximum value of the Server ID). */
  server_id_mask: number;
  /** Number of bits for Worker ID. */
  worker_id_bits: number;
  /** Bitmask for Worker ID (maximum value of the Worker ID). */
  worker_id_mask: number;
  /** Number of bits to shift the increment value inside the second 32-bit integer of the Snowflake. */
  increment_bit_offset: number;
  /** Number representing the Server ID and Worker ID combined. */
  number_server_id_worker_id: number;
};
type SnowflakeFactoryConstructorOptions = {
  bits?: {
    server_id?: number;
    worker_id?: number;
  };
  server_id: number;
  worker_id: number;
};
declare class SnowflakeFactory {
  readonly server_id: number;
  readonly worker_id: number;
  private increment;
  private increment_timestamp;
  private increment_max;
  private options;
  constructor({
    bits: {
      server_id: bits_server_id,
      worker_id: bits_worker_id
    },
    server_id,
    worker_id
  }: SnowflakeFactoryConstructorOptions);
  /**
  * Creates new Snowflake.
  * @throws {SnowflakeError}
  * @throws {SnowflakeIncrementOverflowError} If increment has reached maximum value. Try again in next millisecond.
  * @returns -
  */
  create(): Snowflake;
  /**
  * Asynchronously creates new Snowflake, avoiding SnowflakeIncrementOverflowError by waiting for next millisecond.
  * @returns New Snowflake instance.
  */
  createSafe(): Promise<Snowflake>;
  /**
  * Parses Snowflake from ArrayBuffer, Buffer, bigint or string.
  * @param snowflake - Snowflake to parse.
  * @returns Parsed Snowflake instance.
  */
  parse(snowflake: ArrayBuffer | Buffer | bigint): Snowflake;
  /**
  * Parses Snowflake from ArrayBuffer, Buffer, bigint or string.
  * @param snowflake - Snowflake to parse.
  * @param encoding - Encoding of snowflake string.
  * @returns Parsed Snowflake instance.
  */
  parse(snowflake: string, encoding: "decimal" | "hex" | "base62"): Snowflake;
} //#endregion
//#region src/errors.d.ts
declare class SnowflakeError extends Error {}
declare class SnowflakeIncrementOverflowError extends SnowflakeError {
  constructor();
}

//#endregion
export { Snowflake, SnowflakeError, SnowflakeFactory, SnowflakeIncrementOverflowError };