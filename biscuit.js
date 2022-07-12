// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

class Collection extends Map {
    maxSize;
    constructor(entries, options){
        super(entries ?? []);
        this.maxSize = options?.maxSize;
    }
    set(key, value) {
        if ((this.maxSize || this.maxSize === 0) && this.size >= this.maxSize) {
            return this;
        }
        return super.set(key, value);
    }
    forceSet(key, value) {
        return super.set(key, value);
    }
    array() {
        return [
            ...this.values()
        ];
    }
    first() {
        return this.values().next().value;
    }
    last() {
        return [
            ...this.values()
        ][this.size - 1];
    }
    random() {
        const array = [
            ...this.values()
        ];
        return array[Math.floor(Math.random() * array.length)];
    }
    find(callback) {
        for (const key of this.keys()){
            const value = this.get(key);
            if (callback(value, key)) return value;
        }
        return;
    }
    filter(callback) {
        const relevant = new Collection();
        this.forEach((value, key)=>{
            if (callback(value, key)) relevant.set(key, value);
        });
        return relevant;
    }
    map(callback) {
        const results = [];
        for (const key of this.keys()){
            const value = this.get(key);
            results.push(callback(value, key));
        }
        return results;
    }
    some(callback) {
        for (const key of this.keys()){
            const value = this.get(key);
            if (callback(value, key)) return true;
        }
        return false;
    }
    every(callback) {
        for (const key of this.keys()){
            const value = this.get(key);
            if (!callback(value, key)) return false;
        }
        return true;
    }
    reduce(callback, initialValue) {
        let accumulator = initialValue;
        for (const key of this.keys()){
            const value = this.get(key);
            accumulator = callback(accumulator, value, key);
        }
        return accumulator;
    }
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
Object.freeze({
    UNCOMPRESSED: 0,
    FIXED: 1,
    DYNAMIC: 2
});
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
generateHuffmanTable(makeFixedHuffmanCodelenValues());
new TextDecoder();
const BASE_URL = "https://discord.com/api";
const DISCORDENO_VERSION = "13.0.0-rc45";
`DiscordBot (https://github.com/discordeno/discordeno, v${DISCORDENO_VERSION})`;
const IMAGE_BASE_URL = "https://cdn.discordapp.com";
const baseEndpoints = {
    BASE_URL: `${BASE_URL}/v${10}`,
    CDN_URL: IMAGE_BASE_URL
};
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
function GUILD_EMOJIS(guildId) {
    return `/guilds/${guildId}/emojis`;
}
function GUILD_EMOJI(guildId, emojiId) {
    return `/guilds/${guildId}/emojis/${emojiId}`;
}
function GUILDS() {
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
function WEBHOOK_MESSAGE(webhookId, token, messageId) {
    return `/webhooks/${webhookId}/${token}/messages/${messageId}`;
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
        this.banner = data.banner;
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
    get tag() {
        return `${this.username}#${this.discriminator}}`;
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
const Snowflake = {
    snowflakeToTimestamp (id) {
        return (Number(id) >> 22) + 14200704e5;
    }
};
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
class InviteGuild extends AnonymousGuild {
    constructor(session, data){
        super(session, data);
        if (data.welcome_screen) {
            this.welcomeScreen = new WelcomeScreen(session, data.welcome_screen);
        }
    }
    welcomeScreen;
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
                if (component.style === ButtonStyles.Link) {
                    return new Button(session, component);
                }
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
        const message = await this.session.rest.sendRequest(this.session.rest, {
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
        return options?.wait ?? true ? new Message(this.session, message) : undefined;
    }
    async fetch() {
        const message = await this.session.rest.runMethod(this.session.rest, "GET", WEBHOOK_TOKEN(this.id, this.token));
        return new Webhook(this.session, message);
    }
    async fetchMessage(messageId) {
        if (!this.token) {
            return;
        }
        const message = await this.session.rest.runMethod(this.session.rest, "GET", WEBHOOK_MESSAGE(this.id, this.token, messageId));
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
    }
    session;
    id;
    type;
    channelId;
    guildId;
    applicationId;
    author;
    flags;
    pinned;
    tts;
    content;
    nonce;
    mentionEveryone;
    timestamp;
    editedTimestamp;
    reactions;
    attachments;
    embeds;
    member;
    thread;
    components;
    webhook;
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
            tts: options.tts
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
    members;
    roles;
    emojis;
    channels;
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
    async leave() {}
    async delete() {
        await this.session.rest.runMethod(this.session.rest, "DELETE", GUILDS());
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
            icon: "iconURL" in options ? options.iconURL || urlToBase64(options.iconURL) : options.iconHash || Util.iconBigintToHash(options.iconHash),
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
                    icon: options.iconURL || urlToBase64(options.iconURL)
                }))
        });
        return new Guild(session, guild);
    }
    async edit(session, options) {
        const guild = await session.rest.runMethod(session.rest, "PATCH", GUILDS(), {
            name: options.name,
            afk_channel_id: options.afkChannelId,
            afk_timeout: options.afkTimeout,
            default_message_notifications: options.defaultMessageNotifications,
            explicit_content_filter: options.explicitContentFilter,
            system_channel_flags: options.systemChannelFlags,
            verification_level: options.verificationLevel,
            icon: "iconURL" in options ? options.iconURL || urlToBase64(options.iconURL) : options.iconHash || Util.iconBigintToHash(options.iconHash),
            splash: "splashURL" in options ? options.splashURL || urlToBase64(options.splashURL) : options.splashHash || Util.iconBigintToHash(options.iconHash),
            banner: "bannerURL" in options ? options.bannerURL || urlToBase64(options.bannerURL) : options.bannerHash || Util.iconBigintToHash(options.bannerHash),
            discovery_splash: "discoverySplashURL" in options ? options.discoverySplashURL || urlToBase64(options.discoverySplashURL) : options.discoverySplashHash || Util.iconBigintToHash(options.discoverySplashHash),
            owner_id: options.ownerId,
            rules_channel_id: options.rulesChannelId,
            public_updates_channel_id: options.publicUpdatesChannelId,
            preferred_locale: options.preferredLocale,
            features: options.features,
            description: options.description,
            premiumProgressBarEnabled: options.premiumProgressBarEnabled
        });
        return new Guild(session, guild);
    }
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
const cache_sym = Symbol("@cache");
class StructCache extends Map {
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
        const result = new StructCache(this.session);
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
        return new StructCache(this.session, this.entries());
    }
    concat(structures) {
        const conc = this.clone();
        for (const structure of structures){
            if (!structure || !(structure instanceof StructCache)) continue;
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
}
function userBootstrapper(cache, user) {
    cache.users.set(user.id, new User(cache.session, user));
}
function emojiBootstrapper(cache, emoji, guildId) {
    if (!emoji.id) return;
    cache.emojis.set(emoji.id, new GuildEmoji(cache.session, emoji, guildId));
}
function DMChannelBootstrapper(cache, channel) {
    cache.dms.set(channel.id, new DMChannel(cache.session, channel));
}
function guildBootstrapper(guild, cache) {
    const members = new Map(guild.members?.map((data)=>{
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
    const channels = new Map(guild.channels?.map((data)=>{
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
export { cache_sym as cache_sym };
export { StructCache as StructCache };
export { userBootstrapper as userBootstrapper };
export { emojiBootstrapper as emojiBootstrapper };
export { DMChannelBootstrapper as DMChannelBootstrapper };
export { guildBootstrapper as guildBootstrapper };
