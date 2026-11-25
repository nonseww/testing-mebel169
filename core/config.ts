import path from 'node:path';
import dotenv from 'dotenv';
import type { Account, ContactData } from './dto';

/**
 * Единая точка конфигурации. Значения берутся из переменных окружения
 * и локального файла .env (он в .gitignore). Секреты в коде не хранятся.
 */
dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

export type BrowserName = 'chromium' | 'firefox' | 'webkit';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const BROWSERS: readonly BrowserName[] = ['chromium', 'firefox', 'webkit'];
const LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'];

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function str(name: string, fallback: string): string {
  return env(name) ?? fallback;
}

function int(name: string, fallback: number): number {
  const raw = env(name);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Переменная ${name} должна быть положительным целым числом, получено "${raw}"`);
  }
  return value;
}

function bool(name: string, fallback: boolean): boolean {
  const raw = env(name);
  if (raw === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

function oneOf<T extends string>(name: string, allowed: readonly T[], fallback: T): T {
  const raw = (env(name) ?? fallback).toLowerCase() as T;
  if (!allowed.includes(raw)) {
    throw new Error(`Переменная ${name}="${raw}" не из списка: ${allowed.join(', ')}`);
  }
  return raw;
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function readAccount(): Account | null {
  const password = env('TEST_USER_PASSWORD');
  const phone = env('TEST_USER_PHONE');
  const email = env('TEST_USER_EMAIL');
  if (!password || (!phone && !email)) return null;
  return { phone, email, password, displayName: env('TEST_USER_NAME') };
}

const account = readAccount();

const checkoutContacts: ContactData = {
  name: str('CHECKOUT_NAME', account?.displayName ?? 'Автотест'),
  phone: str('CHECKOUT_PHONE', account?.phone ?? '+79000000000'),
  email: str('CHECKOUT_EMAIL', account?.email ?? 'autotest@example.com'),
};

export const config = Object.freeze({
  baseUrl: trimSlash(str('BASE_URL', 'https://mebel169.ru')),
  lkUrl: trimSlash(str('LK_URL', 'https://lk.169.ru')),
  browser: oneOf('BROWSER', BROWSERS, 'firefox'),
  headless: bool('HEADLESS', true),
  /** Замедление каждого действия браузера, мс (для показа прогона в видимом браузере). */
  slowMo: int('SLOW_MO_MS', 0),
  workers: int('WORKERS', 2),
  timeouts: Object.freeze({
    /** Тайм-аут одного действия (клик, ввод). */
    action: int('ACTION_TIMEOUT_MS', 15_000),
    /** Тайм-аут навигации. */
    navigation: int('NAVIGATION_TIMEOUT_MS', 45_000),
    /** Тайм-аут ожидания в expect(). */
    expect: int('EXPECT_TIMEOUT_MS', 10_000),
    /** Тайм-аут теста целиком. */
    test: int('TEST_TIMEOUT_MS', 180_000),
  }),
  logLevel: oneOf('LOG_LEVEL', LOG_LEVELS, 'info'),
  logDir: path.resolve(process.cwd(), str('LOG_DIR', 'logs')),
  /** Источник тестовых данных: каталог с JSON-наборами. */
  dataDir: path.resolve(process.cwd(), str('TEST_DATA_DIR', 'autotest/data')),
  account,
  checkoutContacts,
  /** Нажимать ли «Подтвердить заказ». По умолчанию false: заказ на боевом сайте не создаём. */
  orderSubmit: bool('ORDER_SUBMIT', false),
  /** Отладка сквозного сценария без учётной записи (шаг «Вход» пропускается). */
  e2eAllowGuest: bool('E2E_ALLOW_GUEST', false),
});

export type Config = typeof config;
