import { format as dfFormat, parse as dfParse } from 'date-fns';

/*
  Парсинг дат
*/

/**
 * Приймає рядок 'dd.MM.yyyy' та повертає 'yyyy-MM-dd' (для PostgreSQL).
 *
 * Приклад:
 * parseDateForPostgres('16.11.2025') -> '2025-11-16'
 */
export const parseDateForPostgres = (dateForParse: string): string => {
  const parsedDate = dfParse(dateForParse, 'dd.MM.yyyy', new Date());
  return dfFormat(parsedDate, 'yyyy-MM-dd');
};

/**
 * Парсить локальний рядок формату 'YYYY-MM-DD HH:mm:ss[.SSS] [±hh:mm]' у Date,
 * інтерпретуючи час як локальний (ігноруючи часовий пояс, якщо присутній).
 *
 * Приклад:
 * parseLocalDate('2025-11-16 10:15:20.000 +00:00') -> Date локального часу
 */
export const parseLocalDate = (dateString: string | Date | null): Date => {
  if (!dateString) return new Date();
  if (dateString instanceof Date) return dateString;
  if (typeof dateString !== 'string') return new Date(dateString);

  try {
    const clean = dateString.split('.')[0];
    const [datePart, timePart] = clean.split(' ');
    const [y, m, d] = datePart.split('-').map(Number);
    const [hh = 0, mm = 0, ss = 0] = (timePart ?? '00:00:00').split(':').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1, hh, mm, ss);
  } catch {
    return new Date();
  }
};

/* Демонстрація:
console.log(parseDateForPostgres('16.11.2025')); // '2025-11-16'
console.log(parseLocalDate('2025-11-16 10:15:20.000 +00:00'));
*/
