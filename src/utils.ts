import basex from 'base-x';

export const base62: basex.BaseConverter = basex('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');

/**
 * Wrapper for setTimeout.
 * @param delay - The delay in milliseconds.
 * @returns A promise that resolves after the specified delay.
 */
export function asyncTimeout(delay: number = 0): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(
			resolve,
			delay,
		);
	});
}
