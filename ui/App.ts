import type { Page } from '@playwright/test';
import { AccountPage } from './pages/AccountPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { ProductPage } from './pages/ProductPage';
import { SearchResultsPage } from './pages/SearchResultsPage';

/**
 * Точка доступа к Page Object'ам. Хранит текущую вкладку: сайт открывает карточку товара
 * в новой вкладке, после чего сценарий продолжается уже в ней (switchTo).
 */
export class App {
  constructor(private current: Page) {}

  get page(): Page {
    return this.current;
  }

  switchTo(page: Page): void {
    this.current = page;
  }

  get login() {
    return new LoginPage(this.current);
  }
  get account() {
    return new AccountPage(this.current);
  }
  get home() {
    return new HomePage(this.current);
  }
  search(query = '') {
    return new SearchResultsPage(this.current, query);
  }
  product(path?: string) {
    return new ProductPage(this.current, path);
  }
  get cart() {
    return new CartPage(this.current);
  }
  get checkout() {
    return new CheckoutPage(this.current);
  }
  get orderSuccess() {
    return new OrderSuccessPage(this.current);
  }
}

/** Поля, которые закрашиваются на скриншотах при падении (контакты, имя пользователя). */
export const SENSITIVE_SELECTORS = ['input', 'textarea', '[data-user-menu-name]'];
