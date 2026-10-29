
const DECIMALS = 2;

export function cleanPriceInput(text: string): string {
  const [integer, ...rest] = text.replace(/[^\d,]/g, '').split(',');
  const digits = integer.replace(/^0+(?=\d)/, '');
  if (rest.length === 0) return digits;
  return `${digits || '0'},${rest.join('').slice(0, DECIMALS)}`;
}

export function formatPriceInput(raw: string): string {
  if (raw === '') return '';
  const [integer, decimals] = raw.split(/[.,]/);
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${grouped}${decimals === undefined ? '' : `,${decimals}`}`;
}

export function countSignificant(text: string): number {
  return text.replace(/[^\d,]/g, '').length;
}

export function caretFor(formatted: string, significant: number): number {
  if (significant <= 0) return formatted.startsWith('$') ? 1 : 0;
  let seen = 0;
  for (let index = 0; index < formatted.length; index += 1) {
    if (/[\d,]/.test(formatted[index])) seen += 1;
    if (seen === significant) return index + 1;
  }
  return formatted.length;
}
