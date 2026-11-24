/** DTO, которыми обмениваются слои core / ui / autotest. */

export type IdentifierKind = 'phone' | 'email' | 'none';

export interface Account {
  phone?: string;
  email?: string;
  password: string;
  /** Имя в шапке сайта после входа: нужно, чтобы подтвердить, что сессия принадлежит этому пользователю. */
  displayName?: string;
}

export interface ContactData {
  name: string;
  phone: string;
  email: string;
}

export interface ProductInfo {
  id: string;
  name: string;
  /** Актуальная цена за единицу, ₽. */
  price: number;
  oldPrice?: number;
  code?: string;
  variant?: string;
  url: string;
}

export interface CartLine {
  id: string;
  name: string;
  code?: string;
  quantity: number;
  /** Стоимость строки (цена × количество), ₽. */
  linePrice: number;
}

export interface OrderSummary {
  itemsCount: number;
  itemsSum: number;
  discount: number;
  total: number;
}

export type DeliveryMethod = 'delivery' | 'pickup';
export type PaymentMethod = 'sbp' | 'card' | 'cash' | 'installment';
export type PersonType = 'individual' | 'legal';
