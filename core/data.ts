import fs from 'node:fs';
import path from 'node:path';
import { config } from './config';

/**
 * Загрузка тестовых данных из JSON (каталог задаётся TEST_DATA_DIR).
 * В данных можно ссылаться на учётную запись: {{account.phone}}, {{account.email}}, {{account.password}}.
 * Сами значения берутся из окружения и в файлах данных не хранятся.
 */
const REF = /^\{\{account\.(phone|email|password)\}\}$/;

export class MissingTestDataError extends Error {}

export function loadData<T>(fileName: string): T {
  const file = path.join(config.dataDir, fileName);
  if (!fs.existsSync(file)) {
    throw new Error(`Не найден файл тестовых данных: ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
}

/** true, если строка ссылается на данные учётной записи. */
export function isAccountRef(value: string): boolean {
  return REF.test(value);
}

/** Подставляет значение из учётной записи; без учётной записи бросает MissingTestDataError. */
export function resolveRef(value: string): string {
  const match = REF.exec(value);
  if (!match) return value;
  const field = match[1] as 'phone' | 'email' | 'password';
  const resolved = config.account?.[field];
  if (!resolved) {
    throw new MissingTestDataError(
      `Для набора нужен TEST_USER_${field.toUpperCase()} — задайте его в .env (см. .env.example)`,
    );
  }
  return resolved;
}

/** Можно ли разрешить все ссылки набора; используется для test.skip с понятной причиной. */
export function missingRefs(...values: string[]): string[] {
  const missing: string[] = [];
  for (const value of values) {
    try {
      resolveRef(value);
    } catch (error) {
      if (error instanceof MissingTestDataError) missing.push(error.message);
      else throw error;
    }
  }
  return missing;
}
