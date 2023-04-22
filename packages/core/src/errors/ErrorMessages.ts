export enum ErrorMessages {
	ClientInvalidOption = 'The client options passed were invalid.',
	ClientInvalidProvidedShards = 'The shards option was invalid. It should be an array of numbers or "auto".',
	ClientMissingIntents = 'Valid intents must be provided for the client.',
	ClientNotReady = 'The client needs to be logged in to perform this action.',

	TokenInvalid = 'An invalid token was provided.',
	TokenMissing = 'Request to use token, but token was unavailable to the client.',
	ApplicationCommandPermissionsTokenMissing = 'Request to use application command permissions, but token was unavailable to the client.',

	WSCloseRequested = 'WebSocket closed due to user request.',
	WSConnectionExists = 'There is already an existing WebSocket connection.',
	WSNotOpen = 'WebSocket is not open',
	ManagerDestroyed = 'The Manager has been destroyed and cannot be used.',

	BitFieldInvalid = 'Invalid bitfield flag or number.',

	ShardingInvalid = 'Invalid shard settings were provided.',
	ShardingRequired = 'This session would have handled too many guilds - Sharding is required.',
	InvalidIntents = 'Invalid intents were provided.',
	DisallowedIntents = 'Privileged intent provided is not enabled or whitelisted.',
	ShardingNoShards = 'No shards have been spawned.',
	ShardingInProcess = 'Shards are still being spawned.',
	ShardingInvalidEvalBroadcast = 'Cannot broadcast an eval to other shards with this method.',
	ShardingShardNotFound = 'Shard could not be found by id.',
	ShardingAlreadySpawned = 'Shard with that id has already been spawned.',
	ShardingProcessExists = 'A process with that id has already been spawned.',
	ShardingWorkerExists = 'A worker with that id has already been spawned.',
	ShardingReadyTimeout = 'Shards took too long to become ready.',
	ShardingReadyDisconnected = 'Shards disconnected before becoming ready.',
	ShardingReadyDied = 'Shards died before becoming ready.',
	ShardingNoChildExists = 'No process or worker exists with that id.',
	ShardingShardMiscalculation = 'Shard count and shard ids are mismatched.',

	ColorRange = 'Color must be within the range 0 - 16777215 (0xFFFFFF).',
	ColorConvert = 'Unable to convert color to a number.',

	InviteOptionsMissingChannel = 'Channel must be set in InviteOptions.',

	ButtonLabel = 'Button label must be a string.',
	ButtonURL = 'Button URL must be a string.',
	ButtonCustomId = 'Button customId must be a string.',

	SelectMenuCustomId = 'SelectMenu customId must be a string.',
	SelectMenuPlaceholder = 'SelectMenu placeholder must be a string.',
	SelectOptionLabel = 'SelectOption label must be a string.',
	SelectOptionValue = 'SelectOption value must be a string.',
	SelectOptionDescription = 'SelectOption description must be a string.',

	InteractionCollectorError = 'Cannot collect interactions on a message that has not been sent.',

	FileNotFound = 'File could not be found.',

	UserBannerNotFetched = 'User banner is not fetched.',
	UserNoDMChannel = 'User does not have a DM channel.',

	VoiceNotStageChannel = 'Voice channel is not a stage channel.',

	VoiceStateNotOwn = 'Voice state does not belong to the client.',
	VoiceStateInvalidType = 'Voice state type must be a boolean.',

	ReqResourceType = 'Request resource type must be a string, Buffer, or a Stream.',

	ImageFormat = 'Invalid image format.',
	ImageSize = 'Invalid image size.',

	MessageBulkDeleteType = 'The messages must be an Array or number.',
	MessageNonceType = 'Message nonce must be a string or number.',
	MessageContentType = 'Message content must be a string.',

	SplitMaxLen = 'Exceeds maximum length and contains no split characters.',

	BanResolveId = 'Could not resolve the user ID.',
	FetchBanResolveId = 'Fetch ban resolve target must be a user id.',

	PruneDaysType = 'Days must be a number.',

	GuildChannelResolve = 'Could not resolve channel to a guild channel.',
	GuildVoiceChannelResolve = 'Failed to resolve guild voice channel',
	GuildChannelOrphan = 'Could not find the guild parent for this channel.',
	GuildChannelUnowned = 'The channel does not have an owner.',
	GuildOwned = 'The guild is owned by the client.',
	GuildMembersTimeout = 'Timed out while fetching guild members.',
	GuildUncachedMe = 'The bot user is not cached for this guild.',
	ChannelNotCached = 'The channel is not cached.',
	StageChannelResolve = 'Failed to resolve stage channel.',
	GuildScheduledEventResolve = 'Failed to resolve guild scheduled event.',
	FetchOwnerId = 'Failed to fetch owner ID for guild.',

	InvalidType = 'Invalid type provided.',
	InvalidElement = 'Invalid element provided.',

	MessageThreadParent = 'Message was not sent in a thread or news channel.',
	MessageExistingThread = 'Message already has an existing thread.',
	ThreadInvitableType = 'Thread invitable type must be a boolean.',

	WebhookMessage = 'Webhook message must be a string, object, or array.',
	WebhookTokenUnavailable = 'Webhook token is unavailable.',
	WebhookURLInvalid = 'Webhook URL is invalid.',
	WebhookApplication = 'Webhook application is invalid.',
	MessageReferenceMissing = 'Message reference is missing.',

	EmojiType = 'Emoji type must be a string.',
	EmojiManaged = 'Emoji is managed.',
	MissingManageEmojisAndStickersPermission = 'Missing Manage Emojis and Stickers permission.',
	NotGuildSticker = 'Sticker is not a guild sticker.',

	ReactionResolveUser = 'Failed to resolve user.',

	VanityURL = 'Vanity URL is not available.',

	InviteResolveCode = 'Failed to resolve invite code.',

	InviteNotFound = 'Invite was not found.',

	DeleteGroupDMChannel = 'Cannot delete a group DM channel.',
	FetchGroupDMChannel = 'Cannot fetch a group DM channel.',

	MemberFetchNonceLength = 'Member fetch nonce must be at least 32 characters long.',

	GlobalCommandPermissions = 'Global command permissions may onle be fetched by providing a Guild.',
	GuildUncachedEntityResolve = 'The guild is not cached and could not resolve the entity.',

	InteractionAlreadyReplied = 'Interaction has already been replied to.',
	InteractionNotReplied = 'Interaction has not been replied to.',
	InteractionEphemeralReplied = 'Interaction has already been replied to with ephemeral.',

	CommandInteractionOptionNotFound = 'Command interaction option not found.',
	CommandInteractionOptionType = 'Invalid command interaction option type.',
	CommandInteractionOptionEmpty = 'Command interaction option is empty.',
	CommandInteractionOptionNoSubcommand = 'Command interaction option has no subcommand.',
	CommandInteractionOptionNoSubcommandGroup = 'Command interaction option has no subcommand group.',
	CommandInteractionOptionInvalidChannelType = 'Command interaction option has invalid channel type.',
	AutocompleteInteractionOptionNoFocusedOption = 'Autocomplete interaction option has no focused option.',

	ModalSubmitInteractionFieldNotFound = 'Required field with custom id not found in modal submit interaction.',
	ModalSubmitInteractionTypeField = 'Invalid type for field with custom id in modal submit interaction.',

	InvalidMissingScopes = 'Invalid or missing scopes.',

	NotImplemented = 'Not implemented.',

	SweepFilterReturn = 'Sweep filter must return a boolean.',

	GuildForumMessageRequired = 'Guild forum message is required.'
}
