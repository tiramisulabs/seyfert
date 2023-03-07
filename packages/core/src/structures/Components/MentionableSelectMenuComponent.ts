import { APIMentionableSelectComponent, ComponentType } from "discord-api-types/v10";
import { BaseSelectMenuComponent } from "../extra/BaseSelectMenuComponent";

export interface MentionableSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.MentionableSelect> {
	constructor(data: APIMentionableSelectComponent): MentionableSelectMenuComponent;
}

export class MentionableSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.MentionableSelect> {}
