export const API_VERSION = '10';

export const BASE_URL = `/api/v${API_VERSION}`;
export const BASE_HOST = `https://discord.com`;

export const GATEWAY_BASE_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';

export const OK_STATUS_CODES = [200, 201, 204, 304];

export const enum HTTPMethods {
	Delete = 'DELETE',
	Get = 'GET',
	Patch = 'PATCH',
	Post = 'POST',
	Put = 'PUT',
}

