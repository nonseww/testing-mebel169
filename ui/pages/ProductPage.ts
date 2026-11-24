import type { ProductInfo } from '../../core/dto';
import { parsePrice } from '../../core/utils';
import { AddedToCartModal } from '../components/AddedToCartModal';
import { Header } from '../components/Header';
import { BaseElement } from '../elements/BaseElement';
import { BasePage } from './BasePage';

/** Карточка товара. */
export class ProductPage extends BasePage {
  readonly title = 'Карточка товара';
  readonly header = new Header(this.page);

  readonly name = new BaseElement(this.page.locator('.product-page__header h1.main-title'), 'Название товара');
  readonly code = new BaseElement(this.page.locator('.product-reviews__vendor-code'), 'Код товара');
  readonly price = new BaseElement(this.page.locator('#product-price'), 'Цена');
  readonly oldPrice = new BaseElement(this.page.locator('#product-price-old'), 'Старая цена');
  readonly variant = new BaseElement(this.page.locator('.js-product-set-active-title').first(), 'Выбранный вариант');
  private readonly buyBlock = this.page.locator('.product-page__buy-block--main');
  readonly addToCartButton = new BaseElement(this.buyBlock.locator('.product-page__add-to-cart'), 'В корзину');
  readonly addedModal = new AddedToCartModal(this.page);

  constructor(
    page: import('@playwright/test').Page,
    private readonly path = '/',
  ) {
    super(page);
  }

  protected url(): string {
    return this.path;
  }

  protected readyMarker(): BaseElement {
    return this.addToCartButton;
  }

  async read(): Promise<ProductInfo> {
    const hasOld = await this.oldPrice.isVisible();
    const hasVariant = await this.variant.isVisible();
    return {
      id: (await this.buyBlock.getAttribute('data-product-id')) ?? '',
      name: await this.name.text(),
      code: (await this.code.attribute('data-copy-text')) ?? undefined,
      price: parsePrice(await this.price.text()),
      oldPrice: hasOld ? parsePrice(await this.oldPrice.text()) : undefined,
      variant: hasVariant ? await this.variant.text() : undefined,
      url: new URL(this.page.url()).pathname,
    };
  }

  async addToCart(): Promise<AddedToCartModal> {
    await this.addToCartButton.click();
    await this.addedModal.waitVisible();
    return this.addedModal;
  }
}
