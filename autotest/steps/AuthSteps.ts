import type { Account } from '../../core/dto';
import { step } from '../../core/reporting';
import type { App } from '../../ui/App';
import type { LoginField } from '../../ui/pages/LoginPage';

/** Повторяющиеся операции авторизации: используются и в тестах входа, и в сквозном сценарии. */
export class AuthSteps {
  constructor(private readonly app: App) {}

  async openLoginForm(): Promise<void> {
    await step('Открыть форму входа', async () => {
      const login = await this.app.login.open();
      await login.loginInput.expectVisible();
      await login.passwordInput.expectVisible();
    });
  }

  async submitCredentials(identifier: string, password: string): Promise<void> {
    await step('Ввести идентификатор и пароль', () => this.app.login.fill(identifier, password));
  }

  /** Полный успешный вход с проверкой сессии нужного пользователя. */
  async loginAs(account: Account, identifier: string): Promise<void> {
    await this.openLoginForm();
    await this.submitCredentials(identifier, account.password);
    await step('Нажать «Войти» и дождаться перехода в магазин', () => this.app.login.submitAndWaitForRedirect());
    await this.expectLoggedIn(account);
  }

  async expectLoggedIn(account: Account): Promise<void> {
    await step('Проверить, что сессия принадлежит пользователю', async () => {
      await this.app.home.waitLoaded();
      await this.app.home.header.expectLoggedIn(account.displayName);
      await this.app.account.expectSessionActive();
    });
  }

  async expectLoginRejected(field: LoginField, message: string): Promise<void> {
    await step(`Проверить отказ во входе: ошибка у поля «${field}»`, async () => {
      const login = this.app.login;
      await login.errorFor(field).expectText(message);
      await login.inputFor(field).expectInvalid();
      await login.expectStillOnLoginForm();
    });
    await step('Проверить отсутствие авторизованной сессии', () => this.app.account.expectNoSession());
  }
}
