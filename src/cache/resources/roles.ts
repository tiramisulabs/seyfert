import type { APIRole } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { GuildRelatedResource } from './default/guild-related';
import { type GuildRoleStructure, Transformers } from '../../client/transformers';

export class Roles extends GuildRelatedResource<any, APIRole> {
	namespace = 'role';

	//@ts-expect-error
	filter(data: APIRole, id: string, guild_id?: string) {
		return true;
	}

	raw(id: string): ReturnCache<APIRole | undefined> {
		return super.get(id);
	}

	override get(id: string): ReturnCache<GuildRoleStructure | undefined> {
		return fakePromise(super.get(id)).then(rawRole =>
			rawRole ? Transformers.GuildRole(this.client, rawRole, rawRole.guild_id) : undefined,
		);
	}

	override bulk(ids: string[]): ReturnCache<GuildRoleStructure[]> {
		return fakePromise(super.bulk(ids)).then(roles =>
			roles.map(rawRole => Transformers.GuildRole(this.client, rawRole, rawRole.guild_id)),
		);
	}

	override values(guild: string): ReturnCache<GuildRoleStructure[]> {
		return fakePromise(super.values(guild)).then(roles =>
			roles.map(rawRole => Transformers.GuildRole(this.client, rawRole, rawRole.guild_id)),
		);
	}

	valuesRaw(guild: string): ReturnCache<APIRole[]> {
		return super.values(guild);
	}
}
