import { ApplicationCommandType, LocalizationMap, RESTPostAPIContextMenuApplicationCommandsJSONBody } from '@biscuitland/common';
import { PermissionResolvable, Permissions } from '../../Permissions';

export type ContextCommandType = ApplicationCommandType.Message | ApplicationCommandType.User;

export class ContextCommand {
  name: string = undefined!;
  name_localizations?: LocalizationMap;
  type: ContextCommandType = undefined!;
  default_permission: boolean | undefined = undefined;
  default_member_permissions: string | undefined = undefined;
  dm_permission: boolean | undefined = undefined;

  setName(name: string): this {
    this.name = name;
    return this;
  }

  setType(type: ContextCommandType) {
    this.type = type;
    return this;
  }

  addNameLocalizations(locals: LocalizationMap): this {
    this.name_localizations = locals;
    Reflect;
    return this;
  }

  setDMPermission(value = true): this {
    this.dm_permission = value;
    return this;
  }

  setDefautlMemberPermissions(permissions: PermissionResolvable[]): this {
    this.default_member_permissions = Permissions.reduce(permissions).bitfield.toString();
    return this;
  }

  toJSON(): RESTPostAPIContextMenuApplicationCommandsJSONBody {
    return { ...this };
  }
}
