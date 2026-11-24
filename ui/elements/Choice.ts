import { expect, type Locator } from '@playwright/test';
import { BaseElement } from './BaseElement';

/**
 * Радиокнопка или чекбокс со стилизованной меткой: сам input скрыт,
 * поэтому кликаем по label, а состояние проверяем по input.
 */
export class Choice extends BaseElement {
  constructor(
    private readonly input: Locator,
    private readonly label: Locator,
    name: string,
  ) {
    super(label, name);
  }

  async select(): Promise<void> {
    this.log.debug(`Выбор: ${this.name}`);
    await this.label.click();
    await this.expectSelected();
  }

  async expectSelected(): Promise<void> {
    await expect(this.input, `«${this.name}» должен быть выбран`).toBeChecked();
  }

  async expectPresent(): Promise<void> {
    await expect(this.input, `«${this.name}» должен присутствовать`).toBeAttached();
  }

  /** По id инпута: <input id="X"> + <label for="X">. */
  static byId(scope: { locator(selector: string): Locator }, id: string, name: string): Choice {
    return new Choice(scope.locator(`input#${id}`), scope.locator(`label[for="${id}"]`), name);
  }
}
