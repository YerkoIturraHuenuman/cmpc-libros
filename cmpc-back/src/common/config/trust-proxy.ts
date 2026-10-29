export function parseTrustProxy(value: string | undefined): boolean | number | string {
  const text = value?.trim() ?? '';
  if (text === '' || text === 'false') return false;
  if (text === 'true') return true;
  if (/^\d+$/.test(text)) return Number(text);
  return text;
}
