import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, test } from 'vitest';

type TypeSnapshot = {
	readonly isAny: boolean;
	readonly text: string;
};

const isAnyType = (type: ts.Type) => (type.flags & ts.TypeFlags.Any) !== 0;

const writeConsumerFixture = (root: string) => {
	mkdirSync(join(root, 'src'), { recursive: true });
	mkdirSync(join(root, 'node_modules'), { recursive: true });
	symlinkSync(process.cwd(), join(root, 'node_modules', 'seyfert'), 'dir');

	writeFileSync(join(root, 'src', 'index.ts'), 'export * from "./start";\n');
	writeFileSync(join(root, 'src', 'middlewares.ts'), 'export const middlewares = {};\n');
	writeFileSync(
		join(root, 'src', 'start.ts'),
		`import { Client, type ParseClient } from "seyfert";
import { middlewares } from "./middlewares";

export let client: Client<true>;
declare const typedClient: Client<true>;
const parsedClient: ParseClient<Client<true>> = typedClient;
void parsedClient;

declare module "seyfert" {
	interface SeyfertRegistry {
		client: ParseClient<Client<true>>;
		middlewares: typeof middlewares;
	}
}
`,
	);
	writeFileSync(
		join(root, 'src', 'client-utils.ts'),
		`import type { AutocompleteInteraction } from "seyfert";
import { client } from "./index";

export async function campaignAutocomplete(ctx: AutocompleteInteraction) {
	await client.messages.write("123", { content: "ok" });
	return ctx.respond([]);
}
`,
	);
	writeFileSync(
		join(root, 'src', 'command.ts'),
		`import { createStringOption, type AutocompleteInteraction, type GuildCommandContext } from "seyfert";
import { campaignAutocomplete } from "./client-utils";

const options = {
	campaign: createStringOption({
		autocomplete: async (interaction: AutocompleteInteraction) => campaignAutocomplete(interaction),
		description: "Campaign",
		required: true,
	}),
};

declare const ctx: GuildCommandContext<typeof options>;
ctx.client.messages.write(ctx.channelId, { content: "ok" });
`,
	);
};

const writeInvalidClientFixture = (root: string) => {
	mkdirSync(join(root, 'src'), { recursive: true });
	mkdirSync(join(root, 'node_modules'), { recursive: true });
	symlinkSync(process.cwd(), join(root, 'node_modules', 'seyfert'), 'dir');

	writeFileSync(
		join(root, 'src', 'start.ts'),
		`import type { BaseClient } from "seyfert/lib/client/base";

declare module "seyfert" {
	interface SeyfertRegistry {
		client: Pick<BaseClient, "messages" | "rest" | "logger"> & { fake: 1 };
	}
}
`,
	);
	writeFileSync(
		join(root, 'src', 'command.ts'),
		`import "./start";
import type { CommandContext } from "seyfert";

declare const ctx: CommandContext;
ctx.client.messages.write("123", { content: "ok" });
ctx.client.fake;
`,
	);
};

const writeDirectClientFixture = (root: string) => {
	mkdirSync(join(root, 'src'), { recursive: true });
	mkdirSync(join(root, 'node_modules'), { recursive: true });
	symlinkSync(process.cwd(), join(root, 'node_modules', 'seyfert'), 'dir');

	writeFileSync(
		join(root, 'src', 'start.ts'),
		`import type { Client } from "seyfert";

declare module "seyfert" {
	interface SeyfertRegistry {
		client: Client<true>;
	}
}
`,
	);
	writeFileSync(
		join(root, 'src', 'command.ts'),
		`import "./start";
import type { CommandContext } from "seyfert";

declare const ctx: CommandContext;
ctx.client.gateway.values();
ctx.client.events.load("events");
ctx.client.messages.write("123", { content: "ok" });
`,
	);
};

const writeDocumentedClientVariantFixture = (root: string) => {
	mkdirSync(join(root, 'src'), { recursive: true });
	mkdirSync(join(root, 'node_modules'), { recursive: true });
	symlinkSync(process.cwd(), join(root, 'node_modules', 'seyfert'), 'dir');

	writeFileSync(
		join(root, 'src', 'gateway.ts'),
		`import type { Client, CommandContext, ParseClient } from "seyfert";

declare module "seyfert" {
	interface SeyfertRegistry {
		client: ParseClient<Client<true>>;
	}
}

declare const ctx: CommandContext;
ctx.client.gateway.values();
ctx.client.events.load("events");
ctx.client.messages.write("123", { content: "ok" });
`,
	);
	writeFileSync(
		join(root, 'src', 'http.ts'),
		`import type { CommandContext, HttpClient, ParseClient } from "seyfert";

declare module "seyfert" {
	interface SeyfertRegistry {
		client: ParseClient<HttpClient>;
	}
}

declare const ctx: CommandContext;
ctx.client.messages.write("123", { content: "ok" });
ctx.client.rest;
ctx.client.logger;
`,
	);
	writeFileSync(
		join(root, 'src', 'worker.ts'),
		`import type { CommandContext, ParseClient, WorkerClient } from "seyfert";

declare module "seyfert" {
	interface SeyfertRegistry {
		client: ParseClient<WorkerClient<true>>;
	}
}

declare const ctx: CommandContext;
ctx.client.events.load("events");
ctx.client.messages.write("123", { content: "ok" });
`,
	);
};

