
const SnowflakeGenerator = require('../main');

(async () => {
	const SERVER_ID = 13;
	const WORKER_ID = process.pid & 31; // eslint-disable-line no-bitwise

	console.log('SERVER_ID', SERVER_ID);
	console.log('WORKER_ID', WORKER_ID);

	const snowflakeGenerator = new SnowflakeGenerator({
		server_id: SERVER_ID,
		worker_id: WORKER_ID,
	});

	for (const encoding of [ null, 'bigint', 'decimal', 'hex', '62' ]) {
		// for (let i = 0; i < 10_000; i++) {
		// 	if (i % 100_000 === 0) {
		// 		console.log(encoding, i / 1000, 'k');
		// 	}
		// }

		console.log('---------', encoding ?? 'buffer', '---------');

		const snowflake = await snowflakeGenerator.createStrict(encoding);
		console.log('snowflake', snowflake);

		console.log(
			'data parsed',
			snowflakeGenerator.parse(snowflake, encoding),
		);
	}
})();
