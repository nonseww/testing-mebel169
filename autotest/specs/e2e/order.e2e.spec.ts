import { config } from '../../../core/config';
import { loadData } from '../../../core/data';
import type { CartLine, ProductInfo } from '../../../core/dto';
import { describeCase, parameter, step } from '../../../core/reporting';
import type { OrderScenario } from '../../data/types';
import { expect, test } from '../../fixtures';

const scenario = loadData<OrderScenario>('order.json');

test.describe('Сквозной сценарий', () => {
  test(`[${scenario.caseId}] ${scenario.title}`, async ({ app, auth, shop, log }) => {
    const account = config.account;
    const identifier = account?.[scenario.identifierKind];
    test.skip(
      !(account && identifier) && !config.e2eAllowGuest,
      `Нужна учётная запись: TEST_USER_${scenario.identifierKind.toUpperCase()} и TEST_USER_PASSWORD в .env`,
    );

    await describeCase({
      caseId: scenario.caseId,
      epic: 'Критический путь',
      feature: 'Оформление заказа',
      severity: 'blocker',
      relatedCases: scenario.relatedCases,
      description: 'Сквозной сценарий п. 03 ТЗ. Создание заказа выполняется только при ORDER_SUBMIT=true.',
    });
    await parameter('Поисковый запрос', scenario.searchQuery);
    await parameter('Товар', scenario.product.path);
    await parameter('Количество', String(scenario.quantity));
    await parameter('Получение / оплата', `${scenario.delivery} / ${scenario.payment}`);

    // ── 1. Вход ──────────────────────────────────────────────────────────────
    await step('1. Вход', async () => {
      if (account && identifier) {
        await auth.loginAs(account, identifier);
      } else {
        log.warn('E2E_ALLOW_GUEST=true: шаг «Вход» пропущен, сценарий выполняется гостем (только для отладки)');
        test.info().annotations.push({ type: 'warning', description: 'Шаг «Вход» пропущен (гостевой режим отладки)' });
      }
    });

    await shop.ensureEmptyCart();

    // ── 2. Поиск ─────────────────────────────────────────────────────────────
    await step('2. Поиск', async () => {
      await app.home.open();
      await app.home.header.search(scenario.searchQuery);
      const results = await app.search().waitLoaded();
      expect(await results.count(), 'Выдача не должна быть пустой').toBeGreaterThan(0);

      const top = await results.titles(scenario.checkTopResults);
      for (const title of top) {
        for (const keyword of scenario.searchKeywords) {
          expect(title.toLowerCase(), `Результат «${title}» должен соответствовать запросу`).toContain(keyword);
        }
      }
      await results.tileByPath(scenario.product.path).expectVisible();
    });

    // ── 3. Карточка ──────────────────────────────────────────────────────────
    const product: ProductInfo = await step('3. Карточка товара', async () => {
      const tile = app.search().tileByPath(scenario.product.path);
      const tilePrice = await tile.priceValue();
      app.switchTo(await tile.open(app.page));

      const page = await app.product().waitLoaded();
      const info = await page.read();
      expect(info.url, 'Открыта карточка выбранного товара').toBe(scenario.product.path);
      expect(info.name, 'Название товара').toContain(scenario.product.nameContains);
      expect(info.variant, 'Вариант исполнения').toBe(scenario.product.variant);
      expect(info.price, 'Цена в карточке совпадает с ценой в выдаче').toBe(tilePrice);
      await page.addToCartButton.expectEnabled();
      return info;
    });

    await step('3.1. Добавить в корзину', async () => {
      const modal = await app.product().addToCart();
      await modal.productTitle.expectText(product.name);
      expect(await modal.priceValue(), 'Цена в окне добавления').toBe(product.price);
      await app.product().header.expectCartAmount(1);
    });

    // ── 4. Корзина ───────────────────────────────────────────────────────────
    const line: CartLine = await step('4. Корзина', async () => {
      const cart = await app.cart.open();
      await cart.expectItemsCount(1);
      const item = cart.itemById(product.id);
      await item.setQuantity(scenario.quantity);

      const current = await item.read();
      expect(current.name, 'Товар в корзине').toBe(product.name);
      expect(current.name.toLowerCase(), 'Вариант в названии позиции').toContain(scenario.product.variant.toLowerCase());
      expect(current.quantity, 'Количество').toBe(scenario.quantity);
      expect(current.linePrice, 'Стоимость строки = цена × количество').toBe(product.price * scenario.quantity);

      await cart.summary.expectTotals({ itemsCount: scenario.quantity, total: current.linePrice });
      const summary = await cart.summary.read();
      expect(summary.itemsSum - summary.discount, 'Итого = сумма − скидка').toBe(summary.total);
      return current;
    });

    // ── 5. Оформление ────────────────────────────────────────────────────────
    await step('5. Оформление', async () => {
      await app.cart.proceedToCheckout();
      const checkout = await app.checkout.waitLoaded();

      await step('Состав и сумма перенесены из корзины', async () => {
        await checkout.assemblyFor(product.id).expectPresent();
        await checkout.summary.expectTotals({ itemsCount: line.quantity, total: line.linePrice });
      });
      await step('Покупатель и контакты', async () => {
        await checkout.person(scenario.person).select();
        await checkout.fillContacts(config.checkoutContacts);
        await checkout.expectContactsAccepted();
      });
      await step('Способ получения', async () => {
        if (scenario.delivery === 'pickup') {
          const address = await checkout.selectPickup(scenario.pickupPoint);
          log.info(`Пункт самовывоза: ${address}`);
        } else {
          await checkout.delivery(scenario.delivery).select();
        }
      });
      await step('Способ оплаты', () => checkout.payment(scenario.payment).select());
      await step('Согласие и готовность к отправке', async () => {
        await checkout.consentText.expectContainsText('персональных данных');
        await checkout.expectReadyToSubmit();
      });
    });

    // ── 6. Заказ ─────────────────────────────────────────────────────────────
    if (!config.orderSubmit) {
      const reason =
        'Шаг 6 «Заказ» заблокирован: создание заказа на боевом сайте не согласовано (ORDER_SUBMIT=false). ' +
        'Шаги 1–5 выполнены, форма готова к отправке.';
      log.warn(reason);
      test.info().annotations.push({ type: 'blocked', description: reason });
      test.skip(true, reason);
    }

    await step('6. Заказ', async () => {
      await app.checkout.submit();
      const success = await app.orderSuccess.waitLoaded();
      const orderNumber = await success.orderNumber();
      log.info(`Создан заказ №${orderNumber}`);
      await parameter('Номер заказа', orderNumber);
      await expect(app.page.locator('main'), 'Итоговая сумма заказа').toContainText(
        line.linePrice.toLocaleString('ru-RU').replace(/ /g, ' '),
      );
    });
  });
});
