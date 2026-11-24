import { BaseElement } from '../elements/BaseElement';
import { Header } from '../components/Header';
import { ProductTile } from '../components/ProductTile';
import { BasePage } from './BasePage';

/** Выдача поиска / листинг категории: обе страницы показывают плитки .product-preview. */
export class SearchResultsPage extends BasePage {
  readonly title = 'Результаты поиска';
  readonly header = new Header(this.page);
  private readonly tiles = this.page.locator('.product-preview');

  constructor(page: import('@playwright/test').Page, private readonly query = '') {
    super(page);
  }

  protected url(): string {
    return `/search/?term=${encodeURIComponent(this.query)}`;
  }

  protected readyMarker(): BaseElement {
    return new BaseElement(this.tiles.first(), 'Первая плитка выдачи');
  }

  async count(): Promise<number> {
    return this.tiles.count();
  }

  async titles(limit?: number): Promise<string[]> {
    const all = await this.tiles.locator('a.product-preview__link').allInnerTexts();
    return (limit ? all.slice(0, limit) : all).map((t) => t.trim());
  }

  tileByPath(productPath: string): ProductTile {
    return new ProductTile(
      this.tiles.filter({ has: this.page.locator(`a.product-preview__link[href="${productPath}"]`) }).first(),
      `Плитка ${productPath}`,
    );
  }
}
