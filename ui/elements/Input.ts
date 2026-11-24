import { expect, type Locator } from '@playwright/test';
import { describeValue } from '../../core/secrets';
import { BaseElement } from './BaseElement';

export interface InputOptions {
  /** Значение никогда не выводится в лог (пароли). */
  sensitive?: boolean;
  /** CSS-класс, которым сайт помечает невалидное поле. */
  invalidClass?: RegExp;
}

export class Input extends BaseElement {
  private readonly sensitive: boolean;
  private readonly invalidClass: RegExp;

  constructor(root: Locator, name: string, options: InputOptions = {}) {
    super(root, name);
    this.sensitive = options.sensitive ?? false;
    this.invalidClass = options.invalidClass ?? /is-invalid/;
  }

  async fill(value: string): Promise<void> {
    this.log.debug(`Ввод в «${this.name}»: ${describeValue(value, this.sensitive)}`);
    await this.root.fill(value);
  }

  /** Посимвольный ввод — для полей с маской (телефон). */
  async type(value: string): Promise<void> {
    this.log.debug(`Посимвольный ввод в «${this.name}»: ${describeValue(value, this.sensitive)}`);
    await this.root.clear();
    await this.root.pressSequentially(value);
  }

  async clear(): Promise<void> {
    await this.root.clear();
  }

  async value(): Promise<string> {
    return this.root.inputValue();
  }

  async expectEmpty(): Promise<void> {
    await expect(this.root, `Поле «${this.name}» должно быть пустым`).toHaveValue('');
  }

  async expectValue(expected: string | RegExp): Promise<void> {
    await expect(this.root, `Значение поля «${this.name}»`).toHaveValue(expected);
  }

  async expectInvalid(): Promise<void> {
    await expect(this.root, `Поле «${this.name}» должно быть помечено как ошибочное`).toHaveClass(this.invalidClass);
  }

  async expectType(type: string): Promise<void> {
    await expect(this.root, `Тип поля «${this.name}»`).toHaveAttribute('type', type);
  }
}
