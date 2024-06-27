
/**
 * @param {number} [delay] -
 * @returns {Promise<void>} -
 */
export async function asyncTimeout(delay = 0) {
	return new Promise((resolve) => {
		setTimeout(
			resolve,
			delay,
		);
	});
}
