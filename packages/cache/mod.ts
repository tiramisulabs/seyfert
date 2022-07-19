import type { Emoji, Session, SymCache } from './deps.ts';
import type { CachedGuild } from './guilds.ts';
import type { CachedUser } from './users.ts';
import type { CachedDMChannel } from './channels.ts';
import { Collection } from './Collection.ts';
import { memberBootstrapper } from './members.ts';
import { userBootstrapper } from './users.ts';
import { channelBootstrapper } from './channels.ts';
import { guildBootstrapper } from './guilds.ts';
import { messageBootstrapper, reactionBootstrapper, reactionBootstrapperDeletions } from './messages.ts';

export const cache_sym = Symbol('@cache');

export interface SessionCache extends SymCache {
    guilds: Collection<CachedGuild>;
    users: Collection<CachedUser>;
    dms: Collection<CachedDMChannel>;
    emojis: Collection<Emoji>;
    session: Session;
}

export function enableCache(session: Session): SessionCache {
    const cache = {
        guilds: new Collection<CachedGuild>(session),
        users: new Collection<CachedUser>(session),
        dms: new Collection<CachedDMChannel>(session),
        emojis: new Collection<Emoji>(session),
        cache: cache_sym,
        session,
    };

    session.on('raw', (data) => {
        // deno-lint-ignore no-explicit-any
        const raw = data.d as any;

        if (!raw) return;

        switch (data.t) {
            // TODO: add more events
            // for now users have to use the bootstrappers that are not implemented yet
            case 'MESSAGE_CREATE':
                messageBootstrapper(cache, raw, false);
                break;
            case 'MESSAGE_UPDATE':
                messageBootstrapper(cache, raw, !raw.edited_timestamp);
                break;
            case 'CHANNEL_CREATE':
                channelBootstrapper(cache, raw);
                break;
            case 'GUILD_MEMBER_ADD':
                memberBootstrapper(cache, raw, raw.guild_id);
                break;
            case 'GUILD_CREATE':
                guildBootstrapper(cache, raw);
                break;
            case 'GUILD_DELETE':
                cache.guilds.delete(raw.id);
                break;
            case 'MESSAGE_REACTION_ADD':
                reactionBootstrapper(cache, raw, false);
                break;
            case 'MESSAGE_REACTION_REMOVE':
                reactionBootstrapper(cache, raw, false);
                break;
            case 'MESSAGE_REACTION_REMOVE_ALL':
                reactionBootstrapperDeletions(cache, raw);
                break;
            case 'READY':
                userBootstrapper(cache, raw.user);
                break;
            default:
                session.emit('debug', `NOT CACHED: ${JSON.stringify(raw)}`);
        }
    });

    return cache;
}

