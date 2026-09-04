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
	writeFileSync(
		join(root, 'src', 'extended.ts'),
		`import type { Client, CommandContext, ParseClient } from "seyfert";

declare module "seyfert" {
	interface SeyfertRegistry {
		client: { custom: number } & ParseClient<Client<true>>;
	}
}

declare const ctx: CommandContext;
ctx.client.custom;
ctx.client.gateway.values();
ctx.client.messages.write("123", { content: "ok" });
`,
	);
};

const createMiddlewareContextProgram = (guild = false) => {
	const root = join(tmpdir(), 'seyfert-middleware-context');
	const commandFile = join(root, 'src', 'command.ts');
	const completionsFile = join(root, 'src', 'completions.ts');
	const sources = new Map([
		[
			join(root, 'src', 'middlewares.ts'),
			`import {
	createMiddleware,
	createStringOption,
	type ${guild ? 'GuildCommandContext as CommandContext' : 'CommandContext'},
	type ${guild ? 'GuildComponentContext as ComponentContext' : 'ComponentContext'},
	type ${guild ? 'GuildEntryPointContext as EntryPointContext' : 'EntryPointContext'},
	type ${guild ? 'GuildMenuCommandContext as MenuCommandContext' : 'MenuCommandContext'},
	type MessageCommandInteraction,
	type ${guild ? 'GuildModalContext as ModalContext' : 'ModalContext'},
	type UserStructure,
	type MessageStructure,
} from "seyfert";

const options = {
	team: createStringOption({ description: "Team", required: true }),
};

const teamOnly = createMiddleware<{ teamId: string }, CommandContext<typeof options>>(({ context, next }) => {
	const teamId: string = context.options.team;
	// @ts-expect-error command options retain their declared value type.
	const invalidTeam: number = context.options.team;
	// @ts-expect-error a context without middleware names has no middleware metadata.
	context.metadata.teamOnly;
	if (context.inGuild()) {
		const guildId: string = context.guildId;
		void guildId;
	}
	next({ teamId });
});

const menuOnly = createMiddleware<{ menu: true }, MenuCommandContext<MessageCommandInteraction>>(
	({ context, next }) => {
		const target: MessageStructure = context.target;
		// @ts-expect-error a message target is not a user.
		const invalidTarget: UserStructure = context.target;
		void target;
		next({ menu: true });
	},
);
const componentOnly = createMiddleware<{ component: true }, ComponentContext<"StringSelect", never, ("red" | "blue")[]>>(({ context, next }) => {
	const value: "red" | "blue" = context.interaction.values[0];
	// @ts-expect-error select values keep the supplied literals.
	const invalidValue: "green" = context.interaction.values[0];
	void value;
	next({ component: true });
});
const modalOnly = createMiddleware<{ modal: true }, ModalContext>(({ next }) => next({ modal: true }));
const entryPointOnly = createMiddleware<{ entryPoint: true }, EntryPointContext>(({ next }) =>
	next({ entryPoint: true }),
);

export const middlewares = { teamOnly, menuOnly, componentOnly, modalOnly, entryPointOnly };
`,
		],
		[
			join(root, 'src', 'start.ts'),
			`import { middlewares } from "./middlewares";

declare module "seyfert" {
	interface SeyfertRegistry {
		middlewares: typeof middlewares;
	}
}
`,
		],
		[
			commandFile,
			`import "./start";
import type {
	CommandContext, CommandMetadata, ComponentContext, EntryPointContext, MenuCommandContext, ModalContext,
	GuildCommandContext, GuildComponentContext, GuildEntryPointContext, GuildMenuCommandContext, GuildModalContext,
	MessageCommandInteraction, ResolvedRegisteredMiddlewares,
} from "seyfert";

type ContextWithMetadata<M extends keyof ResolvedRegisteredMiddlewares> =
	| CommandContext<{}, M> | GuildCommandContext<{}, M>
	| ComponentContext<"Button", M> | GuildComponentContext<"Button", M>
	| EntryPointContext<M> | GuildEntryPointContext<M>
	| MenuCommandContext<MessageCommandInteraction, M> | GuildMenuCommandContext<MessageCommandInteraction, M>
	| ModalContext<M> | GuildModalContext<M>;

function readMetadata<M extends keyof ResolvedRegisteredMiddlewares>(context: ContextWithMetadata<M>): CommandMetadata<M> {
	return context.metadata;
}


declare const ctx: CommandContext<{}, "teamOnly" | "menuOnly" | "componentOnly" | "modalOnly" | "entryPointOnly">;
const teamId: string = ctx.metadata.teamOnly.teamId;
const menu: true = ctx.metadata.menuOnly.menu;
const component: true = ctx.metadata.componentOnly.component;
const modal: true = ctx.metadata.modalOnly.modal;
const entryPoint: true = ctx.metadata.entryPointOnly.entryPoint;
declare const metadata: CommandMetadata<"teamOnly">;
const metadataTeamId: string = metadata.teamOnly.teamId;
// @ts-expect-error inferred metadata preserves the callback payload.
const invalidTeamId: number = ctx.metadata.teamOnly.teamId;
// @ts-expect-error normal contexts reject middleware names absent from the registry.
type InvalidContext = CommandContext<{}, "missing">;
// @ts-expect-error metadata rejects middleware names absent from the registry.
type InvalidMetadata = CommandMetadata<"missing">;
void teamId;
void menu;
void component;
void modal;
void entryPoint;
void metadataTeamId;
`,
		],
		[
			completionsFile,
			`import "./start";
import { Client, Middlewares, middlewares as collectMiddlewares, type CommandContext, type CommandMetadata } from "seyfert";
import { middlewares as registeredMiddlewares } from "./middlewares";

declare class TestCommand {}
Middlewares([/* decorator */ ""])(TestCommand);
collectMiddlewares(/* helper */ "");
new Client({ globalMiddlewares: [/* global */ ""] });
new Client().setServices({
	middlewares: { /* services */ "": registeredMiddlewares.teamOnly },
});
type ContextCompletion = CommandContext<{}, /* context */ "">;
type MetadataCompletion = CommandMetadata</* metadata */ "">;
`,
		],
	]);
	const compilerOptions: ts.CompilerOptions = {
		esModuleInterop: true,
		module: ts.ModuleKind.CommonJS,
		moduleResolution: ts.ModuleResolutionKind.Node10,
		noEmit: true,
		skipLibCheck: true,
		strict: true,
		target: ts.ScriptTarget.ESNext,
		types: ['node'],
	};
	const host = ts.createCompilerHost(compilerOptions);
	const readFile = host.readFile.bind(host);
	const fileExists = host.fileExists.bind(host);

	host.fileExists = fileName => sources.has(fileName) || fileExists(fileName);
	host.readFile = fileName => sources.get(fileName) ?? readFile(fileName);
	host.getSourceFile = (fileName, languageVersion) => {
		const source = host.readFile(fileName);
		return source === undefined ? undefined : ts.createSourceFile(fileName, source, languageVersion, true);
	};
	host.resolveModuleNames = (moduleNames, containingFile) =>
		moduleNames.map(moduleName => {
			if (moduleName === 'seyfert') {
				return {
					extension: ts.Extension.Dts,
					isExternalLibraryImport: true,
					resolvedFileName: join(process.cwd(), 'lib', 'index.d.ts'),
				};
			}
			if (moduleName.startsWith('./')) {
				const resolvedFileName = join(root, 'src', `${moduleName.slice(2)}.ts`);
				if (sources.has(resolvedFileName)) return { extension: ts.Extension.Ts, resolvedFileName };
			}
			return ts.resolveModuleName(moduleName, containingFile, compilerOptions, host).resolvedModule;
		});

	const languageServiceHost: ts.LanguageServiceHost = {
		fileExists: host.fileExists,
		getCompilationSettings: () => compilerOptions,
		getCurrentDirectory: () => root,
		getDefaultLibFileName: ts.getDefaultLibFilePath,
		getScriptFileNames: () => [...sources.keys()],
		getScriptSnapshot: fileName => {
			const source = host.readFile(fileName);
			return source === undefined ? undefined : ts.ScriptSnapshot.fromString(source);
		},
		getScriptVersion: () => '0',
		readDirectory: ts.sys.readDirectory,
		readFile: host.readFile,
		resolveModuleNames: host.resolveModuleNames,
	};

	return {
		completionsFile,
		completionsSource: sources.get(completionsFile)!,
		languageService: ts.createLanguageService(languageServiceHost),
		program: ts.createProgram([commandFile], compilerOptions, host),
	};
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
					diagnostic =>
						diagnostic.code === 2339 && ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n').includes('fake'),
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

			for (const filename of ['gateway.ts', 'http.ts', 'worker.ts', 'extended.ts']) {
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

	test.each([false, true])('registers existing middleware contexts without circular inference (guild: %s)', guild => {
		const { program } = createMiddlewareContextProgram(guild);

		expect(
			program.getSemanticDiagnostics().map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
		).toEqual([]);
	});

	test('keeps registered middleware completions on public configuration surfaces', () => {
		const { completionsFile, completionsSource, languageService } = createMiddlewareContextProgram();
		const expected = ['componentOnly', 'entryPointOnly', 'menuOnly', 'modalOnly', 'teamOnly'];

		for (const marker of ['decorator', 'helper', 'global', 'services', 'context', 'metadata']) {
			const markerPosition = completionsSource.indexOf(`/* ${marker} */`);
			const quotePosition = completionsSource.indexOf('"', markerPosition);
			const completions = languageService.getCompletionsAtPosition(completionsFile, quotePosition + 1, {});
			const middlewareNames = completions?.entries
				.map(entry => entry.name)
				.filter(name => expected.includes(name))
				.sort();

			expect(middlewareNames, marker).toEqual(expected);
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
