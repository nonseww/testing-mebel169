import { expect } from '@playwright/test';
import { config } from '../../core/config';
import { BaseElement } from '../elements/BaseElement';
import { Input } from '../elements/Input';
import { BasePage } from './BasePage';

export type LoginField = 'login' | 'password';

/** Форма входа в личный кабинет (отдельный домен lk.169.ru). */
export class LoginPage extends BasePage {
  readonly title = 'Вход в личный кабинет';

  private readonly form = this.page.locator('form[data-login-form]');
  readonly loginInput = new Input(this.form.locator('input#login'), 'Email или телефон');
  readonly passwordInput = new Input(this.form.locator('input#password'), 'Пароль', { sensitive: true });
  readonly submitButton = new BaseElement(this.form.locator('[data-login-submit]'), 'Войти');
  readonly passwordToggle = new BaseElement(this.form.locator('[data-password-toggle]'), 'Показать пароль');
  private readonly loginError = new BaseElement(this.form.locator('#login-error'), 'Ошибка поля логина');
  private readonly passwordError = new BaseElement(this.form.locator('#password-error'), 'Ошибка поля пароля');

  protected url(): string {
    return `${config.lkUrl}/auth/login/?redirect_url=${encodeURIComponent(`${config.baseUrl}/`)}`;
  }

  protected readyMarker(): BaseElement {
    return this.submitButton;
  }

  async fill(login: string, password: string): Promise<void> {
    if (login) await this.loginInput.fill(login);
    else await this.loginInput.clear();
    if (password) await this.passwordInput.fill(password);
    else await this.passwordInput.clear();
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Успешный вход: форма редиректит обратно в магазин.
   * Если вместо редиректа появилась ошибка входа — падаем сразу с её текстом, не дожидаясь тайм-аута.
   */
  async submitAndWaitForRedirect(): Promise<void> {
    const shopHost = new URL(config.baseUrl).host;
    await this.submit();

    // После отправки страница перезагружается (редирект в магазин или обратно на форму с ошибкой),
    // поэтому опрашиваем состояние, переживая разрушение контекста при навигации.
    let rejection = '';
    await expect
      .poll(
        async () => {
          try {
            if (new URL(this.page.url()).host === shopHost) return 'redirected';
            for (const error of [this.loginError, this.passwordError]) {
              if (await error.isVisible()) {
                rejection = await error.text();
                return 'rejected';
              }
            }
          } catch {
            // страница в процессе навигации — проверим на следующей итерации
          }
          return 'pending';
        },
        { message: 'Результат входа (переход в магазин или ошибка)', timeout: config.timeouts.navigation },
      )
      .not.toBe('pending');

    if (rejection) throw new Error(`Вход отклонён: «${rejection}»`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  errorFor(field: LoginField): BaseElement {
    return field === 'login' ? this.loginError : this.passwordError;
  }

  inputFor(field: LoginField): Input {
    return field === 'login' ? this.loginInput : this.passwordInput;
  }

  async expectStillOnLoginForm(): Promise<void> {
    await expect(this.page, 'Пользователь должен остаться на форме входа').toHaveURL(/\/auth\/login/);
    await this.submitButton.expectVisible();
  }
}
