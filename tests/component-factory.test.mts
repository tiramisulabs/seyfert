import { describe, expect, test } from 'vitest';
import { ComponentType, componentFactory, LabelComponent } from '../lib';

describe('componentFactory', () => {
	test('materializes label components and their nested component', () => {
		const label = componentFactory({
			type: ComponentType.Label,
			label: 'Name',
			component: {
				type: ComponentType.TextInput,
				custom_id: 'name',
				style: 1,
			},
		});

		expect(label).toBeInstanceOf(LabelComponent);
		expect((label as LabelComponent).component.constructor.name).toBe('TextInputComponent');
	});
});
