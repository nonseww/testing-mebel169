import { test } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { getLogger } from './logger';
import { maskSecrets } from './secrets';

/**
 * Обёртки над Allure: шаги с логированием, метаданные кейса и безопасные параметры.
 */
const log = getLogger('step');

/** Шаг: попадает в Allure (через test.step) и в лог; при ошибке пишет место сбоя. */
export async function step<T>(name: string, body: () => Promise<T>): Promise<T> {
  log.info(`▶ ${name}`);
  try {
    const result = await test.step(name, body);
    log.info(`✔ ${name}`);
    return result;
  } catch (error) {
    log.error(`✘ ${name}: ${firstLine(error)}`);
    throw error;
  }
}

export type Severity = 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';

export interface CaseMeta {
  /** ID тест-кейса из документации, например «ТК-А-02». */
  caseId: string;
  epic: string;
  feature: string;
  story?: string;
  severity?: Severity;
  /** Связанные тест-кейсы (для сквозного сценария). */
  relatedCases?: string[];
  description?: string;
  /** Известный дефект сайта, влияющий на результат. */
  knownIssue?: string;
}

export async function describeCase(meta: CaseMeta): Promise<void> {
  await allure.label('case_id', meta.caseId);
  await allure.tag(meta.caseId);
  await allure.epic(meta.epic);
  await allure.feature(meta.feature);
  if (meta.story) await allure.story(meta.story);
  await allure.severity(meta.severity ?? 'normal');
  for (const related of meta.relatedCases ?? []) await allure.tag(related);
  const description = [meta.description, meta.knownIssue && `⚠ Известный дефект: ${meta.knownIssue}`]
    .filter(Boolean)
    .join('\n\n');
  if (description) await allure.description(description);
  if (meta.knownIssue) {
    await allure.tag('known-defect');
    test.info().annotations.push({ type: 'known-defect', description: meta.knownIssue });
    log.warn(`Известный дефект: ${meta.knownIssue}`);
  }
}

/** Параметр набора данных. Чувствительные значения уходят в Allure в режиме masked. */
export async function parameter(name: string, value: string, sensitive = false): Promise<void> {
  if (sensitive) {
    // Само значение в результаты не попадает — только признак, что оно задано.
    await allure.parameter(name, value ? '***' : '(пусто)', { mode: 'masked' });
  } else {
    await allure.parameter(name, value ? maskSecrets(value) : '(пусто)');
  }
}

export function firstLine(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return maskSecrets(text.split('\n')[0] ?? text);
}
