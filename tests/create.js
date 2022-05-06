
const SnowflakeGenerator = require('../main');

(async () => {
	const snowflakeGenerator = new SnowflakeGenerator({
		server_id: 0,
		worker_id: 0,
	});

	for (const encoding of [ 'decimal', 'hex', '64' ]) {
		console.log('encoding', encoding, snowflakeGenerator.create(encoding));

		for (let i = 0; i < 10_000_000; i++) {
			if (i % 100_000 === 0) {
				console.log(encoding, i / 1000, 'k');
			}

			// console.log('----------------');

			let snowflake1;
			let snowflake2;

			try {
				snowflake1 = snowflakeGenerator.create(encoding);
				// console.log('snowflake 1', snowflake1);

				snowflake2 = snowflakeGenerator.create(encoding);
				// console.log('snowflake 2', snowflake2);
			}
			catch (_) {
				await new Promise(resolve => {
					setTimeout(resolve, 1);
				});
			}

			if (snowflake2 <= snowflake1) {
				console.log('invalid comparison', snowflake1, snowflake2);
				for (const history_slice of snowflakeGenerator._history) {
					console.log('-----');
					for (const [ name, value ] of history_slice) {
						console.log(
							name,
							(value >>> 0),
							(value >>> 0).toString(2),
							SnowflakeGenerator.analyzeBits(value),
						);
					}
				}
				throw new Error('Invalid comparison');
			}
		}
	}

	console.log('all ok');

	process.exit(); // eslint-disable-line no-process-exit, unicorn/no-process-exit
})();
