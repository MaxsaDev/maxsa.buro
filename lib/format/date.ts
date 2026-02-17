import { format as dfFormat } from 'date-fns';
import { uk } from 'date-fns/locale';
import { formatDistanceToNow } from 'date-fns';

/*
  Додаткові форматери дати/часу (UA).
  Примітка: Основні утиліти вже в '@/lib/date'. Тут — вузькі форматери під конкретні кейси.
*/

/**
 * Форматує UNIX-час у секундах до 'dd.MM.yyyy'.
 *
 * Демонстрація:
 * // formatUnixToDateString(1731715200) -> '16.11.2024' (приклад)
 */
export const formatUnixToDateString = (unixSeconds: number): string => {
  const date = new Date(unixSeconds * 1000);
  return dfFormat(date, 'dd.MM.yyyy');
};

/**
 * Форматує UNIX-час у секундах до 'yyyy-MM-dd' (зручно для Postgres).
 *
 * Демонстрація:
 * // formatUnixToDateStringPostgres(1731715200) -> '2024-11-16'
 */
export const formatUnixToDateStringPostgres = (unixSeconds: number): string => {
  const date = new Date(unixSeconds * 1000);
  return dfFormat(date, 'yyyy-MM-dd');
};

/**
 * Повертає назву місяця українською у називному відмінку (LLLL).
 *
 * Демонстрація:
 * // formatMonthNameNominative(3) -> 'березень'
 */
export const formatMonthNameNominative = (month: number): string => {
  if (month < 1 || month > 12) return '';
  const date = new Date(2000, month - 1, 1);
  return dfFormat(date, 'LLLL', { locale: uk });
};

/**
 * Повертає назву місяця українською у родовому відмінку (MMMM).
 *
 * Демонстрація:
 * // formatMonthNameGenitive(3) -> 'березня'
 */
export const formatMonthNameGenitive = (month: number): string => {
  if (month < 1 || month > 12) return '';
  const date = new Date(2000, month - 1, 1);
  return dfFormat(date, 'MMMM', { locale: uk });
};

/**
 * Форматує інтервал від дати до «зараз» у роках/місяцях/днях або лише у днях.
 * Повертає україномовний рядок із правильними відмінками.
 *
 * Демонстрація:
 * // formatDateInterval('2024-01-01')      -> '10 місяців 15 днів' (приклад)
 * // formatDateInterval(new Date(), true)  -> '0 днів'
 */
export const formatDateInterval = (
  dateInput: string | Date | null,
  inDays: boolean = false
): string => {
  if (!dateInput) return 'Немає даних';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  if (inDays) {
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const rounded = Math.round(diffDays * 2) / 2;
    return `${rounded} ${decline(rounded, ['день', 'дні', 'днів'])}`;
  }
  let years = now.getFullYear() - date.getFullYear();
  let months = now.getMonth() - date.getMonth();
  let days = now.getDate() - date.getDate();
  if (days < 0) {
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth(), 0);
    days += lastMonthDate.getDate();
    months--;
  }
  if (months < 0) {
    months += 12;
    years--;
  }
  if (years === 0 && months === 0 && days === 0) return 'Сьогодні';
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${decline(years, ['рік', 'роки', 'років'])}`);
  if (months > 0) parts.push(`${months} ${decline(months, ['місяць', 'місяці', 'місяців'])}`);
  if (days > 0 || parts.length === 0)
    parts.push(`${days} ${decline(days, ['день', 'дні', 'днів'])}`);
  return parts.join(' ');
};

/**
 * Форматує кількість днів від заданої дати до «зараз».
 *
 * Демонстрація:
 * // formatDaysFromDate('2024-01-01') -> '320 днів' (приклад)
 */
export const formatDaysFromDate = (dateInput: string | Date | null): string => {
  if (!dateInput) return 'Немає даних';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const rounded = Math.round(diffDays * 2) / 2;
  return `${rounded} ${decline(rounded, ['день', 'дні', 'днів'])}`;
};

/**
 * Тип-обгортка для інтервалів Postgres (часто приходять як об’єкт).
 */
export interface PostgresIntervalLike {
  years?: number;
  months?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

/**
 * Форматує інтервал (Postgres-like або дата-рядок) у «N днів» з половинками.
 * Зворотна сумісність: якщо передано рядок дати — рахує різницю в днях до «зараз».
 *
 * Демонстрація:
 * // formatInterval({ days: 2 })     -> '2 дні'
 * // formatInterval('2024-10-10')    -> '37,5 днів' (приклад)
 */
export const formatInterval = (
  interval: PostgresIntervalLike | string | null | undefined
): string => {
  if (!interval) return 'Немає даних';
  if (typeof interval === 'object') {
    const days = interval.days ?? 0;
    const rounded = Math.round(days * 2) / 2;
    return `${rounded} ${decline(rounded, ['день', 'дні', 'днів'])}`;
  }
  if (typeof interval === 'string') {
    const lastVisit = new Date(interval);
    const now = new Date();
    const diffMs = now.getTime() - lastVisit.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const rounded = Math.round(diffDays * 2) / 2;
    return `${rounded} ${decline(rounded, ['день', 'дні', 'днів'])}`;
  }
  return 'Немає даних';
};

/**
 * Внутрішня функція для відмінювання слів залежно від числа.
 */
const decline = (num: number, forms: [string, string, string]): string => {
  const n = Math.abs(num);
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 > 10 && mod100 < 20) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
};

/* Демонстрація модуля:
console.log(formatUnixToDateString(1731715200));
console.log(formatMonthNameGenitive(3));
console.log(formatDateInterval('2024-01-01'));
console.log(formatDaysFromDate('2024-01-01'));
console.log(formatInterval({ days: 2.5 }));
*/

/**
 * Повертає рядок відносного часу до «зараз», локалізований українською.
 * Використовує date-fns/formatDistanceToNow.
 *
 * Опції:
 * - addSuffix: додати «тому / через» (за замовчуванням true)
 *
 * Демонстрація:
 * // formatRelativeToNow('2025-01-01') -> 'приблизно X місяців тому' (приклад)
 */
export const formatRelativeToNow = (
  date: Date | string | number,
  options?: { addSuffix?: boolean }
): string => {
  const addSuffix = options?.addSuffix ?? true;
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix, locale: uk });
};
