import { addMinutes, format as dfFormat } from 'date-fns';

/*
  Операції з UTC
*/

/**
 * Конвертує локальний Date у рядок UTC 'yyyy-MM-dd HH:mm:ss.SSS'
 *
 * Приклад:
 * convertToUTC(new Date('2025-11-16T10:00:00')) -> '2025-11-16 08:00:00.000' (залежить від TZ)
 */
export const convertToUTC = (date: Date): string => {
  const utcDate = addMinutes(date, -date.getTimezoneOffset());
  return dfFormat(utcDate, 'yyyy-MM-dd HH:mm:ss.SSS');
};

/**
 * Конвертує локальний Date у рядок UTC 'yyyy-MM-dd'
 *
 * Приклад:
 * convertToUTCYMD(new Date('2025-11-16T10:00:00')) -> '2025-11-16'
 */
export const convertToUTCYMD = (date: Date): string => {
  const utcDate = addMinutes(date, -date.getTimezoneOffset());
  return dfFormat(utcDate, 'yyyy-MM-dd');
};

/**
 * Нормалізує довільну дату до 00:00:00 у вказаному часовому поясі та повертає ISO в UTC.
 * Працює без додаткових залежностей: через Intl.DateTimeFormat.formatToParts.
 *
 * Приклад:
 * normalizeDateToUTC('2025-11-16T10:00:00Z', 'Europe/Kyiv') -> '2025-11-15T22:00:00.000Z' (приклад)
 */
export const normalizeDateToUTC = (date: string | Date, timeZone: string): string => {
  const source = typeof date === 'string' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(source);
  const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  const d = parts.find((p) => p.type === 'day')?.value ?? '01';
  const iso = `${y}-${m}-${d}T00:00:00.000Z`;
  return new Date(iso).toISOString();
};

/* Демонстрація:
console.log(convertToUTC(new Date()));
console.log(convertToUTCYMD(new Date()));
console.log(normalizeDateToUTC('2025-11-16T10:00:00Z', 'Europe/Kyiv'));
*/
