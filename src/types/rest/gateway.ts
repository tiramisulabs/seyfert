import type { APIGatewayBotInfo, APIGatewayInfo } from '../payloads';

/**
 * https://discord.com/developers/docs/topics/gateway#get-gateway
 */
export type RESTGetAPIGatewayResult = APIGatewayInfo;

/**
 * https://discord.com/developers/docs/topics/gateway#get-gateway-bot
 */
export type RESTGetAPIGatewayBotResult = APIGatewayBotInfo;
