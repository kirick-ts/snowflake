
const { randomBytes } = require('crypto');

const SnowflakeGenerator = require('../main');

for (let i = 0; i < 10_000_000; i++) {
	if (i % 100_000 === 0) {
		console.log(i / 1000, 'k');
	}

	const buffer = randomBytes(8);
	const string = SnowflakeGenerator.encode64(buffer);
	const buffer_decoded = SnowflakeGenerator.decode64(string);

	if (!buffer.equals(buffer_decoded)) {
		console.error(
			`got an error (try #${i}):`,
			buffer,
			string,
			buffer_decoded,
		);
		throw new Error('Failed to decode snowflake.');
	}
}

console.log('all ok');
