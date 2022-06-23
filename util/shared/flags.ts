/**
 * @link https://discord.com/developers/docs/resources/channel#message-object-message-flags
 */
export enum MessageFlags {
    /** this message has been published to subscribed channels (via Channel Following) */
    CROSSPOSTED = 1 << 0,
    /** this message originated from a message in another channel (via Channel Following) */
    IS_CROSSPOST = 1 << 1,
    /** do not include any embeds when serializing this message */
    SUPPRESS_EMBEDS = 1 << 2,
    /** the source message for this crosspost has been deleted (via Channel Following) */
    SOURCE_MESSAGE_DELETED = 1 << 3,
    /** this message came from the urgent message system */
    URGENT = 1 << 4,
    /** this message has an associated thread, with the same id as the message */
    HAS_THREAD = 1 << 5,
    /** this message is only visible to the user who invoked the Interaction */
    EPHEMERAL = 1 << 6,
    /** this message is an Interaction Response and the bot is "thinking" */
    LOADING = 1 << 7,
    /** this message failed to mention some roles and add their members to the thread */
    FAILED_TO_MENTION_SOME_ROLES_IN_THREAD = 1 << 8,
}
