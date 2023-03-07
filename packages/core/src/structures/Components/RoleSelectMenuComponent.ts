import { APIRoleSelectComponent, ComponentType } from "discord-api-types/v10";
import { BaseSelectMenuComponent } from "../extra/BaseSelectMenuComponent";

export interface RoleSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.RoleSelect> {
	constructor(data: APIRoleSelectComponent): RoleSelectMenuComponent;
}

export class RoleSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.RoleSelect> {}
