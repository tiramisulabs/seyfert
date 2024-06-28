import { type APIPollMedia, type RESTAPIPollCreate } from 'discord-api-types/v10';
import type { DeepPartial, EmojiResolvable, RestOrArray } from '../common';
export declare class PollBuilder {
    data: DeepPartial<RESTAPIPollCreate>;
    constructor(data?: DeepPartial<RESTAPIPollCreate>);
    addAnswers(...answers: RestOrArray<PollMedia>): this;
    setAnswers(...answers: RestOrArray<PollMedia>): this;
    setQuestion(data: PollMedia): this;
    setDuration(hours: number): this;
    allowMultiselect(value?: boolean): this;
    toJSON(): RESTAPIPollCreate;
    private resolvedPollMedia;
}
export type PollMedia = Omit<APIPollMedia, 'emoji'> & {
    emoji?: EmojiResolvable;
};
