const wrap = (fn: (text: string) => string) => (text: string) => fn(text);

export const colors = {
	yellow: wrap((text: string) => `\x1b[33m${text}\x1B[39m`),
	white: wrap((text: string) => `\x1b[37m${text}\x1B[39m`),
	cyan: wrap((text: string) => `\x1b[36m${text}\x1B[39m`),
};
