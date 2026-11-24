import { expect } from '@playwright/test';
import { config } from '../../core/config';
import { BaseElement } from '../elements/BaseElement';
import { BasePage } from './BasePage';

/**
 * Личный кабинет. Защищённая страница: без сессии сайт редиректит на /auth/login,
 * поэтому её удобно использовать для проверки наличия/отсутствия авторизованной сессии.
 */
export class AccountPage extends BasePage {
  readonly title = 'Личный кабинет';

  protected url(): string {
    return `${config.lkUrl}/`;
  }

  protected readyMarker(): BaseElement {
    return new BaseElement(this.page.locator('body'), 'Страница ЛК');
  }

  async expectSessionActive(): Promise<void> {
    await this.open();
    await expect(this.page, 'Авторизованный пользователь не должен попадать на форму входа').not.toHaveURL(
      /\/auth\/login/,
    );
  }

  async expectNoSession(): Promise<void> {
    await this.open();
    await expect(this.page, 'Без сессии ЛК должен перенаправлять на форму входа').toHaveURL(/\/auth\/login/);
  }
}
