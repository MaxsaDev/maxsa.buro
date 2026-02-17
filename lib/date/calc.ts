import {
  addMonths,
  format as dfFormat,
  differenceInMonths,
  differenceInYears,
  parseISO,
} from 'date-fns';

/*
  Розрахунки/арифметика дат
*/

/**
 * Повертає кількість ПОВНИХ років між startDate і поточною датою.
 * Важливо: без +1 (раніше була логічна помилка із інкрементом).
 *
 * Приклад:
 * getYearsPassed(new Date('2020-11-16')) -> 5 (на 2025-11-16)
 */
export const getYearsPassed = (startDate: Date): number => {
  const now = new Date();
  return differenceInYears(now, startDate);
};

/**
 * Кількість повних місяців між двома ISO-датами (yyyy-MM-dd).
 *
 * Приклад:
 * getFullMonthsDifference('2023-01-15', '2025-07-01') -> 29
 */
export const getFullMonthsDifference = (fromIso: string, toIso: string): number => {
  const from = parseISO(fromIso);
  const to = parseISO(toIso);
  return differenceInMonths(to, from);
};

/**
 * Додає/віднімає місяці до ISO 'yyyy-MM-dd' і повертає у тому ж форматі.
 *
 * Приклад:
 * addMonthToYMD('2025-11-16', 1) -> '2025-12-16'
 */
export const addMonthToYMD = (dateIso: string, count: number): string => {
  const date = parseISO(dateIso);
  const newDate = addMonths(date, count);
  return dfFormat(newDate, 'yyyy-MM-dd');
};

/**
 * Порівнює дві локальні дати та повертає різницю у хвилинах.
 * Особливість: якщо різниця ≈ +2 години (±5 хв), компенсує зсув на 2 години.
 *
 * Приклад:
 * compareLocalDates(new Date('2025-01-01T10:00:00'), new Date('2025-01-01T08:00:00')) -> 0 (компенсація)
 */
export const compareLocalDates = (createdAt: Date, currentDate: Date): number => {
  const createdTimestamp = createdAt.getTime();
  const currentTimestamp = currentDate.getTime();
  const diff = createdTimestamp - currentTimestamp;
  const twoHoursMs = 2 * 60 * 60 * 1000;
  if (Math.abs(diff - twoHoursMs) < 5 * 60 * 1000) {
    return Math.floor((currentTimestamp - (createdTimestamp - twoHoursMs)) / (60 * 1000));
  }
  return Math.floor(Math.abs(currentTimestamp - createdTimestamp) / (60 * 1000));
};

/**
 * Перевіряє, чи дата "прострочена" з урахуванням N днів.
 *
 * Приклад:
 * isDateExpired('2025-11-01', 10) -> true/false (залежить від поточної дати)
 */
export const isDateExpired = (dateIsoOrAny: string, days: number): boolean => {
  const base = new Date(dateIsoOrAny);
  const now = new Date();
  base.setDate(base.getDate() + days);
  return now >= base;
};

/**
 * Повертає кількість днів у місяці (month 0..11).
 *
 * Приклад:
 * getDaysInMonth(2025, 1) -> 28 (або 29 у високосний)
 */
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

/* Демонстрація:
console.log(getYearsPassed(new Date('2020-11-16')));
console.log(getFullMonthsDifference('2023-01-15', '2025-07-01'));
console.log(addMonthToYMD('2025-11-16', 1));
console.log(compareLocalDates(new Date('2025-01-01T10:00:00'), new Date('2025-01-01T08:00:00')));
console.log(isDateExpired('2025-11-01', 10));
console.log(getDaysInMonth(2025, 1));
*/
