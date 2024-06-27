export class SnowflakeFactory {
    constructor({ bits: { server_id: bits_server_id, worker_id: bits_worker_id, }, server_id, worker_id, }?: {
        bits?: {
            server_id?: number;
            worker_id?: number;
        };
        server_id?: number;
        worker_id?: number;
    });
    /**
     * Creates new Snowflake.
     * @throws {SnowflakeError}
     * @throws {SnowflakeIncrementOverflowError} If increment has reached maximum value. Try again in next millisecond.
     * @returns {Snowflake} New Snowflake instance.
     */
    create(): Snowflake;
    /**
     * Asynchronously creates new Snowflake, avoiding SnowflakeIncrementOverflowError by waiting for next millisecond.
     * @async
     * @throws {SnowflakeError}
     * @returns {Promise<Snowflake>} New Snowflake instance.
     */
    createSafe(): Promise<Snowflake>;
    /**
     * Parses Snowflake from ArrayBuffer, Buffer, bigint or string.
     * @param {ArrayBuffer | Buffer | bigint | string} snowflake Snowflake to parse.
     * @param {"decimal" | "hex" | "binary"} [encoding] Encoding of snowflake string. Required if snowflake is string.
     * @throws {SnowflakeError}
     * @returns {Snowflake} Parsed Snowflake instance.
     */
    parse(snowflake: ArrayBuffer | Buffer | bigint | string, encoding?: "decimal" | "hex" | "binary"): Snowflake;
    #private;
}
export type SnowflakeFactoryOptions = {
    /**
     * - Bitmask for Server ID (maximum value of the Server ID).
     */
    server_id_mask: number;
    /**
     * - Number of bits for Worker ID.
     */
    worker_id_bits: number;
    /**
     * - Bitmask for Worker ID (maximum value of the Worker ID).
     */
    worker_id_mask: number;
    /**
     * - Number of bits to shift the increment value inside the second 32-bit integer of the Snowflake.
     */
    increment_bit_offset: number;
    /**
     * - Number representing the Server ID and Worker ID combined.
     */
    number_server_id_worker_id: number;
};
import { Snowflake } from './snowflake.js';
