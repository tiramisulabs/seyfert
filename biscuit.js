// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function calculateTotalShards(gateway) {
    if (gateway.manager.totalShards < 100) return gateway.manager.totalShards;
    return Math.ceil(gateway.manager.totalShards / (gateway.gatewayBot.sessionStartLimit.maxConcurrency === 1 ? 16 : gateway.gatewayBot.sessionStartLimit.maxConcurrency)) * gateway.gatewayBot.sessionStartLimit.maxConcurrency;
}
function calculateWorkerId(manager, shardId) {
    let workerId = Math.floor(shardId / manager.shardsPerWorker);
    if (workerId >= manager.totalWorkers) {
        workerId = manager.totalWorkers - 1;
    }
    return workerId;
}
function spawnShards(gateway) {
    gateway.prepareBuckets();
    gateway.buckets.forEach((bucket, bucketId)=>{
        for (const worker of bucket.workers){
            for (const shardId of worker.queue){
                gateway.tellWorkerToIdentify(worker.id, shardId, bucketId).catch(console.error);
            }
        }
    });
}
function delay(ms) {
    return new Promise((res)=>setTimeout(()=>{
            res();
        }, ms));
}
function createLeakyBucket({ max , refillInterval , refillAmount , tokens , waiting , ...rest }) {
    return {
        max,
        refillInterval,
        refillAmount: refillAmount > max ? max : refillAmount,
        lastRefill: performance.now(),
        allowAcquire: true,
        nextRefill: function() {
            return nextRefill(this);
        },
        tokens: function() {
            return updateTokens(this);
        },
        acquire: async function(amount, highPriority) {
            return await acquire(this, amount, highPriority);
        },
        tokensState: tokens ?? max,
        waiting: waiting ?? [],
        ...rest
    };
}
function updateTokens(bucket) {
    const timePassed = performance.now() - bucket.lastRefill;
    const missedRefills = Math.floor(timePassed / bucket.refillInterval);
    bucket.tokensState = Math.min(bucket.tokensState + bucket.refillAmount * missedRefills, bucket.max);
    bucket.lastRefill += bucket.refillInterval * missedRefills;
    return bucket.tokensState;
}
function nextRefill(bucket) {
    updateTokens(bucket);
    return performance.now() - bucket.lastRefill + bucket.refillInterval;
}
async function acquire(bucket, amount, highPriority = false) {
    if (!bucket.allowAcquire) {
        await new Promise((resolve)=>{
            if (highPriority) {
                bucket.waiting.unshift(resolve);
            } else {
                bucket.waiting.push(resolve);
            }
        });
        if (!bucket.allowAcquire) {
            return await acquire(bucket, amount);
        }
    }
    bucket.allowAcquire = false;
    let currentTokens = updateTokens(bucket);
    if (currentTokens < amount) {
        const tokensNeeded = amount - currentTokens;
        let refillsNeeded = Math.ceil(tokensNeeded / bucket.refillAmount);
        const waitTime = bucket.refillInterval * refillsNeeded;
        await delay(waitTime);
        updateTokens(bucket);
    }
    const toSubtract = amount % bucket.refillAmount || amount;
    bucket.tokensState -= toSubtract;
    bucket.allowAcquire = true;
    bucket.waiting.shift()?.();
}
function prepareBuckets(gateway) {
    for(let i = 0; i < gateway.gatewayBot.sessionStartLimit.maxConcurrency; ++i){
        gateway.buckets.set(i, {
            workers: [],
            leak: createLeakyBucket({
                max: 1,
                refillAmount: 1,
                refillInterval: gateway.spawnShardDelay
            })
        });
    }
    for(let shardId = gateway.firstShardId; shardId <= gateway.lastShardId; ++shardId){
        if (shardId >= gateway.manager.totalShards) {
            throw new Error(`Shard (id: ${shardId}) is bigger or equal to the used amount of used shards which is ${gateway.manager.totalShards}`);
        }
        const bucketId = shardId % gateway.gatewayBot.sessionStartLimit.maxConcurrency;
        const bucket = gateway.buckets.get(bucketId);
        if (!bucket) {
            throw new Error(`Shard (id: ${shardId}) got assigned to an illegal bucket id: ${bucketId}, expected a bucket id between 0 and ${gateway.gatewayBot.sessionStartLimit.maxConcurrency - 1}`);
        }
        const workerId = gateway.calculateWorkerId(shardId);
        const worker = bucket.workers.find((w)=>w.id === workerId);
        if (worker) {
            worker.queue.push(shardId);
        } else {
            bucket.workers.push({
                id: workerId,
                queue: [
                    shardId
                ]
            });
        }
    }
}
async function tellWorkerToIdentify(gateway, _workerId, shardId, _bucketId) {
    return await gateway.manager.identify(shardId);
}
var PremiumTypes;
(function(PremiumTypes) {
    PremiumTypes[PremiumTypes["None"] = 0] = "None";
    PremiumTypes[PremiumTypes["NitroClassic"] = 1] = "NitroClassic";
    PremiumTypes[PremiumTypes["Nitro"] = 2] = "Nitro";
})(PremiumTypes || (PremiumTypes = {}));
var UserFlags;
(function(UserFlags) {
    UserFlags[UserFlags["DiscordEmployee"] = 1] = "DiscordEmployee";
    UserFlags[UserFlags["PartneredServerOwner"] = 2] = "PartneredServerOwner";
    UserFlags[UserFlags["HypeSquadEventsMember"] = 4] = "HypeSquadEventsMember";
    UserFlags[UserFlags["BugHunterLevel1"] = 8] = "BugHunterLevel1";
    UserFlags[UserFlags["HouseBravery"] = 64] = "HouseBravery";
    UserFlags[UserFlags["HouseBrilliance"] = 128] = "HouseBrilliance";
    UserFlags[UserFlags["HouseBalance"] = 256] = "HouseBalance";
    UserFlags[UserFlags["EarlySupporter"] = 512] = "EarlySupporter";
    UserFlags[UserFlags["TeamUser"] = 1024] = "TeamUser";
    UserFlags[UserFlags["BugHunterLevel2"] = 16384] = "BugHunterLevel2";
    UserFlags[UserFlags["VerifiedBot"] = 65536] = "VerifiedBot";
    UserFlags[UserFlags["EarlyVerifiedBotDeveloper"] = 131072] = "EarlyVerifiedBotDeveloper";
    UserFlags[UserFlags["DiscordCertifiedModerator"] = 262144] = "DiscordCertifiedModerator";
    UserFlags[UserFlags["BotHttpInteractions"] = 524288] = "BotHttpInteractions";
})(UserFlags || (UserFlags = {}));
var ChannelFlags;
(function(ChannelFlags) {
    ChannelFlags[ChannelFlags["None"] = 0] = "None";
    ChannelFlags[ChannelFlags["Pinned"] = 2] = "Pinned";
})(ChannelFlags || (ChannelFlags = {}));
var IntegrationExpireBehaviors;
(function(IntegrationExpireBehaviors) {
    IntegrationExpireBehaviors[IntegrationExpireBehaviors["RemoveRole"] = 0] = "RemoveRole";
    IntegrationExpireBehaviors[IntegrationExpireBehaviors["Kick"] = 1] = "Kick";
})(IntegrationExpireBehaviors || (IntegrationExpireBehaviors = {}));
var VisibilityTypes;
(function(VisibilityTypes) {
    VisibilityTypes[VisibilityTypes["None"] = 0] = "None";
    VisibilityTypes[VisibilityTypes["Everyone"] = 1] = "Everyone";
})(VisibilityTypes || (VisibilityTypes = {}));
var TeamMembershipStates;
(function(TeamMembershipStates) {
    TeamMembershipStates[TeamMembershipStates["Invited"] = 1] = "Invited";
    TeamMembershipStates[TeamMembershipStates["Accepted"] = 2] = "Accepted";
})(TeamMembershipStates || (TeamMembershipStates = {}));
var ApplicationFlags;
(function(ApplicationFlags) {
    ApplicationFlags[ApplicationFlags["GatewayPresence"] = 4096] = "GatewayPresence";
    ApplicationFlags[ApplicationFlags["GatewayPresenceLimited"] = 8192] = "GatewayPresenceLimited";
    ApplicationFlags[ApplicationFlags["GatewayGuildMembers"] = 16384] = "GatewayGuildMembers";
    ApplicationFlags[ApplicationFlags["GatewayGuildMembersLimited"] = 32768] = "GatewayGuildMembersLimited";
    ApplicationFlags[ApplicationFlags["VerificationPendingGuildLimit"] = 65536] = "VerificationPendingGuildLimit";
    ApplicationFlags[ApplicationFlags["Embedded"] = 131072] = "Embedded";
    ApplicationFlags[ApplicationFlags["GatewayMessageCount"] = 262144] = "GatewayMessageCount";
    ApplicationFlags[ApplicationFlags["GatewayMessageContentLimited"] = 524288] = "GatewayMessageContentLimited";
})(ApplicationFlags || (ApplicationFlags = {}));
var MessageComponentTypes;
(function(MessageComponentTypes) {
    MessageComponentTypes[MessageComponentTypes["ActionRow"] = 1] = "ActionRow";
    MessageComponentTypes[MessageComponentTypes["Button"] = 2] = "Button";
    MessageComponentTypes[MessageComponentTypes["SelectMenu"] = 3] = "SelectMenu";
    MessageComponentTypes[MessageComponentTypes["InputText"] = 4] = "InputText";
})(MessageComponentTypes || (MessageComponentTypes = {}));
var TextStyles;
(function(TextStyles) {
    TextStyles[TextStyles["Short"] = 1] = "Short";
    TextStyles[TextStyles["Paragraph"] = 2] = "Paragraph";
})(TextStyles || (TextStyles = {}));
var ButtonStyles;
(function(ButtonStyles) {
    ButtonStyles[ButtonStyles["Primary"] = 1] = "Primary";
    ButtonStyles[ButtonStyles["Secondary"] = 2] = "Secondary";
    ButtonStyles[ButtonStyles["Success"] = 3] = "Success";
    ButtonStyles[ButtonStyles["Danger"] = 4] = "Danger";
    ButtonStyles[ButtonStyles["Link"] = 5] = "Link";
})(ButtonStyles || (ButtonStyles = {}));
var AllowedMentionsTypes;
(function(AllowedMentionsTypes) {
    AllowedMentionsTypes["RoleMentions"] = "roles";
    AllowedMentionsTypes["UserMentions"] = "users";
    AllowedMentionsTypes["EveryoneMentions"] = "everyone";
})(AllowedMentionsTypes || (AllowedMentionsTypes = {}));
var WebhookTypes;
(function(WebhookTypes) {
    WebhookTypes[WebhookTypes["Incoming"] = 1] = "Incoming";
    WebhookTypes[WebhookTypes["ChannelFollower"] = 2] = "ChannelFollower";
    WebhookTypes[WebhookTypes["Application"] = 3] = "Application";
})(WebhookTypes || (WebhookTypes = {}));
var DefaultMessageNotificationLevels;
(function(DefaultMessageNotificationLevels) {
    DefaultMessageNotificationLevels[DefaultMessageNotificationLevels["AllMessages"] = 0] = "AllMessages";
    DefaultMessageNotificationLevels[DefaultMessageNotificationLevels["OnlyMentions"] = 1] = "OnlyMentions";
})(DefaultMessageNotificationLevels || (DefaultMessageNotificationLevels = {}));
var ExplicitContentFilterLevels;
(function(ExplicitContentFilterLevels) {
    ExplicitContentFilterLevels[ExplicitContentFilterLevels["Disabled"] = 0] = "Disabled";
    ExplicitContentFilterLevels[ExplicitContentFilterLevels["MembersWithoutRoles"] = 1] = "MembersWithoutRoles";
    ExplicitContentFilterLevels[ExplicitContentFilterLevels["AllMembers"] = 2] = "AllMembers";
})(ExplicitContentFilterLevels || (ExplicitContentFilterLevels = {}));
var VerificationLevels;
(function(VerificationLevels) {
    VerificationLevels[VerificationLevels["None"] = 0] = "None";
    VerificationLevels[VerificationLevels["Low"] = 1] = "Low";
    VerificationLevels[VerificationLevels["Medium"] = 2] = "Medium";
    VerificationLevels[VerificationLevels["High"] = 3] = "High";
    VerificationLevels[VerificationLevels["VeryHigh"] = 4] = "VeryHigh";
})(VerificationLevels || (VerificationLevels = {}));
var GuildFeatures;
(function(GuildFeatures) {
    GuildFeatures["InviteSplash"] = "INVITE_SPLASH";
    GuildFeatures["VipRegions"] = "VIP_REGIONS";
    GuildFeatures["VanityUrl"] = "VANITY_URL";
    GuildFeatures["Verified"] = "VERIFIED";
    GuildFeatures["Partnered"] = "PARTNERED";
    GuildFeatures["Community"] = "COMMUNITY";
    GuildFeatures["Commerce"] = "COMMERCE";
    GuildFeatures["News"] = "NEWS";
    GuildFeatures["Discoverable"] = "DISCOVERABLE";
    GuildFeatures["DiscoverableDisabled"] = "DISCOVERABLE_DISABLED";
    GuildFeatures["Feature"] = "FEATURABLE";
    GuildFeatures["AnimatedIcon"] = "ANIMATED_ICON";
    GuildFeatures["Banner"] = "BANNER";
    GuildFeatures["WelcomeScreenEnabled"] = "WELCOME_SCREEN_ENABLED";
    GuildFeatures["MemberVerificationGateEnabled"] = "MEMBER_VERIFICATION_GATE_ENABLED";
    GuildFeatures["PreviewEnabled"] = "PREVIEW_ENABLED";
    GuildFeatures["TicketedEventsEnabled"] = "TICKETED_EVENTS_ENABLED";
    GuildFeatures["MonetizationEnabled"] = "MONETIZATION_ENABLED";
    GuildFeatures["MoreStickers"] = "MORE_STICKERS";
    GuildFeatures["PrivateThreads"] = "PRIVATE_THREADS";
    GuildFeatures["RoleIcons"] = "ROLE_ICONS";
    GuildFeatures["AutoModeration"] = "AUTO_MODERATION";
})(GuildFeatures || (GuildFeatures = {}));
var MfaLevels;
(function(MfaLevels) {
    MfaLevels[MfaLevels["None"] = 0] = "None";
    MfaLevels[MfaLevels["Elevated"] = 1] = "Elevated";
})(MfaLevels || (MfaLevels = {}));
var SystemChannelFlags;
(function(SystemChannelFlags) {
    SystemChannelFlags[SystemChannelFlags["SuppressJoinNotifications"] = 1] = "SuppressJoinNotifications";
    SystemChannelFlags[SystemChannelFlags["SuppressPremiumSubscriptions"] = 2] = "SuppressPremiumSubscriptions";
    SystemChannelFlags[SystemChannelFlags["SuppressGuildReminderNotifications"] = 4] = "SuppressGuildReminderNotifications";
    SystemChannelFlags[SystemChannelFlags["SuppressJoinNotificationReplies"] = 8] = "SuppressJoinNotificationReplies";
})(SystemChannelFlags || (SystemChannelFlags = {}));
var PremiumTiers;
(function(PremiumTiers) {
    PremiumTiers[PremiumTiers["None"] = 0] = "None";
    PremiumTiers[PremiumTiers["Tier1"] = 1] = "Tier1";
    PremiumTiers[PremiumTiers["Tier2"] = 2] = "Tier2";
    PremiumTiers[PremiumTiers["Tier3"] = 3] = "Tier3";
})(PremiumTiers || (PremiumTiers = {}));
var GuildNsfwLevel;
(function(GuildNsfwLevel) {
    GuildNsfwLevel[GuildNsfwLevel["Default"] = 0] = "Default";
    GuildNsfwLevel[GuildNsfwLevel["Explicit"] = 1] = "Explicit";
    GuildNsfwLevel[GuildNsfwLevel["Safe"] = 2] = "Safe";
    GuildNsfwLevel[GuildNsfwLevel["AgeRestricted"] = 3] = "AgeRestricted";
})(GuildNsfwLevel || (GuildNsfwLevel = {}));
var ChannelTypes;
(function(ChannelTypes) {
    ChannelTypes[ChannelTypes["GuildText"] = 0] = "GuildText";
    ChannelTypes[ChannelTypes["DM"] = 1] = "DM";
    ChannelTypes[ChannelTypes["GuildVoice"] = 2] = "GuildVoice";
    ChannelTypes[ChannelTypes["GroupDm"] = 3] = "GroupDm";
    ChannelTypes[ChannelTypes["GuildCategory"] = 4] = "GuildCategory";
    ChannelTypes[ChannelTypes["GuildNews"] = 5] = "GuildNews";
    ChannelTypes[ChannelTypes["GuildNewsThread"] = 10] = "GuildNewsThread";
    ChannelTypes[ChannelTypes["GuildPublicThread"] = 11] = "GuildPublicThread";
    ChannelTypes[ChannelTypes["GuildPrivateThread"] = 12] = "GuildPrivateThread";
    ChannelTypes[ChannelTypes["GuildStageVoice"] = 13] = "GuildStageVoice";
    ChannelTypes[ChannelTypes["GuildDirectory"] = 14] = "GuildDirectory";
    ChannelTypes[ChannelTypes["GuildForum"] = 15] = "GuildForum";
})(ChannelTypes || (ChannelTypes = {}));
var OverwriteTypes;
(function(OverwriteTypes) {
    OverwriteTypes[OverwriteTypes["Role"] = 0] = "Role";
    OverwriteTypes[OverwriteTypes["Member"] = 1] = "Member";
})(OverwriteTypes || (OverwriteTypes = {}));
var VideoQualityModes;
(function(VideoQualityModes) {
    VideoQualityModes[VideoQualityModes["Auto"] = 1] = "Auto";
    VideoQualityModes[VideoQualityModes["Full"] = 2] = "Full";
})(VideoQualityModes || (VideoQualityModes = {}));
var ActivityTypes;
(function(ActivityTypes) {
    ActivityTypes[ActivityTypes["Game"] = 0] = "Game";
    ActivityTypes[ActivityTypes["Streaming"] = 1] = "Streaming";
    ActivityTypes[ActivityTypes["Listening"] = 2] = "Listening";
    ActivityTypes[ActivityTypes["Watching"] = 3] = "Watching";
    ActivityTypes[ActivityTypes["Custom"] = 4] = "Custom";
    ActivityTypes[ActivityTypes["Competing"] = 5] = "Competing";
})(ActivityTypes || (ActivityTypes = {}));
var MessageTypes;
(function(MessageTypes) {
    MessageTypes[MessageTypes["Default"] = 0] = "Default";
    MessageTypes[MessageTypes["RecipientAdd"] = 1] = "RecipientAdd";
    MessageTypes[MessageTypes["RecipientRemove"] = 2] = "RecipientRemove";
    MessageTypes[MessageTypes["Call"] = 3] = "Call";
    MessageTypes[MessageTypes["ChannelNameChange"] = 4] = "ChannelNameChange";
    MessageTypes[MessageTypes["ChannelIconChange"] = 5] = "ChannelIconChange";
    MessageTypes[MessageTypes["ChannelPinnedMessage"] = 6] = "ChannelPinnedMessage";
    MessageTypes[MessageTypes["GuildMemberJoin"] = 7] = "GuildMemberJoin";
    MessageTypes[MessageTypes["UserPremiumGuildSubscription"] = 8] = "UserPremiumGuildSubscription";
    MessageTypes[MessageTypes["UserPremiumGuildSubscriptionTier1"] = 9] = "UserPremiumGuildSubscriptionTier1";
    MessageTypes[MessageTypes["UserPremiumGuildSubscriptionTier2"] = 10] = "UserPremiumGuildSubscriptionTier2";
    MessageTypes[MessageTypes["UserPremiumGuildSubscriptionTier3"] = 11] = "UserPremiumGuildSubscriptionTier3";
    MessageTypes[MessageTypes["ChannelFollowAdd"] = 12] = "ChannelFollowAdd";
    MessageTypes[MessageTypes["GuildDiscoveryDisqualified"] = 14] = "GuildDiscoveryDisqualified";
    MessageTypes[MessageTypes["GuildDiscoveryRequalified"] = 15] = "GuildDiscoveryRequalified";
    MessageTypes[MessageTypes["GuildDiscoveryGracePeriodInitialWarning"] = 16] = "GuildDiscoveryGracePeriodInitialWarning";
    MessageTypes[MessageTypes["GuildDiscoveryGracePeriodFinalWarning"] = 17] = "GuildDiscoveryGracePeriodFinalWarning";
    MessageTypes[MessageTypes["ThreadCreated"] = 18] = "ThreadCreated";
    MessageTypes[MessageTypes["Reply"] = 19] = "Reply";
    MessageTypes[MessageTypes["ChatInputCommand"] = 20] = "ChatInputCommand";
    MessageTypes[MessageTypes["ThreadStarterMessage"] = 21] = "ThreadStarterMessage";
    MessageTypes[MessageTypes["GuildInviteReminder"] = 22] = "GuildInviteReminder";
    MessageTypes[MessageTypes["ContextMenuCommand"] = 23] = "ContextMenuCommand";
    MessageTypes[MessageTypes["AutoModerationAction"] = 24] = "AutoModerationAction";
})(MessageTypes || (MessageTypes = {}));
var MessageActivityTypes;
(function(MessageActivityTypes) {
    MessageActivityTypes[MessageActivityTypes["Join"] = 1] = "Join";
    MessageActivityTypes[MessageActivityTypes["Spectate"] = 2] = "Spectate";
    MessageActivityTypes[MessageActivityTypes["Listen"] = 3] = "Listen";
    MessageActivityTypes[MessageActivityTypes["JoinRequest"] = 4] = "JoinRequest";
})(MessageActivityTypes || (MessageActivityTypes = {}));
var StickerTypes;
(function(StickerTypes) {
    StickerTypes[StickerTypes["Standard"] = 1] = "Standard";
    StickerTypes[StickerTypes["Guild"] = 2] = "Guild";
})(StickerTypes || (StickerTypes = {}));
var StickerFormatTypes;
(function(StickerFormatTypes) {
    StickerFormatTypes[StickerFormatTypes["Png"] = 1] = "Png";
    StickerFormatTypes[StickerFormatTypes["APng"] = 2] = "APng";
    StickerFormatTypes[StickerFormatTypes["Lottie"] = 3] = "Lottie";
})(StickerFormatTypes || (StickerFormatTypes = {}));
var InteractionTypes;
(function(InteractionTypes) {
    InteractionTypes[InteractionTypes["Ping"] = 1] = "Ping";
    InteractionTypes[InteractionTypes["ApplicationCommand"] = 2] = "ApplicationCommand";
    InteractionTypes[InteractionTypes["MessageComponent"] = 3] = "MessageComponent";
    InteractionTypes[InteractionTypes["ApplicationCommandAutocomplete"] = 4] = "ApplicationCommandAutocomplete";
    InteractionTypes[InteractionTypes["ModalSubmit"] = 5] = "ModalSubmit";
})(InteractionTypes || (InteractionTypes = {}));
var ApplicationCommandOptionTypes;
(function(ApplicationCommandOptionTypes) {
    ApplicationCommandOptionTypes[ApplicationCommandOptionTypes["SubCommand"] = 1] = "SubCommand";
    ApplicationCommandOptionTypes[ApplicationCommandOptionTypes["SubCommandGroup"] = 2] = "SubCommandGroup";
    ApplicationCommandOptionTypes[ApplicationCommandOptionTypes["String"] = 3] = "String";
    ApplicationCommandOptionTypes[ApplicationCommandOptionTypes["Integer"] = 4] = "Integer";
    ApplicationCommandOptionTypes[ApplicationCommandOptionTypes["Boolean"] = 5] = "Boolean";
    ApplicationCommandOptionTypes[ApplicationCommandOptionTypes["User"] = 6] = "User";
    ApplicationCommandOptionTypes[ApplicationCommandOptionTypes["Channel"] = 7] = "Channel";
    ApplicationCommandOptionTypes[ApplicationCommandOptionTypes["Role"] = 8] = "Role";
    ApplicationCommandOptionTypes[ApplicationCommandOptionTypes["Mentionable"] = 9] = "Mentionable";
    ApplicationCommandOptionTypes[ApplicationCommandOptionTypes["Number"] = 10] = "Number";
    ApplicationCommandOptionTypes[ApplicationCommandOptionTypes["Attachment"] = 11] = "Attachment";
})(ApplicationCommandOptionTypes || (ApplicationCommandOptionTypes = {}));
var AuditLogEvents;
(function(AuditLogEvents) {
    AuditLogEvents[AuditLogEvents["GuildUpdate"] = 1] = "GuildUpdate";
    AuditLogEvents[AuditLogEvents["ChannelCreate"] = 10] = "ChannelCreate";
    AuditLogEvents[AuditLogEvents["ChannelUpdate"] = 11] = "ChannelUpdate";
    AuditLogEvents[AuditLogEvents["ChannelDelete"] = 12] = "ChannelDelete";
    AuditLogEvents[AuditLogEvents["ChannelOverwriteCreate"] = 13] = "ChannelOverwriteCreate";
    AuditLogEvents[AuditLogEvents["ChannelOverwriteUpdate"] = 14] = "ChannelOverwriteUpdate";
    AuditLogEvents[AuditLogEvents["ChannelOverwriteDelete"] = 15] = "ChannelOverwriteDelete";
    AuditLogEvents[AuditLogEvents["MemberKick"] = 20] = "MemberKick";
    AuditLogEvents[AuditLogEvents["MemberPrune"] = 21] = "MemberPrune";
    AuditLogEvents[AuditLogEvents["MemberBanAdd"] = 22] = "MemberBanAdd";
    AuditLogEvents[AuditLogEvents["MemberBanRemove"] = 23] = "MemberBanRemove";
    AuditLogEvents[AuditLogEvents["MemberUpdate"] = 24] = "MemberUpdate";
    AuditLogEvents[AuditLogEvents["MemberRoleUpdate"] = 25] = "MemberRoleUpdate";
    AuditLogEvents[AuditLogEvents["MemberMove"] = 26] = "MemberMove";
    AuditLogEvents[AuditLogEvents["MemberDisconnect"] = 27] = "MemberDisconnect";
    AuditLogEvents[AuditLogEvents["BotAdd"] = 28] = "BotAdd";
    AuditLogEvents[AuditLogEvents["RoleCreate"] = 30] = "RoleCreate";
    AuditLogEvents[AuditLogEvents["RoleUpdate"] = 31] = "RoleUpdate";
    AuditLogEvents[AuditLogEvents["RoleDelete"] = 32] = "RoleDelete";
    AuditLogEvents[AuditLogEvents["InviteCreate"] = 40] = "InviteCreate";
    AuditLogEvents[AuditLogEvents["InviteUpdate"] = 41] = "InviteUpdate";
    AuditLogEvents[AuditLogEvents["InviteDelete"] = 42] = "InviteDelete";
    AuditLogEvents[AuditLogEvents["WebhookCreate"] = 50] = "WebhookCreate";
    AuditLogEvents[AuditLogEvents["WebhookUpdate"] = 51] = "WebhookUpdate";
    AuditLogEvents[AuditLogEvents["WebhookDelete"] = 52] = "WebhookDelete";
    AuditLogEvents[AuditLogEvents["EmojiCreate"] = 60] = "EmojiCreate";
    AuditLogEvents[AuditLogEvents["EmojiUpdate"] = 61] = "EmojiUpdate";
    AuditLogEvents[AuditLogEvents["EmojiDelete"] = 62] = "EmojiDelete";
    AuditLogEvents[AuditLogEvents["MessageDelete"] = 72] = "MessageDelete";
    AuditLogEvents[AuditLogEvents["MessageBulkDelete"] = 73] = "MessageBulkDelete";
    AuditLogEvents[AuditLogEvents["MessagePin"] = 74] = "MessagePin";
    AuditLogEvents[AuditLogEvents["MessageUnpin"] = 75] = "MessageUnpin";
    AuditLogEvents[AuditLogEvents["IntegrationCreate"] = 80] = "IntegrationCreate";
    AuditLogEvents[AuditLogEvents["IntegrationUpdate"] = 81] = "IntegrationUpdate";
    AuditLogEvents[AuditLogEvents["IntegrationDelete"] = 82] = "IntegrationDelete";
    AuditLogEvents[AuditLogEvents["StageInstanceCreate"] = 83] = "StageInstanceCreate";
    AuditLogEvents[AuditLogEvents["StageInstanceUpdate"] = 84] = "StageInstanceUpdate";
    AuditLogEvents[AuditLogEvents["StageInstanceDelete"] = 85] = "StageInstanceDelete";
    AuditLogEvents[AuditLogEvents["StickerCreate"] = 90] = "StickerCreate";
    AuditLogEvents[AuditLogEvents["StickerUpdate"] = 91] = "StickerUpdate";
    AuditLogEvents[AuditLogEvents["StickerDelete"] = 92] = "StickerDelete";
    AuditLogEvents[AuditLogEvents["GuildScheduledEventCreate"] = 100] = "GuildScheduledEventCreate";
    AuditLogEvents[AuditLogEvents["GuildScheduledEventUpdate"] = 101] = "GuildScheduledEventUpdate";
    AuditLogEvents[AuditLogEvents["GuildScheduledEventDelete"] = 102] = "GuildScheduledEventDelete";
    AuditLogEvents[AuditLogEvents["ThreadCreate"] = 110] = "ThreadCreate";
    AuditLogEvents[AuditLogEvents["ThreadUpdate"] = 111] = "ThreadUpdate";
    AuditLogEvents[AuditLogEvents["ThreadDelete"] = 112] = "ThreadDelete";
    AuditLogEvents[AuditLogEvents["ApplicationCommandPermissionUpdate"] = 121] = "ApplicationCommandPermissionUpdate";
    AuditLogEvents[AuditLogEvents["AutoModerationRuleCreate"] = 140] = "AutoModerationRuleCreate";
    AuditLogEvents[AuditLogEvents["AutoModerationRuleUpdate"] = 141] = "AutoModerationRuleUpdate";
    AuditLogEvents[AuditLogEvents["AutoModerationRuleDelete"] = 142] = "AutoModerationRuleDelete";
    AuditLogEvents[AuditLogEvents["AutoModerationBlockMessage"] = 143] = "AutoModerationBlockMessage";
})(AuditLogEvents || (AuditLogEvents = {}));
var ScheduledEventPrivacyLevel;
(function(ScheduledEventPrivacyLevel) {
    ScheduledEventPrivacyLevel[ScheduledEventPrivacyLevel["GuildOnly"] = 2] = "GuildOnly";
})(ScheduledEventPrivacyLevel || (ScheduledEventPrivacyLevel = {}));
var ScheduledEventEntityType;
(function(ScheduledEventEntityType) {
    ScheduledEventEntityType[ScheduledEventEntityType["StageInstance"] = 1] = "StageInstance";
    ScheduledEventEntityType[ScheduledEventEntityType["Voice"] = 2] = "Voice";
    ScheduledEventEntityType[ScheduledEventEntityType["External"] = 3] = "External";
})(ScheduledEventEntityType || (ScheduledEventEntityType = {}));
var ScheduledEventStatus;
(function(ScheduledEventStatus) {
    ScheduledEventStatus[ScheduledEventStatus["Scheduled"] = 1] = "Scheduled";
    ScheduledEventStatus[ScheduledEventStatus["Active"] = 2] = "Active";
    ScheduledEventStatus[ScheduledEventStatus["Completed"] = 3] = "Completed";
    ScheduledEventStatus[ScheduledEventStatus["Canceled"] = 4] = "Canceled";
})(ScheduledEventStatus || (ScheduledEventStatus = {}));
var TargetTypes;
(function(TargetTypes) {
    TargetTypes[TargetTypes["Stream"] = 1] = "Stream";
    TargetTypes[TargetTypes["EmbeddedApplication"] = 2] = "EmbeddedApplication";
})(TargetTypes || (TargetTypes = {}));
var ApplicationCommandTypes;
(function(ApplicationCommandTypes) {
    ApplicationCommandTypes[ApplicationCommandTypes["ChatInput"] = 1] = "ChatInput";
    ApplicationCommandTypes[ApplicationCommandTypes["User"] = 2] = "User";
    ApplicationCommandTypes[ApplicationCommandTypes["Message"] = 3] = "Message";
})(ApplicationCommandTypes || (ApplicationCommandTypes = {}));
var ApplicationCommandPermissionTypes;
(function(ApplicationCommandPermissionTypes) {
    ApplicationCommandPermissionTypes[ApplicationCommandPermissionTypes["Role"] = 1] = "Role";
    ApplicationCommandPermissionTypes[ApplicationCommandPermissionTypes["User"] = 2] = "User";
    ApplicationCommandPermissionTypes[ApplicationCommandPermissionTypes["Channel"] = 3] = "Channel";
})(ApplicationCommandPermissionTypes || (ApplicationCommandPermissionTypes = {}));
var ActivityFlags;
(function(ActivityFlags) {
    ActivityFlags[ActivityFlags["Instance"] = 1] = "Instance";
    ActivityFlags[ActivityFlags["Join"] = 2] = "Join";
    ActivityFlags[ActivityFlags["Spectate"] = 4] = "Spectate";
    ActivityFlags[ActivityFlags["JoinRequest"] = 8] = "JoinRequest";
    ActivityFlags[ActivityFlags["Sync"] = 16] = "Sync";
    ActivityFlags[ActivityFlags["Play"] = 32] = "Play";
    ActivityFlags[ActivityFlags["PartyPrivacyFriends"] = 64] = "PartyPrivacyFriends";
    ActivityFlags[ActivityFlags["PartyPrivacyVoiceChannel"] = 128] = "PartyPrivacyVoiceChannel";
    ActivityFlags[ActivityFlags["Embedded"] = 256] = "Embedded";
})(ActivityFlags || (ActivityFlags = {}));
var BitwisePermissionFlags;
(function(BitwisePermissionFlags) {
    BitwisePermissionFlags[BitwisePermissionFlags["CREATE_INSTANT_INVITE"] = 0x0000000000000001] = "CREATE_INSTANT_INVITE";
    BitwisePermissionFlags[BitwisePermissionFlags["KICK_MEMBERS"] = 0x0000000000000002] = "KICK_MEMBERS";
    BitwisePermissionFlags[BitwisePermissionFlags["BAN_MEMBERS"] = 0x0000000000000004] = "BAN_MEMBERS";
    BitwisePermissionFlags[BitwisePermissionFlags["ADMINISTRATOR"] = 0x0000000000000008] = "ADMINISTRATOR";
    BitwisePermissionFlags[BitwisePermissionFlags["MANAGE_CHANNELS"] = 0x0000000000000010] = "MANAGE_CHANNELS";
    BitwisePermissionFlags[BitwisePermissionFlags["MANAGE_GUILD"] = 0x0000000000000020] = "MANAGE_GUILD";
    BitwisePermissionFlags[BitwisePermissionFlags["ADD_REACTIONS"] = 0x0000000000000040] = "ADD_REACTIONS";
    BitwisePermissionFlags[BitwisePermissionFlags["VIEW_AUDIT_LOG"] = 0x0000000000000080] = "VIEW_AUDIT_LOG";
    BitwisePermissionFlags[BitwisePermissionFlags["PRIORITY_SPEAKER"] = 0x0000000000000100] = "PRIORITY_SPEAKER";
    BitwisePermissionFlags[BitwisePermissionFlags["STREAM"] = 0x0000000000000200] = "STREAM";
    BitwisePermissionFlags[BitwisePermissionFlags["VIEW_CHANNEL"] = 0x0000000000000400] = "VIEW_CHANNEL";
    BitwisePermissionFlags[BitwisePermissionFlags["SEND_MESSAGES"] = 0x0000000000000800] = "SEND_MESSAGES";
    BitwisePermissionFlags[BitwisePermissionFlags["SEND_TTS_MESSAGES"] = 0x0000000000001000] = "SEND_TTS_MESSAGES";
    BitwisePermissionFlags[BitwisePermissionFlags["MANAGE_MESSAGES"] = 0x0000000000002000] = "MANAGE_MESSAGES";
    BitwisePermissionFlags[BitwisePermissionFlags["EMBED_LINKS"] = 0x0000000000004000] = "EMBED_LINKS";
    BitwisePermissionFlags[BitwisePermissionFlags["ATTACH_FILES"] = 0x0000000000008000] = "ATTACH_FILES";
    BitwisePermissionFlags[BitwisePermissionFlags["READ_MESSAGE_HISTORY"] = 0x0000000000010000] = "READ_MESSAGE_HISTORY";
    BitwisePermissionFlags[BitwisePermissionFlags["MENTION_EVERYONE"] = 0x0000000000020000] = "MENTION_EVERYONE";
    BitwisePermissionFlags[BitwisePermissionFlags["USE_EXTERNAL_EMOJIS"] = 0x0000000000040000] = "USE_EXTERNAL_EMOJIS";
    BitwisePermissionFlags[BitwisePermissionFlags["VIEW_GUILD_INSIGHTS"] = 0x0000000000080000] = "VIEW_GUILD_INSIGHTS";
    BitwisePermissionFlags[BitwisePermissionFlags["CONNECT"] = 0x0000000000100000] = "CONNECT";
    BitwisePermissionFlags[BitwisePermissionFlags["SPEAK"] = 0x0000000000200000] = "SPEAK";
    BitwisePermissionFlags[BitwisePermissionFlags["MUTE_MEMBERS"] = 0x0000000000400000] = "MUTE_MEMBERS";
    BitwisePermissionFlags[BitwisePermissionFlags["DEAFEN_MEMBERS"] = 0x0000000000800000] = "DEAFEN_MEMBERS";
    BitwisePermissionFlags[BitwisePermissionFlags["MOVE_MEMBERS"] = 0x0000000001000000] = "MOVE_MEMBERS";
    BitwisePermissionFlags[BitwisePermissionFlags["USE_VAD"] = 0x0000000002000000] = "USE_VAD";
    BitwisePermissionFlags[BitwisePermissionFlags["CHANGE_NICKNAME"] = 0x0000000004000000] = "CHANGE_NICKNAME";
    BitwisePermissionFlags[BitwisePermissionFlags["MANAGE_NICKNAMES"] = 0x0000000008000000] = "MANAGE_NICKNAMES";
    BitwisePermissionFlags[BitwisePermissionFlags["MANAGE_ROLES"] = 0x0000000010000000] = "MANAGE_ROLES";
    BitwisePermissionFlags[BitwisePermissionFlags["MANAGE_WEBHOOKS"] = 0x0000000020000000] = "MANAGE_WEBHOOKS";
    BitwisePermissionFlags[BitwisePermissionFlags["MANAGE_EMOJIS"] = 0x0000000040000000] = "MANAGE_EMOJIS";
    BitwisePermissionFlags[BitwisePermissionFlags["USE_SLASH_COMMANDS"] = 0x0000000080000000] = "USE_SLASH_COMMANDS";
    BitwisePermissionFlags[BitwisePermissionFlags["REQUEST_TO_SPEAK"] = 0x0000000100000000] = "REQUEST_TO_SPEAK";
    BitwisePermissionFlags[BitwisePermissionFlags["MANAGE_EVENTS"] = 0x0000000200000000] = "MANAGE_EVENTS";
    BitwisePermissionFlags[BitwisePermissionFlags["MANAGE_THREADS"] = 0x0000000400000000] = "MANAGE_THREADS";
    BitwisePermissionFlags[BitwisePermissionFlags["CREATE_PUBLIC_THREADS"] = 0x0000000800000000] = "CREATE_PUBLIC_THREADS";
    BitwisePermissionFlags[BitwisePermissionFlags["CREATE_PRIVATE_THREADS"] = 0x0000001000000000] = "CREATE_PRIVATE_THREADS";
    BitwisePermissionFlags[BitwisePermissionFlags["USE_EXTERNAL_STICKERS"] = 0x0000002000000000] = "USE_EXTERNAL_STICKERS";
    BitwisePermissionFlags[BitwisePermissionFlags["SEND_MESSAGES_IN_THREADS"] = 0x0000004000000000] = "SEND_MESSAGES_IN_THREADS";
    BitwisePermissionFlags[BitwisePermissionFlags["USE_EMBEDDED_ACTIVITIES"] = 0x0000008000000000] = "USE_EMBEDDED_ACTIVITIES";
    BitwisePermissionFlags[BitwisePermissionFlags["MODERATE_MEMBERS"] = 0x0000010000000000] = "MODERATE_MEMBERS";
})(BitwisePermissionFlags || (BitwisePermissionFlags = {}));
var VoiceOpcodes;
(function(VoiceOpcodes) {
    VoiceOpcodes[VoiceOpcodes["Identify"] = 0] = "Identify";
    VoiceOpcodes[VoiceOpcodes["SelectProtocol"] = 1] = "SelectProtocol";
    VoiceOpcodes[VoiceOpcodes["Ready"] = 2] = "Ready";
    VoiceOpcodes[VoiceOpcodes["Heartbeat"] = 3] = "Heartbeat";
    VoiceOpcodes[VoiceOpcodes["SessionDescription"] = 4] = "SessionDescription";
    VoiceOpcodes[VoiceOpcodes["Speaking"] = 5] = "Speaking";
    VoiceOpcodes[VoiceOpcodes["HeartbeatACK"] = 6] = "HeartbeatACK";
    VoiceOpcodes[VoiceOpcodes["Resume"] = 7] = "Resume";
    VoiceOpcodes[VoiceOpcodes["Hello"] = 8] = "Hello";
    VoiceOpcodes[VoiceOpcodes["Resumed"] = 9] = "Resumed";
    VoiceOpcodes[VoiceOpcodes["ClientDisconnect"] = 13] = "ClientDisconnect";
})(VoiceOpcodes || (VoiceOpcodes = {}));
var VoiceCloseEventCodes;
(function(VoiceCloseEventCodes) {
    VoiceCloseEventCodes[VoiceCloseEventCodes["UnknownOpcode"] = 4001] = "UnknownOpcode";
    VoiceCloseEventCodes[VoiceCloseEventCodes["FailedToDecodePayload"] = 4002] = "FailedToDecodePayload";
    VoiceCloseEventCodes[VoiceCloseEventCodes["NotAuthenticated"] = 4003] = "NotAuthenticated";
    VoiceCloseEventCodes[VoiceCloseEventCodes["AuthenticationFailed"] = 4004] = "AuthenticationFailed";
    VoiceCloseEventCodes[VoiceCloseEventCodes["AlreadyAuthenticated"] = 4005] = "AlreadyAuthenticated";
    VoiceCloseEventCodes[VoiceCloseEventCodes["SessionNoLongerValid"] = 4006] = "SessionNoLongerValid";
    VoiceCloseEventCodes[VoiceCloseEventCodes["SessionTimedOut"] = 4009] = "SessionTimedOut";
    VoiceCloseEventCodes[VoiceCloseEventCodes["ServerNotFound"] = 4011] = "ServerNotFound";
    VoiceCloseEventCodes[VoiceCloseEventCodes["UnknownProtocol"] = 4012] = "UnknownProtocol";
    VoiceCloseEventCodes[VoiceCloseEventCodes["Disconnect"] = 4014] = "Disconnect";
    VoiceCloseEventCodes[VoiceCloseEventCodes["VoiceServerCrashed"] = 4015] = "VoiceServerCrashed";
    VoiceCloseEventCodes[VoiceCloseEventCodes["UnknownEncryptionMode"] = 4016] = "UnknownEncryptionMode";
})(VoiceCloseEventCodes || (VoiceCloseEventCodes = {}));
var RpcErrorCodes;
(function(RpcErrorCodes) {
    RpcErrorCodes[RpcErrorCodes["UnknownError"] = 1000] = "UnknownError";
    RpcErrorCodes[RpcErrorCodes["InvalidPayload"] = 4000] = "InvalidPayload";
    RpcErrorCodes[RpcErrorCodes["InvalidCommand"] = 4002] = "InvalidCommand";
    RpcErrorCodes[RpcErrorCodes["InvalidGuild"] = 4003] = "InvalidGuild";
    RpcErrorCodes[RpcErrorCodes["InvalidEvent"] = 4004] = "InvalidEvent";
    RpcErrorCodes[RpcErrorCodes["InvalidChannel"] = 4005] = "InvalidChannel";
    RpcErrorCodes[RpcErrorCodes["InvalidPermissions"] = 4006] = "InvalidPermissions";
    RpcErrorCodes[RpcErrorCodes["InvalidClientId"] = 4007] = "InvalidClientId";
    RpcErrorCodes[RpcErrorCodes["InvalidOrigin"] = 4008] = "InvalidOrigin";
    RpcErrorCodes[RpcErrorCodes["InvalidToken"] = 4009] = "InvalidToken";
    RpcErrorCodes[RpcErrorCodes["InvalidUser"] = 4010] = "InvalidUser";
    RpcErrorCodes[RpcErrorCodes["OAuth2Error"] = 5000] = "OAuth2Error";
    RpcErrorCodes[RpcErrorCodes["SelectChannelTimedOut"] = 5001] = "SelectChannelTimedOut";
    RpcErrorCodes[RpcErrorCodes["GetGuildTimedOut"] = 5002] = "GetGuildTimedOut";
    RpcErrorCodes[RpcErrorCodes["SelectVoiceForceRequired"] = 5003] = "SelectVoiceForceRequired";
    RpcErrorCodes[RpcErrorCodes["CaptureShortcutAlreadyListening"] = 5004] = "CaptureShortcutAlreadyListening";
})(RpcErrorCodes || (RpcErrorCodes = {}));
var RpcCloseEventCodes;
(function(RpcCloseEventCodes) {
    RpcCloseEventCodes[RpcCloseEventCodes["InvalidClientId"] = 4000] = "InvalidClientId";
    RpcCloseEventCodes[RpcCloseEventCodes["InvalidOrigin"] = 4001] = "InvalidOrigin";
    RpcCloseEventCodes[RpcCloseEventCodes["RateLimited"] = 4002] = "RateLimited";
    RpcCloseEventCodes[RpcCloseEventCodes["TokenRevoked"] = 4003] = "TokenRevoked";
    RpcCloseEventCodes[RpcCloseEventCodes["InvalidVersion"] = 4004] = "InvalidVersion";
    RpcCloseEventCodes[RpcCloseEventCodes["InvalidEncoding"] = 4005] = "InvalidEncoding";
})(RpcCloseEventCodes || (RpcCloseEventCodes = {}));
var HTTPResponseCodes;
(function(HTTPResponseCodes) {
    HTTPResponseCodes[HTTPResponseCodes["Ok"] = 200] = "Ok";
    HTTPResponseCodes[HTTPResponseCodes["Created"] = 201] = "Created";
    HTTPResponseCodes[HTTPResponseCodes["NoContent"] = 204] = "NoContent";
    HTTPResponseCodes[HTTPResponseCodes["NotModified"] = 304] = "NotModified";
    HTTPResponseCodes[HTTPResponseCodes["BadRequest"] = 400] = "BadRequest";
    HTTPResponseCodes[HTTPResponseCodes["Unauthorized"] = 401] = "Unauthorized";
    HTTPResponseCodes[HTTPResponseCodes["Forbidden"] = 403] = "Forbidden";
    HTTPResponseCodes[HTTPResponseCodes["NotFound"] = 404] = "NotFound";
    HTTPResponseCodes[HTTPResponseCodes["MethodNotAllowed"] = 405] = "MethodNotAllowed";
    HTTPResponseCodes[HTTPResponseCodes["TooManyRequests"] = 429] = "TooManyRequests";
    HTTPResponseCodes[HTTPResponseCodes["GatewayUnavailable"] = 502] = "GatewayUnavailable";
})(HTTPResponseCodes || (HTTPResponseCodes = {}));
var GatewayCloseEventCodes;
(function(GatewayCloseEventCodes) {
    GatewayCloseEventCodes[GatewayCloseEventCodes["NormalClosure"] = 1000] = "NormalClosure";
    GatewayCloseEventCodes[GatewayCloseEventCodes["UnknownError"] = 4000] = "UnknownError";
    GatewayCloseEventCodes[GatewayCloseEventCodes["UnknownOpcode"] = 4001] = "UnknownOpcode";
    GatewayCloseEventCodes[GatewayCloseEventCodes["DecodeError"] = 4002] = "DecodeError";
    GatewayCloseEventCodes[GatewayCloseEventCodes["NotAuthenticated"] = 4003] = "NotAuthenticated";
    GatewayCloseEventCodes[GatewayCloseEventCodes["AuthenticationFailed"] = 4004] = "AuthenticationFailed";
    GatewayCloseEventCodes[GatewayCloseEventCodes["AlreadyAuthenticated"] = 4005] = "AlreadyAuthenticated";
    GatewayCloseEventCodes[GatewayCloseEventCodes["InvalidSeq"] = 4007] = "InvalidSeq";
    GatewayCloseEventCodes[GatewayCloseEventCodes["RateLimited"] = 4008] = "RateLimited";
    GatewayCloseEventCodes[GatewayCloseEventCodes["SessionTimedOut"] = 4009] = "SessionTimedOut";
    GatewayCloseEventCodes[GatewayCloseEventCodes["InvalidShard"] = 4010] = "InvalidShard";
    GatewayCloseEventCodes[GatewayCloseEventCodes["ShardingRequired"] = 4011] = "ShardingRequired";
    GatewayCloseEventCodes[GatewayCloseEventCodes["InvalidApiVersion"] = 4012] = "InvalidApiVersion";
    GatewayCloseEventCodes[GatewayCloseEventCodes["InvalidIntents"] = 4013] = "InvalidIntents";
    GatewayCloseEventCodes[GatewayCloseEventCodes["DisallowedIntents"] = 4014] = "DisallowedIntents";
})(GatewayCloseEventCodes || (GatewayCloseEventCodes = {}));
var InviteTargetTypes;
(function(InviteTargetTypes) {
    InviteTargetTypes[InviteTargetTypes["Stream"] = 1] = "Stream";
    InviteTargetTypes[InviteTargetTypes["EmbeddedApplication"] = 2] = "EmbeddedApplication";
})(InviteTargetTypes || (InviteTargetTypes = {}));
var GatewayOpcodes;
(function(GatewayOpcodes) {
    GatewayOpcodes[GatewayOpcodes["Dispatch"] = 0] = "Dispatch";
    GatewayOpcodes[GatewayOpcodes["Heartbeat"] = 1] = "Heartbeat";
    GatewayOpcodes[GatewayOpcodes["Identify"] = 2] = "Identify";
    GatewayOpcodes[GatewayOpcodes["PresenceUpdate"] = 3] = "PresenceUpdate";
    GatewayOpcodes[GatewayOpcodes["VoiceStateUpdate"] = 4] = "VoiceStateUpdate";
    GatewayOpcodes[GatewayOpcodes["Resume"] = 6] = "Resume";
    GatewayOpcodes[GatewayOpcodes["Reconnect"] = 7] = "Reconnect";
    GatewayOpcodes[GatewayOpcodes["RequestGuildMembers"] = 8] = "RequestGuildMembers";
    GatewayOpcodes[GatewayOpcodes["InvalidSession"] = 9] = "InvalidSession";
    GatewayOpcodes[GatewayOpcodes["Hello"] = 10] = "Hello";
    GatewayOpcodes[GatewayOpcodes["HeartbeatACK"] = 11] = "HeartbeatACK";
})(GatewayOpcodes || (GatewayOpcodes = {}));
var GatewayIntents;
(function(GatewayIntents) {
    GatewayIntents[GatewayIntents["Guilds"] = 1] = "Guilds";
    GatewayIntents[GatewayIntents["GuildMembers"] = 2] = "GuildMembers";
    GatewayIntents[GatewayIntents["GuildBans"] = 4] = "GuildBans";
    GatewayIntents[GatewayIntents["GuildEmojis"] = 8] = "GuildEmojis";
    GatewayIntents[GatewayIntents["GuildIntegrations"] = 16] = "GuildIntegrations";
    GatewayIntents[GatewayIntents["GuildWebhooks"] = 32] = "GuildWebhooks";
    GatewayIntents[GatewayIntents["GuildInvites"] = 64] = "GuildInvites";
    GatewayIntents[GatewayIntents["GuildVoiceStates"] = 128] = "GuildVoiceStates";
    GatewayIntents[GatewayIntents["GuildPresences"] = 256] = "GuildPresences";
    GatewayIntents[GatewayIntents["GuildMessages"] = 512] = "GuildMessages";
    GatewayIntents[GatewayIntents["GuildMessageReactions"] = 1024] = "GuildMessageReactions";
    GatewayIntents[GatewayIntents["GuildMessageTyping"] = 2048] = "GuildMessageTyping";
    GatewayIntents[GatewayIntents["DirectMessages"] = 4096] = "DirectMessages";
    GatewayIntents[GatewayIntents["DirectMessageReactions"] = 8192] = "DirectMessageReactions";
    GatewayIntents[GatewayIntents["DirectMessageTyping"] = 16384] = "DirectMessageTyping";
    GatewayIntents[GatewayIntents["MessageContent"] = 32768] = "MessageContent";
    GatewayIntents[GatewayIntents["GuildScheduledEvents"] = 65536] = "GuildScheduledEvents";
    GatewayIntents[GatewayIntents["AutoModerationConfiguration"] = 1048576] = "AutoModerationConfiguration";
    GatewayIntents[GatewayIntents["AutoModerationExecution"] = 2097152] = "AutoModerationExecution";
})(GatewayIntents || (GatewayIntents = {}));
var InteractionResponseTypes;
(function(InteractionResponseTypes) {
    InteractionResponseTypes[InteractionResponseTypes["Pong"] = 1] = "Pong";
    InteractionResponseTypes[InteractionResponseTypes["ChannelMessageWithSource"] = 4] = "ChannelMessageWithSource";
    InteractionResponseTypes[InteractionResponseTypes["DeferredChannelMessageWithSource"] = 5] = "DeferredChannelMessageWithSource";
    InteractionResponseTypes[InteractionResponseTypes["DeferredUpdateMessage"] = 6] = "DeferredUpdateMessage";
    InteractionResponseTypes[InteractionResponseTypes["UpdateMessage"] = 7] = "UpdateMessage";
    InteractionResponseTypes[InteractionResponseTypes["ApplicationCommandAutocompleteResult"] = 8] = "ApplicationCommandAutocompleteResult";
    InteractionResponseTypes[InteractionResponseTypes["Modal"] = 9] = "Modal";
})(InteractionResponseTypes || (InteractionResponseTypes = {}));
var Errors;
(function(Errors) {
    Errors["BOTS_HIGHEST_ROLE_TOO_LOW"] = "BOTS_HIGHEST_ROLE_TOO_LOW";
    Errors["CHANNEL_NOT_FOUND"] = "CHANNEL_NOT_FOUND";
    Errors["CHANNEL_NOT_IN_GUILD"] = "CHANNEL_NOT_IN_GUILD";
    Errors["CHANNEL_NOT_TEXT_BASED"] = "CHANNEL_NOT_TEXT_BASED";
    Errors["CHANNEL_NOT_STAGE_VOICE"] = "CHANNEL_NOT_STAGE_VOICE";
    Errors["MESSAGE_MAX_LENGTH"] = "MESSAGE_MAX_LENGTH";
    Errors["RULES_CHANNEL_CANNOT_BE_DELETED"] = "RULES_CHANNEL_CANNOT_BE_DELETED";
    Errors["UPDATES_CHANNEL_CANNOT_BE_DELETED"] = "UPDATES_CHANNEL_CANNOT_BE_DELETED";
    Errors["INVALID_TOPIC_LENGTH"] = "INVALID_TOPIC_LENGTH";
    Errors["GUILD_NOT_DISCOVERABLE"] = "GUILD_NOT_DISCOVERABLE";
    Errors["GUILD_WIDGET_NOT_ENABLED"] = "GUILD_WIDGET_NOT_ENABLED";
    Errors["GUILD_NOT_FOUND"] = "GUILD_NOT_FOUND";
    Errors["MEMBER_NOT_FOUND"] = "MEMBER_NOT_FOUND";
    Errors["MEMBER_NOT_IN_VOICE_CHANNEL"] = "MEMBER_NOT_IN_VOICE_CHANNEL";
    Errors["MEMBER_SEARCH_LIMIT_TOO_HIGH"] = "MEMBER_SEARCH_LIMIT_TOO_HIGH";
    Errors["MEMBER_SEARCH_LIMIT_TOO_LOW"] = "MEMBER_SEARCH_LIMIT_TOO_LOW";
    Errors["PRUNE_MAX_DAYS"] = "PRUNE_MAX_DAYS";
    Errors["ROLE_NOT_FOUND"] = "ROLE_NOT_FOUND";
    Errors["INVALID_THREAD_PARENT_CHANNEL_TYPE"] = "INVALID_THREAD_PARENT_CHANNEL_TYPE";
    Errors["GUILD_NEWS_CHANNEL_ONLY_SUPPORT_PUBLIC_THREADS"] = "GUILD_NEWS_CHANNEL_ONLY_SUPPORT_PUBLIC_THREADS";
    Errors["NOT_A_THREAD_CHANNEL"] = "NOT_A_THREAD_CHANNEL";
    Errors["MISSING_MANAGE_THREADS_AND_NOT_MEMBER"] = "MISSING_MANAGE_THREADS_AND_NOT_MEMBER";
    Errors["CANNOT_GET_MEMBERS_OF_AN_UNJOINED_PRIVATE_THREAD"] = "CANNOT_GET_MEMBERS_OF_AN_UNJOINED_PRIVATE_THREAD";
    Errors["HAVE_TO_BE_THE_CREATOR_OF_THE_THREAD_OR_HAVE_MANAGE_THREADS_TO_REMOVE_MEMBERS"] = "HAVE_TO_BE_THE_CREATOR_OF_THE_THREAD_OR_HAVE_MANAGE_THREADS_TO_REMOVE_MEMBERS";
    Errors["INVALID_GET_MESSAGES_LIMIT"] = "INVALID_GET_MESSAGES_LIMIT";
    Errors["DELETE_MESSAGES_MIN"] = "DELETE_MESSAGES_MIN";
    Errors["PRUNE_MIN_DAYS"] = "PRUNE_MIN_DAYS";
    Errors["INVALID_SLASH_DESCRIPTION"] = "INVALID_SLASH_DESCRIPTION";
    Errors["INVALID_SLASH_NAME"] = "INVALID_SLASH_NAME";
    Errors["INVALID_SLASH_OPTIONS"] = "INVALID_SLASH_OPTIONS";
    Errors["INVALID_SLASH_OPTIONS_CHOICES"] = "INVALID_SLASH_OPTIONS_CHOICES";
    Errors["TOO_MANY_SLASH_OPTIONS"] = "TOO_MANY_SLASH_OPTIONS";
    Errors["INVALID_SLASH_OPTION_CHOICE_NAME"] = "INVALID_SLASH_OPTION_CHOICE_NAME";
    Errors["INVALID_SLASH_OPTIONS_CHOICE_VALUE_TYPE"] = "INVALID_SLASH_OPTIONS_CHOICE_VALUE_TYPE";
    Errors["TOO_MANY_SLASH_OPTION_CHOICES"] = "TOO_MANY_SLASH_OPTION_CHOICES";
    Errors["ONLY_STRING_OR_INTEGER_OPTIONS_CAN_HAVE_CHOICES"] = "ONLY_STRING_OR_INTEGER_OPTIONS_CAN_HAVE_CHOICES";
    Errors["INVALID_SLASH_OPTION_NAME"] = "INVALID_SLASH_OPTION_NAME";
    Errors["INVALID_SLASH_OPTION_DESCRIPTION"] = "INVALID_SLASH_OPTION_DESCRIPTION";
    Errors["INVALID_CONTEXT_MENU_COMMAND_NAME"] = "INVALID_CONTEXT_MENU_COMMAND_NAME";
    Errors["INVALID_CONTEXT_MENU_COMMAND_DESCRIPTION"] = "INVALID_CONTEXT_MENU_COMMAND_DESCRIPTION";
    Errors["INVALID_WEBHOOK_NAME"] = "INVALID_WEBHOOK_NAME";
    Errors["INVALID_WEBHOOK_OPTIONS"] = "INVALID_WEBHOOK_OPTIONS";
    Errors["MISSING_ADD_REACTIONS"] = "MISSING_ADD_REACTIONS";
    Errors["MISSING_ADMINISTRATOR"] = "MISSING_ADMINISTRATOR";
    Errors["MISSING_ATTACH_FILES"] = "MISSING_ATTACH_FILES";
    Errors["MISSING_BAN_MEMBERS"] = "MISSING_BAN_MEMBERS";
    Errors["MISSING_CHANGE_NICKNAME"] = "MISSING_CHANGE_NICKNAME";
    Errors["MISSING_CONNECT"] = "MISSING_CONNECT";
    Errors["MISSING_CREATE_INSTANT_INVITE"] = "MISSING_CREATE_INSTANT_INVITE";
    Errors["MISSING_DEAFEN_MEMBERS"] = "MISSING_DEAFEN_MEMBERS";
    Errors["MISSING_EMBED_LINKS"] = "MISSING_EMBED_LINKS";
    Errors["MISSING_INTENT_GUILD_MEMBERS"] = "MISSING_INTENT_GUILD_MEMBERS";
    Errors["MISSING_KICK_MEMBERS"] = "MISSING_KICK_MEMBERS";
    Errors["MISSING_MANAGE_CHANNELS"] = "MISSING_MANAGE_CHANNELS";
    Errors["MISSING_MANAGE_EMOJIS"] = "MISSING_MANAGE_EMOJIS";
    Errors["MISSING_MANAGE_GUILD"] = "MISSING_MANAGE_GUILD";
    Errors["MISSING_MANAGE_MESSAGES"] = "MISSING_MANAGE_MESSAGES";
    Errors["MISSING_MANAGE_NICKNAMES"] = "MISSING_MANAGE_NICKNAMES";
    Errors["MISSING_MANAGE_ROLES"] = "MISSING_MANAGE_ROLES";
    Errors["MISSING_MANAGE_WEBHOOKS"] = "MISSING_MANAGE_WEBHOOKS";
    Errors["MISSING_MENTION_EVERYONE"] = "MISSING_MENTION_EVERYONE";
    Errors["MISSING_MOVE_MEMBERS"] = "MISSING_MOVE_MEMBERS";
    Errors["MISSING_MUTE_MEMBERS"] = "MISSING_MUTE_MEMBERS";
    Errors["MISSING_PRIORITY_SPEAKER"] = "MISSING_PRIORITY_SPEAKER";
    Errors["MISSING_READ_MESSAGE_HISTORY"] = "MISSING_READ_MESSAGE_HISTORY";
    Errors["MISSING_SEND_MESSAGES"] = "MISSING_SEND_MESSAGES";
    Errors["MISSING_SEND_TTS_MESSAGES"] = "MISSING_SEND_TTS_MESSAGES";
    Errors["MISSING_SPEAK"] = "MISSING_SPEAK";
    Errors["MISSING_STREAM"] = "MISSING_STREAM";
    Errors["MISSING_USE_VAD"] = "MISSING_USE_VAD";
    Errors["MISSING_USE_EXTERNAL_EMOJIS"] = "MISSING_USE_EXTERNAL_EMOJIS";
    Errors["MISSING_VIEW_AUDIT_LOG"] = "MISSING_VIEW_AUDIT_LOG";
    Errors["MISSING_VIEW_CHANNEL"] = "MISSING_VIEW_CHANNEL";
    Errors["MISSING_VIEW_GUILD_INSIGHTS"] = "MISSING_VIEW_GUILD_INSIGHTS";
    Errors["NICKNAMES_MAX_LENGTH"] = "NICKNAMES_MAX_LENGTH";
    Errors["USERNAME_INVALID_CHARACTER"] = "USERNAME_INVALID_CHARACTER";
    Errors["USERNAME_INVALID_USERNAME"] = "USERNAME_INVALID_USERNAME";
    Errors["USERNAME_MAX_LENGTH"] = "USERNAME_MAX_LENGTH";
    Errors["USERNAME_MIN_LENGTH"] = "USERNAME_MIN_LENGTH";
    Errors["NONCE_TOO_LONG"] = "NONCE_TOO_LONG";
    Errors["INVITE_MAX_AGE_INVALID"] = "INVITE_MAX_AGE_INVALID";
    Errors["INVITE_MAX_USES_INVALID"] = "INVITE_MAX_USES_INVALID";
    Errors["RATE_LIMIT_RETRY_MAXED"] = "RATE_LIMIT_RETRY_MAXED";
    Errors["REQUEST_CLIENT_ERROR"] = "REQUEST_CLIENT_ERROR";
    Errors["REQUEST_SERVER_ERROR"] = "REQUEST_SERVER_ERROR";
    Errors["REQUEST_UNKNOWN_ERROR"] = "REQUEST_UNKNOWN_ERROR";
    Errors["TOO_MANY_COMPONENTS"] = "TOO_MANY_COMPONENTS";
    Errors["TOO_MANY_ACTION_ROWS"] = "TOO_MANY_ACTION_ROWS";
    Errors["LINK_BUTTON_CANNOT_HAVE_CUSTOM_ID"] = "LINK_BUTTON_CANNOT_HAVE_CUSTOM_ID";
    Errors["COMPONENT_LABEL_TOO_BIG"] = "COMPONENT_LABEL_TOO_BIG";
    Errors["COMPONENT_CUSTOM_ID_TOO_BIG"] = "COMPONENT_CUSTOM_ID_TOO_BIG";
    Errors["BUTTON_REQUIRES_CUSTOM_ID"] = "BUTTON_REQUIRES_CUSTOM_ID";
    Errors["COMPONENT_SELECT_MUST_BE_ALONE"] = "COMPONENT_SELECT_MUST_BE_ALONE";
    Errors["COMPONENT_PLACEHOLDER_TOO_BIG"] = "COMPONENT_PLACEHOLDER_TOO_BIG";
    Errors["COMPONENT_SELECT_MIN_VALUE_TOO_LOW"] = "COMPONENT_SELECT_MIN_VALUE_TOO_LOW";
    Errors["COMPONENT_SELECT_MIN_VALUE_TOO_MANY"] = "COMPONENT_SELECT_MIN_VALUE_TOO_MANY";
    Errors["COMPONENT_SELECT_MAX_VALUE_TOO_LOW"] = "COMPONENT_SELECT_MAX_VALUE_TOO_LOW";
    Errors["COMPONENT_SELECT_MAX_VALUE_TOO_MANY"] = "COMPONENT_SELECT_MAX_VALUE_TOO_MANY";
    Errors["COMPONENT_SELECT_OPTIONS_TOO_LOW"] = "COMPONENT_SELECT_OPTIONS_TOO_LOW";
    Errors["COMPONENT_SELECT_OPTIONS_TOO_MANY"] = "COMPONENT_SELECT_OPTIONS_TOO_MANY";
    Errors["SELECT_OPTION_LABEL_TOO_BIG"] = "SELECT_OPTION_LABEL_TOO_BIG";
    Errors["SELECT_OPTION_VALUE_TOO_BIG"] = "SELECT_OPTION_VALUE_TOO_BIG";
    Errors["SELECT_OPTION_TOO_MANY_DEFAULTS"] = "SELECT_OPTION_TOO_MANY_DEFAULTS";
    Errors["COMPONENT_SELECT_MIN_HIGHER_THAN_MAX"] = "COMPONENT_SELECT_MIN_HIGHER_THAN_MAX";
    Errors["CANNOT_ADD_USER_TO_ARCHIVED_THREADS"] = "CANNOT_ADD_USER_TO_ARCHIVED_THREADS";
    Errors["CANNOT_LEAVE_ARCHIVED_THREAD"] = "CANNOT_LEAVE_ARCHIVED_THREAD";
    Errors["CANNOT_REMOVE_FROM_ARCHIVED_THREAD"] = "CANNOT_REMOVE_FROM_ARCHIVED_THREAD";
    Errors["YOU_CAN_NOT_DM_THE_BOT_ITSELF"] = "YOU_CAN_NOT_DM_THE_BOT_ITSELF";
})(Errors || (Errors = {}));
var Locales;
(function(Locales) {
    Locales["Danish"] = "da";
    Locales["German"] = "de";
    Locales["EnglishUk"] = "en-GB";
    Locales["EnglishUs"] = "en-US";
    Locales["Spanish"] = "es-ES";
    Locales["French"] = "fr";
    Locales["Croatian"] = "hr";
    Locales["Italian"] = "it";
    Locales["Lithuanian"] = "lt";
    Locales["Hungarian"] = "hu";
    Locales["Dutch"] = "nl";
    Locales["Norwegian"] = "no";
    Locales["Polish"] = "pl";
    Locales["PortugueseBrazilian"] = "pt-BR";
    Locales["RomanianRomania"] = "ro";
    Locales["Finnish"] = "fi";
    Locales["Swedish"] = "sv-SE";
    Locales["Vietnamese"] = "vi";
    Locales["Turkish"] = "tr";
    Locales["Czech"] = "cs";
    Locales["Greek"] = "el";
    Locales["Bulgarian"] = "bg";
    Locales["Russian"] = "ru";
    Locales["Ukrainian"] = "uk";
    Locales["Hindi"] = "hi";
    Locales["Thai"] = "th";
    Locales["ChineseChina"] = "zh-CN";
    Locales["Japanese"] = "ja";
    Locales["ChineseTaiwan"] = "zh-TW";
    Locales["Korean"] = "ko";
})(Locales || (Locales = {}));
const GATEWAY_RATE_LIMIT_RESET_INTERVAL = 60_000;
var ShardState;
(function(ShardState) {
    ShardState[ShardState["Connected"] = 0] = "Connected";
    ShardState[ShardState["Connecting"] = 1] = "Connecting";
    ShardState[ShardState["Disconnected"] = 2] = "Disconnected";
    ShardState[ShardState["Unidentified"] = 3] = "Unidentified";
    ShardState[ShardState["Identifying"] = 4] = "Identifying";
    ShardState[ShardState["Resuming"] = 5] = "Resuming";
    ShardState[ShardState["Offline"] = 6] = "Offline";
})(ShardState || (ShardState = {}));
var ShardSocketCloseCodes;
(function(ShardSocketCloseCodes) {
    ShardSocketCloseCodes[ShardSocketCloseCodes["Shutdown"] = 3000] = "Shutdown";
    ShardSocketCloseCodes[ShardSocketCloseCodes["ResumeClosingOldConnection"] = 3024] = "ResumeClosingOldConnection";
    ShardSocketCloseCodes[ShardSocketCloseCodes["ZombiedConnection"] = 3010] = "ZombiedConnection";
    ShardSocketCloseCodes[ShardSocketCloseCodes["TestingFinished"] = 3064] = "TestingFinished";
    ShardSocketCloseCodes[ShardSocketCloseCodes["Resharded"] = 3065] = "Resharded";
    ShardSocketCloseCodes[ShardSocketCloseCodes["ReIdentifying"] = 3066] = "ReIdentifying";
})(ShardSocketCloseCodes || (ShardSocketCloseCodes = {}));
async function identify(shard) {
    if (shard.state === ShardState.Connected) {
        shard.close(ShardSocketCloseCodes.ReIdentifying, "Re-identifying closure of old connection.");
    }
    shard.state = ShardState.Identifying;
    shard.events.identifying?.(shard);
    if (!shard.isOpen()) {
        await shard.connect();
    }
    await shard.requestIdentify();
    shard.send({
        op: GatewayOpcodes.Identify,
        d: {
            token: `Bot ${shard.gatewayConfig.token}`,
            compress: shard.gatewayConfig.compress,
            properties: shard.gatewayConfig.properties,
            intents: shard.gatewayConfig.intents,
            shard: [
                shard.id,
                shard.totalShards
            ],
            presence: await shard.makePresence?.(shard.id)
        }
    }, true);
    return new Promise((resolve)=>{
        shard.resolves.set("READY", ()=>{
            shard.events.identified?.(shard);
            resolve();
        });
        shard.resolves.set("INVALID_SESSION", ()=>{
            shard.resolves.delete("READY");
            resolve();
        });
    });
}
const BTYPE = Object.freeze({
    UNCOMPRESSED: 0,
    FIXED: 1,
    DYNAMIC: 2
});
const LENGTH_EXTRA_BIT_LEN = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    0, 
];
const LENGTH_EXTRA_BIT_BASE = [
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    13,
    15,
    17,
    19,
    23,
    27,
    31,
    35,
    43,
    51,
    59,
    67,
    83,
    99,
    115,
    131,
    163,
    195,
    227,
    258, 
];
const DISTANCE_EXTRA_BIT_BASE = [
    1,
    2,
    3,
    4,
    5,
    7,
    9,
    13,
    17,
    25,
    33,
    49,
    65,
    97,
    129,
    193,
    257,
    385,
    513,
    769,
    1025,
    1537,
    2049,
    3073,
    4097,
    6145,
    8193,
    12289,
    16385,
    24577, 
];
const DISTANCE_EXTRA_BIT_LEN = [
    0,
    0,
    0,
    0,
    1,
    1,
    2,
    2,
    3,
    3,
    4,
    4,
    5,
    5,
    6,
    6,
    7,
    7,
    8,
    8,
    9,
    9,
    10,
    10,
    11,
    11,
    12,
    12,
    13,
    13, 
];
const CODELEN_VALUES = [
    16,
    17,
    18,
    0,
    8,
    7,
    9,
    6,
    10,
    5,
    11,
    4,
    12,
    3,
    13,
    2,
    14,
    1,
    15, 
];
function generateHuffmanTable(codelenValues) {
    const codelens = Object.keys(codelenValues);
    let codelen = 0;
    let codelenMax = 0;
    let codelenMin = Number.MAX_SAFE_INTEGER;
    codelens.forEach((key)=>{
        codelen = Number(key);
        if (codelenMax < codelen) codelenMax = codelen;
        if (codelenMin > codelen) codelenMin = codelen;
    });
    let code = 0;
    let values;
    const bitlenTables = {};
    for(let bitlen = codelenMin; bitlen <= codelenMax; bitlen++){
        values = codelenValues[bitlen];
        if (values === undefined) values = [];
        values.sort((a, b)=>{
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        });
        const table = {};
        values.forEach((value)=>{
            table[code] = value;
            code++;
        });
        bitlenTables[bitlen] = table;
        code <<= 1;
    }
    return bitlenTables;
}
function makeFixedHuffmanCodelenValues() {
    const codelenValues = {};
    codelenValues[7] = [];
    codelenValues[8] = [];
    codelenValues[9] = [];
    for(let i = 0; i <= 287; i++){
        i <= 143 ? codelenValues[8].push(i) : i <= 255 ? codelenValues[9].push(i) : i <= 279 ? codelenValues[7].push(i) : codelenValues[8].push(i);
    }
    return codelenValues;
}
class BitReadStream {
    buffer;
    bufferIndex;
    nowBits;
    nowBitsLength = 0;
    isEnd = false;
    constructor(buffer, offset = 0){
        this.buffer = buffer;
        this.bufferIndex = offset;
        this.nowBits = buffer[offset];
        this.nowBitsLength = 8;
    }
    read() {
        if (this.isEnd) throw new Error("Lack of data length");
        const bit = this.nowBits & 1;
        if (this.nowBitsLength > 1) {
            this.nowBitsLength--;
            this.nowBits >>= 1;
        } else {
            this.bufferIndex++;
            if (this.bufferIndex < this.buffer.length) {
                this.nowBits = this.buffer[this.bufferIndex];
                this.nowBitsLength = 8;
            } else {
                this.nowBitsLength = 0;
                this.isEnd = true;
            }
        }
        return bit;
    }
    readRange(length) {
        while(this.nowBitsLength <= length){
            this.nowBits |= this.buffer[++this.bufferIndex] << this.nowBitsLength;
            this.nowBitsLength += 8;
        }
        const bits = this.nowBits & (1 << length) - 1;
        this.nowBits >>>= length;
        this.nowBitsLength -= length;
        return bits;
    }
    readRangeCoded(length) {
        let bits = 0;
        for(let i = 0; i < length; i++){
            bits <<= 1;
            bits |= this.read();
        }
        return bits;
    }
}
class Uint8WriteStream {
    index = 0;
    buffer;
    length;
    _extendedSize;
    constructor(extendedSize){
        this.buffer = new Uint8Array(extendedSize);
        this.length = extendedSize;
        this._extendedSize = extendedSize;
    }
    write(value) {
        if (this.length <= this.index) {
            this.length += this._extendedSize;
            const newBuffer = new Uint8Array(this.length);
            const nowSize = this.buffer.length;
            for(let i = 0; i < nowSize; i++){
                newBuffer[i] = this.buffer[i];
            }
            this.buffer = newBuffer;
        }
        this.buffer[this.index] = value;
        this.index++;
    }
}
const FIXED_HUFFMAN_TABLE = generateHuffmanTable(makeFixedHuffmanCodelenValues());
function inflate(input, offset = 0) {
    const buffer = new Uint8WriteStream(input.length * 10);
    const stream = new BitReadStream(input, offset);
    let bFinal = 0;
    let bType = 0;
    while(bFinal !== 1){
        bFinal = stream.readRange(1);
        bType = stream.readRange(2);
        if (bType === BTYPE.UNCOMPRESSED) {
            inflateUncompressedBlock(stream, buffer);
        } else if (bType === BTYPE.FIXED) {
            inflateFixedBlock(stream, buffer);
        } else if (bType === BTYPE.DYNAMIC) {
            inflateDynamicBlock(stream, buffer);
        } else {
            throw new Error("Not supported BTYPE : " + bType);
        }
        if (bFinal === 0 && stream.isEnd) {
            throw new Error("Data length is insufficient");
        }
    }
    return buffer.buffer.subarray(0, buffer.index);
}
function inflateUncompressedBlock(stream, buffer) {
    if (stream.nowBitsLength < 8) {
        stream.readRange(stream.nowBitsLength);
    }
    const LEN = stream.readRange(8) | stream.readRange(8) << 8;
    const NLEN = stream.readRange(8) | stream.readRange(8) << 8;
    if (LEN + NLEN !== 65535) {
        throw new Error("Data is corrupted");
    }
    for(let i = 0; i < LEN; i++){
        buffer.write(stream.readRange(8));
    }
}
function inflateFixedBlock(stream, buffer) {
    const tables = FIXED_HUFFMAN_TABLE;
    const codelens = Object.keys(tables);
    let codelen = 0;
    let codelenMax = 0;
    let codelenMin = Number.MAX_SAFE_INTEGER;
    codelens.forEach((key)=>{
        codelen = Number(key);
        if (codelenMax < codelen) codelenMax = codelen;
        if (codelenMin > codelen) codelenMin = codelen;
    });
    let code = 0;
    let value;
    let repeatLengthCode;
    let repeatLengthValue;
    let repeatLengthExt;
    let repeatDistanceCode;
    let repeatDistanceValue;
    let repeatDistanceExt;
    let repeatStartIndex;
    while(!stream.isEnd){
        value = undefined;
        codelen = codelenMin;
        code = stream.readRangeCoded(codelenMin);
        while(true){
            value = tables[codelen][code];
            if (value !== undefined) {
                break;
            }
            if (codelenMax <= codelen) {
                throw new Error("Data is corrupted");
            }
            codelen++;
            code <<= 1;
            code |= stream.read();
        }
        if (value < 256) {
            buffer.write(value);
            continue;
        }
        if (value === 256) {
            break;
        }
        repeatLengthCode = value - 257;
        repeatLengthValue = LENGTH_EXTRA_BIT_BASE[repeatLengthCode];
        repeatLengthExt = LENGTH_EXTRA_BIT_LEN[repeatLengthCode];
        if (0 < repeatLengthExt) {
            repeatLengthValue += stream.readRange(repeatLengthExt);
        }
        repeatDistanceCode = stream.readRangeCoded(5);
        repeatDistanceValue = DISTANCE_EXTRA_BIT_BASE[repeatDistanceCode];
        repeatDistanceExt = DISTANCE_EXTRA_BIT_LEN[repeatDistanceCode];
        if (0 < repeatDistanceExt) {
            repeatDistanceValue += stream.readRange(repeatDistanceExt);
        }
        repeatStartIndex = buffer.index - repeatDistanceValue;
        for(let i = 0; i < repeatLengthValue; i++){
            buffer.write(buffer.buffer[repeatStartIndex + i]);
        }
    }
}
function inflateDynamicBlock(stream, buffer) {
    const HLIT = stream.readRange(5) + 257;
    const HDIST = stream.readRange(5) + 1;
    const HCLEN = stream.readRange(4) + 4;
    let codelenCodelen = 0;
    const codelenCodelenValues = {};
    for(let i = 0; i < HCLEN; i++){
        codelenCodelen = stream.readRange(3);
        if (codelenCodelen === 0) {
            continue;
        }
        if (!codelenCodelenValues[codelenCodelen]) {
            codelenCodelenValues[codelenCodelen] = [];
        }
        codelenCodelenValues[codelenCodelen].push(CODELEN_VALUES[i]);
    }
    const codelenHuffmanTables = generateHuffmanTable(codelenCodelenValues);
    const codelenCodelens = Object.keys(codelenHuffmanTables);
    let codelenCodelenMax = 0;
    let codelenCodelenMin = Number.MAX_SAFE_INTEGER;
    codelenCodelens.forEach((key)=>{
        codelenCodelen = Number(key);
        if (codelenCodelenMax < codelenCodelen) codelenCodelenMax = codelenCodelen;
        if (codelenCodelenMin > codelenCodelen) codelenCodelenMin = codelenCodelen;
    });
    const dataCodelenValues = {};
    const distanceCodelenValues = {};
    let codelenCode = 0;
    let runlengthCode;
    let repeat = 0;
    let codelen = 0;
    const codesNumber = HLIT + HDIST;
    for(let i1 = 0; i1 < codesNumber;){
        runlengthCode = undefined;
        codelenCodelen = codelenCodelenMin;
        codelenCode = stream.readRangeCoded(codelenCodelenMin);
        while(true){
            runlengthCode = codelenHuffmanTables[codelenCodelen][codelenCode];
            if (runlengthCode !== undefined) {
                break;
            }
            if (codelenCodelenMax <= codelenCodelen) {
                throw new Error("Data is corrupted");
            }
            codelenCodelen++;
            codelenCode <<= 1;
            codelenCode |= stream.read();
        }
        if (runlengthCode === 16) {
            repeat = 3 + stream.readRange(2);
        } else if (runlengthCode === 17) {
            repeat = 3 + stream.readRange(3);
            codelen = 0;
        } else if (runlengthCode === 18) {
            repeat = 11 + stream.readRange(7);
            codelen = 0;
        } else {
            repeat = 1;
            codelen = runlengthCode;
        }
        if (codelen <= 0) {
            i1 += repeat;
        } else {
            while(repeat){
                if (i1 < HLIT) {
                    if (!dataCodelenValues[codelen]) {
                        dataCodelenValues[codelen] = [];
                    }
                    dataCodelenValues[codelen].push(i1++);
                } else {
                    if (!distanceCodelenValues[codelen]) {
                        distanceCodelenValues[codelen] = [];
                    }
                    distanceCodelenValues[codelen].push((i1++) - HLIT);
                }
                repeat--;
            }
        }
    }
    const dataHuffmanTables = generateHuffmanTable(dataCodelenValues);
    const distanceHuffmanTables = generateHuffmanTable(distanceCodelenValues);
    const dataCodelens = Object.keys(dataHuffmanTables);
    let dataCodelen = 0;
    let dataCodelenMax = 0;
    let dataCodelenMin = Number.MAX_SAFE_INTEGER;
    dataCodelens.forEach((key)=>{
        dataCodelen = Number(key);
        if (dataCodelenMax < dataCodelen) dataCodelenMax = dataCodelen;
        if (dataCodelenMin > dataCodelen) dataCodelenMin = dataCodelen;
    });
    const distanceCodelens = Object.keys(distanceHuffmanTables);
    let distanceCodelen = 0;
    let distanceCodelenMax = 0;
    let distanceCodelenMin = Number.MAX_SAFE_INTEGER;
    distanceCodelens.forEach((key)=>{
        distanceCodelen = Number(key);
        if (distanceCodelenMax < distanceCodelen) {
            distanceCodelenMax = distanceCodelen;
        }
        if (distanceCodelenMin > distanceCodelen) {
            distanceCodelenMin = distanceCodelen;
        }
    });
    let dataCode = 0;
    let data;
    let repeatLengthCode;
    let repeatLengthValue;
    let repeatLengthExt;
    let repeatDistanceCode;
    let repeatDistanceValue;
    let repeatDistanceExt;
    let repeatDistanceCodeCodelen;
    let repeatDistanceCodeCode;
    let repeatStartIndex;
    while(!stream.isEnd){
        data = undefined;
        dataCodelen = dataCodelenMin;
        dataCode = stream.readRangeCoded(dataCodelenMin);
        while(true){
            data = dataHuffmanTables[dataCodelen][dataCode];
            if (data !== undefined) {
                break;
            }
            if (dataCodelenMax <= dataCodelen) {
                throw new Error("Data is corrupted");
            }
            dataCodelen++;
            dataCode <<= 1;
            dataCode |= stream.read();
        }
        if (data < 256) {
            buffer.write(data);
            continue;
        }
        if (data === 256) {
            break;
        }
        repeatLengthCode = data - 257;
        repeatLengthValue = LENGTH_EXTRA_BIT_BASE[repeatLengthCode];
        repeatLengthExt = LENGTH_EXTRA_BIT_LEN[repeatLengthCode];
        if (0 < repeatLengthExt) {
            repeatLengthValue += stream.readRange(repeatLengthExt);
        }
        repeatDistanceCode = undefined;
        repeatDistanceCodeCodelen = distanceCodelenMin;
        repeatDistanceCodeCode = stream.readRangeCoded(distanceCodelenMin);
        while(true){
            repeatDistanceCode = distanceHuffmanTables[repeatDistanceCodeCodelen][repeatDistanceCodeCode];
            if (repeatDistanceCode !== undefined) {
                break;
            }
            if (distanceCodelenMax <= repeatDistanceCodeCodelen) {
                throw new Error("Data is corrupted");
            }
            repeatDistanceCodeCodelen++;
            repeatDistanceCodeCode <<= 1;
            repeatDistanceCodeCode |= stream.read();
        }
        repeatDistanceValue = DISTANCE_EXTRA_BIT_BASE[repeatDistanceCode];
        repeatDistanceExt = DISTANCE_EXTRA_BIT_LEN[repeatDistanceCode];
        if (0 < repeatDistanceExt) {
            repeatDistanceValue += stream.readRange(repeatDistanceExt);
        }
        repeatStartIndex = buffer.index - repeatDistanceValue;
        for(let i2 = 0; i2 < repeatLengthValue; i2++){
            buffer.write(buffer.buffer[repeatStartIndex + i2]);
        }
    }
}
function inflate1(input) {
    const stream = new BitReadStream(input);
    const CM = stream.readRange(4);
    if (CM !== 8) {
        throw new Error("Not compressed by deflate");
    }
    stream.readRange(4);
    stream.readRange(5);
    stream.readRange(1);
    stream.readRange(2);
    return inflate(input, 2);
}
const decoder = new TextDecoder();
async function handleMessage(shard, message_) {
    let message = message_.data;
    if (shard.gatewayConfig.compress && message instanceof Blob) {
        message = decoder.decode(inflate1(new Uint8Array(await message.arrayBuffer())));
    }
    if (typeof message !== "string") return;
    const messageData = JSON.parse(message);
    switch(messageData.op){
        case GatewayOpcodes.Heartbeat:
            {
                if (!shard.isOpen()) return;
                shard.heart.lastBeat = Date.now();
                shard.socket?.send(JSON.stringify({
                    op: GatewayOpcodes.Heartbeat,
                    d: shard.previousSequenceNumber
                }));
                shard.events.heartbeat?.(shard);
                break;
            }
        case GatewayOpcodes.Hello:
            {
                const interval = messageData.d.heartbeat_interval;
                shard.startHeartbeating(interval);
                if (shard.state !== ShardState.Resuming) {
                    shard.bucket = createLeakyBucket({
                        max: shard.calculateSafeRequests(),
                        refillInterval: GATEWAY_RATE_LIMIT_RESET_INTERVAL,
                        refillAmount: shard.calculateSafeRequests(),
                        waiting: shard.bucket.waiting
                    });
                }
                shard.events.hello?.(shard);
                break;
            }
        case GatewayOpcodes.HeartbeatACK:
            {
                shard.heart.acknowledged = true;
                shard.heart.lastAck = Date.now();
                if (shard.heart.lastBeat) {
                    shard.heart.rtt = shard.heart.lastAck - shard.heart.lastBeat;
                }
                shard.events.heartbeatAck?.(shard);
                break;
            }
        case GatewayOpcodes.Reconnect:
            {
                shard.events.requestedReconnect?.(shard);
                await shard.resume();
                break;
            }
        case GatewayOpcodes.InvalidSession:
            {
                const resumable = messageData.d;
                shard.events.invalidSession?.(shard, resumable);
                await delay(Math.floor((Math.random() * 4 + 1) * 1000));
                shard.resolves.get("INVALID_SESSION")?.(messageData);
                shard.resolves.delete("INVALID_SESSION");
                if (!resumable) {
                    await shard.identify();
                    break;
                }
                await shard.resume();
                break;
            }
    }
    if (messageData.t === "RESUMED") {
        shard.state = ShardState.Connected;
        shard.events.resumed?.(shard);
        shard.offlineSendQueue.map((resolve)=>resolve());
        shard.resolves.get("RESUMED")?.(messageData);
        shard.resolves.delete("RESUMED");
    } else if (messageData.t === "READY") {
        const payload = messageData.d;
        shard.sessionId = payload.session_id;
        shard.state = ShardState.Connected;
        shard.offlineSendQueue.map((resolve)=>resolve());
        shard.resolves.get("READY")?.(messageData);
        shard.resolves.delete("READY");
    }
    if (messageData.s !== null) {
        shard.previousSequenceNumber = messageData.s;
    }
    shard.events.message?.(shard, messageData);
}
function startHeartbeating(shard, interval) {
    shard.heart.interval = interval;
    if ([
        ShardState.Disconnected,
        ShardState.Offline
    ].includes(shard.state)) {
        shard.state = ShardState.Unidentified;
    }
    const jitter = Math.ceil(shard.heart.interval * (Math.random() || 0.5));
    shard.heart.timeoutId = setTimeout(()=>{
        shard.socket?.send(JSON.stringify({
            op: GatewayOpcodes.Heartbeat,
            d: shard.previousSequenceNumber
        }));
        shard.heart.lastBeat = Date.now();
        shard.heart.acknowledged = false;
        shard.heart.intervalId = setInterval(async ()=>{
            if (!shard.heart.acknowledged) {
                shard.close(ShardSocketCloseCodes.ZombiedConnection, "Zombied connection, did not receive an heartbeat ACK in time.");
                return await shard.identify();
            }
            shard.heart.acknowledged = false;
            shard.socket?.send(JSON.stringify({
                op: GatewayOpcodes.Heartbeat,
                d: shard.previousSequenceNumber
            }));
            shard.heart.lastBeat = Date.now();
            shard.events.heartbeat?.(shard);
        }, shard.heart.interval);
    }, jitter);
}
function stopHeartbeating(shard) {
    clearInterval(shard.heart.intervalId);
    clearTimeout(shard.heart.timeoutId);
}
async function resume(shard) {
    if (shard.isOpen()) {
        shard.close(ShardSocketCloseCodes.ResumeClosingOldConnection, "Reconnecting the shard, closing old connection.");
    }
    if (!shard.sessionId) {
        return await shard.identify();
    }
    shard.state = ShardState.Resuming;
    await shard.connect();
    shard.send({
        op: GatewayOpcodes.Resume,
        d: {
            token: `Bot ${shard.gatewayConfig.token}`,
            session_id: shard.sessionId,
            seq: shard.previousSequenceNumber ?? 0
        }
    }, true);
    return new Promise((resolve)=>{
        shard.resolves.set("RESUMED", ()=>resolve());
        shard.resolves.set("INVALID_SESSION", ()=>{
            shard.resolves.delete("RESUMED");
            resolve();
        });
    });
}
function calculateSafeRequests(shard) {
    const safeRequests = shard.maxRequestsPerRateLimitTick - Math.ceil(shard.rateLimitResetInterval / shard.heart.interval) * 2;
    return safeRequests < 0 ? 0 : safeRequests;
}
async function checkOffline(shard, highPriority) {
    if (!shard.isOpen()) {
        await new Promise((resolve)=>{
            if (highPriority) {
                shard.offlineSendQueue.unshift(resolve);
            } else {
                shard.offlineSendQueue.push(resolve);
            }
        });
    }
}
async function send(shard, message, highPriority) {
    await checkOffline(shard, highPriority);
    await shard.bucket.acquire(1, highPriority);
    await checkOffline(shard, highPriority);
    shard.socket?.send(JSON.stringify(message));
}
async function handleClose(shard, close) {
    shard.stopHeartbeating();
    switch(close.code){
        case ShardSocketCloseCodes.TestingFinished:
            {
                shard.state = ShardState.Offline;
                shard.events.disconnected?.(shard);
                return;
            }
        case ShardSocketCloseCodes.Shutdown:
        case ShardSocketCloseCodes.ReIdentifying:
        case ShardSocketCloseCodes.Resharded:
        case ShardSocketCloseCodes.ResumeClosingOldConnection:
        case ShardSocketCloseCodes.ZombiedConnection:
            {
                shard.state = ShardState.Disconnected;
                shard.events.disconnected?.(shard);
                return;
            }
        case GatewayCloseEventCodes.UnknownOpcode:
        case GatewayCloseEventCodes.NotAuthenticated:
        case GatewayCloseEventCodes.InvalidSeq:
        case GatewayCloseEventCodes.RateLimited:
        case GatewayCloseEventCodes.SessionTimedOut:
            {
                shard.state = ShardState.Identifying;
                shard.events.disconnected?.(shard);
                return await shard.identify();
            }
        case GatewayCloseEventCodes.AuthenticationFailed:
        case GatewayCloseEventCodes.InvalidShard:
        case GatewayCloseEventCodes.ShardingRequired:
        case GatewayCloseEventCodes.InvalidApiVersion:
        case GatewayCloseEventCodes.InvalidIntents:
        case GatewayCloseEventCodes.DisallowedIntents:
            {
                shard.state = ShardState.Offline;
                shard.events.disconnected?.(shard);
                throw new Error(close.reason || "Discord gave no reason! GG! You broke Discord!");
            }
        case GatewayCloseEventCodes.UnknownError:
        case GatewayCloseEventCodes.DecodeError:
        case GatewayCloseEventCodes.AlreadyAuthenticated:
        default:
            {
                shard.state = ShardState.Resuming;
                shard.events.disconnected?.(shard);
                return await shard.resume();
            }
    }
}
async function connect(shard) {
    let gotHello = false;
    if (![
        ShardState.Identifying,
        ShardState.Resuming
    ].includes(shard.state)) {
        shard.state = ShardState.Connecting;
    }
    shard.events.connecting?.(shard);
    const socket = new WebSocket(`${shard.gatewayConfig.url}/?v=${shard.gatewayConfig.version}&encoding=json`);
    shard.socket = socket;
    socket.onerror = (event)=>console.log({
            error: event
        });
    socket.onclose = (event)=>shard.handleClose(event);
    socket.onmessage = (message)=>{
        gotHello = true;
        shard.handleMessage(message);
    };
    return new Promise((resolve)=>{
        socket.onopen = ()=>{
            setTimeout(()=>{
                if (!gotHello) {
                    shard.handleMessage({
                        data: JSON.stringify({
                            t: null,
                            s: null,
                            op: 10,
                            d: {
                                heartbeat_interval: 41250
                            }
                        })
                    });
                }
            }, 250);
            if (![
                ShardState.Identifying,
                ShardState.Resuming
            ].includes(shard.state)) {
                shard.state = ShardState.Unidentified;
            }
            shard.events.connected?.(shard);
            resolve();
        };
    });
}
function close(shard, code, reason) {
    if (shard.socket?.readyState !== WebSocket.OPEN) return;
    return shard.socket?.close(code, reason);
}
async function shutdown(shard) {
    shard.close(ShardSocketCloseCodes.Shutdown, "Shard shutting down.");
    shard.state = ShardState.Offline;
}
function isOpen(shard) {
    return shard.socket?.readyState === WebSocket.OPEN;
}
const BASE_URL = "https://discord.com/api";
const DISCORDENO_VERSION = "13.0.0-rc45";
const USER_AGENT = `DiscordBot (https://github.com/discordeno/discordeno, v${DISCORDENO_VERSION})`;
const IMAGE_BASE_URL = "https://cdn.discordapp.com";
const baseEndpoints = {
    BASE_URL: `${BASE_URL}/v${10}`,
    CDN_URL: IMAGE_BASE_URL
};
function createShard(options) {
    const calculateSafeRequestsOverwritten = options.calculateSafeRequests ?? calculateSafeRequests;
    const closeOverwritten = options.close ?? close;
    const connectOverwritten = options.connect ?? connect;
    const identifyOverwritten = options.identify ?? identify;
    const sendOverwritten = options.send ?? send;
    const shutdownOverwritten = options.shutdown ?? shutdown;
    const resumeOverwritten = options.resume ?? resume;
    const handleCloseOverwritten = options.handleClose ?? handleClose;
    const handleMessageOverwritten = options.handleMessage ?? handleMessage;
    const isOpenOverwritten = options.isOpen ?? isOpen;
    const startHeartbeatingOverwritten = options.startHeartbeating ?? startHeartbeating;
    const stopHeartbeatingOverwritten = options.stopHeartbeating ?? stopHeartbeating;
    return {
        gatewayConfig: {
            compress: options.gatewayConfig.compress ?? false,
            intents: options.gatewayConfig.intents ?? 0,
            properties: {
                os: options.gatewayConfig?.properties?.os ?? "linux",
                browser: options.gatewayConfig?.properties?.browser ?? "Discordeno",
                device: options.gatewayConfig?.properties?.device ?? "Discordeno"
            },
            token: options.gatewayConfig.token,
            url: options.gatewayConfig.url ?? "wss://gateway.discord.gg",
            version: options.gatewayConfig.version ?? 10
        },
        heart: {
            acknowledged: false,
            interval: 45000
        },
        id: options.id,
        maxRequestsPerRateLimitTick: 120,
        previousSequenceNumber: options.previousSequenceNumber || null,
        rateLimitResetInterval: 60_000,
        sessionId: undefined,
        socket: undefined,
        state: ShardState.Offline,
        totalShards: options.totalShards,
        events: options.events ?? {},
        calculateSafeRequests: function() {
            return calculateSafeRequestsOverwritten(this);
        },
        close: function(code, reason) {
            return closeOverwritten(this, code, reason);
        },
        connect: async function() {
            return await connectOverwritten(this);
        },
        identify: async function() {
            return await identifyOverwritten(this);
        },
        isOpen: function() {
            return isOpenOverwritten(this);
        },
        makePresence: options.makePresence,
        resume: async function() {
            return await resumeOverwritten(this);
        },
        send: async function(message, highPriority = false) {
            return await sendOverwritten(this, message, highPriority);
        },
        shutdown: async function() {
            return await shutdownOverwritten(this);
        },
        bucket: createLeakyBucket({
            max: 120,
            refillInterval: 60_000,
            refillAmount: 120
        }),
        handleClose: async function(close) {
            return await handleCloseOverwritten(this, close);
        },
        handleMessage: async function(message) {
            return await handleMessageOverwritten(this, message);
        },
        requestIdentify: async function() {
            return await options.requestIdentify(this.id);
        },
        offlineSendQueue: [],
        resolves: new Map(),
        startHeartbeating: function(interval) {
            return startHeartbeatingOverwritten(this, interval);
        },
        stopHeartbeating: function() {
            return stopHeartbeatingOverwritten(this);
        }
    };
}
function createShardManager(options) {
    return {
        createShardOptions: {
            ...options.createShardOptions,
            events: {
                ...options.createShardOptions?.events,
                message: options.createShardOptions?.events?.message ?? options.handleMessage
            }
        },
        gatewayConfig: options.gatewayConfig,
        shards: new Map(options.shardIds.map((shardId)=>{
            const shard = createShard({
                ...options.createShardOptions,
                id: shardId,
                totalShards: options.totalShards,
                gatewayConfig: options.gatewayConfig,
                requestIdentify: async function() {
                    return await options.requestIdentify(shardId);
                }
            });
            return [
                shardId,
                shard
            ];
        })),
        totalShards: options.totalShards,
        identify: async function(shardId) {
            let shard = this.shards.get(shardId);
            if (!shard) {
                shard = createShard({
                    ...this.createShardOptions,
                    id: shardId,
                    totalShards: this.totalShards,
                    gatewayConfig: this.gatewayConfig,
                    requestIdentify: async function() {
                        return await options.requestIdentify(shardId);
                    }
                });
                this.shards.set(shardId, shard);
            }
            return await shard.identify();
        },
        kill: async function(shardId) {
            const shard = this.shards.get(shardId);
            if (!shard) return;
            this.shards.delete(shardId);
            return await shard.shutdown();
        },
        requestIdentify: options.requestIdentify
    };
}
async function stop(gateway, code, reason) {
    gateway.manager.shards.forEach((shard)=>shard.close(code, reason));
    await delay(5000);
}
function createGatewayManager(options) {
    const prepareBucketsOverwritten = options.prepareBuckets ?? prepareBuckets;
    const spawnShardsOverwritten = options.spawnShards ?? spawnShards;
    const stopOverwritten = options.stop ?? stop;
    const tellWorkerToIdentifyOverwritten = options.tellWorkerToIdentify ?? tellWorkerToIdentify;
    const calculateTotalShardsOverwritten = options.calculateTotalShards ?? calculateTotalShards;
    const calculateWorkerIdOverwritten = options.calculateWorkerId ?? calculateWorkerId;
    const totalShards = (options.totalShards ?? options.gatewayBot.shards) ?? 1;
    const gatewayManager = {
        buckets: new Map(),
        firstShardId: options.firstShardId ?? 0,
        gatewayBot: options.gatewayBot,
        lastShardId: (options.lastShardId ?? totalShards - 1) ?? 1,
        manager: {},
        spawnShardDelay: options.spawnShardDelay ?? 5300,
        shardsPerWorker: options.shardsPerWorker ?? 25,
        totalWorkers: options.totalWorkers ?? 4,
        prepareBuckets: function() {
            return prepareBucketsOverwritten(this);
        },
        spawnShards: function() {
            return spawnShardsOverwritten(this);
        },
        stop: function(code, reason) {
            return stopOverwritten(this, code, reason);
        },
        tellWorkerToIdentify: function(workerId, shardId, bucketId) {
            return tellWorkerToIdentifyOverwritten(this, workerId, shardId, bucketId);
        },
        debug: options.debug || function() {},
        calculateTotalShards: function() {
            return calculateTotalShardsOverwritten(this);
        },
        calculateWorkerId: function(shardId) {
            return calculateWorkerIdOverwritten(this, shardId);
        }
    };
    gatewayManager.manager = createShardManager({
        createShardOptions: options.createShardOptions,
        gatewayConfig: options.gatewayConfig,
        shardIds: [],
        totalShards,
        handleMessage: function(shard, message) {
            return options.handleDiscordPayload(shard, message);
        },
        requestIdentify: async (shardId)=>{
            await gatewayManager.buckets.get(shardId % gatewayManager.gatewayBot.sessionStartLimit.maxConcurrency).leak.acquire(1);
        }
    });
    return gatewayManager;
}
function checkRateLimits(rest, url) {
    const ratelimited = rest.rateLimitedPaths.get(url);
    const global = rest.rateLimitedPaths.get("global");
    const now = Date.now();
    if (ratelimited && now < ratelimited.resetTimestamp) {
        return ratelimited.resetTimestamp - now;
    }
    if (global && now < global.resetTimestamp) {
        return global.resetTimestamp - now;
    }
    return false;
}
function cleanupQueues(rest) {
    for (const [key, queue] of rest.pathQueues){
        rest.debug(`[REST - cleanupQueues] Running for of loop. ${key}`);
        if (queue.requests.length) continue;
        rest.pathQueues.delete(key);
    }
    if (!rest.pathQueues.size) rest.processingQueue = false;
}
function createRequestBody(rest, options) {
    const headers = {
        "user-agent": USER_AGENT
    };
    if (!options.unauthorized) headers["authorization"] = `Bot ${rest.token}`;
    if (options.headers) {
        for(const key in options.headers){
            headers[key.toLowerCase()] = options.headers[key];
        }
    }
    if (options.method === "GET") {
        options.body = undefined;
    }
    if (options.body?.reason) {
        headers["X-Audit-Log-Reason"] = encodeURIComponent(options.body.reason);
        options.body.reason = undefined;
    }
    if (options.body?.file) {
        if (!Array.isArray(options.body.file)) {
            options.body.file = [
                options.body.file
            ];
        }
        const form = new FormData();
        for(let i = 0; i < options.body.file.length; i++){
            form.append(`file${i}`, options.body.file[i].blob, options.body.file[i].name);
        }
        form.append("payload_json", JSON.stringify({
            ...options.body,
            file: undefined
        }));
        options.body.file = form;
    } else if (options.body && ![
        "GET",
        "DELETE"
    ].includes(options.method)) {
        headers["Content-Type"] = "application/json";
    }
    return {
        headers,
        body: options.body?.file ?? JSON.stringify(options.body),
        method: options.method
    };
}
async function processGlobalQueue(rest) {
    if (!rest.globalQueue.length) return;
    if (rest.globalQueueProcessing) return;
    rest.globalQueueProcessing = true;
    while(rest.globalQueue.length){
        if (rest.globallyRateLimited) {
            setTimeout(()=>{
                rest.debug(`[REST - processGlobalQueue] Globally rate limited, running setTimeout.`);
                rest.processGlobalQueue(rest);
            }, 1000);
            break;
        }
        if (rest.invalidRequests === rest.maxInvalidRequests - rest.invalidRequestsSafetyAmount) {
            setTimeout(()=>{
                const time = rest.invalidRequestsInterval - (Date.now() - rest.invalidRequestFrozenAt);
                rest.debug(`[REST - processGlobalQueue] Freeze global queue because of invalid requests. Time Remaining: ${time / 1000} seconds.`);
                rest.processGlobalQueue(rest);
            }, 1000);
            break;
        }
        const request = rest.globalQueue.shift();
        if (!request) continue;
        const urlResetIn = rest.checkRateLimits(rest, request.basicURL);
        const bucketResetIn = request.payload.bucketId ? rest.checkRateLimits(rest, request.payload.bucketId) : false;
        if (urlResetIn || bucketResetIn) {
            setTimeout(()=>{
                rest.debug(`[REST - processGlobalQueue] rate limited, running setTimeout.`);
                rest.globalQueue.unshift(request);
                rest.processGlobalQueue(rest);
            }, urlResetIn || bucketResetIn);
            continue;
        }
        await rest.sendRequest(rest, {
            url: request.urlToUse,
            method: request.request.method,
            bucketId: request.payload.bucketId,
            reject: request.request.reject,
            respond: request.request.respond,
            retryCount: request.payload.retryCount ?? 0,
            payload: rest.createRequestBody(rest, {
                method: request.request.method,
                body: request.payload.body
            })
        }).catch(()=>null);
    }
    rest.globalQueueProcessing = false;
}
function processQueue(rest, id) {
    const queue = rest.pathQueues.get(id);
    if (!queue) return;
    while(queue.requests.length){
        rest.debug(`[REST - processQueue] Running while loop.`);
        const queuedRequest = queue.requests[0];
        if (!queuedRequest) break;
        const basicURL = rest.simplifyUrl(queuedRequest.request.url, queuedRequest.request.method);
        const urlResetIn = rest.checkRateLimits(rest, basicURL);
        if (urlResetIn) {
            if (!queue.isWaiting) {
                queue.isWaiting = true;
                setTimeout(()=>{
                    queue.isWaiting = false;
                    rest.debug(`[REST - processQueue] rate limited, running setTimeout.`);
                    rest.processQueue(rest, id);
                }, urlResetIn);
            }
            break;
        }
        const bucketResetIn = queuedRequest.payload.bucketId ? rest.checkRateLimits(rest, queuedRequest.payload.bucketId) : false;
        if (bucketResetIn) continue;
        rest.debug(`[REST - Add To Global Queue] ${JSON.stringify(queuedRequest.payload)}`);
        rest.globalQueue.push({
            ...queuedRequest,
            urlToUse: queuedRequest.request.url,
            basicURL
        });
        rest.processGlobalQueue(rest);
        queue.requests.shift();
    }
    rest.cleanupQueues(rest);
}
function processRateLimitedPaths(rest) {
    const now = Date.now();
    for (const [key, value] of rest.rateLimitedPaths.entries()){
        rest.debug(`[REST - processRateLimitedPaths] Running for of loop. ${value.resetTimestamp - now}`);
        if (value.resetTimestamp > now) continue;
        rest.rateLimitedPaths.delete(key);
        if (key === "global") rest.globallyRateLimited = false;
    }
    if (!rest.rateLimitedPaths.size) {
        rest.processingRateLimitedPaths = false;
    } else {
        rest.processingRateLimitedPaths = true;
        setTimeout(()=>{
            rest.debug(`[REST - processRateLimitedPaths] Running setTimeout.`);
            rest.processRateLimitedPaths(rest);
        }, 1000);
    }
}
function processRequest(rest, request, payload) {
    const route = request.url.substring(request.url.indexOf("api/"));
    const parts = route.split("/");
    parts.shift();
    if (parts[0]?.startsWith("v")) parts.shift();
    request.url = `${BASE_URL}/v${rest.version}/${parts.join("/")}`;
    parts.shift();
    const url = rest.simplifyUrl(request.url, request.method);
    const queue = rest.pathQueues.get(url);
    if (queue) {
        queue.requests.push({
            request,
            payload
        });
    } else {
        rest.pathQueues.set(url, {
            isWaiting: false,
            requests: [
                {
                    request,
                    payload
                }, 
            ]
        });
        rest.processQueue(rest, url);
    }
}
function processRequestHeaders(rest, url, headers) {
    let rateLimited = false;
    const remaining = headers.get("x-ratelimit-remaining");
    const retryAfter = headers.get("x-ratelimit-reset-after");
    const reset = Date.now() + Number(retryAfter) * 1000;
    const global = headers.get("x-ratelimit-global");
    const bucketId = headers.get("x-ratelimit-bucket") || undefined;
    if (remaining === "0") {
        rateLimited = true;
        rest.rateLimitedPaths.set(url, {
            url,
            resetTimestamp: reset,
            bucketId
        });
        if (bucketId) {
            rest.rateLimitedPaths.set(bucketId, {
                url,
                resetTimestamp: reset,
                bucketId
            });
        }
    }
    if (global) {
        const retryAfter1 = headers.get("retry-after");
        const globalReset = Date.now() + Number(retryAfter1) * 1000;
        rest.debug(`[REST = Globally Rate Limited] URL: ${url} | Global Rest: ${globalReset}`);
        rest.globallyRateLimited = true;
        rateLimited = true;
        rest.rateLimitedPaths.set("global", {
            url: "global",
            resetTimestamp: globalReset,
            bucketId
        });
        if (bucketId) {
            rest.rateLimitedPaths.set(bucketId, {
                url: "global",
                resetTimestamp: globalReset,
                bucketId
            });
        }
    }
    if (rateLimited && !rest.processingRateLimitedPaths) {
        rest.processRateLimitedPaths(rest);
    }
    return rateLimited ? bucketId : undefined;
}
function convertRestError(errorStack, data) {
    errorStack.message = `[${data.status}] ${data.error}\n${data.body}`;
    return errorStack;
}
async function runMethod(rest, method, route, body, options) {
    rest.debug(`[REST - RequestCreate] Method: ${method} | URL: ${route} | Retry Count: ${options?.retryCount ?? 0} | Bucket ID: ${options?.bucketId} | Body: ${JSON.stringify(body)}`);
    const errorStack = new Error("Location:");
    Error.captureStackTrace?.(errorStack);
    if (!baseEndpoints.BASE_URL.startsWith(BASE_URL) && route[0] === "/") {
        const result = await fetch(`${baseEndpoints.BASE_URL}${route}`, {
            body: body ? JSON.stringify(body) : undefined,
            headers: {
                Authorization: rest.secretKey,
                "Content-Type": "application/json"
            },
            method
        }).catch((error)=>{
            errorStack.message = error?.message;
            console.error(error);
            throw errorStack;
        });
        if (!result.ok) {
            errorStack.message = result.statusText;
            rest.debug(`[ERROR] ${errorStack.message}`);
            await result.text();
            throw errorStack;
        }
        return result.status !== 204 ? await result.json() : undefined;
    }
    return new Promise((resolve, reject)=>{
        rest.processRequest(rest, {
            url: route[0] === "/" ? `${BASE_URL}/v${10}${route}` : route,
            method,
            reject: (data)=>{
                const restError = rest.convertRestError(errorStack, data);
                reject(restError);
            },
            respond: (data)=>resolve(data.status !== 204 ? JSON.parse(data.body ?? "{}") : undefined)
        }, {
            bucketId: options?.bucketId,
            body: body,
            retryCount: options?.retryCount ?? 0,
            headers: options?.headers
        });
    });
}
function simplifyUrl(url, method) {
    let route = url.replace(/\/([a-z-]+)\/(?:[0-9]{17,19})/g, function(match, p) {
        return [
            "channels",
            "guilds"
        ].includes(p) ? match : `/${p}/skillzPrefersID`;
    }).replace(/\/reactions\/[^/]+/g, "/reactions/skillzPrefersID");
    if (route.includes("/reactions")) {
        route = route.substring(0, route.indexOf("/reactions") + "/reactions".length);
    }
    if (method === "DELETE" && route.endsWith("/messages/skillzPrefersID")) {
        route = method + route;
    }
    return route;
}
function removeTokenPrefix(token, type = "REST") {
    if (!token) throw new Error(`The ${type} was not given a token. Please provide a token and try again.`);
    if (!token.startsWith("Bot ")) return token;
    return token.substring(token.indexOf(" ") + 1);
}
function getBotIdFromToken(token) {
    return BigInt(atob(token.split(".")[0]));
}
async function sendRequest(rest, options) {
    try {
        rest.debug(`[REST - fetching] URL: ${options.url} | ${JSON.stringify(options)}`);
        const newURL = options.url.startsWith(BASE_URL) ? options.url : `${BASE_URL}/v${rest.version}/${options.url}`;
        rest.debug(`[REST - url data] URL: ${newURL}`);
        const response = await fetch(new Request(newURL, {
            method: options.method,
            headers: options.payload?.headers,
            body: options.payload?.body
        }));
        rest.debug(`[REST - fetched] URL: ${options.url} | ${JSON.stringify(options)}`);
        const bucketIdFromHeaders = rest.processRequestHeaders(rest, rest.simplifyUrl(options.url, options.method), response.headers);
        if (bucketIdFromHeaders) {
            options.bucketId = bucketIdFromHeaders;
        }
        if (response.status < 200 || response.status >= 400) {
            rest.debug(`[REST - httpError] Payload: ${JSON.stringify(options)} | Response: ${JSON.stringify(response)}`);
            let error = "REQUEST_UNKNOWN_ERROR";
            switch(response.status){
                case HTTPResponseCodes.BadRequest:
                    error = "The options was improperly formatted, or the server couldn't understand it.";
                    break;
                case HTTPResponseCodes.Unauthorized:
                    error = "The Authorization header was missing or invalid.";
                    break;
                case HTTPResponseCodes.Forbidden:
                    error = "The Authorization token you passed did not have permission to the resource.";
                    break;
                case HTTPResponseCodes.NotFound:
                    error = "The resource at the location specified doesn't exist.";
                    break;
                case HTTPResponseCodes.MethodNotAllowed:
                    error = "The HTTP method used is not valid for the location specified.";
                    break;
                case HTTPResponseCodes.GatewayUnavailable:
                    error = "There was not a gateway available to process your options. Wait a bit and retry.";
                    break;
            }
            if (rest.invalidRequestErrorStatuses.includes(response.status) && !(response.status === 429 && response.headers.get("X-RateLimit-Scope"))) {
                ++rest.invalidRequests;
                if (!rest.invalidRequestsTimeoutId) {
                    rest.invalidRequestsTimeoutId = setTimeout(()=>{
                        rest.debug(`[REST - processGlobalQueue] Resetting invalid optionss counter in setTimeout.`);
                        rest.invalidRequests = 0;
                        rest.invalidRequestsTimeoutId = 0;
                    }, rest.invalidRequestsInterval);
                }
            }
            if (response.status !== 429) {
                options.reject?.({
                    ok: false,
                    status: response.status,
                    error,
                    body: response.type ? JSON.stringify(await response.json()) : undefined
                });
                throw new Error(JSON.stringify({
                    ok: false,
                    status: response.status,
                    error,
                    body: response.type ? JSON.stringify(await response.json()) : undefined
                }));
            } else {
                if (options.retryCount && (options.retryCount++) >= rest.maxRetryCount) {
                    rest.debug(`[REST - RetriesMaxed] ${JSON.stringify(options)}`);
                    options.reject?.({
                        ok: false,
                        status: response.status,
                        error: "The options was rate limited and it maxed out the retries limit."
                    });
                    return;
                }
            }
        }
        if (response.status === 204) {
            rest.debug(`[REST - FetchSuccess] URL: ${options.url} | ${JSON.stringify(options)}`);
            options.respond?.({
                ok: true,
                status: 204
            });
            return;
        } else {
            const json = JSON.stringify(await response.json());
            rest.debug(`[REST - fetchSuccess] ${JSON.stringify(options)}`);
            options.respond?.({
                ok: true,
                status: 200,
                body: json
            });
            return JSON.parse(json);
        }
    } catch (error1) {
        rest.debug(`[REST - fetchFailed] Payload: ${JSON.stringify(options)} | Error: ${error1}`);
        options.reject?.({
            ok: false,
            status: 599,
            error: "Internal Proxy Error"
        });
        throw new Error("Something went wrong in sendRequest", {
            cause: error1
        });
    }
}
function createRestManager(options) {
    const version = options.version || 10;
    if (options.customUrl) {
        baseEndpoints.BASE_URL = `${options.customUrl}/v${version}`;
    }
    return {
        invalidRequests: 0,
        maxInvalidRequests: 10000,
        invalidRequestsInterval: 600000,
        invalidRequestsTimeoutId: 0,
        invalidRequestsSafetyAmount: 1,
        invalidRequestFrozenAt: 0,
        invalidRequestErrorStatuses: [
            401,
            403,
            429
        ],
        version,
        token: removeTokenPrefix(options.token),
        maxRetryCount: options.maxRetryCount || 10,
        secretKey: options.secretKey || "discordeno_best_lib_ever",
        customUrl: options.customUrl || "",
        pathQueues: new Map(),
        processingQueue: false,
        processingRateLimitedPaths: false,
        globallyRateLimited: false,
        globalQueue: [],
        globalQueueProcessing: false,
        rateLimitedPaths: new Map(),
        debug: options.debug || function(_text) {},
        checkRateLimits: options.checkRateLimits || checkRateLimits,
        cleanupQueues: options.cleanupQueues || cleanupQueues,
        processQueue: options.processQueue || processQueue,
        processRateLimitedPaths: options.processRateLimitedPaths || processRateLimitedPaths,
        processRequestHeaders: options.processRequestHeaders || processRequestHeaders,
        processRequest: options.processRequest || processRequest,
        createRequestBody: options.createRequestBody || createRequestBody,
        runMethod: options.runMethod || runMethod,
        simplifyUrl: options.simplifyUrl || simplifyUrl,
        processGlobalQueue: options.processGlobalQueue || processGlobalQueue,
        convertRestError: options.convertRestError || convertRestError,
        sendRequest: options.sendRequest || sendRequest
    };
}
var AutoModerationEventTypes;
(function(AutoModerationEventTypes) {
    AutoModerationEventTypes[AutoModerationEventTypes["MessageSend"] = 1] = "MessageSend";
})(AutoModerationEventTypes || (AutoModerationEventTypes = {}));
var AutoModerationTriggerTypes;
(function(AutoModerationTriggerTypes) {
    AutoModerationTriggerTypes[AutoModerationTriggerTypes["Keyword"] = 1] = "Keyword";
    AutoModerationTriggerTypes[AutoModerationTriggerTypes["HarmfulLink"] = 2] = "HarmfulLink";
    AutoModerationTriggerTypes[AutoModerationTriggerTypes["Spam"] = 3] = "Spam";
    AutoModerationTriggerTypes[AutoModerationTriggerTypes["KeywordPreset"] = 4] = "KeywordPreset";
})(AutoModerationTriggerTypes || (AutoModerationTriggerTypes = {}));
var DiscordAutoModerationRuleTriggerMetadataPresets;
(function(DiscordAutoModerationRuleTriggerMetadataPresets) {
    DiscordAutoModerationRuleTriggerMetadataPresets[DiscordAutoModerationRuleTriggerMetadataPresets["Profanity"] = 1] = "Profanity";
    DiscordAutoModerationRuleTriggerMetadataPresets[DiscordAutoModerationRuleTriggerMetadataPresets["SexualContent"] = 2] = "SexualContent";
    DiscordAutoModerationRuleTriggerMetadataPresets[DiscordAutoModerationRuleTriggerMetadataPresets["Slurs"] = 3] = "Slurs";
})(DiscordAutoModerationRuleTriggerMetadataPresets || (DiscordAutoModerationRuleTriggerMetadataPresets = {}));
var AutoModerationActionType;
(function(AutoModerationActionType) {
    AutoModerationActionType[AutoModerationActionType["BlockMessage"] = 1] = "BlockMessage";
    AutoModerationActionType[AutoModerationActionType["SendAlertMessage"] = 2] = "SendAlertMessage";
    AutoModerationActionType[AutoModerationActionType["Timeout"] = 3] = "Timeout";
})(AutoModerationActionType || (AutoModerationActionType = {}));
class Permissions {
    static Flags = BitwisePermissionFlags;
    bitfield;
    constructor(bitfield){
        this.bitfield = Permissions.resolve(bitfield);
    }
    has(bit) {
        if (this.bitfield & BigInt(Permissions.Flags.ADMINISTRATOR)) {
            return true;
        }
        return !!(this.bitfield & Permissions.resolve(bit));
    }
    static resolve(bit) {
        switch(typeof bit){
            case "bigint":
                return bit;
            case "number":
                return BigInt(bit);
            case "string":
                return BigInt(Permissions.Flags[bit]);
            case "object":
                return Permissions.resolve(bit.map((p)=>BigInt(Permissions.Flags[p])).reduce((acc, cur)=>acc | cur, 0n));
            default:
                throw new TypeError(`Cannot resolve permission: ${bit}`);
        }
    }
}
class EventEmitter {
    listeners = new Map();
     #addListener(event, func) {
        this.listeners.set(event, this.listeners.get(event) || []);
        this.listeners.get(event)?.push(func);
        return this;
    }
    on(event, func) {
        return this.#addListener(event, func);
    }
     #removeListener(event1, func1) {
        if (this.listeners.has(event1)) {
            const listener = this.listeners.get(event1);
            if (listener?.includes(func1)) {
                listener.splice(listener.indexOf(func1), 1);
                if (listener.length === 0) {
                    this.listeners.delete(event1);
                }
            }
        }
        return this;
    }
    off(event, func) {
        return this.#removeListener(event, func);
    }
    once(event, func) {
        const closure = ()=>{
            func();
            this.off(event, func);
        };
        const listener = this.listeners.get(event) ?? [];
        listener.push(closure);
        return this;
    }
    emit(event, ...args) {
        const listener = this.listeners.get(event);
        if (!listener) {
            return false;
        }
        listener.forEach((f)=>f(...args));
        return true;
    }
    listenerCount(eventName) {
        return this.listeners.get(eventName)?.length ?? 0;
    }
    rawListeners(eventName) {
        return this.listeners.get(eventName);
    }
}
var MessageFlags;
(function(MessageFlags) {
    MessageFlags[MessageFlags["CrossPosted"] = 1] = "CrossPosted";
    MessageFlags[MessageFlags["IsCrosspost"] = 2] = "IsCrosspost";
    MessageFlags[MessageFlags["SupressEmbeds"] = 4] = "SupressEmbeds";
    MessageFlags[MessageFlags["SourceMessageDeleted"] = 8] = "SourceMessageDeleted";
    MessageFlags[MessageFlags["Urgent"] = 16] = "Urgent";
    MessageFlags[MessageFlags["HasThread"] = 32] = "HasThread";
    MessageFlags[MessageFlags["Ephemeral"] = 64] = "Ephemeral";
    MessageFlags[MessageFlags["Loading"] = 128] = "Loading";
    MessageFlags[MessageFlags["FailedToMentionSomeRolesInThread"] = 256] = "FailedToMentionSomeRolesInThread";
})(MessageFlags || (MessageFlags = {}));
class Util {
    static formatImageURL(url, size = 128, format) {
        return `${url}.${format || (url.includes("/a_") ? "gif" : "jpg")}?size=${size}`;
    }
    static iconHashToBigInt(hash) {
        return BigInt("0x" + (hash.startsWith("a_") ? `a${hash.substring(2)}` : `b${hash}`));
    }
    static iconBigintToHash(icon) {
        const hash = icon.toString(16);
        return hash.startsWith("a") ? `a_${hash.substring(1)}` : hash.substring(1);
    }
}
function USER_AVATAR(userId, icon) {
    return `${baseEndpoints.CDN_URL}/avatars/${userId}/${icon}`;
}
function EMOJI_URL(id, animated = false) {
    return `https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "png"}`;
}
function USER_DEFAULT_AVATAR(altIcon) {
    return `${baseEndpoints.CDN_URL}/embed/avatars/${altIcon}.png`;
}
function GUILD_BANNER(guildId, icon) {
    return `${baseEndpoints.CDN_URL}/banners/${guildId}/${icon}`;
}
function GUILD_SPLASH(guildId, icon) {
    return `${baseEndpoints.CDN_URL}/splashes/${guildId}/${icon}`;
}
function GUILD_ICON(guildId, icon) {
    return `${baseEndpoints.CDN_URL}/icons/${guildId}/${icon}`;
}
function USER(userId) {
    if (!userId) return "/users/@me";
    return `/users/${userId}`;
}
function GATEWAY_BOT() {
    return "/gateway/bot";
}
function CHANNEL(channelId) {
    return `/channels/${channelId}`;
}
function CHANNEL_INVITES(channelId) {
    return `/channels/${channelId}/invites`;
}
function CHANNEL_TYPING(channelId) {
    return `/channels/${channelId}/typing`;
}
function CHANNEL_MESSAGES(channelId, options) {
    let url = `/channels/${channelId}/messages?`;
    if (options) {
        if (options.after) url += `after=${options.after}`;
        if (options.before) url += `&before=${options.before}`;
        if (options.around) url += `&around=${options.around}`;
        if (options.limit) url += `&limit=${options.limit}`;
    }
    return url;
}
function CHANNEL_MESSAGE(channelId, messageId) {
    return `/channels/${channelId}/messages/${messageId}`;
}
function GUILD_MEMBER(guildId, userId) {
    return `/guilds/${guildId}/members/${userId}`;
}
function GUILD_BAN(guildId, userId) {
    return `/guilds/${guildId}/bans/${userId}`;
}
function GUILD_ROLE(guildId, roleId) {
    return `/guilds/${guildId}/roles/${roleId}`;
}
function GUILD_ROLES(guildId) {
    return `/guilds/${guildId}/roles`;
}
function USER_GUILDS(guildId) {
    if (guildId) return `/users/@me/guilds/${guildId}`;
    return `/users/@me/guilds/`;
}
function GUILD_EMOJIS(guildId) {
    return `/guilds/${guildId}/emojis`;
}
function GUILD_EMOJI(guildId, emojiId) {
    return `/guilds/${guildId}/emojis/${emojiId}`;
}
function GUILDS(guildId) {
    if (guildId) return `/guilds/${guildId}`;
    return `/guilds`;
}
function INVITE(inviteCode, options) {
    let url = `/invites/${inviteCode}?`;
    if (options) {
        if (options.withCounts) url += `with_counts=${options.withCounts}`;
        if (options.withExpiration) url += `&with_expiration=${options.withExpiration}`;
        if (options.scheduledEventId) url += `&guild_scheduled_event_id=${options.scheduledEventId}`;
    }
    return url;
}
function GUILD_INVITES(guildId) {
    return `/guilds/${guildId}/invites`;
}
function INTERACTION_ID_TOKEN(interactionId, token) {
    return `/interactions/${interactionId}/${token}/callback`;
}
function WEBHOOK_MESSAGE_ORIGINAL(webhookId, token, options) {
    let url = `/webhooks/${webhookId}/${token}/messages/@original?`;
    if (options) {
        if (options.threadId) url += `threadId=${options.threadId}`;
    }
    return url;
}
function WEBHOOK_MESSAGE(webhookId, token, messageId, options) {
    let url = `/webhooks/${webhookId}/${token}/messages/${messageId}?`;
    if (options) {
        if (options.threadId) url += `threadId=${options.threadId}`;
    }
    return url;
}
function WEBHOOK_TOKEN(webhookId, token) {
    if (!token) return `/webhooks/${webhookId}`;
    return `/webhooks/${webhookId}/${token}`;
}
function WEBHOOK(webhookId, token, options) {
    let url = `/webhooks/${webhookId}/${token}`;
    if (options?.wait) url += `?wait=${options.wait}`;
    if (options?.threadId) url += `?threadId=${options.threadId}`;
    if (options?.wait && options.threadId) url += `?wait=${options.wait}&threadId=${options.threadId}`;
    return url;
}
function USER_NICK(guildId) {
    return `/guilds/${guildId}/members/@me`;
}
function GUILD_PRUNE(guildId, options) {
    let url = `/guilds/${guildId}/prune?`;
    if (options?.days) url += `days=${options.days}`;
    if (options?.includeRoles) url += `&include_roles=${options.includeRoles}`;
    return url;
}
function CHANNEL_PIN(channelId, messageId) {
    return `/channels/${channelId}/pins/${messageId}`;
}
function CHANNEL_PINS(channelId) {
    return `/channels/${channelId}/pins`;
}
function CHANNEL_MESSAGE_REACTION_ME(channelId, messageId, emoji) {
    return `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`;
}
function CHANNEL_MESSAGE_REACTION_USER(channelId, messageId, emoji, userId) {
    return `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/${userId}`;
}
function CHANNEL_MESSAGE_REACTIONS(channelId, messageId) {
    return `/channels/${channelId}/messages/${messageId}/reactions`;
}
function CHANNEL_MESSAGE_REACTION(channelId, messageId, emoji, options) {
    let url = `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}?`;
    if (options?.after) url += `after=${options.after}`;
    if (options?.limit) url += `&limit=${options.limit}`;
    return url;
}
function CHANNEL_MESSAGE_CROSSPOST(channelId, messageId) {
    return `/channels/${channelId}/messages/${messageId}/crosspost`;
}
function GUILD_MEMBER_ROLE(guildId, memberId, roleId) {
    return `/guilds/${guildId}/members/${memberId}/roles/${roleId}`;
}
function CHANNEL_WEBHOOKS(channelId) {
    return `/channels/${channelId}/webhooks`;
}
function THREAD_START_PUBLIC(channelId, messageId) {
    return `/channels/${channelId}/messages/${messageId}/threads`;
}
function THREAD_START_PRIVATE(channelId) {
    return `/channels/${channelId}/threads`;
}
function THREAD_ACTIVE(guildId) {
    return `/guilds/${guildId}/threads/active`;
}
function THREAD_ME(channelId) {
    return `/channels/${channelId}/thread-members/@me`;
}
function THREAD_MEMBERS(channelId) {
    return `/channels/${channelId}/thread-members`;
}
function THREAD_USER(channelId, userId) {
    return `/channels/${channelId}/thread-members/${userId}`;
}
function THREAD_ARCHIVED_PUBLIC(channelId, options) {
    let url = `/channels/${channelId}/threads/archived/public?`;
    if (options) {
        if (options.before) url += `before=${new Date(options.before).toISOString()}`;
        if (options.limit) url += `&limit=${options.limit}`;
    }
    return url;
}
function THREAD_ARCHIVED_PRIVATE_JOINED(channelId, options) {
    let url = `/channels/${channelId}/users/@me/threads/archived/private?`;
    if (options) {
        if (options.before) url += `before=${new Date(options.before).toISOString()}`;
        if (options.limit) url += `&limit=${options.limit}`;
    }
    return url;
}
function STAGE_INSTANCE(channelId) {
    return `/stage-instances/${channelId}`;
}
function APPLICATION_COMMANDS(appId, commandId) {
    if (commandId) return `/applications/${appId}/commands/${commandId}`;
    return `/applications/${appId}/commands`;
}
function GUILD_APPLICATION_COMMANDS(appId, guildId, commandId) {
    if (commandId) return `/applications/${appId}/guilds/${guildId}/commands/${commandId}`;
    return `/applications/${appId}/guilds/${guildId}/commands`;
}
function GUILD_APPLICATION_COMMANDS_PERMISSIONS(appId, guildId, commandId) {
    if (commandId) return `/applications/${appId}/guilds/${guildId}/commands/${commandId}/permissions`;
    return `/applications/${appId}/guilds/${guildId}/commands/permissions`;
}
function GUILD_APPLICATION_COMMANDS_LOCALIZATIONS(appId, guildId, commandId, withLocalizations) {
    let url = `/applications/${appId}/guilds/${guildId}/commands/${commandId}?`;
    if (withLocalizations !== undefined) {
        url += `with_localizations=${withLocalizations}`;
    }
    return url;
}
function STICKER_PACKS() {
    return `stickers-packs`;
}
class User {
    constructor(session, data){
        this.session = session;
        this.id = data.id;
        this.username = data.username;
        this.discriminator = data.discriminator;
        this.avatarHash = data.avatar ? Util.iconHashToBigInt(data.avatar) : undefined;
        this.accentColor = data.accent_color;
        this.bot = !!data.bot;
        this.system = !!data.system;
        this.banner = data.banner ? Util.iconHashToBigInt(data.banner) : undefined;
        this.mfaEnabled = !!data.mfa_enabled;
        this.locale = data.locale;
        this.email = data.email ? data.email : undefined;
        this.verified = data.verified;
        this.flags = data.flags;
    }
    session;
    id;
    username;
    discriminator;
    avatarHash;
    accentColor;
    bot;
    system;
    banner;
    mfaEnabled;
    locale;
    email;
    flags;
    verified;
    premiumType;
    publicFlags;
    get tag() {
        return `${this.username}#${this.discriminator}}`;
    }
    fetch() {
        return this.session.fetchUser(this.id);
    }
    avatarURL(options = {
        size: 128
    }) {
        let url;
        if (!this.avatarHash) {
            url = USER_DEFAULT_AVATAR(Number(this.discriminator) % 5);
        } else {
            url = USER_AVATAR(this.id, Util.iconBigintToHash(this.avatarHash));
        }
        return Util.formatImageURL(url, options.size, options.format);
    }
    toString() {
        return `<@${this.id}>`;
    }
}
async function urlToBase64(url) {
    const buffer = await fetch(url).then((res)=>res.arrayBuffer());
    const imageStr = encode(buffer);
    const type = url.substring(url.lastIndexOf(".") + 1);
    return `data:image/${type};base64,${imageStr}`;
}
const base64abc = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "+",
    "/", 
];
function encode(data) {
    const uint8 = typeof data === "string" ? new TextEncoder().encode(data) : data instanceof Uint8Array ? data : new Uint8Array(data);
    let result = "", i;
    const l = uint8.length;
    for(i = 2; i < l; i += 3){
        result += base64abc[uint8[i - 2] >> 2];
        result += base64abc[(uint8[i - 2] & 0x03) << 4 | uint8[i - 1] >> 4];
        result += base64abc[(uint8[i - 1] & 0x0f) << 2 | uint8[i] >> 6];
        result += base64abc[uint8[i] & 0x3f];
    }
    if (i === l + 1) {
        result += base64abc[uint8[i - 2] >> 2];
        result += base64abc[(uint8[i - 2] & 0x03) << 4];
        result += "==";
    }
    if (i === l) {
        result += base64abc[uint8[i - 2] >> 2];
        result += base64abc[(uint8[i - 2] & 0x03) << 4 | uint8[i - 1] >> 4];
        result += base64abc[(uint8[i - 1] & 0x0f) << 2];
        result += "=";
    }
    return result;
}
class AutoModerationRule {
    constructor(session, data){
        this.session = session;
        this.id = data.id;
        this.guildId = data.guild_id;
        this.name = data.name;
        this.creatorId = data.creator_id;
        this.eventType = data.event_type;
        this.triggerType = data.trigger_type;
        this.triggerMetadata = {
            keywordFilter: data.trigger_metadata.keyword_filter,
            presets: data.trigger_metadata.presets
        };
        this.actions = data.actions.map((action)=>Object.create({
                type: action.type,
                metadata: {
                    channelId: action.metadata.channel_id,
                    durationSeconds: action.metadata.duration_seconds
                }
            }));
        this.enabled = !!data.enabled;
        this.exemptRoles = data.exempt_roles;
        this.exemptChannels = data.exempt_channels;
    }
    session;
    id;
    guildId;
    name;
    creatorId;
    eventType;
    triggerType;
    triggerMetadata;
    actions;
    enabled;
    exemptRoles;
    exemptChannels;
}
class AutoModerationExecution {
    constructor(session, data){
        this.session = session;
        this.guildId = data.guild_id;
        this.action = Object.create({
            type: data.action.type,
            metadata: {
                channelId: data.action.metadata.channel_id,
                durationSeconds: data.action.metadata.duration_seconds
            }
        });
        this.ruleId = data.rule_id;
        this.ruleTriggerType = data.rule_trigger_type;
        this.userId = data.user_id;
        this.content = data.content;
        if (data.channel_id) {
            this.channelId = data.channel_id;
        }
        if (data.message_id) {
            this.messageId = data.message_id;
        }
        if (data.alert_system_message_id) {
            this.alertSystemMessageId = data.alert_system_message_id;
        }
        if (data.matched_keyword) {
            this.matchedKeyword = data.matched_keyword;
        }
        if (data.matched_content) {
            this.matched_content = data.matched_content;
        }
    }
    session;
    guildId;
    action;
    ruleId;
    ruleTriggerType;
    userId;
    channelId;
    messageId;
    alertSystemMessageId;
    content;
    matchedKeyword;
    matched_content;
}
const Snowflake = {
    snowflakeToTimestamp (id) {
        return (Number(id) >> 22) + 14200704e5;
    }
};
function transformOasisInteractionDataOption(o) {
    const output = {
        ...o,
        Otherwise: o.value
    };
    switch(o.type){
        case ApplicationCommandOptionTypes.String:
            output.String = o.value;
            break;
        case ApplicationCommandOptionTypes.Number:
            output.Number = o.value;
            break;
        case ApplicationCommandOptionTypes.Integer:
            output.Integer = o.value;
            break;
        case ApplicationCommandOptionTypes.Boolean:
            output.Boolean = o.value;
            break;
        case ApplicationCommandOptionTypes.Role:
            output.Role = BigInt(o.value);
            break;
        case ApplicationCommandOptionTypes.User:
            output.User = BigInt(o.value);
            break;
        case ApplicationCommandOptionTypes.Channel:
            output.Channel = BigInt(o.value);
            break;
        case ApplicationCommandOptionTypes.Mentionable:
        case ApplicationCommandOptionTypes.SubCommand:
        case ApplicationCommandOptionTypes.SubCommandGroup:
        default:
            output.Otherwise = o.value;
    }
    return output;
}
class CommandInteractionOptionResolver {
    #subcommand;
    #group;
    hoistedOptions;
    resolved;
    constructor(options, resolved){
        this.hoistedOptions = options?.map(transformOasisInteractionDataOption) ?? [];
        if (this.hoistedOptions[0]?.type === ApplicationCommandOptionTypes.SubCommandGroup) {
            this.#group = this.hoistedOptions[0].name;
            this.hoistedOptions = (this.hoistedOptions[0].options ?? []).map(transformOasisInteractionDataOption);
        }
        if (this.hoistedOptions[0]?.type === ApplicationCommandOptionTypes.SubCommand) {
            this.#subcommand = this.hoistedOptions[0].name;
            this.hoistedOptions = (this.hoistedOptions[0].options ?? []).map(transformOasisInteractionDataOption);
        }
        this.resolved = resolved;
    }
    getTypedOption(name, type, properties, required) {
        const option = this.get(name, required);
        if (!option) {
            return;
        }
        if (option.type !== type) {}
        if (required === true && properties.every((prop)=>typeof option[prop] === "undefined")) {
            throw new TypeError(`Properties ${properties.join(", ")} are missing in option ${name}`);
        }
        return option;
    }
    get(name, required) {
        const option = this.hoistedOptions.find((o)=>typeof name === "number" ? o.name === name.toString() : o.name === name);
        if (!option) {
            if (required && name in this.hoistedOptions.map((o)=>o.name)) {
                throw new TypeError("Option marked as required was undefined");
            }
            return;
        }
        return option;
    }
    getString(name, required = false) {
        const option = this.getTypedOption(name, ApplicationCommandOptionTypes.String, [
            "Otherwise"
        ], required);
        return option?.Otherwise ?? undefined;
    }
    getNumber(name, required = false) {
        const option = this.getTypedOption(name, ApplicationCommandOptionTypes.Number, [
            "Otherwise"
        ], required);
        return option?.Otherwise ?? undefined;
    }
    getInteger(name, required = false) {
        const option = this.getTypedOption(name, ApplicationCommandOptionTypes.Integer, [
            "Otherwise"
        ], required);
        return option?.Otherwise ?? undefined;
    }
    getBoolean(name, required = false) {
        const option = this.getTypedOption(name, ApplicationCommandOptionTypes.Boolean, [
            "Otherwise"
        ], required);
        return option?.Otherwise ?? undefined;
    }
    getUser(name, required = false) {
        const option = this.getTypedOption(name, ApplicationCommandOptionTypes.User, [
            "Otherwise", 
        ], required);
        return option?.Otherwise ?? undefined;
    }
    getChannel(name, required = false) {
        const option = this.getTypedOption(name, ApplicationCommandOptionTypes.Channel, [
            "Otherwise"
        ], required);
        return option?.Otherwise ?? undefined;
    }
    getMentionable(name, required = false) {
        const option = this.getTypedOption(name, ApplicationCommandOptionTypes.Mentionable, [
            "Otherwise"
        ], required);
        return option?.Otherwise ?? undefined;
    }
    getRole(name, required = false) {
        const option = this.getTypedOption(name, ApplicationCommandOptionTypes.Role, [
            "Otherwise", 
        ], required);
        return option?.Otherwise ?? undefined;
    }
    getAttachment(name, required = false) {
        const option = this.getTypedOption(name, ApplicationCommandOptionTypes.Attachment, [
            "Otherwise"
        ], required);
        return option?.Otherwise ?? undefined;
    }
    getFocused(full = false) {
        const focusedOption = this.hoistedOptions.find((option)=>option.focused);
        if (!focusedOption) {
            throw new TypeError("No option found");
        }
        return full ? focusedOption : focusedOption.Otherwise;
    }
    getSubCommand(required = true) {
        if (required && !this.#subcommand) {
            throw new TypeError("Option marked as required was undefined");
        }
        return [
            this.#subcommand,
            this.hoistedOptions
        ];
    }
    getSubCommandGroup(required = false) {
        if (required && !this.#group) {
            throw new TypeError("Option marked as required was undefined");
        }
        return [
            this.#group,
            this.hoistedOptions
        ];
    }
}
class Attachment {
    constructor(session, data){
        this.session = session;
        this.id = data.id;
        this.contentType = data.content_type ? data.content_type : undefined;
        this.attachment = data.url;
        this.proxyUrl = data.proxy_url;
        this.name = data.filename;
        this.size = data.size;
        this.height = data.height ? data.height : undefined;
        this.width = data.width ? data.width : undefined;
        this.ephemeral = !!data.ephemeral;
    }
    session;
    id;
    contentType;
    attachment;
    proxyUrl;
    name;
    size;
    height;
    width;
    ephemeral;
}
class Emoji {
    constructor(session, data){
        this.id = data.id;
        this.name = data.name;
        this.animated = !!data.animated;
        this.available = !!data.available;
        this.requireColons = !!data.require_colons;
        this.session = session;
    }
    id;
    session;
    name;
    animated;
    available;
    requireColons;
}
class WelcomeChannel {
    constructor(session, data){
        this.session = session;
        this.channelId = data.channel_id;
        this.description = data.description;
        this.emoji = new Emoji(session, {
            name: data.emoji_name ? data.emoji_name : undefined,
            id: data.emoji_id ? data.emoji_id : undefined
        });
    }
    session;
    channelId;
    description;
    emoji;
    get id() {
        return this.channelId;
    }
}
class WelcomeScreen {
    constructor(session, data){
        this.session = session;
        this.welcomeChannels = data.welcome_channels.map((welcomeChannel)=>new WelcomeChannel(session, welcomeChannel));
        if (data.description) {
            this.description = data.description;
        }
    }
    session;
    description;
    welcomeChannels;
}
class ThreadMember {
    constructor(session, data){
        this.session = session;
        this.id = data.id;
        this.flags = data.flags;
        this.timestamp = Date.parse(data.join_timestamp);
    }
    session;
    id;
    flags;
    timestamp;
    get threadId() {
        return this.id;
    }
    async quitThread(memberId = this.session.botId) {
        await this.session.rest.runMethod(this.session.rest, "DELETE", THREAD_USER(this.id, memberId));
    }
    async fetchMember(memberId = this.session.botId) {
        const member = await this.session.rest.runMethod(this.session.rest, "GET", THREAD_USER(this.id, memberId));
        return new ThreadMember(this.session, member);
    }
}
function NewTeam(session, data) {
    return {
        icon: data.icon ? data.icon : undefined,
        id: data.id,
        members: data.members.map((member)=>{
            return {
                membershipState: member.membership_state,
                permissions: member.permissions,
                teamId: member.team_id,
                user: new User(session, member.user)
            };
        }),
        ownerUserId: data.owner_user_id,
        name: data.name
    };
}
class Application {
    constructor(session, data){
        this.id = data.id;
        this.session = session;
        this.name = data.name;
        this.icon = data.icon || undefined;
        this.description = data.description;
        this.rpcOrigins = data.rpc_origins;
        this.botPublic = data.bot_public;
        this.botRequireCodeGrant = data.bot_require_code_grant;
        this.termsOfServiceURL = data.terms_of_service_url;
        this.privacyPolicyURL = data.privacy_policy_url;
        this.owner = data.owner ? new User(session, data.owner) : undefined;
        this.summary = "";
        this.verifyKey = data.verify_key;
        this.team = data.team ? NewTeam(session, data.team) : undefined;
        this.guildId = data.guild_id;
        this.coverImage = data.cover_image;
        this.tags = data.tags;
        this.installParams = data.install_params;
        this.customInstallURL = data.custom_install_url;
    }
    session;
    id;
    name;
    icon;
    description;
    rpcOrigins;
    botPublic;
    botRequireCodeGrant;
    termsOfServiceURL;
    privacyPolicyURL;
    owner;
    summary;
    verifyKey;
    team;
    guildId;
    primarySkuId;
    slug;
    coverImage;
    flags;
    tags;
    installParams;
    customInstallURL;
}
class BaseComponent {
    constructor(type){
        this.type = type;
    }
    type;
    isActionRow() {
        return this.type === MessageComponentTypes.ActionRow;
    }
    isButton() {
        return this.type === MessageComponentTypes.Button;
    }
    isSelectMenu() {
        return this.type === MessageComponentTypes.SelectMenu;
    }
    isTextInput() {
        return this.type === MessageComponentTypes.InputText;
    }
}
class Button extends BaseComponent {
    constructor(session, data){
        super(data.type);
        this.session = session;
        this.type = data.type;
        this.customId = data.custom_id;
        this.label = data.label;
        this.style = data.style;
        this.disabled = data.disabled;
        if (data.emoji) {
            this.emoji = new Emoji(session, data.emoji);
        }
    }
    session;
    type;
    customId;
    label;
    style;
    disabled;
    emoji;
}
class LinkButton extends BaseComponent {
    constructor(session, data){
        super(data.type);
        this.session = session;
        this.type = data.type;
        this.url = data.url;
        this.label = data.label;
        this.style = data.style;
        this.disabled = data.disabled;
        if (data.emoji) {
            this.emoji = new Emoji(session, data.emoji);
        }
    }
    session;
    type;
    url;
    label;
    style;
    disabled;
    emoji;
}
class SelectMenu extends BaseComponent {
    constructor(session, data){
        super(data.type);
        this.session = session;
        this.type = data.type;
        this.customId = data.custom_id;
        this.options = data.options.map((option)=>{
            return {
                label: option.label,
                description: option.description,
                emoji: option.emoji || new Emoji(session, option.emoji),
                value: option.value
            };
        });
        this.placeholder = data.placeholder;
        this.minValues = data.min_values;
        this.maxValues = data.max_values;
        this.disabled = data.disabled;
    }
    session;
    type;
    customId;
    options;
    placeholder;
    minValues;
    maxValues;
    disabled;
}
class TextInput extends BaseComponent {
    constructor(session, data){
        super(data.type);
        this.session = session;
        this.type = data.type;
        this.customId = data.custom_id;
        this.label = data.label;
        this.style = data.style;
        this.placeholder = data.placeholder;
        this.value = data.value;
        this.minLength = data.min_length;
        this.maxLength = data.max_length;
    }
    session;
    type;
    style;
    customId;
    label;
    placeholder;
    value;
    minLength;
    maxLength;
}
class ActionRow extends BaseComponent {
    constructor(session, data){
        super(data.type);
        this.session = session;
        this.type = data.type;
        this.components = data.components.map((component)=>{
            switch(component.type){
                case MessageComponentTypes.Button:
                    if (component.style === ButtonStyles.Link) {
                        return new LinkButton(session, component);
                    }
                    return new Button(session, component);
                case MessageComponentTypes.SelectMenu:
                    return new SelectMenu(session, component);
                case MessageComponentTypes.InputText:
                    return new TextInput(session, component);
                case MessageComponentTypes.ActionRow:
                    throw new Error("Cannot have an action row inside an action row");
            }
        });
    }
    session;
    type;
    components;
}
class ComponentFactory {
    static from(session, component) {
        switch(component.type){
            case MessageComponentTypes.ActionRow:
                return new ActionRow(session, component);
            case MessageComponentTypes.Button:
                if (component.style === ButtonStyles.Link) return new Button(session, component);
                return new Button(session, component);
            case MessageComponentTypes.SelectMenu:
                return new SelectMenu(session, component);
            case MessageComponentTypes.InputText:
                return new TextInput(session, component);
        }
    }
}
function calculateShardId(gateway, guildId) {
    if (gateway.manager.totalShards === 1) return 0;
    return Number((guildId >> 22n) % BigInt(gateway.manager.totalShards - 1));
}
class Member {
    constructor(session, data, guildId){
        this.session = session;
        this.user = new User(session, data.user);
        this.guildId = guildId;
        this.avatarHash = data.avatar ? Util.iconHashToBigInt(data.avatar) : undefined;
        this.nickname = data.nick ? data.nick : undefined;
        this.premiumSince = data.premium_since ? Number.parseInt(data.premium_since) : undefined;
        this.joinedTimestamp = Number.parseInt(data.joined_at);
        this.roles = data.roles;
        this.deaf = !!data.deaf;
        this.mute = !!data.mute;
        this.pending = !!data.pending;
        this.communicationDisabledUntilTimestamp = data.communication_disabled_until ? Number.parseInt(data.communication_disabled_until) : undefined;
    }
    session;
    user;
    guildId;
    avatarHash;
    nickname;
    premiumSince;
    joinedTimestamp;
    roles;
    deaf;
    mute;
    pending;
    communicationDisabledUntilTimestamp;
    get id() {
        return this.user.id;
    }
    get nicknameOrUsername() {
        return this.nickname ?? this.user.username;
    }
    get joinedAt() {
        return new Date(this.joinedTimestamp);
    }
    async ban(options) {
        await Guild.prototype.banMember.call({
            id: this.guildId,
            session: this.session
        }, this.user.id, options);
        return this;
    }
    async kick(options) {
        await Guild.prototype.kickMember.call({
            id: this.guildId,
            session: this.session
        }, this.user.id, options);
        return this;
    }
    async unban() {
        await Guild.prototype.unbanMember.call({
            id: this.guildId,
            session: this.session
        }, this.user.id);
    }
    async edit(options) {
        const member = await Guild.prototype.editMember.call({
            id: this.guildId,
            session: this.session
        }, this.user.id, options);
        return member;
    }
    async addRole(roleId, options = {}) {
        await Guild.prototype.addRole.call({
            id: this.guildId,
            session: this.session
        }, this.user.id, roleId, options);
    }
    async removeRole(roleId, options = {}) {
        await Guild.prototype.removeRole.call({
            id: this.guildId,
            session: this.session
        }, this.user.id, roleId, options);
    }
    avatarURL(options = {
        size: 128
    }) {
        let url;
        if (this.user.bot) {
            return this.user.avatarURL();
        }
        if (!this.avatarHash) {
            url = USER_DEFAULT_AVATAR(Number(this.user.discriminator) % 5);
        } else {
            url = USER_AVATAR(this.user.id, Util.iconBigintToHash(this.avatarHash));
        }
        return Util.formatImageURL(url, options.size, options.format);
    }
    toString() {
        return `<@!${this.user.id}>`;
    }
}
function NewMessageReactionAdd(session, data) {
    return {
        userId: data.user_id,
        channelId: data.channel_id,
        messageId: data.message_id,
        guildId: data.guild_id,
        member: data.member ? new Member(session, data.member, data.guild_id || "") : undefined,
        emoji: new Emoji(session, data.emoji)
    };
}
class BaseChannel {
    constructor(session, data){
        this.id = data.id;
        this.session = session;
        this.name = data.name;
        this.type = data.type;
    }
    id;
    session;
    name;
    type;
    isText() {
        return textBasedChannels.includes(this.type);
    }
    isVoice() {
        return this.type === ChannelTypes.GuildVoice;
    }
    isDM() {
        return this.type === ChannelTypes.DM;
    }
    isNews() {
        return this.type === ChannelTypes.GuildNews;
    }
    isThread() {
        return this.type === ChannelTypes.GuildPublicThread || this.type === ChannelTypes.GuildPrivateThread;
    }
    isStage() {
        return this.type === ChannelTypes.GuildStageVoice;
    }
    toString() {
        return `<#${this.id}>`;
    }
}
class Webhook {
    constructor(session, data){
        this.session = session;
        this.id = data.id;
        this.type = data.type;
        this.token = data.token;
        if (data.avatar) {
            this.avatar = Util.iconHashToBigInt(data.avatar);
        }
        if (data.user) {
            this.user = new User(session, data.user);
        }
        if (data.guild_id) {
            this.guildId = data.guild_id;
        }
        if (data.channel_id) {
            this.channelId = data.channel_id;
        }
        if (data.application_id) {
            this.applicationId = data.application_id;
        }
    }
    session;
    id;
    type;
    token;
    avatar;
    applicationId;
    channelId;
    guildId;
    user;
    async execute(options) {
        if (!this.token) {
            return;
        }
        const data = {
            content: options?.content,
            embeds: options?.embeds,
            tts: options?.tts,
            allowed_mentions: options?.allowedMentions,
            components: options?.components,
            file: options?.files
        };
        const message = this.session.rest.sendRequest(this.session.rest, {
            url: WEBHOOK(this.id, this.token, {
                wait: options?.wait,
                threadId: options?.threadId
            }),
            method: "POST",
            payload: this.session.rest.createRequestBody(this.session.rest, {
                method: "POST",
                body: {
                    ...data
                }
            })
        });
        return options?.wait ?? true ? new Message(this.session, await message) : undefined;
    }
    async fetch() {
        const message = await this.session.rest.runMethod(this.session.rest, "GET", WEBHOOK_TOKEN(this.id, this.token));
        return new Webhook(this.session, message);
    }
    async fetchMessage(messageId, options) {
        if (!this.token) {
            return;
        }
        const message = await this.session.rest.runMethod(this.session.rest, "GET", WEBHOOK_MESSAGE(this.id, this.token, messageId, options));
        return new Message(this.session, message);
    }
    async deleteMessage(messageId, options) {
        if (!this.token) {
            throw new Error("No token found");
        }
        await this.session.rest.runMethod(this.session.rest, "DELETE", WEBHOOK_MESSAGE(this.id, this.token, messageId, options));
    }
    async editMessage(messageId, options) {
        if (!this.token) {
            throw new Error("No token found");
        }
        const message = await this.session.rest.runMethod(this.session.rest, "PATCH", messageId ? WEBHOOK_MESSAGE(this.id, this.token, messageId) : WEBHOOK_MESSAGE_ORIGINAL(this.id, this.token), {
            content: options?.content,
            embeds: options?.embeds,
            file: options?.files,
            components: options?.components,
            allowed_mentions: options?.allowedMentions && {
                parse: options?.allowedMentions.parse,
                replied_user: options?.allowedMentions.repliedUser,
                users: options?.allowedMentions.users,
                roles: options?.allowedMentions.roles
            },
            attachments: options?.attachments?.map((attachment)=>{
                return {
                    id: attachment.id,
                    filename: attachment.name,
                    content_type: attachment.contentType,
                    size: attachment.size,
                    url: attachment.attachment,
                    proxy_url: attachment.proxyUrl,
                    height: attachment.height,
                    width: attachment.width,
                    ephemeral: attachment.ephemeral
                };
            })
        });
        return new Message(this.session, message);
    }
}
class MessageReaction {
    constructor(session, data){
        this.session = session;
        this.me = data.me;
        this.count = data.count;
        this.emoji = new Emoji(session, data.emoji);
    }
    session;
    me;
    count;
    emoji;
}
class Message {
    constructor(session, data){
        this.session = session;
        this.id = data.id;
        this.type = data.type;
        this.channelId = data.channel_id;
        this.guildId = data.guild_id;
        this.applicationId = data.application_id;
        this.mentions = {
            users: data.mentions?.map((user)=>new User(session, user)) ?? [],
            roleIds: data.mention_roles ?? [],
            channels: data.mention_channels?.map((channel)=>ChannelFactory.from(session, channel)) ?? []
        };
        if (!data.webhook_id) {
            this.author = new User(session, data.author);
        }
        this.flags = data.flags;
        this.pinned = !!data.pinned;
        this.tts = !!data.tts;
        this.content = data.content;
        this.nonce = data.nonce;
        this.mentionEveryone = data.mention_everyone;
        this.timestamp = Date.parse(data.timestamp);
        this.editedTimestamp = data.edited_timestamp ? Date.parse(data.edited_timestamp) : undefined;
        this.reactions = data.reactions?.map((react)=>new MessageReaction(session, react)) ?? [];
        this.attachments = data.attachments.map((attachment)=>new Attachment(session, attachment));
        this.embeds = data.embeds;
        if (data.interaction) {
            this.interaction = InteractionFactory.fromMessage(session, data.interaction, data.guild_id);
        }
        if (data.thread && data.guild_id) {
            this.thread = new ThreadChannel(session, data.thread, data.guild_id);
        }
        if (data.webhook_id && data.author.discriminator === "0000") {
            this.webhook = {
                id: data.webhook_id,
                username: data.author.username,
                discriminator: data.author.discriminator,
                avatar: data.author.avatar ? Util.iconHashToBigInt(data.author.avatar) : undefined
            };
        }
        if (data.guild_id && data.member && !this.isWebhookMessage()) {
            this.member = new Member(session, {
                ...data.member,
                user: data.author
            }, data.guild_id);
        }
        this.components = data.components?.map((component)=>ComponentFactory.from(session, component)) ?? [];
        if (data.activity) {
            this.activity = {
                partyId: data.activity.party_id,
                type: data.activity.type
            };
        }
        if (data.sticker_items) {
            this.stickers = data.sticker_items.map((si)=>{
                return {
                    id: si.id,
                    name: si.name,
                    formatType: si.format_type
                };
            });
        }
        if (data.application) {
            const application = {
                id: data.application.id,
                icon: data.application.icon ? data.application.icon : undefined,
                name: data.application.name,
                guildId: data.application.guild_id,
                flags: data.application.flags,
                botPublic: data.application.bot_public,
                owner: data.application.owner ? new User(session, data.application.owner) : undefined,
                botRequireCodeGrant: data.application.bot_require_code_grant,
                coverImage: data.application.cover_image,
                customInstallURL: data.application.custom_install_url,
                description: data.application.description,
                installParams: data.application.install_params,
                tags: data.application.tags,
                verifyKey: data.application.verify_key,
                team: data.application.team ? NewTeam(session, data.application.team) : undefined,
                primarySkuId: data.application.primary_sku_id,
                privacyPolicyURL: data.application.privacy_policy_url,
                rpcOrigins: data.application.rpc_origins,
                slug: data.application.slug
            };
            Object.setPrototypeOf(application, Application.prototype);
            this.application = application;
        }
    }
    session;
    id;
    type;
    channelId;
    guildId;
    applicationId;
    mentions;
    interaction;
    author;
    flags;
    pinned;
    tts;
    content;
    nonce;
    mentionEveryone;
    timestamp;
    editedTimestamp;
    stickers;
    reactions;
    attachments;
    embeds;
    member;
    thread;
    components;
    webhook;
    application;
    activity;
    get createdTimestamp() {
        return Snowflake.snowflakeToTimestamp(this.id);
    }
    get createdAt() {
        return new Date(this.createdTimestamp);
    }
    get sentAt() {
        return new Date(this.timestamp);
    }
    get editedAt() {
        return this.editedTimestamp ? new Date(this.editedTimestamp) : undefined;
    }
    get edited() {
        return this.editedTimestamp;
    }
    get url() {
        return `https://discord.com/channels/${this.guildId ?? "@me"}/${this.channelId}/${this.id}`;
    }
    get isBot() {
        return this.author.bot;
    }
    async pin() {
        await this.session.rest.runMethod(this.session.rest, "PUT", CHANNEL_PIN(this.channelId, this.id));
    }
    async unpin() {
        await this.session.rest.runMethod(this.session.rest, "DELETE", CHANNEL_PIN(this.channelId, this.id));
    }
    async edit(options) {
        const message = await this.session.rest.runMethod(this.session.rest, "POST", CHANNEL_MESSAGE(this.id, this.channelId), {
            content: options.content,
            allowed_mentions: {
                parse: options.allowedMentions?.parse,
                roles: options.allowedMentions?.roles,
                users: options.allowedMentions?.users,
                replied_user: options.allowedMentions?.repliedUser
            },
            flags: options.flags,
            embeds: options.embeds
        });
        return message;
    }
    async suppressEmbeds(suppress = true) {
        if (this.flags === MessageFlags.SupressEmbeds && suppress === false) {
            return;
        }
        const message = await this.edit({
            flags: MessageFlags.SupressEmbeds
        });
        return message;
    }
    async delete({ reason  }) {
        await this.session.rest.runMethod(this.session.rest, "DELETE", CHANNEL_MESSAGE(this.channelId, this.id), {
            reason
        });
        return this;
    }
    async reply(options) {
        const message = await this.session.rest.runMethod(this.session.rest, "POST", CHANNEL_MESSAGES(this.channelId), {
            content: options.content,
            file: options.files,
            allowed_mentions: {
                parse: options.allowedMentions?.parse,
                roles: options.allowedMentions?.roles,
                users: options.allowedMentions?.users,
                replied_user: options.allowedMentions?.repliedUser
            },
            message_reference: options.messageReference ? {
                message_id: options.messageReference.messageId,
                channel_id: options.messageReference.channelId,
                guild_id: options.messageReference.guildId,
                fail_if_not_exists: options.messageReference.failIfNotExists ?? true
            } : undefined,
            embeds: options.embeds,
            tts: options.tts,
            components: options.components
        });
        return new Message(this.session, message);
    }
    get react() {
        return this.addReaction;
    }
    async addReaction(reaction) {
        const r = typeof reaction === "string" ? reaction : `${reaction.name}:${reaction.id}`;
        await this.session.rest.runMethod(this.session.rest, "PUT", CHANNEL_MESSAGE_REACTION_ME(this.channelId, this.id, r), {});
    }
    async removeReaction(reaction, options) {
        const r = typeof reaction === "string" ? reaction : `${reaction.name}:${reaction.id}`;
        await this.session.rest.runMethod(this.session.rest, "DELETE", options?.userId ? CHANNEL_MESSAGE_REACTION_USER(this.channelId, this.id, r, options.userId) : CHANNEL_MESSAGE_REACTION_ME(this.channelId, this.id, r));
    }
    async fetchReactions(reaction, options) {
        const r = typeof reaction === "string" ? reaction : `${reaction.name}:${reaction.id}`;
        const users = await this.session.rest.runMethod(this.session.rest, "GET", CHANNEL_MESSAGE_REACTION(this.channelId, this.id, encodeURIComponent(r), options));
        return users.map((user)=>new User(this.session, user));
    }
    async removeReactionEmoji(reaction) {
        const r = typeof reaction === "string" ? reaction : `${reaction.name}:${reaction.id}`;
        await this.session.rest.runMethod(this.session.rest, "DELETE", CHANNEL_MESSAGE_REACTION(this.channelId, this.id, r));
    }
    async nukeReactions() {
        await this.session.rest.runMethod(this.session.rest, "DELETE", CHANNEL_MESSAGE_REACTIONS(this.channelId, this.id));
    }
    async crosspost() {
        const message = await this.session.rest.runMethod(this.session.rest, "POST", CHANNEL_MESSAGE_CROSSPOST(this.channelId, this.id));
        return new Message(this.session, message);
    }
    async fetch() {
        const message = await this.session.rest.runMethod(this.session.rest, "GET", CHANNEL_MESSAGE(this.channelId, this.id));
        if (!message?.id) return;
        return new Message(this.session, message);
    }
    get publish() {
        return this.crosspost;
    }
    inGuild() {
        return !!this.guildId;
    }
    isWebhookMessage() {
        return !!this.webhook;
    }
}
class BaseGuild {
    constructor(session, data){
        this.session = session;
        this.id = data.id;
        this.name = data.name;
        this.iconHash = data.icon ? Util.iconHashToBigInt(data.icon) : undefined;
        this.features = data.features;
    }
    session;
    id;
    name;
    iconHash;
    features;
    get createdTimestamp() {
        return Snowflake.snowflakeToTimestamp(this.id);
    }
    get createdAt() {
        return new Date(this.createdTimestamp);
    }
    get partnered() {
        return this.features.includes(GuildFeatures.Partnered);
    }
    get verified() {
        return this.features.includes(GuildFeatures.Verified);
    }
    iconURL(options = {
        size: 128
    }) {
        if (this.iconHash) {
            return Util.formatImageURL(GUILD_ICON(this.id, Util.iconBigintToHash(this.iconHash)), options.size, options.format);
        }
    }
    toString() {
        return this.name;
    }
}
function NewInviteCreate(session, invite) {
    return {
        channelId: invite.channel_id,
        code: invite.code,
        createdAt: invite.created_at,
        guildId: invite.guild_id,
        inviter: invite.inviter ? new User(session, invite.inviter) : undefined,
        maxAge: invite.max_age,
        maxUses: invite.max_uses,
        targetType: invite.target_type,
        targetUser: invite.target_user ? new User(session, invite.target_user) : undefined,
        targetApplication: invite.target_application && new Application(session, invite.target_application),
        temporary: invite.temporary,
        uses: invite.uses
    };
}
class Role {
    constructor(session, data, guildId){
        this.session = session;
        this.id = data.id;
        this.guildId = guildId;
        this.hoist = data.hoist;
        this.iconHash = data.icon ? Util.iconHashToBigInt(data.icon) : undefined;
        this.color = data.color;
        this.name = data.name;
        this.unicodeEmoji = data.unicode_emoji;
        this.mentionable = data.mentionable;
        this.managed = data.managed;
        this.permissions = new Permissions(BigInt(data.permissions));
    }
    session;
    id;
    guildId;
    hoist;
    iconHash;
    color;
    name;
    unicodeEmoji;
    mentionable;
    managed;
    permissions;
    get createdTimestamp() {
        return Snowflake.snowflakeToTimestamp(this.id);
    }
    get createdAt() {
        return new Date(this.createdTimestamp);
    }
    get hexColor() {
        return `#${this.color.toString(16).padStart(6, "0")}`;
    }
    async delete() {
        await Guild.prototype.deleteRole.call({
            id: this.guildId,
            session: this.session
        }, this.id);
    }
    async edit(options) {
        const role = await Guild.prototype.editRole.call({
            id: this.guildId,
            session: this.session
        }, this.id, options);
        return role;
    }
    async add(memberId, options = {}) {
        await Guild.prototype.addRole.call({
            id: this.guildId,
            session: this.session
        }, memberId, this.id, options);
    }
    async remove(memberId, options = {}) {
        await Guild.prototype.removeRole.call({
            id: this.guildId,
            session: this.session
        }, memberId, this.id, options);
    }
    toString() {
        switch(this.id){
            case this.guildId:
                return "@everyone";
            default:
                return `<@&${this.id}>`;
        }
    }
}
class GuildEmoji extends Emoji {
    constructor(session, data, guildId){
        super(session, data);
        this.guildId = guildId;
        this.roles = data.roles;
        this.user = data.user ? new User(this.session, data.user) : undefined;
        this.managed = !!data.managed;
        this.id = super.id;
    }
    guildId;
    roles;
    user;
    managed;
    id;
    async edit(options) {
        const emoji = await Guild.prototype.editEmoji.call({
            id: this.guildId,
            session: this.session
        }, this.id, options);
        return emoji;
    }
    async delete({ reason  } = {}) {
        await Guild.prototype.deleteEmoji.call({
            id: this.guildId,
            session: this.session
        }, this.id, {
            reason
        });
        return this;
    }
    get url() {
        return EMOJI_URL(this.id, this.animated);
    }
}
class InteractionFactory {
    static from(session, interaction) {
        switch(interaction.type){
            case InteractionTypes.Ping:
                return new PingInteraction(session, interaction);
            case InteractionTypes.ApplicationCommand:
                return new CommandInteraction(session, interaction);
            case InteractionTypes.MessageComponent:
                return new ComponentInteraction(session, interaction);
            case InteractionTypes.ApplicationCommandAutocomplete:
                return new AutoCompleteInteraction(session, interaction);
            case InteractionTypes.ModalSubmit:
                return new ModalSubmitInteraction(session, interaction);
        }
    }
    static fromMessage(session, interaction, _guildId) {
        const obj = {
            id: interaction.id,
            type: interaction.type,
            name: interaction.name,
            user: new User(session, interaction.user)
        };
        return obj;
    }
}
class BaseInteraction {
    constructor(session, data){
        this.session = session;
        this.id = data.id;
        this.token = data.token;
        this.type = data.type;
        this.guildId = data.guild_id;
        this.channelId = data.channel_id;
        this.applicationId = data.application_id;
        this.version = data.version;
        const perms = data.app_permissions;
        if (perms) {
            this.appPermissions = new Permissions(BigInt(perms));
        }
        if (!data.guild_id) {
            this.user = new User(session, data.user);
        } else {
            this.member = new Member(session, data.member, data.guild_id);
        }
    }
    session;
    id;
    token;
    type;
    guildId;
    channelId;
    applicationId;
    user;
    member;
    appPermissions;
    version;
    responded = false;
    get createdTimestamp() {
        return Snowflake.snowflakeToTimestamp(this.id);
    }
    get createdAt() {
        return new Date(this.createdTimestamp);
    }
    isCommand() {
        return this.type === InteractionTypes.ApplicationCommand;
    }
    isAutoComplete() {
        return this.type === InteractionTypes.ApplicationCommandAutocomplete;
    }
    isComponent() {
        return this.type === InteractionTypes.MessageComponent;
    }
    isPing() {
        return this.type === InteractionTypes.Ping;
    }
    isModalSubmit() {
        return this.type === InteractionTypes.ModalSubmit;
    }
    inGuild() {
        return !!this.guildId;
    }
    async editReply(options) {
        const message = await this.session.rest.runMethod(this.session.rest, "PATCH", options.messageId ? WEBHOOK_MESSAGE(this.id, this.token, options.messageId) : WEBHOOK_MESSAGE_ORIGINAL(this.id, this.token), {
            content: options.content,
            embeds: options.embeds,
            file: options.files,
            components: options.components,
            allowed_mentions: options.allowedMentions && {
                parse: options.allowedMentions.parse,
                replied_user: options.allowedMentions.repliedUser,
                users: options.allowedMentions.users,
                roles: options.allowedMentions.roles
            },
            attachments: options.attachments?.map((attachment)=>{
                return {
                    id: attachment.id,
                    filename: attachment.name,
                    content_type: attachment.contentType,
                    size: attachment.size,
                    url: attachment.attachment,
                    proxy_url: attachment.proxyUrl,
                    height: attachment.height,
                    width: attachment.width
                };
            }),
            message_id: options.messageId
        });
        if (!message || !options.messageId) {
            return message;
        }
        return new Message(this.session, message);
    }
    async sendFollowUp(options) {
        const message = await Webhook.prototype.execute.call({
            id: this.applicationId,
            token: this.token,
            session: this.session
        }, options);
        return message;
    }
    async editFollowUp(messageId, options) {
        const message = await Webhook.prototype.editMessage.call({
            id: this.session.applicationId,
            token: this.token
        }, messageId, options);
        return message;
    }
    async deleteFollowUp(messageId, options) {
        await Webhook.prototype.deleteMessage.call({
            id: this.session.applicationId,
            token: this.token
        }, messageId, options);
    }
    async fetchFollowUp(messageId, options) {
        const message = await Webhook.prototype.fetchMessage.call({
            id: this.session.applicationId,
            token: this.token
        }, messageId, options);
        return message;
    }
    async respond(resp) {
        const options = "with" in resp ? resp.with : resp.data;
        const type = "type" in resp ? resp.type : InteractionResponseTypes.ChannelMessageWithSource;
        const data = {
            content: options?.content,
            custom_id: options?.customId,
            file: options?.files,
            allowed_mentions: options?.allowedMentions,
            flags: options?.flags,
            chocies: options?.choices,
            embeds: options?.embeds,
            title: options?.title,
            components: options?.components
        };
        if (!this.responded) {
            await this.session.rest.sendRequest(this.session.rest, {
                url: INTERACTION_ID_TOKEN(this.id, this.token),
                method: "POST",
                payload: this.session.rest.createRequestBody(this.session.rest, {
                    method: "POST",
                    body: {
                        type,
                        data,
                        file: options?.files
                    },
                    headers: {
                        "Authorization": ""
                    }
                })
            });
            this.responded = true;
            return;
        }
        return this.sendFollowUp(data);
    }
    async respondWith(resp) {
        const m = await this.respond({
            with: resp
        });
        return m;
    }
    async defer() {
        await this.respond({
            type: InteractionResponseTypes.DeferredChannelMessageWithSource
        });
    }
    async autocomplete() {
        await this.respond({
            type: InteractionResponseTypes.ApplicationCommandAutocompleteResult
        });
    }
}
class CommandInteraction extends BaseInteraction {
    constructor(session, data){
        super(session, data);
        this.type = data.type;
        this.commandId = data.data.id;
        this.commandName = data.data.name;
        this.commandType = data.data.type;
        this.commandGuildId = data.data.guild_id;
        this.options = new CommandInteractionOptionResolver(data.data.options ?? []);
        this.resolved = {
            users: new Map(),
            members: new Map(),
            roles: new Map(),
            attachments: new Map(),
            messages: new Map()
        };
        if (data.data.resolved?.users) {
            for (const [id, u] of Object.entries(data.data.resolved.users)){
                this.resolved.users.set(id, new User(session, u));
            }
        }
        if (data.data.resolved?.members && !!super.guildId) {
            for (const [id1, m] of Object.entries(data.data.resolved.members)){
                this.resolved.members.set(id1, new Member(session, m, super.guildId));
            }
        }
        if (data.data.resolved?.roles && !!super.guildId) {
            for (const [id2, r] of Object.entries(data.data.resolved.roles)){
                this.resolved.roles.set(id2, new Role(session, r, super.guildId));
            }
        }
        if (data.data.resolved?.attachments) {
            for (const [id3, a] of Object.entries(data.data.resolved.attachments)){
                this.resolved.attachments.set(id3, new Attachment(session, a));
            }
        }
        if (data.data.resolved?.messages) {
            for (const [id4, m1] of Object.entries(data.data.resolved.messages)){
                this.resolved.messages.set(id4, new Message(session, m1));
            }
        }
    }
    type;
    commandId;
    commandName;
    commandType;
    commandGuildId;
    resolved;
    options;
}
class ComponentInteraction extends BaseInteraction {
    constructor(session, data){
        super(session, data);
        this.type = data.type;
        this.componentType = data.data.component_type;
        this.customId = data.data.custom_id;
        this.targetId = data.data.target_id;
        this.values = data.data.values;
        this.message = new Message(session, data.message);
    }
    type;
    componentType;
    customId;
    targetId;
    values;
    message;
    isButton() {
        return this.componentType === MessageComponentTypes.Button;
    }
    isActionRow() {
        return this.componentType === MessageComponentTypes.ActionRow;
    }
    isTextInput() {
        return this.componentType === MessageComponentTypes.InputText;
    }
    isSelectMenu() {
        return this.componentType === MessageComponentTypes.SelectMenu;
    }
    async deferUpdate() {
        await this.respond({
            type: InteractionResponseTypes.DeferredUpdateMessage
        });
    }
}
class ModalSubmitInteraction extends BaseInteraction {
    constructor(session, data){
        super(session, data);
        this.type = data.type;
        this.componentType = data.data.component_type;
        this.customId = data.data.custom_id;
        this.targetId = data.data.target_id;
        this.values = data.data.values;
        this.components = data.data?.components?.map(ModalSubmitInteraction.transformComponent);
        if (data.message) {
            this.message = new Message(session, data.message);
        }
    }
    type;
    componentType;
    customId;
    targetId;
    values;
    message;
    components;
    static transformComponent(component) {
        return {
            type: component.type,
            components: component.components.map((component)=>{
                return {
                    customId: component.custom_id,
                    value: component.value
                };
            })
        };
    }
    inMessage() {
        return !!this.message;
    }
}
class PingInteraction extends BaseInteraction {
    constructor(session, data){
        super(session, data);
        this.type = data.type;
        this.commandId = data.data.id;
        this.commandName = data.data.name;
        this.commandType = data.data.type;
        this.commandGuildId = data.data.guild_id;
    }
    type;
    commandId;
    commandName;
    commandType;
    commandGuildId;
    async pong() {
        await this.session.rest.runMethod(this.session.rest, "POST", INTERACTION_ID_TOKEN(this.id, this.token), {
            type: InteractionResponseTypes.Pong
        });
    }
}
class AutoCompleteInteraction extends BaseInteraction {
    constructor(session, data){
        super(session, data);
        this.type = data.type;
        this.commandId = data.data.id;
        this.commandName = data.data.name;
        this.commandType = data.data.type;
        this.commandGuildId = data.data.guild_id;
    }
    type;
    commandId;
    commandName;
    commandType;
    commandGuildId;
    async respondWithChoices(choices) {
        await this.session.rest.runMethod(this.session.rest, "POST", INTERACTION_ID_TOKEN(this.id, this.token), {
            data: {
                choices
            },
            type: InteractionResponseTypes.ApplicationCommandAutocompleteResult
        });
    }
}
const textBasedChannels = [
    ChannelTypes.DM,
    ChannelTypes.GroupDm,
    ChannelTypes.GuildPrivateThread,
    ChannelTypes.GuildPublicThread,
    ChannelTypes.GuildNews,
    ChannelTypes.GuildVoice,
    ChannelTypes.GuildText, 
];
class TextChannel {
    constructor(session, data){
        this.session = session;
        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
        this.rateLimitPerUser = data.rate_limit_per_user ?? 0;
        this.nsfw = !!data.nsfw ?? false;
        if (data.last_message_id) {
            this.lastMessageId = data.last_message_id;
        }
        if (data.last_pin_timestamp) {
            this.lastPinTimestamp = data.last_pin_timestamp;
        }
    }
    session;
    id;
    name;
    type;
    lastMessageId;
    lastPinTimestamp;
    rateLimitPerUser;
    nsfw;
    static applyTo(klass, ignore = []) {
        const methods = [
            "fetchPins",
            "createInvite",
            "fetchMessages",
            "sendTyping",
            "pinMessage",
            "unpinMessage",
            "addReaction",
            "removeReaction",
            "nukeReactions",
            "fetchPins",
            "sendMessage",
            "editMessage",
            "createWebhook", 
        ];
        for (const method of methods){
            if (ignore.includes(method)) continue;
            klass.prototype[method] = TextChannel.prototype[method];
        }
    }
    async fetchPins() {
        const messages = await this.session.rest.runMethod(this.session.rest, "GET", CHANNEL_PINS(this.id));
        return messages[0] ? messages.map((x)=>new Message(this.session, x)) : [];
    }
    async createInvite(options) {
        const invite = await this.session.rest.runMethod(this.session.rest, "POST", CHANNEL_INVITES(this.id), options ? {
            max_age: options.maxAge,
            max_uses: options.maxUses,
            temporary: options.temporary,
            unique: options.unique,
            target_type: options.targetType,
            target_user_id: options.targetUserId,
            target_application_id: options.targetApplicationId
        } : {});
        return new Invite(this.session, invite);
    }
    async fetchMessages(options) {
        if (options?.limit > 100) throw Error("Values must be between 0-100");
        const messages = await this.session.rest.runMethod(this.session.rest, "GET", CHANNEL_MESSAGES(this.id, options));
        return messages[0] ? messages.map((x)=>new Message(this.session, x)) : [];
    }
    async sendTyping() {
        await this.session.rest.runMethod(this.session.rest, "POST", CHANNEL_TYPING(this.id));
    }
    async pinMessage(messageId) {
        await Message.prototype.pin.call({
            id: messageId,
            channelId: this.id,
            session: this.session
        });
    }
    async unpinMessage(messageId) {
        await Message.prototype.unpin.call({
            id: messageId,
            channelId: this.id,
            session: this.session
        });
    }
    async addReaction(messageId, reaction) {
        await Message.prototype.addReaction.call({
            channelId: this.id,
            id: messageId,
            session: this.session
        }, reaction);
    }
    async removeReaction(messageId, reaction, options) {
        await Message.prototype.removeReaction.call({
            channelId: this.id,
            id: messageId,
            session: this.session
        }, reaction, options);
    }
    async removeReactionEmoji(messageId, reaction) {
        await Message.prototype.removeReactionEmoji.call({
            channelId: this.id,
            id: messageId,
            session: this.session
        }, reaction);
    }
    async nukeReactions(messageId) {
        await Message.prototype.nukeReactions.call({
            channelId: this.id,
            id: messageId
        });
    }
    async fetchReactions(messageId, reaction, options) {
        const users = await Message.prototype.fetchReactions.call({
            channelId: this.id,
            id: messageId,
            session: this.session
        }, reaction, options);
        return users;
    }
    sendMessage(options) {
        return Message.prototype.reply.call({
            channelId: this.id,
            session: this.session
        }, options);
    }
    editMessage(messageId, options) {
        return Message.prototype.edit.call({
            channelId: this.id,
            id: messageId,
            session: this.session
        }, options);
    }
    async createWebhook(options) {
        const webhook = await this.session.rest.runMethod(this.session.rest, "POST", CHANNEL_WEBHOOKS(this.id), {
            name: options.name,
            avatar: options.avatar ? urlToBase64(options.avatar) : undefined,
            reason: options.reason
        });
        return new Webhook(this.session, webhook);
    }
}
class GuildChannel extends BaseChannel {
    constructor(session, data, guildId){
        super(session, data);
        this.type = data.type;
        this.guildId = guildId;
        this.position = data.position;
        data.topic ? this.topic = data.topic : null;
        data.parent_id ? this.parentId = data.parent_id : undefined;
    }
    type;
    guildId;
    topic;
    position;
    parentId;
    async fetchInvites() {
        const invites = await this.session.rest.runMethod(this.session.rest, "GET", CHANNEL_INVITES(this.id));
        return invites.map((invite)=>new Invite(this.session, invite));
    }
    async edit(options) {
        const channel = await this.session.rest.runMethod(this.session.rest, "PATCH", CHANNEL(this.id), {
            name: options.name,
            type: "type" in options ? options.type : undefined,
            position: options.position,
            topic: "topic" in options ? options.topic : undefined,
            nsfw: "nfsw" in options ? options.nfsw : undefined,
            rate_limit_per_user: "rateLimitPerUser" in options ? options.rateLimitPerUser : undefined,
            bitrate: "bitrate" in options ? options.bitrate : undefined,
            user_limit: "userLimit" in options ? options.userLimit : undefined,
            permissions_overwrites: options.permissionOverwrites,
            parent_id: "parentId" in options ? options.parentId : undefined,
            rtc_region: "rtcRegion" in options ? options.rtcRegion : undefined,
            video_quality_mode: "videoQualityMode" in options ? options.videoQualityMode : undefined,
            default_auto_archive_duration: "defaultAutoArchiveDuration" in options ? options.defaultAutoArchiveDuration : undefined
        });
        return ChannelFactory.from(this.session, channel);
    }
    async getArchivedThreads(options) {
        let func;
        switch(options.type){
            case "public":
                func = THREAD_ARCHIVED_PUBLIC;
                break;
            case "private":
                func = THREAD_START_PRIVATE;
                break;
            case "privateJoinedThreads":
                func = THREAD_ARCHIVED_PRIVATE_JOINED;
                break;
        }
        const { threads , members , has_more  } = await this.session.rest.runMethod(this.session.rest, "GET", func(this.id, options));
        return {
            threads: Object.fromEntries(threads.map((thread)=>[
                    thread.id,
                    new ThreadChannel(this.session, thread, this.id)
                ])),
            members: Object.fromEntries(members.map((threadMember)=>[
                    threadMember.id,
                    new ThreadMember(this.session, threadMember)
                ])),
            hasMore: has_more
        };
    }
    async createThread(options) {
        const thread = await this.session.rest.runMethod(this.session.rest, "POST", "messageId" in options ? THREAD_START_PUBLIC(this.id, options.messageId) : THREAD_START_PRIVATE(this.id), {
            name: options.name,
            auto_archive_duration: options.autoArchiveDuration
        });
        return new ThreadChannel(this.session, thread, thread.guild_id ?? this.guildId);
    }
}
class BaseVoiceChannel extends GuildChannel {
    constructor(session, data, guildId){
        super(session, data, guildId);
        this.bitRate = data.bitrate;
        this.userLimit = data.user_limit ?? 0;
        this.videoQuality = data.video_quality_mode;
        this.nsfw = !!data.nsfw;
        this.type = data.type;
        if (data.rtc_region) {
            this.rtcRegion = data.rtc_region;
        }
    }
    type;
    bitRate;
    userLimit;
    rtcRegion;
    videoQuality;
    nsfw;
    async connect(options) {
        const shardId = calculateShardId(this.session.gateway, BigInt(super.guildId));
        const shard = this.session.gateway.manager.shards.get(shardId);
        if (!shard) {
            throw new Error(`Shard (id: ${shardId} not found`);
        }
        await shard.send({
            op: GatewayOpcodes.VoiceStateUpdate,
            d: {
                guild_id: super.guildId,
                channel_id: super.id,
                self_mute: Boolean(options?.selfMute),
                self_deaf: options?.selfDeaf ?? true
            }
        });
    }
}
class DMChannel extends BaseChannel {
    constructor(session, data){
        super(session, data);
        this.user = new User(this.session, data.recipents.find((r)=>r.id !== this.session.botId));
        this.type = data.type;
        if (data.last_message_id) {
            this.lastMessageId = data.last_message_id;
        }
    }
    type;
    user;
    lastMessageId;
    async close() {
        const channel = await this.session.rest.runMethod(this.session.rest, "DELETE", CHANNEL(this.id));
        return new DMChannel(this.session, channel);
    }
}
TextChannel.applyTo(DMChannel);
class VoiceChannel extends BaseVoiceChannel {
    constructor(session, data, guildId){
        super(session, data, guildId);
        this.type = data.type;
    }
    type;
}
TextChannel.applyTo(VoiceChannel);
class NewsChannel extends GuildChannel {
    constructor(session, data, guildId){
        super(session, data, guildId);
        this.type = data.type;
        this.defaultAutoArchiveDuration = data.default_auto_archive_duration;
    }
    type;
    defaultAutoArchiveDuration;
    crosspostMessage(messageId) {
        return Message.prototype.crosspost.call({
            id: messageId,
            channelId: this.id,
            session: this.session
        });
    }
    get publishMessage() {
        return this.crosspostMessage;
    }
}
TextChannel.applyTo(NewsChannel);
class StageChannel extends BaseVoiceChannel {
    constructor(session, data, guildId){
        super(session, data, guildId);
        this.type = data.type;
        this.topic = data.topic ? data.topic : undefined;
    }
    type;
    topic;
}
class ThreadChannel extends GuildChannel {
    constructor(session, data, guildId){
        super(session, data, guildId);
        this.type = data.type;
        this.archived = !!data.thread_metadata?.archived;
        this.archiveTimestamp = data.thread_metadata?.archive_timestamp;
        this.autoArchiveDuration = data.thread_metadata?.auto_archive_duration;
        this.locked = !!data.thread_metadata?.locked;
        this.messageCount = data.message_count;
        this.memberCount = data.member_count;
        this.ownerId = data.owner_id;
        if (data.member) {
            this.member = new ThreadMember(session, data.member);
        }
    }
    type;
    archived;
    archiveTimestamp;
    autoArchiveDuration;
    locked;
    messageCount;
    memberCount;
    member;
    ownerId;
    async joinThread() {
        await this.session.rest.runMethod(this.session.rest, "PUT", THREAD_ME(this.id));
    }
    async addToThread(guildMemberId) {
        await this.session.rest.runMethod(this.session.rest, "PUT", THREAD_USER(this.id, guildMemberId));
    }
    async leaveToThread(guildMemberId) {
        await this.session.rest.runMethod(this.session.rest, "DELETE", THREAD_USER(this.id, guildMemberId));
    }
    removeMember(memberId = this.session.botId) {
        return ThreadMember.prototype.quitThread.call({
            id: this.id,
            session: this.session
        }, memberId);
    }
    fetchMember(memberId = this.session.botId) {
        return ThreadMember.prototype.fetchMember.call({
            id: this.id,
            session: this.session
        }, memberId);
    }
    async fetchMembers() {
        const members = await this.session.rest.runMethod(this.session.rest, "GET", THREAD_MEMBERS(this.id));
        return members.map((threadMember)=>new ThreadMember(this.session, threadMember));
    }
}
TextChannel.applyTo(ThreadChannel);
class GuildTextChannel extends GuildChannel {
    constructor(session, data, guildId){
        super(session, data, guildId);
        this.type = data.type;
    }
    type;
}
TextChannel.applyTo(GuildTextChannel);
class ChannelFactory {
    static fromGuildChannel(session, channel) {
        switch(channel.type){
            case ChannelTypes.GuildPublicThread:
            case ChannelTypes.GuildPrivateThread:
                return new ThreadChannel(session, channel, channel.guild_id);
            case ChannelTypes.GuildText:
                return new GuildTextChannel(session, channel, channel.guild_id);
            case ChannelTypes.GuildNews:
                return new NewsChannel(session, channel, channel.guild_id);
            case ChannelTypes.GuildVoice:
                return new VoiceChannel(session, channel, channel.guild_id);
            case ChannelTypes.GuildStageVoice:
                return new StageChannel(session, channel, channel.guild_id);
            default:
                throw new Error("Channel was not implemented");
        }
    }
    static from(session, channel) {
        switch(channel.type){
            case ChannelTypes.GuildPublicThread:
            case ChannelTypes.GuildPrivateThread:
                return new ThreadChannel(session, channel, channel.guild_id);
            case ChannelTypes.GuildText:
                return new GuildTextChannel(session, channel, channel.guild_id);
            case ChannelTypes.GuildNews:
                return new NewsChannel(session, channel, channel.guild_id);
            case ChannelTypes.DM:
                return new DMChannel(session, channel);
            case ChannelTypes.GuildVoice:
                return new VoiceChannel(session, channel, channel.guild_id);
            case ChannelTypes.GuildStageVoice:
                return new StageChannel(session, channel, channel.guild_id);
            default:
                if (textBasedChannels.includes(channel.type)) {
                    return new TextChannel(session, channel);
                }
                throw new Error("Channel was not implemented");
        }
    }
}
class AnonymousGuild extends BaseGuild {
    constructor(session, data){
        super(session, data);
        this.splashHash = data.splash ? Util.iconHashToBigInt(data.splash) : undefined;
        this.bannerHash = data.banner ? Util.iconHashToBigInt(data.banner) : undefined;
        this.verificationLevel = data.verification_level;
        this.vanityUrlCode = data.vanity_url_code ? data.vanity_url_code : undefined;
        this.nsfwLevel = data.nsfw_level;
        this.description = data.description ? data.description : undefined;
        this.premiumSubscriptionCount = data.premium_subscription_count;
    }
    splashHash;
    bannerHash;
    verificationLevel;
    vanityUrlCode;
    nsfwLevel;
    description;
    premiumSubscriptionCount;
    splashURL(options = {
        size: 128
    }) {
        if (this.splashHash) {
            return Util.formatImageURL(GUILD_SPLASH(this.id, Util.iconBigintToHash(this.splashHash)), options.size, options.format);
        }
    }
    bannerURL(options = {
        size: 128
    }) {
        if (this.bannerHash) {
            return Util.formatImageURL(GUILD_BANNER(this.id, Util.iconBigintToHash(this.bannerHash)), options.size, options.format);
        }
    }
}
class InviteGuild extends AnonymousGuild {
    constructor(session, data){
        super(session, data);
        if (data.welcome_screen) {
            this.welcomeScreen = new WelcomeScreen(session, data.welcome_screen);
        }
    }
    welcomeScreen;
}
class Guild extends BaseGuild {
    constructor(session, data){
        super(session, data);
        this.splashHash = data.splash ? Util.iconHashToBigInt(data.splash) : undefined;
        this.discoverySplashHash = data.discovery_splash ? Util.iconHashToBigInt(data.discovery_splash) : undefined;
        this.ownerId = data.owner_id;
        this.widgetEnabled = !!data.widget_enabled;
        this.widgetChannelId = data.widget_channel_id ? data.widget_channel_id : undefined;
        this.vefificationLevel = data.verification_level;
        this.defaultMessageNotificationLevel = data.default_message_notifications;
        this.explicitContentFilterLevel = data.explicit_content_filter;
        this.premiumTier = data.premium_tier;
        this.members = new Map(data.members?.map((member)=>[
                data.id,
                new Member(session, {
                    ...member,
                    user: member.user
                }, data.id)
            ]));
        this.roles = new Map(data.roles.map((role)=>[
                data.id,
                new Role(session, role, data.id)
            ]));
        this.emojis = new Map(data.emojis.map((guildEmoji)=>[
                guildEmoji.id,
                new GuildEmoji(session, guildEmoji, data.id)
            ]));
        this.channels = new Map(data.channels?.map((guildChannel)=>[
                guildChannel.id,
                new GuildChannel(session, guildChannel, data.id)
            ]));
    }
    splashHash;
    discoverySplashHash;
    ownerId;
    widgetEnabled;
    widgetChannelId;
    vefificationLevel;
    defaultMessageNotificationLevel;
    explicitContentFilterLevel;
    premiumTier;
    members;
    roles;
    emojis;
    channels;
    get maxEmojis() {
        switch(this.premiumTier){
            case 1:
                return 100;
            case 2:
                return 150;
            case 3:
                return 250;
            default:
                return 50;
        }
    }
    get maxStickers() {
        switch(this.premiumTier){
            case 1:
                return 15;
            case 2:
                return 30;
            case 3:
                return 60;
            default:
                return 5;
        }
    }
    async editBotNickname(options) {
        const result = await this.session.rest.runMethod(this.session.rest, "PATCH", USER_NICK(this.id), options);
        return result?.nick;
    }
    async createEmoji(options) {
        if (options.image && !options.image.startsWith("data:image/")) {
            options.image = await urlToBase64(options.image);
        }
        const emoji = await this.session.rest.runMethod(this.session.rest, "POST", GUILD_EMOJIS(this.id), options);
        return new GuildEmoji(this.session, emoji, this.id);
    }
    async deleteEmoji(id, { reason  } = {}) {
        await this.session.rest.runMethod(this.session.rest, "DELETE", GUILD_EMOJI(this.id, id), {
            reason
        });
    }
    async editEmoji(id, options) {
        const emoji = await this.session.rest.runMethod(this.session.rest, "PATCH", GUILD_EMOJI(this.id, id), options);
        return new GuildEmoji(this.session, emoji, this.id);
    }
    async createRole(options) {
        let icon;
        if (options.iconHash) {
            if (typeof options.iconHash === "string") {
                icon = options.iconHash;
            } else {
                icon = Util.iconBigintToHash(options.iconHash);
            }
        }
        const role = await this.session.rest.runMethod(this.session.rest, "PUT", GUILD_ROLES(this.id), {
            name: options.name,
            color: options.color,
            icon,
            unicode_emoji: options.unicodeEmoji,
            hoist: options.hoist,
            mentionable: options.mentionable
        });
        return new Role(this.session, role, this.id);
    }
    async deleteRole(roleId) {
        await this.session.rest.runMethod(this.session.rest, "DELETE", GUILD_ROLE(this.id, roleId));
    }
    async editRole(roleId, options) {
        const role = await this.session.rest.runMethod(this.session.rest, "PATCH", GUILD_ROLE(this.id, roleId), {
            name: options.name,
            color: options.color,
            hoist: options.hoist,
            mentionable: options.mentionable
        });
        return new Role(this.session, role, this.id);
    }
    async addRole(memberId, roleId, { reason  } = {}) {
        await this.session.rest.runMethod(this.session.rest, "PUT", GUILD_MEMBER_ROLE(this.id, memberId, roleId), {
            reason
        });
    }
    async removeRole(memberId, roleId, { reason  } = {}) {
        await this.session.rest.runMethod(this.session.rest, "DELETE", GUILD_MEMBER_ROLE(this.id, memberId, roleId), {
            reason
        });
    }
    async moveRoles(options) {
        const roles = await this.session.rest.runMethod(this.session.rest, "PATCH", GUILD_ROLES(this.id), options);
        return roles.map((role)=>new Role(this.session, role, this.id));
    }
    async deleteInvite(inviteCode) {
        await this.session.rest.runMethod(this.session.rest, "DELETE", INVITE(inviteCode), {});
    }
    async fetchInvite(inviteCode, options) {
        const inviteMetadata = await this.session.rest.runMethod(this.session.rest, "GET", INVITE(inviteCode, options));
        return new Invite(this.session, inviteMetadata);
    }
    async fetchInvites() {
        const invites = await this.session.rest.runMethod(this.session.rest, "GET", GUILD_INVITES(this.id));
        return invites.map((invite)=>new Invite(this.session, invite));
    }
    async banMember(memberId, options) {
        await this.session.rest.runMethod(this.session.rest, "PUT", GUILD_BAN(this.id, memberId), options ? {
            delete_message_days: options.deleteMessageDays,
            reason: options.reason
        } : {});
    }
    async kickMember(memberId, { reason  }) {
        await this.session.rest.runMethod(this.session.rest, "DELETE", GUILD_MEMBER(this.id, memberId), {
            reason
        });
    }
    async unbanMember(memberId) {
        await this.session.rest.runMethod(this.session.rest, "DELETE", GUILD_BAN(this.id, memberId));
    }
    async editMember(memberId, options) {
        const member = await this.session.rest.runMethod(this.session.rest, "PATCH", GUILD_MEMBER(this.id, memberId), {
            nick: options.nick,
            roles: options.roles,
            mute: options.mute,
            deaf: options.deaf,
            channel_id: options.channelId,
            communication_disabled_until: options.communicationDisabledUntil ? new Date(options.communicationDisabledUntil).toISOString() : undefined
        });
        return new Member(this.session, member, this.id);
    }
    async pruneMembers(options) {
        const result = await this.session.rest.runMethod(this.session.rest, "POST", GUILD_PRUNE(this.id), {
            days: options.days,
            compute_prune_count: options.computePruneCount,
            include_roles: options.includeRoles
        });
        return result.pruned;
    }
    async getPruneCount() {
        const result = await this.session.rest.runMethod(this.session.rest, "GET", GUILD_PRUNE(this.id));
        return result.pruned;
    }
    async getActiveThreads() {
        const { threads , members  } = await this.session.rest.runMethod(this.session.rest, "GET", THREAD_ACTIVE(this.id));
        return {
            threads: Object.fromEntries(threads.map((thread)=>[
                    thread.id,
                    new ThreadChannel(this.session, thread, this.id)
                ])),
            members: Object.fromEntries(members.map((threadMember)=>[
                    threadMember.id,
                    new ThreadMember(this.session, threadMember)
                ]))
        };
    }
    async delete() {
        await this.session.rest.runMethod(this.session.rest, "DELETE", GUILDS(this.id));
    }
    async leave() {
        await this.session.rest.runMethod(this.session.rest, "DELETE", USER_GUILDS(this.id));
    }
    static async create(session, options) {
        const guild = await session.rest.runMethod(session.rest, "POST", GUILDS(), {
            name: options.name,
            afk_channel_id: options.afkChannelId,
            afk_timeout: options.afkTimeout,
            default_message_notifications: options.defaultMessageNotifications,
            explicit_content_filter: options.explicitContentFilter,
            system_channel_flags: options.systemChannelFlags,
            verification_level: options.verificationLevel,
            icon: "iconURL" in options ? options.iconURL && urlToBase64(options.iconURL) : options.iconHash && Util.iconBigintToHash(options.iconHash),
            channels: options.channels?.map((channel)=>({
                    name: channel.name,
                    nsfw: channel.nsfw,
                    id: channel.id,
                    bitrate: channel.bitrate,
                    parent_id: channel.parentId,
                    permission_overwrites: channel.permissionOverwrites,
                    rtc_region: channel.rtcRegion,
                    user_limit: channel.userLimit,
                    video_quality_mode: channel.videoQualityMode,
                    rate_limit_per_user: channel.rateLimitPerUser
                })),
            roles: options.roles?.map((role)=>({
                    name: role.name,
                    id: role.id,
                    color: role.color,
                    mentionable: role.mentionable,
                    hoist: role.hoist,
                    position: role.position,
                    unicode_emoji: role.unicodeEmoji,
                    icon: options.iconURL && urlToBase64(options.iconURL)
                }))
        });
        return new Guild(session, guild);
    }
    setSplash(splashURL) {
        return this.edit({
            splashURL
        });
    }
    setBanner(bannerURL) {
        return this.edit({
            bannerURL
        });
    }
    setDiscoverySplash(discoverySplashURL) {
        return this.edit({
            discoverySplashURL
        });
    }
    async edit(options) {
        const guild = await this.session.rest.runMethod(this.session.rest, "PATCH", GUILDS(), {
            name: options.name,
            afk_channel_id: options.afkChannelId,
            afk_timeout: options.afkTimeout,
            default_message_notifications: options.defaultMessageNotifications,
            explicit_content_filter: options.explicitContentFilter,
            system_channel_flags: options.systemChannelFlags,
            verification_level: options.verificationLevel,
            icon: "iconURL" in options ? options.iconURL && urlToBase64(options.iconURL) : options.iconHash && Util.iconBigintToHash(options.iconHash),
            splash: "splashURL" in options ? options.splashURL && urlToBase64(options.splashURL) : options.iconHash && Util.iconBigintToHash(options.iconHash),
            banner: "bannerURL" in options ? options.bannerURL && urlToBase64(options.bannerURL) : options.bannerHash && Util.iconBigintToHash(options.bannerHash),
            discovery_splash: "discoverySplashURL" in options ? options.discoverySplashURL && urlToBase64(options.discoverySplashURL) : options.discoverySplashHash && Util.iconBigintToHash(options.discoverySplashHash),
            owner_id: options.ownerId,
            rules_channel_id: options.rulesChannelId,
            public_updates_channel_id: options.publicUpdatesChannelId,
            preferred_locale: options.preferredLocale,
            features: options.features,
            description: options.description,
            premiumProgressBarEnabled: options.premiumProgressBarEnabled
        });
        return new Guild(this.session, guild);
    }
}
class Invite {
    constructor(session, data){
        this.session = session;
        this.guild = data.guild ? new InviteGuild(session, data.guild) : undefined;
        this.approximateMemberCount = data.approximate_member_count ? data.approximate_member_count : undefined;
        this.approximatePresenceCount = data.approximate_presence_count ? data.approximate_presence_count : undefined;
        this.code = data.code;
        this.expiresAt = data.expires_at ? Number.parseInt(data.expires_at) : undefined;
        this.inviter = data.inviter ? new User(session, data.inviter) : undefined;
        this.targetUser = data.target_user ? new User(session, data.target_user) : undefined;
        this.targetApplication = data.target_application ? new Application(session, data.target_application) : undefined;
        this.targetType = data.target_type;
        if (data.channel) {
            const guildId = data.guild && data.guild?.id ? data.guild.id : "";
            this.channel = new GuildChannel(session, data.channel, guildId);
        }
        if (data.guild_scheduled_event) {
            this.guildScheduledEvent = {
                id: data.guild_scheduled_event.id,
                guildId: data.guild_scheduled_event.guild_id,
                channelId: data.guild_scheduled_event.channel_id ? data.guild_scheduled_event.channel_id : undefined,
                creatorId: data.guild_scheduled_event.creator_id ? data.guild_scheduled_event.creator_id : undefined,
                name: data.guild_scheduled_event.name,
                description: data.guild_scheduled_event.description ? data.guild_scheduled_event.description : undefined,
                scheduledStartTime: data.guild_scheduled_event.scheduled_start_time,
                scheduledEndTime: data.guild_scheduled_event.scheduled_end_time ? data.guild_scheduled_event.scheduled_end_time : undefined,
                privacyLevel: data.guild_scheduled_event.privacy_level,
                status: data.guild_scheduled_event.status,
                entityType: data.guild_scheduled_event.entity_type,
                entityId: data.guild ? data.guild.id : undefined,
                entityMetadata: data.guild_scheduled_event.entity_metadata ? data.guild_scheduled_event.entity_metadata : undefined,
                creator: data.guild_scheduled_event.creator ? new User(session, data.guild_scheduled_event.creator) : undefined,
                userCount: data.guild_scheduled_event.user_count ? data.guild_scheduled_event.user_count : undefined,
                image: data.guild_scheduled_event.image ? data.guild_scheduled_event.image : undefined
            };
        }
        if (data.stage_instance) {
            const guildId1 = data.guild && data.guild?.id ? data.guild.id : "";
            this.stageInstance = {
                members: data.stage_instance.members.map((m)=>new Member(session, m, guildId1)),
                participantCount: data.stage_instance.participant_count,
                speakerCount: data.stage_instance.speaker_count,
                topic: data.stage_instance.topic
            };
        }
    }
    session;
    guild;
    approximateMemberCount;
    approximatePresenceCount;
    code;
    expiresAt;
    inviter;
    targetUser;
    targetType;
    channel;
    stageInstance;
    guildScheduledEvent;
    targetApplication;
    async delete() {
        await Guild.prototype.deleteInvite.call(this.guild, this.code);
        return this;
    }
}
var PrivacyLevels;
(function(PrivacyLevels) {
    PrivacyLevels[PrivacyLevels["Public"] = 1] = "Public";
    PrivacyLevels[PrivacyLevels["GuildOnly"] = 2] = "GuildOnly";
})(PrivacyLevels || (PrivacyLevels = {}));
class StageInstance {
    constructor(session, data){
        this.session = session;
        this.id = data.id;
        this.channelId = data.channel_id;
        this.guildId = data.guild_id;
        this.topic = data.topic;
        this.privacyLevel = data.privacy_level;
        this.discoverableDisabled = data.discoverable_disabled;
        this.guildScheduledEventId = data.guild_scheduled_event_id;
    }
    session;
    id;
    channelId;
    guildId;
    topic;
    privacyLevel;
    discoverableDisabled;
    guildScheduledEventId;
    async edit(options) {
        const stageInstance = await this.session.rest.runMethod(this.session.rest, "PATCH", STAGE_INSTANCE(this.id), {
            topic: options.topic,
            privacy_level: options.privacyLevel
        });
        return new StageInstance(this.session, stageInstance);
    }
    async delete() {
        await this.session.rest.runMethod(this.session.rest, "DELETE", STAGE_INSTANCE(this.id));
    }
}
class ScheduledEvent {
    constructor(session, data){
        this.session = session;
        this.id = data.id;
        this.guildId = data.guild_id;
        this.channelId = data.channel_id;
        this.creatorId = data.creator_id ? data.creator_id : undefined;
        this.name = data.name;
        this.description = data.description;
        this.scheduledStartTime = data.scheduled_start_time;
        this.scheduledEndTime = data.scheduled_end_time;
        this.privacyLevel = PrivacyLevels.GuildOnly;
        this.status = data.status;
        this.entityType = data.entity_type;
        this.entityMetadata = data.entity_metadata ? data.entity_metadata : undefined;
        this.creator = data.creator ? new User(session, data.creator) : undefined;
        this.userCount = data.user_count;
        this.image = data.image ? data.image : undefined;
    }
    session;
    id;
    guildId;
    channelId;
    creatorId;
    name;
    description;
    scheduledStartTime;
    scheduledEndTime;
    privacyLevel;
    status;
    entityType;
    entityMetadata;
    creator;
    userCount;
    image;
}
var StatusTypes;
(function(StatusTypes) {
    StatusTypes[StatusTypes["online"] = 0] = "online";
    StatusTypes[StatusTypes["dnd"] = 1] = "dnd";
    StatusTypes[StatusTypes["idle"] = 2] = "idle";
    StatusTypes[StatusTypes["invisible"] = 3] = "invisible";
    StatusTypes[StatusTypes["offline"] = 4] = "offline";
})(StatusTypes || (StatusTypes = {}));
class Presence {
    constructor(session, data){
        this.session = session;
        this.user = new User(this.session, data.user);
        this.guildId = data.guild_id;
        this.status = StatusTypes[data.status];
        this.activities = data.activities.map((activity)=>Object.create({
                name: activity.name,
                type: activity.type,
                url: activity.url ? activity.url : undefined,
                createdAt: activity.created_at,
                timestamps: activity.timestamps,
                applicationId: activity.application_id,
                details: activity.details ? activity.details : undefined,
                state: activity.state,
                emoji: activity.emoji ? activity.emoji : undefined,
                party: activity.party ? activity.party : undefined,
                assets: activity.assets ? {
                    largeImage: activity.assets.large_image,
                    largeText: activity.assets.large_text,
                    smallImage: activity.assets.small_image,
                    smallText: activity.assets.small_text
                } : null,
                secrets: activity.secrets ? activity.secrets : undefined,
                instance: !!activity.instance,
                flags: activity.flags,
                buttons: activity.buttons
            }));
        this.clientStatus = data.client_status;
    }
    session;
    user;
    guildId;
    status;
    activities;
    clientStatus;
}
class Integration {
    constructor(session, data){
        this.id = data.id;
        this.session = session;
        data.guild_id ? this.guildId = data.guild_id : null;
        this.name = data.name;
        this.type = data.type;
        this.enabled = !!data.enabled;
        this.syncing = !!data.syncing;
        this.roleId = data.role_id;
        this.enableEmoticons = !!data.enable_emoticons;
        this.expireBehavior = data.expire_behavior;
        this.expireGracePeriod = data.expire_grace_period;
        this.syncedAt = data.synced_at;
        this.subscriberCount = data.subscriber_count;
        this.revoked = !!data.revoked;
        this.user = data.user ? new User(session, data.user) : undefined;
        this.account = {
            id: data.account.id,
            name: data.account.name
        };
        if (data.application) {
            this.application = {
                id: data.application.id,
                name: data.application.name,
                icon: data.application.icon ? data.application.icon : undefined,
                description: data.application.description,
                bot: data.application.bot ? new User(session, data.application.bot) : undefined
            };
        }
    }
    session;
    id;
    guildId;
    name;
    type;
    enabled;
    syncing;
    roleId;
    enableEmoticons;
    expireBehavior;
    expireGracePeriod;
    syncedAt;
    subscriberCount;
    revoked;
    user;
    account;
    application;
}
const READY = (session, shardId, payload)=>{
    session.applicationId = payload.application.id;
    session.botId = payload.user.id;
    session.emit("ready", {
        ...payload,
        user: new User(session, payload.user)
    }, shardId);
};
const MESSAGE_CREATE = (session, _shardId, message)=>{
    session.emit("messageCreate", new Message(session, message));
};
const MESSAGE_UPDATE = (session, _shardId, new_message)=>{
    if (!new_message.edited_timestamp) {
        const message = {
            session,
            id: new_message.id,
            guildId: new_message.guild_id,
            channelId: new_message.channel_id
        };
        Object.setPrototypeOf(message, Message.prototype);
        session.emit("messageUpdate", message);
        return;
    }
    session.emit("messageUpdate", new Message(session, new_message));
};
const MESSAGE_DELETE = (session, _shardId, { id , channel_id , guild_id  })=>{
    session.emit("messageDelete", {
        id,
        channelId: channel_id,
        guildId: guild_id
    });
};
const GUILD_CREATE = (session, _shardId, guild)=>{
    session.emit("guildCreate", new Guild(session, guild));
};
const GUILD_DELETE = (session, _shardId, guild)=>{
    session.emit("guildDelete", {
        id: guild.id,
        unavailable: true
    });
};
const GUILD_MEMBER_ADD = (session, _shardId, member)=>{
    session.emit("guildMemberAdd", new Member(session, member, member.guild_id));
};
const GUILD_MEMBER_UPDATE = (session, _shardId, member)=>{
    session.emit("guildMemberUpdate", new Member(session, member, member.guild_id));
};
const GUILD_MEMBER_REMOVE = (session, _shardId, member)=>{
    session.emit("guildMemberRemove", new User(session, member.user), member.guild_id);
};
const GUILD_BAN_ADD = (session, _shardId, data)=>{
    session.emit("guildBanAdd", {
        guildId: data.guild_id,
        user: data.user
    });
};
const GUILD_BAN_REMOVE = (session, _shardId, data)=>{
    session.emit("guildBanRemove", {
        guildId: data.guild_id,
        user: data.user
    });
};
const GUILD_EMOJIS_UPDATE = (session, _shardId, data)=>{
    session.emit("guildEmojisUpdate", {
        guildId: data.guild_id,
        emojis: data.emojis
    });
};
const GUILD_ROLE_CREATE = (session, _shardId, data)=>{
    session.emit("guildRoleCreate", {
        guildId: data.guild_id,
        role: data.role
    });
};
const GUILD_ROLE_UPDATE = (session, _shardId, data)=>{
    session.emit("guildRoleUpdate", {
        guildId: data.guild_id,
        role: data.role
    });
};
const GUILD_ROLE_DELETE = (session, _shardId, data)=>{
    session.emit("guildRoleDelete", {
        guildId: data.guild_id,
        roleId: data.role_id
    });
};
const TYPING_START = (session, _shardId, payload)=>{
    session.emit("typingStart", {
        channelId: payload.channel_id,
        guildId: payload.guild_id ? payload.guild_id : undefined,
        userId: payload.user_id,
        timestamp: payload.timestamp,
        member: payload.guild_id ? new Member(session, payload.member, payload.guild_id) : undefined
    });
};
const INTERACTION_CREATE = (session, _shardId, interaction)=>{
    session.emit("interactionCreate", InteractionFactory.from(session, interaction));
};
const CHANNEL_CREATE = (session, _shardId, channel)=>{
    session.emit("channelCreate", ChannelFactory.from(session, channel));
};
const CHANNEL_UPDATE = (session, _shardId, channel)=>{
    session.emit("channelUpdate", ChannelFactory.from(session, channel));
};
const CHANNEL_DELETE = (session, _shardId, channel)=>{
    if (!channel.guild_id) return;
    session.emit("channelDelete", new GuildChannel(session, channel, channel.guild_id));
};
const THREAD_CREATE = (session, _shardId, channel)=>{
    if (!channel.guild_id) return;
    session.emit("threadCreate", new ThreadChannel(session, channel, channel.guild_id));
};
const THREAD_UPDATE = (session, _shardId, channel)=>{
    if (!channel.guild_id) return;
    session.emit("threadUpdate", new ThreadChannel(session, channel, channel.guild_id));
};
const THREAD_DELETE = (session, _shardId, channel)=>{
    if (!channel.guild_id) return;
    session.emit("threadDelete", new ThreadChannel(session, channel, channel.guild_id));
};
const THREAD_MEMBER_UPDATE = (session, _shardId, payload)=>{
    session.emit("threadMemberUpdate", {
        guildId: payload.guild_id,
        id: payload.id,
        userId: payload.user_id,
        joinedAt: payload.joined_at,
        flags: payload.flags
    });
};
const THREAD_MEMBERS_UPDATE = (session, _shardId, payload)=>{
    session.emit("threadMembersUpdate", {
        memberCount: payload.member_count,
        addedMembers: payload.added_members ? payload.added_members.map((tm)=>new ThreadMember(session, tm)) : undefined,
        removedMemberIds: payload.removed_member_ids ? payload.removed_member_ids : undefined,
        guildId: payload.guild_id,
        id: payload.id
    });
};
const THREAD_LIST_SYNC = (session, _shardId, payload)=>{
    session.emit("threadListSync", {
        guildId: payload.guild_id,
        channelIds: payload.channel_ids ?? [],
        threads: payload.threads.map((channel)=>new ThreadChannel(session, channel, payload.guild_id)),
        members: payload.members.map((member)=>new ThreadMember(session, member))
    });
};
const CHANNEL_PINS_UPDATE = (session, _shardId, payload)=>{
    session.emit("channelPinsUpdate", {
        guildId: payload.guild_id,
        channelId: payload.channel_id,
        lastPinTimestamp: payload.last_pin_timestamp ? Date.parse(payload.last_pin_timestamp) : undefined
    });
};
const USER_UPDATE = (session, _shardId, payload)=>{
    session.emit("userUpdate", new User(session, payload));
};
const PRESENCE_UPDATE = (session, _shardId, payload)=>{
    session.emit("presenceUpdate", new Presence(session, payload));
};
const WEBHOOKS_UPDATE = (session, _shardId, webhook)=>{
    session.emit("webhooksUpdate", {
        guildId: webhook.guild_id,
        channelId: webhook.channel_id
    });
};
const INTEGRATION_CREATE = (session, _shardId, payload)=>{
    session.emit("integrationCreate", new Integration(session, payload));
};
const INTEGRATION_UPDATE = (session, _shardId, payload)=>{
    session.emit("integrationCreate", new Integration(session, payload));
};
const INTEGRATION_DELETE = (session, _shardId, payload)=>{
    session.emit("integrationDelete", {
        id: payload.id,
        guildId: payload.guild_id,
        applicationId: payload.application_id
    });
};
const AUTO_MODERATION_RULE_CREATE = (session, _shardId, payload)=>{
    session.emit("autoModerationRuleCreate", new AutoModerationRule(session, payload));
};
const AUTO_MODERATION_RULE_UPDATE = (session, _shardId, payload)=>{
    session.emit("autoModerationRuleUpdate", new AutoModerationRule(session, payload));
};
const AUTO_MODERATION_RULE_DELETE = (session, _shardId, payload)=>{
    session.emit("autoModerationRuleDelete", new AutoModerationRule(session, payload));
};
const AUTO_MODERATION_ACTION_EXECUTE = (session, _shardId, payload)=>{
    session.emit("autoModerationActionExecution", new AutoModerationExecution(session, payload));
};
const MESSAGE_REACTION_ADD = (session, _shardId, reaction)=>{
    session.emit("messageReactionAdd", NewMessageReactionAdd(session, reaction));
};
const MESSAGE_REACTION_REMOVE = (session, _shardId, reaction)=>{
    session.emit("messageReactionRemove", NewMessageReactionAdd(session, reaction));
};
const MESSAGE_REACTION_REMOVE_ALL = (session, _shardId, reaction)=>{
    session.emit("messageReactionRemoveAll", NewMessageReactionAdd(session, reaction));
};
const MESSAGE_REACTION_REMOVE_EMOJI = (session, _shardId, reaction)=>{
    session.emit("messageReactionRemoveEmoji", NewMessageReactionAdd(session, reaction));
};
const INVITE_CREATE = (session, _shardId, invite)=>{
    session.emit("inviteCreate", NewInviteCreate(session, invite));
};
const INVITE_DELETE = (session, _shardId, data)=>{
    session.emit("inviteDelete", {
        channelId: data.channel_id,
        guildId: data.guild_id,
        code: data.code
    });
};
const STAGE_INSTANCE_CREATE = (session, _shardId, payload)=>{
    session.emit("stageInstanceCreate", new StageInstance(session, payload));
};
const STAGE_INSTANCE_UPDATE = (session, _shardId, payload)=>{
    session.emit("stageInstanceUpdate", new StageInstance(session, payload));
};
const STAGE_INSTANCE_DELETE = (session, _shardId, payload)=>{
    session.emit("stageInstanceDelete", new StageInstance(session, payload));
};
const GUILD_SCHEDULED_EVENT_CREATE = (session, _shardId, payload)=>{
    session.emit("guildScheduledEventCreate", new ScheduledEvent(session, payload));
};
const GUILD_SCHEDULED_EVENT_UPDATE = (session, _shardId, payload)=>{
    session.emit("guildScheduledEventUpdate", new ScheduledEvent(session, payload));
};
const GUILD_SCHEDULED_EVENT_DELETE = (session, _shardId, payload)=>{
    session.emit("guildScheduledEventDelete", new ScheduledEvent(session, payload));
};
const GUILD_SCHEDULED_EVENT_USER_ADD = (session, _shardId, payload)=>{
    session.emit("guildScheduledEventUserAdd", {
        scheduledEventId: payload.guild_scheduled_event_id,
        userId: payload.user_id,
        guildId: payload.guild_id
    });
};
const GUILD_SCHEDULED_EVENT_USER_REMOVE = (session, _shardId, payload)=>{
    session.emit("guildScheduledEventUserRemove", {
        scheduledEventId: payload.guild_scheduled_event_id,
        userId: payload.user_id,
        guildId: payload.guild_id
    });
};
const raw = (session, shardId, data)=>{
    session.emit("raw", data, shardId);
};
const mod = {
    READY: READY,
    MESSAGE_CREATE: MESSAGE_CREATE,
    MESSAGE_UPDATE: MESSAGE_UPDATE,
    MESSAGE_DELETE: MESSAGE_DELETE,
    GUILD_CREATE: GUILD_CREATE,
    GUILD_DELETE: GUILD_DELETE,
    GUILD_MEMBER_ADD: GUILD_MEMBER_ADD,
    GUILD_MEMBER_UPDATE: GUILD_MEMBER_UPDATE,
    GUILD_MEMBER_REMOVE: GUILD_MEMBER_REMOVE,
    GUILD_BAN_ADD: GUILD_BAN_ADD,
    GUILD_BAN_REMOVE: GUILD_BAN_REMOVE,
    GUILD_EMOJIS_UPDATE: GUILD_EMOJIS_UPDATE,
    GUILD_ROLE_CREATE: GUILD_ROLE_CREATE,
    GUILD_ROLE_UPDATE: GUILD_ROLE_UPDATE,
    GUILD_ROLE_DELETE: GUILD_ROLE_DELETE,
    TYPING_START: TYPING_START,
    INTERACTION_CREATE: INTERACTION_CREATE,
    CHANNEL_CREATE: CHANNEL_CREATE,
    CHANNEL_UPDATE: CHANNEL_UPDATE,
    CHANNEL_DELETE: CHANNEL_DELETE,
    THREAD_CREATE: THREAD_CREATE,
    THREAD_UPDATE: THREAD_UPDATE,
    THREAD_DELETE: THREAD_DELETE,
    THREAD_MEMBER_UPDATE: THREAD_MEMBER_UPDATE,
    THREAD_MEMBERS_UPDATE: THREAD_MEMBERS_UPDATE,
    THREAD_LIST_SYNC: THREAD_LIST_SYNC,
    CHANNEL_PINS_UPDATE: CHANNEL_PINS_UPDATE,
    USER_UPDATE: USER_UPDATE,
    PRESENCE_UPDATE: PRESENCE_UPDATE,
    WEBHOOKS_UPDATE: WEBHOOKS_UPDATE,
    INTEGRATION_CREATE: INTEGRATION_CREATE,
    INTEGRATION_UPDATE: INTEGRATION_UPDATE,
    INTEGRATION_DELETE: INTEGRATION_DELETE,
    AUTO_MODERATION_RULE_CREATE: AUTO_MODERATION_RULE_CREATE,
    AUTO_MODERATION_RULE_UPDATE: AUTO_MODERATION_RULE_UPDATE,
    AUTO_MODERATION_RULE_DELETE: AUTO_MODERATION_RULE_DELETE,
    AUTO_MODERATION_ACTION_EXECUTE: AUTO_MODERATION_ACTION_EXECUTE,
    MESSAGE_REACTION_ADD: MESSAGE_REACTION_ADD,
    MESSAGE_REACTION_REMOVE: MESSAGE_REACTION_REMOVE,
    MESSAGE_REACTION_REMOVE_ALL: MESSAGE_REACTION_REMOVE_ALL,
    MESSAGE_REACTION_REMOVE_EMOJI: MESSAGE_REACTION_REMOVE_EMOJI,
    INVITE_CREATE: INVITE_CREATE,
    INVITE_DELETE: INVITE_DELETE,
    STAGE_INSTANCE_CREATE: STAGE_INSTANCE_CREATE,
    STAGE_INSTANCE_UPDATE: STAGE_INSTANCE_UPDATE,
    STAGE_INSTANCE_DELETE: STAGE_INSTANCE_DELETE,
    GUILD_SCHEDULED_EVENT_CREATE: GUILD_SCHEDULED_EVENT_CREATE,
    GUILD_SCHEDULED_EVENT_UPDATE: GUILD_SCHEDULED_EVENT_UPDATE,
    GUILD_SCHEDULED_EVENT_DELETE: GUILD_SCHEDULED_EVENT_DELETE,
    GUILD_SCHEDULED_EVENT_USER_ADD: GUILD_SCHEDULED_EVENT_USER_ADD,
    GUILD_SCHEDULED_EVENT_USER_REMOVE: GUILD_SCHEDULED_EVENT_USER_REMOVE,
    raw: raw
};
class Session extends EventEmitter {
    options;
    rest;
    gateway;
    #botId;
    #applicationId;
    set applicationId(id) {
        this.#applicationId = id;
    }
    get applicationId() {
        return this.#applicationId;
    }
    set botId(id) {
        this.#botId = id;
    }
    get botId() {
        return this.#botId;
    }
    constructor(options){
        super();
        this.options = options;
        const defHandler = (shard, data)=>{
            mod.raw(this, shard.id, data);
            if (!data.t || !data.d) {
                return;
            }
            mod[data.t]?.(this, shard.id, data.d);
        };
        this.rest = createRestManager({
            token: this.options.token,
            debug: (text)=>{
                super.rawListeners("debug")?.forEach((fn)=>fn(text));
            },
            secretKey: this.options.rest?.secretKey ?? undefined
        });
        this.gateway = createGatewayManager({
            gatewayBot: this.options.gateway?.data ?? {},
            gatewayConfig: {
                token: this.options.token,
                intents: this.options.intents
            },
            handleDiscordPayload: this.options.rawHandler ?? defHandler
        });
        this.#botId = getBotIdFromToken(options.token).toString();
    }
    on(event, func) {
        return super.on(event, func);
    }
    off(event, func) {
        return super.off(event, func);
    }
    once(event, func) {
        return super.once(event, func);
    }
    emit(event, ...params) {
        return super.emit(event, ...params);
    }
    async editProfile(nick, avatarURL) {
        const avatar = avatarURL ? await urlToBase64(avatarURL) : avatarURL;
        const user = await this.rest.runMethod(this.rest, "PATCH", USER(), {
            username: nick,
            avatar: avatar
        });
        return new User(this, user);
    }
    editStatus(shardId, status) {
        const shard = this.gateway.manager.shards.get(shardId);
        if (!shard) {
            throw new Error(`Unknown shard ${shardId}`);
        }
        shard.send({
            op: GatewayOpcodes.PresenceUpdate,
            d: {
                status: status.status,
                since: null,
                afk: false,
                activities: status.activities.map((activity)=>{
                    return {
                        name: activity.name,
                        type: activity.type,
                        url: activity.url,
                        created_at: activity.createdAt,
                        timestamps: activity.timestamps,
                        application_id: this.applicationId,
                        details: activity.details,
                        state: activity.state,
                        emoji: activity.emoji && {
                            name: activity.emoji.name,
                            id: activity.emoji.id,
                            animated: activity.emoji.animated
                        },
                        party: activity.party,
                        assets: activity.assets && {
                            large_image: activity.assets.largeImage,
                            large_text: activity.assets.largeText,
                            small_image: activity.assets.smallImage,
                            small_text: activity.assets.smallText
                        },
                        secrets: activity.secrets,
                        instance: activity.instance,
                        flags: activity.flags,
                        buttons: activity.buttons
                    };
                })
            }
        });
    }
    async fetchUser(id) {
        const user = await this.rest.runMethod(this.rest, "GET", USER(id));
        if (!user.id) return;
        return new User(this, user);
    }
    createApplicationCommand(options, guildId) {
        return this.rest.runMethod(this.rest, "POST", guildId ? GUILD_APPLICATION_COMMANDS(this.applicationId, guildId) : APPLICATION_COMMANDS(this.applicationId), this.isContextApplicationCommand(options) ? {
            name: options.name,
            name_localizations: options.nameLocalizations,
            type: options.type
        } : {
            name: options.name,
            name_localizations: options.nameLocalizations,
            description: options.description,
            description_localizations: options.descriptionLocalizations,
            type: options.type,
            options: options.options,
            default_member_permissions: options.defaultMemberPermissions ? new Permissions(options.defaultMemberPermissions).bitfield.toString() : undefined,
            dm_permission: options.dmPermission
        });
    }
    deleteApplicationCommand(id, guildId) {
        return this.rest.runMethod(this.rest, "DELETE", guildId ? GUILD_APPLICATION_COMMANDS(this.applicationId, guildId, id) : APPLICATION_COMMANDS(this.applicationId, id));
    }
    updateApplicationCommandPermissions(guildId, id, bearerToken, options) {
        return this.rest.runMethod(this.rest, "PUT", GUILD_APPLICATION_COMMANDS_PERMISSIONS(this.applicationId, guildId, id), {
            permissions: options
        }, {
            headers: {
                authorization: `Bearer ${bearerToken}`
            }
        });
    }
    fetchApplicationCommand(id, options) {
        return this.rest.runMethod(this.rest, "GET", options?.guildId ? GUILD_APPLICATION_COMMANDS_LOCALIZATIONS(this.applicationId, options.guildId, id, options?.withLocalizations) : APPLICATION_COMMANDS(this.applicationId, id));
    }
    fetchApplicationCommandPermissions(guildId) {
        return this.rest.runMethod(this.rest, "GET", GUILD_APPLICATION_COMMANDS_PERMISSIONS(this.applicationId, guildId));
    }
    fetchApplicationCommandPermission(guildId, id) {
        return this.rest.runMethod(this.rest, "GET", GUILD_APPLICATION_COMMANDS_PERMISSIONS(this.applicationId, guildId, id));
    }
    upsertApplicationCommand(id, options, guildId) {
        return this.rest.runMethod(this.rest, "PATCH", guildId ? GUILD_APPLICATION_COMMANDS(this.applicationId, guildId) : APPLICATION_COMMANDS(this.applicationId, id), this.isContextApplicationCommand(options) ? {
            name: options.name,
            type: options.type
        } : {
            name: options.name,
            description: options.description,
            type: options.type,
            options: options.options
        });
    }
    upsertApplicationCommands(options, guildId) {
        return this.rest.runMethod(this.rest, "PUT", guildId ? GUILD_APPLICATION_COMMANDS(this.applicationId, guildId) : APPLICATION_COMMANDS(this.applicationId), options.map((o)=>this.isContextApplicationCommand(o) ? {
                name: o.name,
                type: o.type
            } : {
                name: o.name,
                description: o.description,
                type: o.type,
                options: o.options
            }));
    }
    fetchCommands(guildId) {
        return this.rest.runMethod(this.rest, "GET", guildId ? GUILD_APPLICATION_COMMANDS(this.applicationId, guildId) : APPLICATION_COMMANDS(this.applicationId));
    }
    isContextApplicationCommand(cmd) {
        return cmd.type === ApplicationCommandTypes.Message || cmd.type === ApplicationCommandTypes.User;
    }
    async start() {
        const getGatewayBot = ()=>this.rest.runMethod(this.rest, "GET", GATEWAY_BOT());
        if (!Object.keys(this.options.gateway?.data ?? {}).length) {
            const nonParsed = await getGatewayBot();
            this.gateway.gatewayBot = {
                url: nonParsed.url,
                shards: nonParsed.shards,
                sessionStartLimit: {
                    total: nonParsed.session_start_limit.total,
                    remaining: nonParsed.session_start_limit.remaining,
                    resetAfter: nonParsed.session_start_limit.reset_after,
                    maxConcurrency: nonParsed.session_start_limit.max_concurrency
                }
            };
            this.gateway.lastShardId = this.gateway.gatewayBot.shards - 1;
            this.gateway.manager.totalShards = this.gateway.gatewayBot.shards;
        }
        this.gateway.spawnShards();
    }
}
class Sticker {
    constructor(session, data){
        this.session = session;
        this.id = data.id;
        this.packId = data.pack_id;
        this.name = data.name;
        this.description = data.description;
        this.tags = data.tags.split(",");
        this.type = data.type;
        this.formatType = data.format_type;
        this.available = !!data.available;
        this.guildId = data.guild_id;
        this.user = data.user ? new User(this.session, data.user) : undefined;
        this.sortValue = data.sort_value;
    }
    session;
    id;
    packId;
    name;
    description;
    tags;
    type;
    formatType;
    available;
    guildId;
    user;
    sortValue;
    async fetchPremiumPack() {
        const data = await this.session.rest.runMethod(this.session.rest, "GET", STICKER_PACKS());
        return {
            id: data.id,
            stickers: data.stickers.map((st)=>new Sticker(this.session, st)),
            name: data.name,
            skuId: data.sku_id,
            coverStickerId: data.cover_sticker_id,
            description: data.description,
            bannerAssetId: data.banner_asset_id
        };
    }
}
class ChoiceBuilder {
    name;
    value;
    setName(name) {
        this.name = name;
        return this;
    }
    setValue(value) {
        this.value = value;
        return this;
    }
    toJSON() {
        if (!this.name) throw new TypeError("Property 'name' is required");
        if (!this.value) throw new TypeError("Property 'value' is required");
        return {
            name: this.name,
            value: this.value
        };
    }
}
class OptionBuilder {
    required;
    autocomplete;
    type;
    name;
    description;
    constructor(type, name, description){
        this.type = type;
        this.name = name;
        this.description = description;
    }
    setType(type) {
        return this.type = type, this;
    }
    setName(name) {
        return this.name = name, this;
    }
    setDescription(description) {
        return this.description = description, this;
    }
    setRequired(required) {
        return this.required = required, this;
    }
    toJSON() {
        if (!this.type) throw new TypeError("Property 'type' is required");
        if (!this.name) throw new TypeError("Property 'name' is required");
        if (!this.description) {
            throw new TypeError("Property 'description' is required");
        }
        const applicationCommandOption = {
            type: this.type,
            name: this.name,
            description: this.description,
            required: this.required ? true : false
        };
        return applicationCommandOption;
    }
}
class OptionBuilderLimitedValues extends OptionBuilder {
    choices;
    minValue;
    maxValue;
    constructor(type, name, description){
        super();
        this.type = type;
        this.name = name;
        this.description = description;
    }
    setMinValue(n) {
        return this.minValue = n, this;
    }
    setMaxValue(n) {
        return this.maxValue = n, this;
    }
    addChoice(fn) {
        const choice = fn(new ChoiceBuilder());
        this.choices ??= [];
        this.choices.push(choice);
        return this;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            choices: this.choices?.map((c)=>c.toJSON()) ?? [],
            minValue: this.minValue,
            maxValue: this.maxValue
        };
    }
}
class OptionBuilderString extends OptionBuilder {
    choices;
    constructor(type, name, description){
        super();
        this.type = type;
        this.name = name;
        this.description = description;
    }
    addChoice(fn) {
        const choice = fn(new ChoiceBuilder());
        this.choices ??= [];
        this.choices.push(choice);
        return this;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            choices: this.choices?.map((c)=>c.toJSON()) ?? []
        };
    }
}
class OptionBuilderChannel extends OptionBuilder {
    channelTypes;
    constructor(type, name, description){
        super();
        this.type = type;
        this.name = name;
        this.description = description;
    }
    addChannelTypes(...channels) {
        this.channelTypes ??= [];
        this.channelTypes.push(...channels);
        return this;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            channelTypes: this.channelTypes ?? []
        };
    }
}
class OptionBased {
    options;
    addOption(fn, type) {
        const option = fn(new OptionBuilder(type));
        this.options ??= [];
        this.options.push(option);
        return this;
    }
    addNestedOption(fn) {
        const option = fn(new OptionBuilder(ApplicationCommandOptionTypes.SubCommand));
        this.options ??= [];
        this.options.push(option);
        return this;
    }
    addStringOption(fn) {
        const option = fn(new OptionBuilderString(ApplicationCommandOptionTypes.String));
        this.options ??= [];
        this.options.push(option);
        return this;
    }
    addIntegerOption(fn) {
        const option = fn(new OptionBuilderLimitedValues(ApplicationCommandOptionTypes.Integer));
        this.options ??= [];
        this.options.push(option);
        return this;
    }
    addNumberOption(fn) {
        const option = fn(new OptionBuilderLimitedValues(ApplicationCommandOptionTypes.Number));
        this.options ??= [];
        this.options.push(option);
        return this;
    }
    addBooleanOption(fn) {
        return this.addOption(fn, ApplicationCommandOptionTypes.Boolean);
    }
    addSubCommand(fn) {
        const option = fn(new OptionBuilderNested(ApplicationCommandOptionTypes.SubCommand));
        this.options ??= [];
        this.options.push(option);
        return this;
    }
    addSubCommandGroup(fn) {
        const option = fn(new OptionBuilderNested(ApplicationCommandOptionTypes.SubCommandGroup));
        this.options ??= [];
        this.options.push(option);
        return this;
    }
    addUserOption(fn) {
        return this.addOption(fn, ApplicationCommandOptionTypes.User);
    }
    addChannelOption(fn) {
        const option = fn(new OptionBuilderChannel(ApplicationCommandOptionTypes.Channel));
        this.options ??= [];
        this.options.push(option);
        return this;
    }
    addRoleOption(fn) {
        return this.addOption(fn, ApplicationCommandOptionTypes.Role);
    }
    addMentionableOption(fn) {
        return this.addOption(fn, ApplicationCommandOptionTypes.Mentionable);
    }
    static applyTo(klass, ignore = []) {
        const methods = [
            "addOption",
            "addNestedOption",
            "addStringOption",
            "addIntegerOption",
            "addNumberOption",
            "addBooleanOption",
            "addSubCommand",
            "addSubCommandGroup",
            "addUserOption",
            "addChannelOption",
            "addRoleOption",
            "addMentionableOption", 
        ];
        for (const method of methods){
            if (ignore.includes(method)) continue;
            klass.prototype[method] = OptionBased.prototype[method];
        }
    }
}
class OptionBuilderNested extends OptionBuilder {
    constructor(type, name, description){
        super();
        this.type = type;
        this.name = name;
        this.description = description;
    }
    toJSON() {
        if (!this.type) throw new TypeError("Property 'type' is required");
        if (!this.name) throw new TypeError("Property 'name' is required");
        if (!this.description) {
            throw new TypeError("Property 'description' is required");
        }
        return {
            type: this.type,
            name: this.name,
            description: this.description,
            options: this.options?.map((o)=>o.toJSON()) ?? [],
            required: this.required ? true : false
        };
    }
}
OptionBased.applyTo(OptionBuilderNested);
class ApplicationCommandBuilder {
    constructor(type = ApplicationCommandTypes.ChatInput, name = "", description = "", defaultMemberPermissions, nameLocalizations, descriptionLocalizations, dmPermission = true){
        this.type = type;
        this.name = name;
        this.description = description;
        this.defaultMemberPermissions = defaultMemberPermissions;
        this.nameLocalizations = nameLocalizations;
        this.descriptionLocalizations = descriptionLocalizations;
        this.dmPermission = dmPermission;
    }
    type;
    name;
    description;
    defaultMemberPermissions;
    nameLocalizations;
    descriptionLocalizations;
    dmPermission;
    setType(type) {
        return this.type = type, this;
    }
    setName(name) {
        return this.name = name, this;
    }
    setDescription(description) {
        return this.description = description, this;
    }
    setDefaultMemberPermission(perm) {
        return this.defaultMemberPermissions = perm, this;
    }
    setNameLocalizations(l) {
        return this.nameLocalizations = l, this;
    }
    setDescriptionLocalizations(l) {
        return this.descriptionLocalizations = l, this;
    }
    setDmPermission(perm) {
        return this.dmPermission = perm, this;
    }
}
class ChatInputApplicationCommandBuilder extends ApplicationCommandBuilder {
    type = ApplicationCommandTypes.ChatInput;
    toJSON() {
        if (!this.type) throw new TypeError("Propety 'type' is required");
        if (!this.name) throw new TypeError("Propety 'name' is required");
        if (!this.description) {
            throw new TypeError("Propety 'description' is required");
        }
        return {
            type: ApplicationCommandTypes.ChatInput,
            name: this.name,
            description: this.description,
            options: this.options?.map((o)=>o.toJSON()) ?? [],
            defaultMemberPermissions: this.defaultMemberPermissions,
            nameLocalizations: this.nameLocalizations,
            descriptionLocalizations: this.descriptionLocalizations,
            dmPermission: this.dmPermission
        };
    }
}
OptionBased.applyTo(ChatInputApplicationCommandBuilder);
class Collection extends Map {
    constructor(session, entries){
        super(entries);
        this.session = session;
    }
    session;
    get(key) {
        return super.get(key);
    }
    set(key, value) {
        return super.set(key, value);
    }
    has(key) {
        return super.has(key);
    }
    clear() {
        return super.clear();
    }
    random(amount) {
        const arr = [
            ...this.values()
        ];
        if (typeof amount === "undefined") return arr[Math.floor(Math.random() * arr.length)];
        if (!arr.length) return [];
        if (amount && amount > arr.length) amount = arr.length;
        return Array.from({
            length: Math.min(amount, arr.length)
        }, ()=>arr.splice(Math.floor(Math.random() * arr.length), 1)[0]);
    }
    find(fn) {
        for (const [key, value] of this.entries()){
            if (fn(value, key, this)) return value;
        }
        return undefined;
    }
    filter(fn) {
        const result = new Collection(this.session);
        for (const [key, value] of this.entries()){
            if (fn(value, key, this)) result.set(key, value);
        }
        return result;
    }
    forEach(fn) {
        super.forEach((v, k)=>{
            fn(v, k, this);
        });
    }
    clone() {
        return new Collection(this.session, this.entries());
    }
    concat(structures) {
        const conc = this.clone();
        for (const structure of structures){
            if (!structure || !(structure instanceof Collection)) {
                continue;
            }
            for (const [key, value] of structure.entries()){
                conc.set(key, value);
            }
        }
        return conc;
    }
    some(fn) {
        for (const [key, value] of this.entries()){
            if (fn(value, key, this)) {
                return true;
            }
        }
        return false;
    }
    every(fn) {
        for (const [key, value] of this.entries()){
            if (!fn(value, key, this)) {
                return false;
            }
        }
        return true;
    }
    first(amount) {
        if (!amount || amount <= 1) {
            return this.values().next().value;
        }
        const values = [
            ...this.values()
        ];
        amount = Math.min(values.length, amount);
        return values.slice(0, amount);
    }
    last(amount) {
        const values = [
            ...this.values()
        ];
        if (!amount || amount <= 1) {
            return values[values.length - 1];
        }
        amount = Math.min(values.length, amount);
        return values.slice(-amount);
    }
    reverse() {
        const entries = [
            ...this.entries()
        ].reverse();
        this.clear();
        for (const [key, value] of entries)this.set(key, value);
        return this;
    }
    map(fn) {
        const result = [];
        for (const [key, value] of this.entries()){
            result.push(fn(value, key, this));
        }
        return result;
    }
    reduce(fn, initV) {
        const entries = this.entries();
        const first = entries.next().value;
        let result = initV;
        if (result !== undefined) {
            result = fn(result, first[1], first[0], this);
        } else {
            result = first;
        }
        for (const [key, value] of entries){
            result = fn(result, value, key, this);
        }
        return result;
    }
    get size() {
        return super.size;
    }
    get empty() {
        return this.size === 0;
    }
    updateFields(key, obj) {
        const value = this.get(key);
        if (!value) {
            return;
        }
        for(const prop in obj){
            if (obj[prop]) {
                value[prop] = obj[prop];
            }
        }
        return this.set(key, value);
    }
    getOr(key, or) {
        return this.get(key) ?? or;
    }
    retrieve(key, fn) {
        const value = this.get(key);
        if (!value) {
            return;
        }
        return fn(value);
    }
}
function memberBootstrapper(cache, member, guildId) {
    cache.guilds.retrieve(guildId, (guild)=>{
        guild.members.set(member.user.id, Object.assign(new Member(cache.session, member, guildId), {
            userId: member.user.id,
            get user () {
                return cache.users.get(this.userId);
            }
        }));
    });
}
function userBootstrapper(cache, user) {
    cache.users.set(user.id, new User(cache.session, user));
}
function channelBootstrapper(cache, channel) {
    if (!channel.guild_id) {
        cache.dms.set(channel.id, Object.assign(new DMChannel(cache.session, channel), {
            messages: new Collection(cache.session)
        }));
        return;
    }
    cache.guilds.retrieve(channel.guild_id, (guild)=>{
        if (textBasedChannels.includes(channel.type)) {
            guild.channels.set(channel.id, Object.assign(ChannelFactory.fromGuildChannel(cache.session, channel), {
                messages: new Collection(cache.session),
                guildId: channel.guild_id,
                get guild () {
                    return cache.guilds.get(this.guildId);
                }
            }));
        } else {
            guild.channels.set(channel.id, Object.assign(ChannelFactory.fromGuildChannel(cache.session, channel), {
                guildId: channel.guild_id,
                get guild () {
                    return cache.guilds.get(this.guildId);
                }
            }));
        }
    });
}
function guildBootstrapper(cache, guild) {
    const members = new Collection(cache.session, guild.members?.map((data)=>{
        const obj = Object.assign(new Member(cache.session, data, guild.id), {
            userId: data.user.id,
            get user () {
                return cache.users.get(this.userId);
            }
        });
        return [
            data.user.id,
            obj
        ];
    }));
    const channels = new Collection(cache.session, guild.channels?.map((data)=>{
        const obj = Object.assign(ChannelFactory.from(cache.session, data), {
            messages: new Map()
        });
        return [
            data.id,
            obj
        ];
    }));
    cache.guilds.set(guild.id, Object.assign(new Guild(cache.session, guild), {
        members,
        channels
    }));
}
function messageBootstrapper(cache, message, partial) {
    if (message.member) {
        const member = Object.assign(message.member, {
            user: message.author
        });
        memberBootstrapper(cache, member, message.guild_id);
    }
    if (cache.dms.has(message.channel_id)) {
        cache.dms.retrieve(message.channel_id, (dm)=>{
            dm.messages[partial ? "updateFields" : "set"](message.id, Object.assign(new Message(cache.session, message), {
                authorId: message.author.id,
                get author () {
                    return cache.users.get(this.authorId);
                }
            }));
        });
    } else {
        cache.guilds.retrieve(message.guild_id, (guild)=>guild.channels.retrieve(message.channel_id, (dm)=>{
                dm.messages[partial ? "updateFields" : "set"](message.id, Object.assign(new Message(cache.session, message), {
                    authorId: message.author.id,
                    get author () {
                        return cache.users.get(this.authorId);
                    }
                }));
            }));
    }
}
function reactionBootstrapper(cache, reaction, remove) {
    cache.emojis.set(reaction.emoji.id ?? reaction.emoji.name, new Emoji(cache.session, reaction.emoji));
    function onAdd(message) {
        const reactions = message.reactions.map((r)=>r.emoji.name);
        const upsertData = {
            count: 1,
            emoji: reaction.emoji,
            me: reaction.user_id === cache.session.botId
        };
        if (reactions.length === 0) {
            message.reactions = [];
        } else if (!reactions.includes(reaction.emoji.name)) {
            message.reactions.push(new MessageReaction(cache.session, upsertData));
        } else {
            const current = message.reactions?.[reactions.indexOf(reaction.emoji.name)];
            if (current && message.reactions?.[message.reactions.indexOf(current)]) {
                ++message.reactions[message.reactions.indexOf(current)].count;
            }
        }
    }
    function onRemove(message) {
        const reactions = message.reactions.map((r)=>r.emoji.name);
        if (reactions.indexOf(reaction.emoji.name) !== undefined) {
            const current = message.reactions[reactions.indexOf(reaction.emoji.name)];
            if (current) {
                if (current.count > 0) {
                    current.count--;
                }
                if (current.count === 0) {
                    message.reactions.splice(reactions?.indexOf(reaction.emoji.name), 1);
                }
            }
        }
    }
    if (reaction.guild_id) {
        cache.guilds.retrieve(reaction.guild_id, (guild)=>{
            guild.channels.retrieve(reaction.channel_id, (channel)=>{
                channel.messages.retrieve(reaction.message_id, (message)=>{
                    if (remove) onRemove(message);
                    else onAdd(message);
                });
            });
        });
    } else {
        cache.dms.retrieve(reaction.channel_id, (channel)=>{
            channel.messages.retrieve(reaction.message_id, (message)=>{
                if (remove) onRemove(message);
                else onAdd(message);
            });
        });
    }
}
function reactionBootstrapperDeletions(cache, payload) {
    if (payload.guild_id) {
        cache.guilds.retrieve(payload.guild_id, (guild)=>{
            guild.channels.retrieve(payload.channel_id, (channel)=>{
                channel.messages.retrieve(payload.message_id, (message)=>{
                    message.reactions = [];
                });
            });
        });
    } else {
        cache.dms.retrieve(payload.channel_id, (channel)=>{
            channel.messages.retrieve(payload.message_id, (message)=>{
                message.reactions = [];
            });
        });
    }
}
const cache_sym = Symbol("@cache");
function enableCache(session) {
    const cache = {
        guilds: new Collection(session),
        users: new Collection(session),
        dms: new Collection(session),
        emojis: new Collection(session),
        cache: cache_sym,
        session
    };
    session.on("raw", (data)=>{
        const raw = data.d;
        if (!raw) return;
        switch(data.t){
            case "MESSAGE_CREATE":
                messageBootstrapper(cache, raw, false);
                break;
            case "MESSAGE_UPDATE":
                messageBootstrapper(cache, raw, !raw.edited_timestamp);
                break;
            case "CHANNEL_CREATE":
                channelBootstrapper(cache, raw);
                break;
            case "GUILD_MEMBER_ADD":
                memberBootstrapper(cache, raw, raw.guild_id);
                break;
            case "GUILD_CREATE":
                guildBootstrapper(cache, raw);
                break;
            case "GUILD_DELETE":
                cache.guilds.delete(raw.id);
                break;
            case "MESSAGE_REACTION_ADD":
                reactionBootstrapper(cache, raw, false);
                break;
            case "MESSAGE_REACTION_REMOVE":
                reactionBootstrapper(cache, raw, false);
                break;
            case "MESSAGE_REACTION_REMOVE_ALL":
                reactionBootstrapperDeletions(cache, raw);
                break;
            case "READY":
                userBootstrapper(cache, raw.user);
                break;
            default:
                session.emit("debug", `NOT CACHED: ${JSON.stringify(raw)}`);
        }
    });
    return cache;
}
export { cache_sym as cache_sym };
export { enableCache as enableCache };
export { enableCache as enableCache };
export { Session as default };
