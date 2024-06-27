export class Snowflake {
    /**
     * Create a new Snowflake from values.
     * @param {SnowflakeDescription} snowflake_description -
     * @param {SnowflakeFactoryOptions} options Options for encoding.
     * @returns {Snowflake} New Snowflake instance.
     */
    static fromValues({ timestamp, server_id, worker_id, increment, }: SnowflakeDescription, { increment_bit_offset, number_server_id_worker_id, }: SnowflakeFactoryOptions): Snowflake;
    /**
     * Create a new Snowflake from values.
     * @param {ArrayBuffer | Buffer | bigint | string} snowflake -
     * @param {string} encoding -
     * @param {SnowflakeFactoryOptions} options Options for encoding.
     * @returns {Snowflake} New Snowflake instance.
     */
    static fromSnowflake(snowflake: ArrayBuffer | Buffer | bigint | string, encoding: string, { server_id_mask, worker_id_bits, worker_id_mask, increment_bit_offset, }: SnowflakeFactoryOptions): Snowflake;
    /**
     * @param {ArrayBuffer} array_buffer -
     * @param {DataView} data_view -
     * @param {SnowflakeDescription} description -
     */
    constructor(array_buffer: ArrayBuffer, data_view: DataView, { timestamp, server_id, worker_id, increment, }: SnowflakeDescription);
    /**
     * Timestamp in milliseconds when Snowflake was created.
     * @type {number}
     * @readonly
     */
    readonly timestamp: number;
    /**
     * Server ID where Snowflake was created.
     * @type {number}
     * @readonly
     */
    readonly server_id: number;
    /**
     * Worker ID where Snowflake was created.
     * @type {number}
     * @readonly
     */
    readonly worker_id: number;
    /**
     * Increment of Snowflake.
     * @type {number}
     * @readonly
     */
    readonly increment: number;
    /**
     * Snowflake as ArrayBuffer.
     * @returns {ArrayBuffer} -
     */
    toArrayBuffer(): ArrayBuffer;
    /**
     * Snowflake as Uint8Array.
     * @returns {Uint8Array} -
     */
    toUint8Array(): Uint8Array;
    /**
     * Snowflake as Node.JS Buffer.
     * @returns {Buffer} -
     */
    toBuffer(): Buffer;
    /**
     * Snowflake as BigInt.
     * @returns {bigint} -
     */
    toBigInt(): bigint;
    /**
     * Snowflake as decimal string.
     * @returns {string} -
     */
    toDecimal(): string;
    /**
     * Snowflake as hex string.
     * @returns {string} -
     */
    toHex(): string;
    /**
     * Snowflake as base62 string.
     * @returns {string} -
     */
    toBase62(): string;
    #private;
}
export type SnowflakeFactoryOptions = import("./factory.js").SnowflakeFactoryOptions;
export type SnowflakeDescription = {
    /**
     * - Timestamp in milliseconds when Snowflake was created.
     */
    timestamp: number;
    /**
     * - Server ID where Snowflake was created.
     */
    server_id: number;
    /**
     * - Worker ID where Snowflake was created.
     */
    worker_id: number;
    /**
     * - Increment of Snowflake.
     */
    increment: number;
};
