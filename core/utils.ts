/** "32 990 ₽" → 32990; "-5 900 ₽" → 5900 (знак отбрасывается). */
export function parsePrice(text: string): number {
  const digits = text.replace(/[^\d]/g, '');
  if (!digits) throw new Error(`Не удалось разобрать цену из "${text}"`);
  return Number(digits);
}

/** "Товары (2)" → 2 */
export function parseCount(text: string): number {
  const match = /\((\d+)\)/.exec(text) ?? /(\d+)/.exec(text);
  if (!match) throw new Error(`Не удалось разобрать количество из "${text}"`);
  return Number(match[1]);
}

/** Цифры номера без кода страны: "+7 (900) 123-45-67" → "9001234567". */
export function localPhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 11 && /^[78]/.test(digits) ? digits.slice(1) : digits;
}
