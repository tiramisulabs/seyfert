export enum ErrorCodes {
	ClientInvalidOption = 'CLIENT_INVALID_OPTION',
	ClientInvalidProvidedShards = 'CLIENT_INVALID_PROVIDED_SHARDS',
	ClientMissingIntents = 'CLIENT_MISSING_INTENTS',
	ClientNotReady = 'CLIENT_NOT_READY',

	TokenInvalid = 'TOKEN_INVALID',
	TokenMissing = 'TOKEN_MISSING',
	ApplicationCommandPermissionsTokenMissing = 'APPLICATION_COMMAND_PERMISSIONS_TOKEN_MISSING',

	WSCloseRequested = 'WS_CLOSE_REQUESTED',
	WSConnectionExists = 'WS_CONNECTION_EXISTS',
	WSNotOpen = 'WS_NOT_OPEN',
	ManagerDestroyed = 'MANAGER_DESTROYED',

	BitFieldInvalid = 'BITFIELD_INVALID',

	ShardingInvalid = 'SHARDING_INVALID',
	ShardingRequired = 'SHARDING_REQUIRED',
	InvalidIntents = 'INVALID_INTENTS',
	DisallowedIntents = 'DISALLOWED_INTENTS',
	ShardingNoShards = 'SHARDING_NO_SHARDS',
	ShardingInProcess = 'SHARDING_IN_PROCESS',
	ShardingInvalidEvalBroadcast = 'SHARDING_INVALID_EVAL_BROADCAST',
	ShardingShardNotFound = 'SHARDING_SHARD_NOT_FOUND',
	ShardingAlreadySpawned = 'SHARDING_ALREADY_SPAWNED',
	ShardingProcessExists = 'SHARDING_PROCESS_EXISTS',
	ShardingWorkerExists = 'SHARDING_WORKER_EXISTS',
	ShardingReadyTimeout = 'SHARDING_READY_TIMEOUT',
	ShardingReadyDisconnected = 'SHARDING_READY_DISCONNECTED',
	ShardingReadyDied = 'SHARDING_READY_DIED',
	ShardingNoChildExists = 'SHARDING_NO_CHILD_EXISTS',
	ShardingShardMiscalculation = 'SHARDING_SHARD_MISCALCULATION',

	ColorRange = 'COLOR_RANGE',
	ColorConvert = 'COLOR_CONVERT',

	InviteOptionsMissingChannel = 'INVITE_OPTIONS_MISSING_CHANNEL',

	ButtonLabel = 'BUTTON_LABEL',
	ButtonURL = 'BUTTON_URL',
	ButtonCustomId = 'BUTTON_CUSTOM_ID',

	SelectMenuCustomId = 'SELECT_MENU_CUSTOM_ID',
	SelectMenuPlaceholder = 'SELECT_MENU_PLACEHOLDER',
	SelectOptionLabel = 'SELECT_OPTION_LABEL',
	SelectOptionValue = 'SELECT_OPTION_VALUE',
	SelectOptionDescription = 'SELECT_OPTION_DESCRIPTION',

	InteractionCollectorError = 'INTERACTION_COLLECTOR_ERROR',

	FileNotFound = 'FILE_NOT_FOUND',

	UserBannerNotFetched = 'USER_BANNER_NOT_FETCHED',
	UserNoDMChannel = 'USER_NO_DM_CHANNEL',

	VoiceNotStageChannel = 'VOICE_NOT_STAGE_CHANNEL',

	VoiceStateNotOwn = 'VOICE_STATE_NOT_OWN',
	VoiceStateInvalidType = 'VOICE_STATE_INVALID_TYPE',

	ReqResourceType = 'REQ_RESOURCE_TYPE',

	ImageFormat = 'IMAGE_FORMAT',
	ImageSize = 'IMAGE_SIZE',

	MessageBulkDeleteType = 'MESSAGE_BULK_DELETE_TYPE',
	MessageNonceType = 'MESSAGE_NONCE_TYPE',
	MessageContentType = 'MESSAGE_CONTENT_TYPE',

	SplitMaxLen = 'SPLIT_MAX_LEN',

	BanResolveId = 'BAN_RESOLVE_ID',
	FetchBanResolveId = 'FETCH_BAN_RESOLVE_ID',

	PruneDaysType = 'PRUNE_DAYS_TYPE',

	GuildChannelResolve = 'GUILD_CHANNEL_RESOLVE',
	GuildVoiceChannelResolve = 'GUILD_VOICE_CHANNEL_RESOLVE',
	GuildChannelOrphan = 'GUILD_CHANNEL_ORPHAN',
	GuildChannelUnowned = 'GUILD_CHANNEL_UNOWNED',
	GuildOwned = 'GUILD_OWNED',
	GuildMembersTimeout = 'GUILD_MEMBERS_TIMEOUT',
	GuildUncachedMe = 'GUILD_UNCACHED_ME',
	ChannelNotCached = 'CHANNEL_NOT_CACHED',
	StageChannelResolve = 'STAGE_CHANNEL_RESOLVE',
	GuildScheduledEventResolve = 'GUILD_SCHEDULED_EVENT_RESOLVE',
	FetchOwnerId = 'FETCH_OWNER_ID',

	InvalidType = 'INVALID_TYPE',
	InvalidElement = 'INVALID_ELEMENT',

	MessageThreadParent = 'MESSAGE_THREAD_PARENT',
	MessageExistingThread = 'MESSAGE_EXISTING_THREAD',
	ThreadInvitableType = 'THREAD_INVITABLE_TYPE',

	WebhookMessage = 'WEBHOOK_MESSAGE',
	WebhookTokenUnavailable = 'WEBHOOK_TOKEN_UNAVAILABLE',
	WebhookURLInvalid = 'WEBHOOK_URL_INVALID',
	WebhookApplication = 'WEBHOOK_APPLICATION',
	MessageReferenceMissing = 'MESSAGE_REFERENCE_MISSING',

	EmojiType = 'EMOJI_TYPE',
	EmojiManaged = 'EMOJI_MANAGED',
	MissingManageEmojisAndStickersPermission = 'MISSING_MANAGE_EMOJIS_AND_STICKERS_PERMISSION',
	NotGuildSticker = 'NOT_GUILD_STICKER',

	ReactionResolveUser = 'REACTION_RESOLVE_USER',

	VanityURL = 'VANITY_URL',

	InviteResolveCode = 'INVITE_RESOLVE_CODE',

	InviteNotFound = 'INVITE_NOT_FOUND',

	DeleteGroupDMChannel = 'DELETE_GROUP_DM_CHANNEL',
	FetchGroupDMChannel = 'FETCH_GROUP_DM_CHANNEL',

	MemberFetchNonceLength = 'MEMBER_FETCH_NONCE_LENGTH',

	GlobalCommandPermissions = 'GLOBAL_COMMAND_PERMISSIONS',
	GuildUncachedEntityResolve = 'GUILD_UNCACHED_ENTITY_RESOLVE',

	InteractionAlreadyReplied = 'INTERACTION_ALREADY_REPLIED',
	InteractionNotReplied = 'INTERACTION_NOT_REPLIED',
	InteractionEphemeralReplied = 'INTERACTION_EPHEMERAL_REPLIED',

	CommandInteractionOptionNotFound = 'COMMAND_INTERACTION_OPTION_NOT_FOUND',
	CommandInteractionOptionType = 'COMMAND_INTERACTION_OPTION_TYPE',
	CommandInteractionOptionEmpty = 'COMMAND_INTERACTION_OPTION_EMPTY',
	CommandInteractionOptionNoSubcommand = 'COMMAND_INTERACTION_OPTION_NO_SUBCOMMAND',
	CommandInteractionOptionNoSubcommandGroup = 'COMMAND_INTERACTION_OPTION_NO_SUBCOMMAND_GROUP',
	CommandInteractionOptionInvalidChannelType = 'COMMAND_INTERACTION_OPTION_INVALID_CHANNEL_TYPE',
	AutocompleteInteractionOptionNoFocusedOption = 'AUTOCOMPLETE_INTERACTION_OPTION_NO_FOCUSED_OPTION',

	ModalSubmitInteractionFieldNotFound = 'MODAL_SUBMIT_INTERACTION_FIELD_NOT_FOUND',
	ModalSubmitInteractionTypeField = 'MODAL_SUBMIT_INTERACTION_TYPE_FIELD',

	InvalidMissingScopes = 'INVALID_MISSING_SCOPES',

	NotImplemented = 'NOT_IMPLEMENTED',

	SweepFilterReturn = 'SWEEP_FILTER_RETURN',

	GuildForumMessageRequired = 'GUILD_FORUM_MESSAGE_REQUIRED'
}
