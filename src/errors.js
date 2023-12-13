
export class SnowflakeError extends Error {}

export class SnowflakeIncrementOverflowError extends SnowflakeError {
	constructor() {
		super('Cannot create snowflake due to increment overflow.');
	}
}