const getClientTypesBeforeDiagnostics = (sourceFile: ts.SourceFile, checker: ts.TypeChecker) => {
	const clientTypes: TypeSnapshot[] = [];

	const visit = (node: ts.Node) => {
		if (ts.isPropertyAccessExpression(node) && node.name.text === 'client') {
			const type = checker.getTypeAtLocation(node);
			clientTypes.push({
				isAny: isAnyType(type),
				text: checker.typeToString(type),
			});
		}

		ts.forEachChild(node, visit);
	};

	visit(sourceFile);
	return clientTypes;
};

describe('command context client type', () => {
	test('keeps ctx.client typed while resolving circular consumer module augmentation', () => {
		const root = mkdtempSync(join(tmpdir(), 'seyfert-context-client-'));

		try {
			writeConsumerFixture(root);

			const commandFile = join(root, 'src', 'command.ts');
			const program = ts.createProgram([commandFile], {
				esModuleInterop: true,
				module: ts.ModuleKind.CommonJS,
				moduleResolution: ts.ModuleResolutionKind.Node10,
				noEmit: true,
				skipLibCheck: true,
				strict: true,
				target: ts.ScriptTarget.ESNext,
				types: ['node'],
			});
			const checker = program.getTypeChecker();
			const sourceFile = program.getSourceFile(commandFile);

			expect(sourceFile).toBeDefined();
			if (!sourceFile) throw new Error('Fixture command source was not loaded');

			const clientTypes = getClientTypesBeforeDiagnostics(sourceFile, checker);

			expect(clientTypes).toHaveLength(1);
			expect(clientTypes[0]?.text).toBe('UsingClient');
			expect(clientTypes[0]?.isAny).toBe(false);
			expect(program.getSemanticDiagnostics()).toHaveLength(0);
		} finally {
			rmSync(root, { force: true, recursive: true });
		}
	});

	test('ignores arbitrary client registry types not created with ParseClient', () => {
		const root = mkdtempSync(join(tmpdir(), 'seyfert-invalid-client-'));

		try {
			writeInvalidClientFixture(root);

			const commandFile = join(root, 'src', 'command.ts');
			const program = ts.createProgram([commandFile], {
				esModuleInterop: true,
				module: ts.ModuleKind.CommonJS,
				moduleResolution: ts.ModuleResolutionKind.Node10,
				noEmit: true,
				skipLibCheck: true,
				strict: true,
				target: ts.ScriptTarget.ESNext,
				types: ['node'],
			});
			const diagnostics = program.getSemanticDiagnostics();

			expect(
				diagnostics.some(
					(diagnostic) =>
						diagnostic.code === 2339 &&
						ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n').includes('fake'),
				),
			).toBe(true);
		} finally {
			rmSync(root, { force: true, recursive: true });
		}
	});

	test('keeps direct Client registry types compatible', () => {
		const root = mkdtempSync(join(tmpdir(), 'seyfert-direct-client-'));

		try {
			writeDirectClientFixture(root);

			const commandFile = join(root, 'src', 'command.ts');
			const program = ts.createProgram([commandFile], {
				esModuleInterop: true,
				module: ts.ModuleKind.CommonJS,
				moduleResolution: ts.ModuleResolutionKind.Node10,
				noEmit: true,
				skipLibCheck: true,
				strict: true,
				target: ts.ScriptTarget.ESNext,
				types: ['node'],
			});

			expect(program.getSemanticDiagnostics()).toHaveLength(0);
		} finally {
			rmSync(root, { force: true, recursive: true });
		}
	});

	test('keeps documented ParseClient variants compatible', () => {
		const root = mkdtempSync(join(tmpdir(), 'seyfert-client-variants-'));

		try {
			writeDocumentedClientVariantFixture(root);

			for (const filename of ['gateway.ts', 'http.ts', 'worker.ts']) {
				const program = ts.createProgram([join(root, 'src', filename)], {
					esModuleInterop: true,
					module: ts.ModuleKind.CommonJS,
					moduleResolution: ts.ModuleResolutionKind.Node10,
					noEmit: true,
					skipLibCheck: true,
					strict: true,
					target: ts.ScriptTarget.ESNext,
					types: ['node'],
				});

				expect(program.getSemanticDiagnostics()).toHaveLength(0);
			}
		} finally {
			rmSync(root, { force: true, recursive: true });
		}
	});
});

