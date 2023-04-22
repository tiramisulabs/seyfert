import { APIRoleSelectComponent, ComponentType } from '@biscuitland/common';
import { BaseSelectMenuComponent } from '../extra/BaseSelectMenuComponent';

export interface RoleSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.RoleSelect> {
	constructor(data: APIRoleSelectComponent): RoleSelectMenuComponent;
}

export class RoleSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.RoleSelect> {}
