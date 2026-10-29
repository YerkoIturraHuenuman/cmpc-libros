const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export function parseDurationMs(value: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(value.trim());
  if (!match) {
    throw new Error(`Duración inválida: "${value}" (usa 30s, 15m, 2h o 7d)`);
  }
  return Number(match[1]) * UNIT_MS[match[2]];
}
