export class SeyfertPluginError extends Error {
	readonly plugin: string;
	readonly phase: string;
	readonly index: number;

	constructor(plugin: string, phase: string, index: number, cause: unknown) {
		super(`Seyfert plugin "${plugin}" failed during ${phase} at index ${index}.`, { cause });
		this.name = 'SeyfertPluginError';
		this.plugin = plugin;
		this.phase = phase;
		this.index = index;
	}
}

export function wrapPluginError(plugin: string, phase: string, index: number, cause: unknown) {
	if (cause instanceof SeyfertPluginError) return cause;
	return new SeyfertPluginError(plugin, phase, index, cause);
}

export function createPluginConflictError(plugin: string, phase: string, index: number, detail: string) {
	return wrapPluginError(plugin, phase, index, new Error(detail));
}
