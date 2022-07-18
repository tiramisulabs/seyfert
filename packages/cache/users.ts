import type { DiscordUser } from './deps.ts';
import type { SessionCache } from './mod.ts';
import { User } from './deps.ts';

export type CachedUser = User;

export function userBootstrapper(cache: SessionCache, user: DiscordUser) {
    cache.users.set(user.id, new User(cache.session, user));
}
