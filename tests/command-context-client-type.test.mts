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
		} finally {
			rmSync(root, { force: true, recursive: true });
		}
	});
});
