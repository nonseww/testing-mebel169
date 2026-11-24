import type { DeliveryMethod, IdentifierKind, PaymentMethod, PersonType } from '../../core/dto';
import type { LoginField } from '../../ui/pages/LoginPage';

/** Набор данных для проверки входа. Значения вида {{account.*}} подставляются из окружения. */
export interface AuthCase {
  caseId: string;
  title: string;
  identifierKind: IdentifierKind;
  login: string;
  password: string;
  /** Известный дефект сайта, из-за которого набор падает: попадает в описание и метки Allure. */
  knownIssue?: string;
}

export interface NegativeAuthCase extends AuthCase {
  /** Класс ошибки из ТЗ — по нему наборы группируются в отчёте. */
  errorClass: 'empty-identifier' | 'empty-password' | 'invalid-format' | 'unknown-account' | 'wrong-password';
  expected: { field: LoginField; message: string };
}

export interface AuthData {
  positive: AuthCase[];
  negative: NegativeAuthCase[];
}

export interface OrderScenario {
  caseId: string;
  title: string;
  relatedCases: string[];
  searchQuery: string;
  /** Слова, которые должны быть в названиях первых результатов поиска. */
  searchKeywords: string[];
  checkTopResults: number;
  product: {
    path: string;
    nameContains: string;
    variant: string;
  };
  quantity: number;
  identifierKind: Exclude<IdentifierKind, 'none'>;
  person: PersonType;
  delivery: DeliveryMethod;
  /** Часть названия/адреса пункта самовывоза, например «Одинцово». */
  pickupPoint: string;
  payment: PaymentMethod;
}
