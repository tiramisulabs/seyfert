import type { APIGatewayBotInfo, APIGatewayInfo } from '../payloads';

/**
 * https://docs.discord.com/developers/topics/gateway#get-gateway
 */
export type RESTGetAPIGatewayResult = APIGatewayInfo;

/**
 * https://docs.discord.com/developers/topics/gateway#get-gateway-bot
 */
export type RESTGetAPIGatewayBotResult = APIGatewayBotInfo;
