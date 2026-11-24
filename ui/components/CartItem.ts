import { expect, type Locator } from '@playwright/test';
import type { CartLine } from '../../core/dto';
import { parsePrice } from '../../core/utils';
import { BaseElement } from '../elements/BaseElement';
import { Input } from '../elements/Input';

/** Строка товара в корзине. */
export class CartItem extends BaseElement {
  readonly title: BaseElement;
  readonly code: BaseElement;
  readonly linePrice: BaseElement;
  readonly quantity: Input;
  readonly increase: BaseElement;
  readonly decrease: BaseElement;
  readonly remove: BaseElement;

  constructor(root: Locator, name = 'Строка корзины') {
    super(root, name);
    this.title = new BaseElement(root.locator('.cart-page__basket-item--title'), 'Название в корзине');
    this.code = new BaseElement(root.locator('.cart-page__basket-item--product-code span').last(), 'Код товара');
    this.linePrice = new BaseElement(root.locator('.cart-page__basket-item--actual-price'), 'Стоимость строки');
    this.quantity = new Input(root.locator('.add-product__input'), 'Количество');
    this.decrease = new BaseElement(root.locator('.add-product__ctrl').first(), 'Уменьшить количество');
    this.increase = new BaseElement(root.locator('.add-product__ctrl').last(), 'Увеличить количество');
    this.remove = new BaseElement(root.locator('.cart-page__basket-item--button-delete'), 'Удалить товар');
  }

  async read(): Promise<CartLine> {
    return {
      id: (await this.attribute('data-id')) ?? '',
      name: await this.title.text(),
      code: await this.code.text(),
      quantity: Number(await this.quantity.value()),
      linePrice: parsePrice(await this.linePrice.text()),
    };
  }

  async setQuantity(target: number): Promise<void> {
    let current = Number(await this.quantity.value());
    while (current !== target) {
      await (current < target ? this.increase : this.decrease).click();
      current += current < target ? 1 : -1;
      // ждём, пока корзина пересчитается на сервере и обновит поле
      await expect(this.quantity.locator, 'Количество после изменения').toHaveValue(String(current));
    }
  }
}
