import type { Page } from '@playwright/test';
import { BaseElement } from '../elements/BaseElement';

/** Модальное подтверждение действия (role="dialog"), например «Удаление товаров». */
export class ConfirmDialog extends BaseElement {
  readonly confirm: BaseElement;

  constructor(page: Page, text: string | RegExp, confirmLabel: string) {
    const root = page.getByRole('dialog').filter({ hasText: text });
    super(root, `Диалог «${String(text)}»`);
    this.confirm = new BaseElement(root.getByRole('button', { name: confirmLabel, exact: true }), confirmLabel);
  }

  async accept(): Promise<void> {
    await this.waitVisible();
    await this.confirm.click();
    await this.waitHidden();
  }
}
