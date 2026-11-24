import { isAccountRef, loadData, missingRefs, resolveRef } from '../../../core/data';
import { describeCase, parameter, step } from '../../../core/reporting';
import type { AuthData, NegativeAuthCase } from '../../data/types';
import { test } from '../../fixtures';

const { negative } = loadData<AuthData>('auth.json');

const ERROR_CLASSES: Record<NegativeAuthCase['errorClass'], string> = {
  'empty-identifier': 'Пустой идентификатор',
  'empty-password': 'Пустой пароль',
  'invalid-format': 'Неверный формат',
  'unknown-account': 'Несуществующий аккаунт',
  'wrong-password': 'Неверный пароль',
};

test.describe('Авторизация › Негативные проверки', () => {
  // Группировка по классу ошибки (п. 02 ТЗ); каждый набор — отдельная проверка в отчёте.
  for (const [errorClass, className] of Object.entries(ERROR_CLASSES)) {
    const cases = negative.filter((c) => c.errorClass === errorClass);
    if (cases.length === 0) continue;

    test.describe(className, () => {
      for (const data of cases) {
        test(`[${data.caseId}] ${data.title}`, async ({ auth, app }) => {
          const missing = missingRefs(data.login, data.password);
          test.skip(missing.length > 0, missing.join('; '));

          await describeCase({
            caseId: data.caseId,
            epic: 'Авторизация',
            feature: 'Вход в личный кабинет',
            story: className,
            severity: 'critical',
            knownIssue: data.knownIssue,
          });
          await parameter('Вид идентификатора', data.identifierKind);
          await parameter('Идентификатор', resolveRef(data.login), isAccountRef(data.login));
          await parameter('Пароль', resolveRef(data.password), true);
          await parameter('Ожидаемая ошибка', `${data.expected.field}: ${data.expected.message}`);

          await auth.openLoginForm();
          await auth.submitCredentials(resolveRef(data.login), resolveRef(data.password));
          await step('Нажать «Войти»', () => app.login.submit());
          await auth.expectLoginRejected(data.expected.field, data.expected.message);
        });
      }
    });
  }
});
