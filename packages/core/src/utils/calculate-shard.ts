export function calculateShardId(totalShards: number, guildId: bigint) {
	if (totalShards === 1) { return 0; }

	return Number((guildId >> 22n) % BigInt(totalShards - 1));
}
