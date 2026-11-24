import { config } from '../../../core/config';
import { isAccountRef, loadData, missingRefs, resolveRef } from '../../../core/data';
import { describeCase, parameter } from '../../../core/reporting';
import type { AuthData } from '../../data/types';
import { test } from '../../fixtures';

const { positive } = loadData<AuthData>('auth.json');

test.describe('Авторизация › Позитивные проверки', () => {
  for (const data of positive) {
    test(`[${data.caseId}] ${data.title}`, async ({ auth }) => {
      const missing = missingRefs(data.login, data.password);
      test.skip(missing.length > 0, missing.join('; '));

      await describeCase({
        caseId: data.caseId,
        epic: 'Авторизация',
        feature: 'Вход в личный кабинет',
        story: 'Успешный вход',
        severity: 'blocker',
        knownIssue: data.knownIssue,
      });
      await parameter('Вид идентификатора', data.identifierKind);
      await parameter('Идентификатор', resolveRef(data.login), isAccountRef(data.login));
      await parameter('Пароль', resolveRef(data.password), true);

      await auth.loginAs(config.account!, resolveRef(data.login));
    });
  }
});
