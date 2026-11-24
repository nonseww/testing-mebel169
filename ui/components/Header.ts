import { expect, type Page } from '@playwright/test';
import { getLogger } from '../../core/logger';
import { BaseElement } from '../elements/BaseElement';
import { Input } from '../elements/Input';

const log = getLogger('ui');

/** Шапка магазина: поиск, меню пользователя, счётчик корзины. */
export class Header {
  readonly searchInput: Input;
  readonly searchSubmit: BaseElement;
  readonly userMenuName: BaseElement;
  readonly cartLink: BaseElement;
  private readonly cartCounter: BaseElement;

  constructor(private readonly page: Page) {
    const root = page.locator('#header-main');
    this.searchInput = new Input(root.locator('input#search-box'), 'Поиск');
    this.searchSubmit = new BaseElement(root.locator('.search-box__submit'), 'Кнопка поиска');
    this.userMenuName = new BaseElement(root.locator('[data-user-menu-name]'), 'Меню пользователя');
    this.cartLink = new BaseElement(root.locator('a.user-bar__link--cart'), 'Корзина');
    this.cartCounter = new BaseElement(root.locator('a.user-bar__link--cart .js-cart-status'), 'Счётчик корзины');
  }

  async search(query: string): Promise<void> {
    log.info(`Поиск: «${query}»`);
    const before = this.page.url();
    await this.searchInput.fill(query);
    // Сайт ведёт либо на /search/?term=…, либо сразу в категорию (запрос «диван» → /divany/)
    await Promise.all([
      this.page.waitForURL((url) => url.href !== before, { waitUntil: 'domcontentloaded' }),
      this.searchInput.locator.press('Enter'),
    ]);
  }

  async expectCartAmount(amount: number): Promise<void> {
    await expect(this.cartCounter.locator, 'Количество товаров в значке корзины').toHaveAttribute(
      'data-amount',
      String(amount),
    );
  }

  /** Гость видит «Войти»; после входа там имя пользователя. */
  async expectGuest(): Promise<void> {
    await this.userMenuName.expectText('Войти');
  }

  async expectLoggedIn(displayName?: string): Promise<void> {
    if (displayName) {
      await this.userMenuName.expectContainsText(displayName);
    } else {
      await expect(this.userMenuName.locator, 'В шапке не должно быть «Войти»').not.toHaveText('Войти');
    }
  }
}
