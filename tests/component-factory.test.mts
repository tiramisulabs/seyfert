import { describe, expect, test } from 'vitest';
import { componentFactory } from '../src/components';
import { MessageActionRowComponent } from '../src/components/ActionRow';
import { BaseComponent } from '../src/components/BaseComponent';
import { ButtonComponent, LinkButtonComponent, SKUButtonComponent } from '../src/components/ButtonComponent';
import { ChannelSelectMenuComponent } from '../src/components/ChannelSelectMenuComponent';
import { ContainerComponent } from '../src/components/Container';
import { FileComponent } from '../src/components/File';
import { LabelComponent } from '../src/components/LabelComponent';
import { MediaGalleryComponent } from '../src/components/MediaGallery';
import { MentionableSelectMenuComponent } from '../src/components/MentionableSelectMenuComponent';
import { RoleSelectMenuComponent } from '../src/components/RoleSelectMenuComponent';
import { SectionComponent } from '../src/components/Section';
import { SeparatorComponent } from '../src/components/Separator';
import { StringSelectMenuComponent } from '../src/components/StringSelectMenuComponent';
import { TextDisplayComponent } from '../src/components/TextDisplay';
import { TextInputComponent } from '../src/components/TextInputComponent';
import { ThumbnailComponent } from '../src/components/Thumbnail';
import { UserSelectMenuComponent } from '../src/components/UserSelectMenuComponent';
import { type APIComponents, ButtonStyle, ComponentType, TextInputStyle } from '../src/types';

type ComponentConstructor = (new (...args: never[]) => object) & { name: string };
type FactoryCase<T extends APIComponents['type']> = readonly [
	component: Extract<APIComponents, { type: T }>,
	expected: ComponentConstructor,
];
type FactoryMatrix = {
	[T in APIComponents['type']]: readonly [FactoryCase<T>, ...FactoryCase<T>[]];
};

const options = [
	{ label: 'First', value: 'first' },
	{ label: 'Second', value: 'second' },
];

const factoryMatrix = {
	[ComponentType.ActionRow]: [
		[
			{
				type: ComponentType.ActionRow,
				components: [{ type: ComponentType.Button, style: ButtonStyle.Primary, custom_id: 'action' }],
			},
			MessageActionRowComponent,
		],
	],
	[ComponentType.Button]: [
		[{ type: ComponentType.Button, style: ButtonStyle.Primary, custom_id: 'primary' }, ButtonComponent],
		[{ type: ComponentType.Button, style: ButtonStyle.Link, url: 'https://example.com' }, LinkButtonComponent],
		[{ type: ComponentType.Button, style: ButtonStyle.Premium, sku_id: '1' }, SKUButtonComponent],
	],
	[ComponentType.StringSelect]: [
		[{ type: ComponentType.StringSelect, custom_id: 'string', options }, StringSelectMenuComponent],
	],
	[ComponentType.TextInput]: [
		[{ type: ComponentType.TextInput, custom_id: 'text', style: TextInputStyle.Short }, TextInputComponent],
	],
	[ComponentType.UserSelect]: [
		[{ type: ComponentType.UserSelect, custom_id: 'user' }, UserSelectMenuComponent],
	],
	[ComponentType.RoleSelect]: [
		[{ type: ComponentType.RoleSelect, custom_id: 'role' }, RoleSelectMenuComponent],
	],
	[ComponentType.MentionableSelect]: [
		[{ type: ComponentType.MentionableSelect, custom_id: 'mentionable' }, MentionableSelectMenuComponent],
	],
	[ComponentType.ChannelSelect]: [
		[{ type: ComponentType.ChannelSelect, custom_id: 'channel' }, ChannelSelectMenuComponent],
	],
	[ComponentType.Section]: [
		[
			{
				type: ComponentType.Section,
				components: [{ type: ComponentType.TextDisplay, content: 'Section' }],
				accessory: { type: ComponentType.Thumbnail, media: { url: 'https://example.com/thumbnail.png' } },
			},
			SectionComponent,
		],
	],
	[ComponentType.TextDisplay]: [
		[{ type: ComponentType.TextDisplay, content: 'Text' }, TextDisplayComponent],
	],
	[ComponentType.Thumbnail]: [
		[{ type: ComponentType.Thumbnail, media: { url: 'https://example.com/thumbnail.png' } }, ThumbnailComponent],
	],
	[ComponentType.MediaGallery]: [
		[
			{ type: ComponentType.MediaGallery, items: [{ media: { url: 'https://example.com/gallery.png' } }] },
			MediaGalleryComponent,
		],
	],
	[ComponentType.File]: [
		[{ type: ComponentType.File, file: { url: 'attachment://document.txt' } }, FileComponent],
	],
	[ComponentType.Separator]: [[{ type: ComponentType.Separator }, SeparatorComponent]],
	[ComponentType.Container]: [
		[
			{
				type: ComponentType.Container,
				components: [{ type: ComponentType.TextDisplay, content: 'Container' }],
			},
			ContainerComponent,
		],
	],
	[ComponentType.Label]: [
		[
			{
				type: ComponentType.Label,
				label: 'Name',
				component: { type: ComponentType.TextInput, custom_id: 'name', style: TextInputStyle.Short },
			},
			LabelComponent,
		],
	],
	[ComponentType.FileUpload]: [
		[{ type: ComponentType.FileUpload, custom_id: 'upload' }, BaseComponent],
	],
	[ComponentType.RadioGroup]: [
		[{ type: ComponentType.RadioGroup, custom_id: 'radio', options }, BaseComponent],
	],
	[ComponentType.CheckboxGroup]: [
		[{ type: ComponentType.CheckboxGroup, custom_id: 'checkboxes', options }, BaseComponent],
	],
	[ComponentType.Checkbox]: [[{ type: ComponentType.Checkbox, custom_id: 'checkbox' }, BaseComponent]],
} satisfies FactoryMatrix;

const factoryCases = Object.values(factoryMatrix)
	.flat()
	.map(([component, expected]) => [
		`${ComponentType[component.type]} -> ${expected.name}`,
		component,
		expected,
	] as const);

describe('componentFactory', () => {
	test.each(factoryCases)('%s', (_name, component, expected) => {
		expect(componentFactory(component).constructor).toBe(expected);
	});
});
