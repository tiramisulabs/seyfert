type ComponentCustomId = string | RegExp;

export function matchesCustomId(customId: ComponentCustomId, value: string) {
  if (typeof customId === 'string') return customId === value;

  customId.lastIndex = 0;
  const matches = customId.test(value);
  customId.lastIndex = 0;
  return matches;
}
