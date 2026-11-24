import fs from 'node:fs';
import path from 'node:path';
import type { Reporter } from '@playwright/test/reporter';
import { maskSecrets } from './secrets';

/**
 * Последний рубеж защиты данных: после прогона проходит по текстовым файлам
 * allure-results и test-results и маскирует зарегистрированные секреты.
 * Нужен, потому что Playwright сам прикладывает к отчёту error-context.md
 * (снимок страницы со значениями полей) и тексты ошибок.
 */
const TEXT_EXT = new Set(['.json', '.txt', '.md', '.properties', '.log', '.xml', '.html']);
const DIRS = ['allure-results', 'test-results'];

export default class SanitizingReporter implements Reporter {
  printsToStdio(): boolean {
    return false;
  }

  async onExit(): Promise<void> {
    for (const dir of DIRS) sanitizeDir(path.resolve(process.cwd(), dir));
  }
}

function sanitizeDir(dir: string): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      sanitizeDir(file);
    } else if (TEXT_EXT.has(path.extname(entry.name).toLowerCase())) {
      const text = fs.readFileSync(file, 'utf-8');
      const masked = maskSecrets(text, false);
      if (masked !== text) fs.writeFileSync(file, masked);
    }
  }
}
