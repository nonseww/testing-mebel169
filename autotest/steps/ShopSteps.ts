import { step } from '../../core/reporting';
import type { App } from '../../ui/App';

/** Повторяющиеся операции магазина. */
export class ShopSteps {
  constructor(private readonly app: App) {}

  /** Подготовка: у авторизованного пользователя корзина хранится на сервере — очищаем её. */
  async ensureEmptyCart(): Promise<void> {
    await step('Подготовка: очистить корзину', async () => {
      const cart = await this.app.cart.open();
      await cart.removeAll();
      await cart.header.expectCartAmount(0);
    });
  }
}
