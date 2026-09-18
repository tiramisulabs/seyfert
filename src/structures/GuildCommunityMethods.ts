// ho tiny mixin so Guild structures get community helpers without bloating Guild.ts
// btw keeps onboarding + welcome + widget + audit + incidents in one spot
import type { GuildOnboardingStructure, GuildWelcomeScreenStructure } from '../client/transformers';
import type { MethodContext } from '../common';
import type {
	APIGuildWidget,
	APIGuildWidgetSettings,
	AuditLogEvent,
	RESTGetAPIAuditLogQuery,
	RESTGetAPIAuditLogResult,
	RESTGetAPIGuildWidgetImageQuery,
	RESTPatchAPIGuildWelcomeScreenJSONBody,
	RESTPatchAPIGuildWidgetSettingsJSONBody,
	RESTPutAPIGuildIncidentActionsJSONBody,
	RESTPutAPIGuildIncidentActionsResult,
	RESTPutAPIGuildOnboardingJSONBody,
} from '../types';

export function GuildCommunityMethods({ client, guildId }: MethodContext<{ guildId: string }>) {
	return {
		// ops audit log fetch lives here too for guild scoped calls
		auditLog: (query?: RESTGetAPIAuditLogQuery): Promise<RESTGetAPIAuditLogResult> =>
			client.guilds.audit.fetch(guildId, query),
		auditLogByUser: (
			userId: string,
			query?: Omit<RESTGetAPIAuditLogQuery, 'user_id'>,
		): Promise<RESTGetAPIAuditLogResult> => client.guilds.audit.byUser(guildId, userId, query),
		auditLogByAction: (
			actionType: AuditLogEvent,
			query?: Omit<RESTGetAPIAuditLogQuery, 'action_type'>,
		): Promise<RESTGetAPIAuditLogResult> => client.guilds.audit.byAction(guildId, actionType, query),
		// ho onboarding shortcuts, cuz full shorter path is a mouthful
		onboarding: (): Promise<GuildOnboardingStructure> => client.guilds.onboarding.fetch(guildId),
		editOnboarding: (
			body: RESTPutAPIGuildOnboardingJSONBody,
			reason?: string,
		): Promise<GuildOnboardingStructure> => client.guilds.onboarding.edit(guildId, body, reason),
		// ahh welcome screen shortcuts
		welcomeScreen: (): Promise<GuildWelcomeScreenStructure> => client.guilds.welcome.fetch(guildId),
		editWelcomeScreen: (
			body: RESTPatchAPIGuildWelcomeScreenJSONBody,
			reason?: string,
		): Promise<GuildWelcomeScreenStructure> => client.guilds.welcome.edit(guildId, body, reason),
		// btw widget bits, settings plus public json plus png
		widgetSettings: (): Promise<APIGuildWidgetSettings> => client.guilds.widget.settings(guildId),
		editWidgetSettings: (
			body: RESTPatchAPIGuildWidgetSettingsJSONBody,
			reason?: string,
		): Promise<APIGuildWidgetSettings> => client.guilds.widget.edit(guildId, body, reason),
		widget: (): Promise<APIGuildWidget> => client.guilds.widget.fetch(guildId),
		widgetImage: (query?: RESTGetAPIGuildWidgetImageQuery) => client.guilds.widget.image(guildId, query),
		// hell incidents toggle, invites and dms disable windows
		editIncidents: (
			body: RESTPutAPIGuildIncidentActionsJSONBody,
			reason?: string,
		): Promise<RESTPutAPIGuildIncidentActionsResult> => client.guilds.incidents(guildId, body, reason),
	};
}
