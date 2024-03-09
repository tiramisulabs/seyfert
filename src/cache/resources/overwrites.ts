import type { APIOverwrite } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { fakePromise } from '../../common/it/utils';
import { PermissionsBitField } from '../../structures/extra/Permissions';
import { GuildRelatedResource } from './default/guild-related';

export class Overwrites extends GuildRelatedResource {
	namespace = 'overwrite';

	parse(data: any, _id: string, _guild_id: string) {
		return data;
	}

	override get(
		id: string,
	): ReturnCache<{ type: number; id: string; deny: PermissionsBitField; allow: PermissionsBitField }[] | undefined> {
		return fakePromise(super.get(id) as APIOverwrite[] | undefined).then(rawOverwrites =>
			rawOverwrites
				? rawOverwrites.map(rawOverwrite => ({
						allow: new PermissionsBitField(BigInt(rawOverwrite.allow)),
						deny: new PermissionsBitField(BigInt(rawOverwrite.deny)),
						id: rawOverwrite.id,
						type: rawOverwrite.type,
				  }))
				: undefined,
		);
	}

	override values(
		guild: string,
	): ReturnCache<{ type: number; id: string; deny: PermissionsBitField; allow: PermissionsBitField }[][]> {
		return fakePromise(super.values(guild) as APIOverwrite[][]).then(values =>
			values.map(rawOverwrites =>
				rawOverwrites.map(rawOverwrite => ({
					allow: new PermissionsBitField(BigInt(rawOverwrite.allow)),
					deny: new PermissionsBitField(BigInt(rawOverwrite.deny)),
					id: rawOverwrite.id,
					type: rawOverwrite.type,
				})),
			),
		);
	}

	override bulk(
		ids: string[],
	): ReturnCache<{ type: number; id: string; deny: PermissionsBitField; allow: PermissionsBitField }[][]> {
		return fakePromise(super.bulk(ids) as APIOverwrite[][]).then(values =>
			values.map(rawOverwrites =>
				rawOverwrites.map(rawOverwrite => ({
					allow: new PermissionsBitField(BigInt(rawOverwrite.allow)),
					deny: new PermissionsBitField(BigInt(rawOverwrite.deny)),
					id: rawOverwrite.id,
					type: rawOverwrite.type,
				})),
			),
		);
	}
}
