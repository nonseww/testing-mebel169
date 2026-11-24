import path from 'node:path';
import winston from 'winston';
import { config } from './config';
import { maskSecrets } from './secrets';

/**
 * Логгер на winston: уровни DEBUG / INFO / WARN / ERROR (LOG_LEVEL),
 * вывод в консоль и в logs/autotest.log, маскирование секретов.
 * Строки текущего теста дополнительно собираются в буфер и прикладываются к Allure.
 */
const MESSAGE = Symbol.for('message');

let testBuffer: string[] | null = null;

const mask = winston.format((info) => {
  info.message = maskSecrets(String(info.message));
  return info;
});

const capture = winston.format((info) => {
  testBuffer?.push(String((info as Record<symbol, unknown>)[MESSAGE]));
  return info;
});

const line = winston.format.printf(({ timestamp, level, message, scope }) =>
  `${timestamp} ${level.toUpperCase().padEnd(5)} [${scope ?? 'run'}] ${message}`,
);

const rootLogger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
    mask(),
    line,
    capture(),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(config.logDir, 'autotest.log') }),
  ],
});

export type Logger = winston.Logger;

export function getLogger(scope: string): Logger {
  return rootLogger.child({ scope });
}

export function startTestLogCapture(): void {
  testBuffer = [];
}

export function stopTestLogCapture(): string {
  const text = (testBuffer ?? []).join('\n');
  testBuffer = null;
  return text;
}
