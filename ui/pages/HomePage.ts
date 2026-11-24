import type { BaseElement } from '../elements/BaseElement';
import { Header } from '../components/Header';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly title = 'Главная';
  readonly header = new Header(this.page);

  protected url(): string {
    return '/';
  }

  protected readyMarker(): BaseElement {
    return this.header.searchInput;
  }
}
