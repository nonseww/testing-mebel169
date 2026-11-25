import { config } from './config';

/**
 * Маскирование чувствительных данных в логах и вложениях отчёта:
 * пароли, контакты, токены, cookies.
 */
const MASK = '***';
const registered = new Set<string>();
/** Виды зарегистрированных секретов (без значений) — для сводки в логе. */
const registeredKinds = new Set<string>();

export function registerSecret(value: string | undefined, kind = 'секрет'): void {
  if (!value || value.length < 3) return;
  registered.add(value);
  registeredKinds.add(kind);
  const digits = value.replace(/\D/g, '');
  // Телефон может появиться в логах в другом формате: +7(900) 123-45-67 / 79001234567 / 9001234567
  if (digits.length >= 10) {
    registered.add(digits);
    registered.add(digits.slice(-10));
  }
}

const GENERIC_PATTERNS: Array<[RegExp, string]> = [
  // email
  [/[\w.+-]+@[\w-]+(\.[\w-]+)*/g, MASK],
  // телефоны РФ в разных форматах
  [/(\+?[78])?[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/g, MASK],
  // токены и cookies
  [/(authorization|bearer|token|cookie|set-cookie|xsrf-token|laravel_session|sessionid)(["':=\s]+)[^\s;,"']+/gi, `$1$2${MASK}`],
];

/**
 * @param generic — дополнительно маскировать любые email/телефоны/токены по шаблонам.
 * Для логов — да; для JSON-результатов Allure — нет (шаблон телефона задел бы таймстемпы).
 */
export function maskSecrets(text: string, generic = true): string {
  let result = text;
  // длинные значения первыми, чтобы не оставлять «хвосты»
  for (const secret of [...registered].sort((a, b) => b.length - a.length)) {
    result = result.split(secret).join(MASK);
  }
  if (!generic) return result;
  for (const [pattern, replacement] of GENERIC_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Значение для логов: пароль всегда скрыт, остальное проходит через maskSecrets.
 * Если значение было скрыто — в лог добавляется пометка, что сработало маскирование.
 */
export function describeValue(value: string, sensitive: boolean): string {
  if (!value) return '(пусто)';
  if (sensitive) return `${MASK} [замаскировано: пароль]`;
  const masked = maskSecrets(value);
  return masked === value ? value : `${masked} [замаскировано]`;
}

/** Сводка для лога: что маскируется (только виды данных, без самих значений). */
export function maskingSummary(): string {
  const kinds = [...registeredKinds].join(', ') || 'нет';
  return (
    `Маскирование включено. Значения из окружения (.env): ${kinds}; ` +
    'шаблоны: email, телефоны, токены, cookies. В логах и отчёте они заменяются на «***».'
  );
}

// Секреты из конфигурации регистрируются сразу при загрузке модуля.
registerSecret(config.account?.password, 'пароль');
registerSecret(config.account?.phone, 'телефон');
registerSecret(config.account?.email, 'email');
registerSecret(config.account?.displayName, 'имя пользователя');
registerSecret(config.checkoutContacts.phone, 'телефон');
registerSecret(config.checkoutContacts.email, 'email');
