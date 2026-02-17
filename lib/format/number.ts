/*
  Утиліти форматування числових значень (UA).
  Всі функції безпечні до некоректних вхідних значень та не повертають any.
*/

/**
 * Форматує довільне числове значення як людинозрозумілий рядок без «зайвих нулів».
 *
 * Правила:
 * - null/undefined → '0'
 * - '123.00' → '123'
 * - '123.40' → '123,4'
 * - Десятковий розділювач у результаті — кома
 *
 * Демонстрація:
 * // formatNumberLoose(12)            -> '12'
 * // formatNumberLoose(12.5)          -> '12,5'
 * // formatNumberLoose('12.50')       -> '12,5'
 * // formatNumberLoose(undefined)     -> '0'
 */
export const formatNumberLoose = (value: unknown): string => {
  if (value === null || value === undefined) return '0';
  const numeric = typeof value === 'string' ? Number(value.replace(',', '.')) : Number(value);
  if (Number.isNaN(numeric)) return '0';
  const fixed = numeric.toFixed(2);
  const trimmed = fixed.replace(/\.?0+$/, '').replace(/\.$/, '');
  return trimmed.replace('.', ',');
};

/**
 * Форматує грошове значення з фіксованою кількістю знаків після коми.
 * Локаль — uk-UA, розділювач тисяч — пробіл, десятковий — кома.
 *
 * Демонстрація:
 * // formatMoneyUA(1234.5)         -> '1 234,50'
 * // formatMoneyUA(0)              -> '0,00'
 * // formatMoneyUA(NaN)            -> '0,00'
 */
export const formatMoneyUA = (value: unknown, fractionDigits: number = 2): string => {
  const num = typeof value === 'string' ? Number(value.replace(',', '.')) : Number(value);
  const safe = Number.isFinite(num) ? num : 0;
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(safe);
};

/**
 * Форматує грошове значення у валюті (за замовчуванням UAH) з Intl.
 * Якщо значення некоректне — повертає '-'.
 *
 * Демонстрація:
 * // formatCurrencyIntl(1234.56)                 -> '1 234,56 ₴'
 * // formatCurrencyIntl(null)                    -> '-'
 * // formatCurrencyIntl(100, { currency: 'USD'}) -> '$100.00'
 */
export const formatCurrencyIntl = (
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions
): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  const base: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    currencyDisplay: 'symbol',
    ...options,
  };
  return new Intl.NumberFormat('uk-UA', base).format(value);
};

/**
 * Видаляє «зайві нулі» у дробовій частині.
 * Приймає як крапку, так і кому як десятковий розділювач.
 *
 * Демонстрація:
 * // removeTrailingZeros('12.3400') -> '12,34'
 * // removeTrailingZeros('10,00')   -> '10'
 * // removeTrailingZeros(5)         -> '5'
 */
export const removeTrailingZeros = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '';
  const s = String(value).replace(',', '.');
  if (!s.includes('.')) return s;
  let out = s.replace(/0+$/, '');
  if (out.endsWith('.')) out = out.slice(0, -1);
  return out.replace('.', ',');
};

/**
 * Повертає додатне представлення числа (прибирає «-» спереду).
 *
 * Демонстрація:
 * // removeLeadingMinus('-12.5') -> '12.5'
 * // removeLeadingMinus(0)       -> '0'
 */
export const removeLeadingMinus = (value: number | string): string => {
  const num = typeof value === 'string' ? Number(value.replace(',', '.')) : Number(value);
  const abs = Math.abs(num);
  return String(abs);
};

/**
 * Форматує кількість (ціле — без дробів, дробове — як є).
 *
 * Демонстрація:
 * // formatQuantity(5)     -> '5'
 * // formatQuantity(5.25)  -> '5.25'
 */
export const formatQuantity = (value: number): string => {
  if (Number.isInteger(value)) return String(value);
  return String(value);
};

/**
 * Форматує ціле число для UA локалі.
 *
 * Демонстрація:
 * // formatIntUA(123456) -> '123 456'
 */
export const formatIntUA = (value: number): string => {
  const v = Number.isFinite(value) ? Math.trunc(value) : 0;
  return new Intl.NumberFormat('uk-UA').format(v);
};

/**
 * Додає знак «+» для додатних значень і форматування для UA.
 *
 * Демонстрація:
 * // formatIntUAWithSign(10)  -> '+10'
 * // formatIntUAWithSign(0)   -> '0'
 * // formatIntUAWithSign(-3)  -> '-3'
 */
export const formatIntUAWithSign = (value: number): string => {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${formatIntUA(value)}`;
};

/**
 * Форматує відсоток популярності/ефективності з обмеженнями <1% та 100%.
 *
 * Демонстрація:
 * // formatPercentRounded(0)        -> '0%'
 * // formatPercentRounded(0.4)      -> '<1%'
 * // formatPercentRounded(99.6)     -> '100%'
 * // formatPercentRounded(42.2)     -> '42%'
 */
export const formatPercentRounded = (percentage: number): string => {
  if (!Number.isFinite(percentage)) return '0%';
  if (percentage === 0) return '0%';
  if (percentage < 1) return '<1%';
  if (percentage >= 100) return '100%';
  return `${Math.round(percentage)}%`;
};

/* Демонстрація модуля:
console.log(formatNumberLoose('123.00'));         // '123'
console.log(formatMoneyUA(1234.5));               // '1 234,50'
console.log(formatCurrencyIntl(1234.56));         // '1 234,56 ₴'
console.log(removeTrailingZeros('10,00'));        // '10'
console.log(removeLeadingMinus('-12.5'));         // '12.5'
console.log(formatQuantity(5.25));                // '5.25'
console.log(formatIntUAWithSign(12));             // '+12'
console.log(formatPercentRounded(0.4));           // '<1%'
*/
