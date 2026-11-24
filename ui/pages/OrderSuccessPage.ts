import { BaseElement } from '../elements/BaseElement';
import { BasePage } from './BasePage';

/**
 * Страница подтверждения заказа.
 * ВНИМАНИЕ: разметка не проверена — заказ на боевом сайте не создавался (ORDER_SUBMIT=false).
 * Локаторы нужно уточнить при первом разрешённом прогоне с ORDER_SUBMIT=true.
 */
export class OrderSuccessPage extends BasePage {
  readonly title = 'Заказ оформлен';
  readonly heading = new BaseElement(
    this.page.getByRole('heading', { name: /спасибо|заказ.*(оформлен|принят|создан)/i }).first(),
    'Подтверждение заказа',
  );

  protected url(): string {
    return '/cart/success/';
  }

  protected readyMarker(): BaseElement {
    return this.heading;
  }

  async orderNumber(): Promise<string> {
    const text = await this.page.locator('main').innerText();
    const match = /(?:заказ|номер)[^\d№]*№?\s*([\w-]*\d[\w-]*)/i.exec(text);
    if (!match?.[1]) throw new Error('Номер заказа на странице подтверждения не найден');
    return match[1];
  }
}
