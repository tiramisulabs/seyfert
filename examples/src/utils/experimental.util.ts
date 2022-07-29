const originalEmit = process.emit;

// @ts-ignore
process.emit = function (name, data: any, ..._args: any[]) {
	if (
		name === `warning` &&
		typeof data === `object` &&
		data.name === `ExperimentalWarning`
	) {
		return false;
	}

	// @ts-ignore
	return originalEmit.apply(process, arguments);
};
