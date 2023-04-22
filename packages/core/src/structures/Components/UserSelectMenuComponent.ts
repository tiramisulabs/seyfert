import { APIUserSelectComponent, ComponentType } from '@biscuitland/common';
import { BaseSelectMenuComponent } from '../extra/BaseSelectMenuComponent';

export interface UserSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.UserSelect> {
	constructor(data: APIUserSelectComponent): UserSelectMenuComponent;
}

export class UserSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.UserSelect> {}