const writeLocaleFixture = (root: string) => {
	mkdirSync(join(root, 'src', 'langs'), { recursive: true });
	mkdirSync(join(root, 'node_modules'), { recursive: true });
	symlinkSync(process.cwd(), join(root, 'node_modules', 'seyfert'), 'dir');

	writeFileSync(join(root, 'src', 'index.ts'), 'export * from "./start";\n');
	writeFileSync(join(root, 'src', 'middlewares.ts'), 'export const middlewares = {};\n');
	writeFileSync(
		join(root, 'src', 'langs', 'en.ts'),
		`export default {
	commands: {
		ping: { content: "Pong" },
	},
	greeting: (name: string) => "Hi " + name,
};
`,
	);
	// Mirrors a real consumer entrypoint: a single SeyfertRegistry augmentation that registers a
	// self-referential client AND langs, resolved through a circular module graph (index -> start,
	// client-utils -> index, command -> client-utils). The self-referential client field is what
	// previously made the constrained `infer L extends Record<string, any>` in DefaultLocale collapse
	// to `{}`, leaving `ctx.t` untyped.
	writeFileSync(
		join(root, 'src', 'start.ts'),
		`import { Client, type ParseClient, type ParseLocales } from "seyfert";
import { middlewares } from "./middlewares";

export let client: Client<true>;

declare module "seyfert" {
	interface SeyfertRegistry {
		client: ParseClient<Client<true>>;
		middlewares: typeof middlewares;
		langs: ParseLocales<typeof import("./langs/en")["default"]>;
	}
}
`,
	);
	writeFileSync(
		join(root, 'src', 'client-utils.ts'),
		`import { client } from "./index";

export async function helper() {
	await client.messages.write("123", { content: "ok" });
}
`,
	);
	writeFileSync(
		join(root, 'src', 'command.ts'),
		`import type { CommandContext } from "seyfert";
import { helper } from "./client-utils";

void helper;
declare const ctx: CommandContext;
const reply = ctx.t.commands.ping.content.get();
const greeting = ctx.t.greeting("world").get();
void reply;
void greeting;
`,
	);
};

const getLocaleTypesBeforeDiagnostics = (sourceFile: ts.SourceFile, checker: ts.TypeChecker) => {
	const localeTypes: TypeSnapshot[] = [];

	const visit = (node: ts.Node) => {
		if (ts.isPropertyAccessExpression(node) && node.name.text === 't') {
			const type = checker.getTypeAtLocation(node);
			localeTypes.push({
				isAny: isAnyType(type),
				text: checker.typeToString(type),
			});
		}

		ts.forEachChild(node, visit);
	};

	visit(sourceFile);
	return localeTypes;
};

describe('command context locale type', () => {
	test('keeps ctx.t typed while resolving circular consumer module augmentation', () => {
		const root = mkdtempSync(join(tmpdir(), 'seyfert-context-locale-'));

		try {
			writeLocaleFixture(root);

			const commandFile = join(root, 'src', 'command.ts');
			const program = ts.createProgram([commandFile], {
				esModuleInterop: true,
				module: ts.ModuleKind.CommonJS,
				moduleResolution: ts.ModuleResolutionKind.Node10,
				noEmit: true,
				skipLibCheck: true,
				strict: true,
				target: ts.ScriptTarget.ESNext,
				types: ['node'],
			});
			const checker = program.getTypeChecker();
			const sourceFile = program.getSourceFile(commandFile);

			expect(sourceFile).toBeDefined();
			if (!sourceFile) throw new Error('Fixture command source was not loaded');

			const localeTypes = getLocaleTypesBeforeDiagnostics(sourceFile, checker);

			// ctx.t must resolve to the registered locale proxy, not collapse to `{}` (untyped).
			expect(localeTypes.length).toBeGreaterThanOrEqual(1);
			for (const localeType of localeTypes) {
				expect(localeType.isAny).toBe(false);
				expect(localeType.text).not.toBe('{}');
			}
			// Accessing ctx.t.commands.ping.content.get() and ctx.t.greeting(...).get() must typecheck.
			expect(program.getSemanticDiagnostics()).toHaveLength(0);
		} finally {
			rmSync(root, { force: true, recursive: true });
		}
	});
});
