import type { APIOverwrite } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { fakePromise } from '../../common/it/utils';
import { PermissionsBitField } from '../../structures/extra/Permissions';
import { GuildRelatedResource } from './default/guild-related';

export class Overwrites extends GuildRelatedResource<any, APIOverwrite[]> {
	namespace = 'overwrite';

	//@ts-expect-error
	filter(data: APIOverwrite[], id: string, guild_id?: string) {
		return true;
	}

	parse(data: any[], _id: string, guild_id: string) {
		data.forEach(x => {
			x.guild_id = guild_id;
		});
		return data;
	}

	raw(id: string): ReturnCache<(APIOverwrite & { guild_id: string })[]> {
		return super.get(id);
	}

	override get(
		id: string,
	): ReturnCache<
		{ type: number; id: string; deny: PermissionsBitField; allow: PermissionsBitField; guildId: string }[] | undefined
	> {
		return fakePromise(super.get(id) as (APIOverwrite & { guild_id: string })[] | undefined).then(rawOverwrites =>
			rawOverwrites
				? rawOverwrites.map(rawOverwrite => ({
						allow: new PermissionsBitField(BigInt(rawOverwrite.allow)),
						deny: new PermissionsBitField(BigInt(rawOverwrite.deny)),
						id: rawOverwrite.id,
						type: rawOverwrite.type,
						guildId: rawOverwrite.guild_id,
					}))
				: undefined,
		);
	}

	override values(
		guild: string,
	): ReturnCache<
		{ type: number; id: string; deny: PermissionsBitField; allow: PermissionsBitField; guildId: string }[][]
	> {
		return fakePromise(super.values(guild) as (APIOverwrite & { guild_id: string })[][]).then(values =>
			values.map(rawOverwrites =>
				rawOverwrites.map(rawOverwrite => ({
					allow: new PermissionsBitField(BigInt(rawOverwrite.allow)),
					deny: new PermissionsBitField(BigInt(rawOverwrite.deny)),
					id: rawOverwrite.id,
					type: rawOverwrite.type,
					guildId: rawOverwrite.guild_id,
				})),
			),
		);
	}

	override bulk(
		ids: string[],
	): ReturnCache<{ type: number; id: string; deny: PermissionsBitField; allow: PermissionsBitField }[][]> {
		return fakePromise(super.bulk(ids) as (APIOverwrite & { guild_id: string })[][]).then(values =>
			values.map(rawOverwrites =>
				rawOverwrites.map(rawOverwrite => ({
					allow: new PermissionsBitField(BigInt(rawOverwrite.allow)),
					deny: new PermissionsBitField(BigInt(rawOverwrite.deny)),
					id: rawOverwrite.id,
					type: rawOverwrite.type,
					guildId: rawOverwrite.guild_id,
				})),
			),
		);
	}
}
