import type { GuildOnboardingStructure, GuildWelcomeScreenStructure } from '../client/transformers';
import type { MethodContext } from '../common';
import type {
	APIGuildWidget,
	APIGuildWidgetSettings,
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
		auditLog: (query?: RESTGetAPIAuditLogQuery): Promise<RESTGetAPIAuditLogResult> =>
			client.guilds.audit.fetch(guildId, query),
		onboarding: (): Promise<GuildOnboardingStructure> => client.guilds.onboarding.fetch(guildId),
		editOnboarding: (body: RESTPutAPIGuildOnboardingJSONBody, reason?: string): Promise<GuildOnboardingStructure> =>
			client.guilds.onboarding.edit(guildId, body, reason),
		welcomeScreen: (): Promise<GuildWelcomeScreenStructure> => client.guilds.welcome.fetch(guildId),
		editWelcomeScreen: (
			body: RESTPatchAPIGuildWelcomeScreenJSONBody,
			reason?: string,
		): Promise<GuildWelcomeScreenStructure> => client.guilds.welcome.edit(guildId, body, reason),
		widgetSettings: (): Promise<APIGuildWidgetSettings> => client.guilds.widget.settings(guildId),
		editWidgetSettings: (
			body: RESTPatchAPIGuildWidgetSettingsJSONBody,
			reason?: string,
		): Promise<APIGuildWidgetSettings> => client.guilds.widget.edit(guildId, body, reason),
		widget: (): Promise<APIGuildWidget> => client.guilds.widget.fetch(guildId),
		widgetImage: (query?: RESTGetAPIGuildWidgetImageQuery) => client.guilds.widget.image(guildId, query),
		editIncidents: (
			body: RESTPutAPIGuildIncidentActionsJSONBody,
			reason?: string,
		): Promise<RESTPutAPIGuildIncidentActionsResult> => client.guilds.incidents(guildId, body, reason),
	};
}
