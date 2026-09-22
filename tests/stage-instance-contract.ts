import type { Client, 
	RESTPatchAPIStageInstanceJSONBody,
	RESTPostAPIStageInstanceJSONBody,StageInstancePrivacyLevel, StageInstanceStructure, } from 'seyfert';
import type {
	STAGE_INSTANCE_CREATE,
	STAGE_INSTANCE_DELETE,
	STAGE_INSTANCE_UPDATE,
} from '../lib/events/hooks/stage';

declare function expectType<T>(value: T): void;
declare const instance: StageInstanceStructure;
declare const client: Client;
declare const created: ReturnType<typeof STAGE_INSTANCE_CREATE>;
declare const deleted: ReturnType<typeof STAGE_INSTANCE_DELETE>;
declare const updated: ReturnType<typeof STAGE_INSTANCE_UPDATE>;

expectType<string>(instance.id);
expectType<string>(instance.guildId);
expectType<string>(instance.channelId);
expectType<string>(instance.topic);
expectType<StageInstancePrivacyLevel>(instance.privacyLevel);
expectType<boolean>(instance.isGuildOnly);
expectType<Promise<StageInstanceStructure>>(instance.fetch());
expectType<Promise<StageInstanceStructure>>(instance.fetch(true));
declare const stageChannel: import('seyfert').StageChannelStructure;
expectType<Promise<StageInstanceStructure>>(stageChannel.stage.fetch());
expectType<Promise<StageInstanceStructure>>(stageChannel.stage.fetch(true));
expectType<Promise<StageInstanceStructure>>(stageChannel.stage.create({ topic: 'late show' }));
expectType<Promise<StageInstanceStructure>>(stageChannel.stage.edit({ topic: 'late show' }));
expectType<Promise<undefined>>(stageChannel.stage.delete());
expectType<Promise<StageInstanceStructure>>(instance.edit({ topic: 'late show' }));
expectType<Promise<StageInstanceStructure>>(client.stageInstances.fetch('channel-id'));
expectType<Promise<StageInstanceStructure>>(
	client.stageInstances.create({ channel_id: 'channel-id', topic: 'late show' }),
);
expectType<Promise<StageInstanceStructure>>(client.stageInstances.edit('channel-id', { topic: 'late show' }));
expectType<StageInstanceStructure>(created);
expectType<StageInstanceStructure>(deleted);
updated.then(([stage, old]) => {
	expectType<StageInstanceStructure>(stage);
	expectType<StageInstanceStructure | undefined>(old);
});

const createBody: RESTPostAPIStageInstanceJSONBody = {
	channel_id: 'channel-id',
	topic: 'late show',
	privacy_level: 2,
	send_start_notification: true,
};
expectType<string>(createBody.topic);

const editBody: RESTPatchAPIStageInstanceJSONBody = { topic: 'late show' };
expectType<RESTPatchAPIStageInstanceJSONBody>(editBody);
