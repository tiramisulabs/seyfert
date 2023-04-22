import { APIMentionableSelectComponent, ComponentType } from '@biscuitland/common';
import { BaseSelectMenuComponent } from '../extra/BaseSelectMenuComponent';

export interface MentionableSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.MentionableSelect> {
	constructor(data: APIMentionableSelectComponent): MentionableSelectMenuComponent;
}

export class MentionableSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.MentionableSelect> {}
