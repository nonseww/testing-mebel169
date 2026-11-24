import { expect } from '@playwright/test';
import type { ContactData, DeliveryMethod, PaymentMethod, PersonType } from '../../core/dto';
import { localPhoneDigits } from '../../core/utils';
import { OrderSummaryBlock } from '../components/OrderSummaryBlock';
import { BaseElement } from '../elements/BaseElement';
import { Choice } from '../elements/Choice';
import { Input } from '../elements/Input';
import { BasePage } from './BasePage';

const PERSON_IDS: Record<PersonType, string> = { individual: 'person-change-1', legal: 'person-change-2' };
const DELIVERY_IDS: Record<DeliveryMethod, string> = { delivery: 'shipping-1', pickup: 'shipping-2' };
const PAYMENT_IDS: Record<PaymentMethod, string> = {
  sbp: 'order-payment-5',
  card: 'order-payment-3',
  cash: 'order-payment-1',
  installment: 'order-payment-4',
};

/** Оформление заказа: /cart/checkout/ */
export class CheckoutPage extends BasePage {
  readonly title = 'Оформление заказа';
  readonly summary = new OrderSummaryBlock(this.page);

  readonly heading = new BaseElement(this.page.locator('h1.order-page__main-title'), 'Оформление заказа');
  readonly nameInput = new Input(this.page.locator('#checkout-name'), 'Имя');
  readonly phoneInput = new Input(this.page.locator('#checkout-phone'), 'Телефон');
  readonly emailInput = new Input(this.page.locator('#checkout-email'), 'Email');
  readonly pickupAddress = new BaseElement(
    this.page.locator('.order-page__delivery-block .order-page__blue-text.active'),
    'Адрес пункта самовывоза',
  );
  private readonly pickupDialog = this.page.getByRole('dialog').filter({ hasText: 'Самовывоз' });
  readonly consentText = new BaseElement(
    this.page.locator('.cart-page__order-buttons .accept-text'),
    'Текст согласия на обработку ПД',
  );
  readonly confirmButton = new BaseElement(
    this.page.locator('.cart-page__order-buttons .cart-page__button--order'),
    'Подтвердить заказ',
  );

  protected url(): string {
    return '/cart/checkout/';
  }

  protected readyMarker(): BaseElement {
    return this.nameInput;
  }

  person(type: PersonType): Choice {
    return Choice.byId(this.page, PERSON_IDS[type], type === 'individual' ? 'Физическое лицо' : 'Юридическое лицо');
  }

  delivery(method: DeliveryMethod): Choice {
    return Choice.byId(this.page, DELIVERY_IDS[method], method === 'pickup' ? 'Самовывоз' : 'Доставка');
  }

  payment(method: PaymentMethod): Choice {
    return Choice.byId(this.page, PAYMENT_IDS[method], `Оплата: ${method}`);
  }

  /**
   * Самовывоз. Если пункт ещё не определён, сайт открывает окно выбора на карте
   * (зависит от того, успел ли загрузиться список пунктов) — тогда выбираем пункт явно.
   */
  async selectPickup(point: string): Promise<string> {
    await this.delivery('pickup').select();
    const pointsInDialog = this.pickupDialog.locator('.map-page__button--address');
    await expect(
      this.pickupAddress.locator.or(pointsInDialog.first()),
      'После выбора самовывоза должен появиться адрес или окно выбора пункта',
    ).toBeVisible();

    if (await this.pickupDialog.isVisible()) {
      this.log.info(`Открылось окно выбора пункта самовывоза, выбираем «${point}»`);
      await pointsInDialog.filter({ hasText: point }).first().click();
      await this.pickupDialog.waitFor({ state: 'hidden' });
    }
    await this.pickupAddress.expectContainsText(point);
    return this.pickupAddress.text();
  }

  /** Чекбокс услуги сборки для товара: заодно подтверждает, что товар попал в оформление. */
  assemblyFor(productId: string): Choice {
    return Choice.byId(this.page, `mounting_${productId}`, `Сборка товара ${productId}`);
  }

  async fillContacts(contacts: ContactData): Promise<void> {
    await this.nameInput.fill(contacts.name);
    // Поле телефона с маской +7(XXX) XXX-XX-XX — вводим только 10 цифр номера
    await this.phoneInput.type(localPhoneDigits(contacts.phone));
    await this.emailInput.fill(contacts.email);
  }

  async expectContactsAccepted(): Promise<void> {
    await expect(this.phoneInput.locator, 'Телефон в формате маски').toHaveValue(/^\+7\(\d{3}\) \d{3}-\d{2}-\d{2}$/);
    for (const input of [this.nameInput, this.phoneInput, this.emailInput]) {
      await expect(input.locator, `Поле «${input.name}» не должно быть ошибочным`).not.toHaveClass(/invalid|error/);
    }
  }

  async expectReadyToSubmit(): Promise<void> {
    await this.confirmButton.expectEnabled();
  }

  async submit(): Promise<void> {
    await this.confirmButton.click();
  }
}
