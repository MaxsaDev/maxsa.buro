/*
  Утиліти часових поясів (Europe/Kyiv) і DST

/**
 * Вираховує останню неділю місяця (month — 0..11).
 */
const getLastSundayOfMonth = (year: number, month: number): Date => {
  const date = new Date(year, month + 1, 0);
  date.setDate(date.getDate() - date.getDay());
  return date;
};

/**
 * Поточний час в Україні (DST: UTC+2/UTC+3).
 * - returnDate=true повертає Date, інакше ISO-рядок.
 *
 * Приклад:
 * getCurrentDateTimeInUkraineTime() -> ISO рядок
 */
export const getCurrentDateTimeInUkraineTime = (returnDate: boolean = false): Date | string => {
  const now = new Date();
  const year = now.getFullYear();
  const lastSundayOfMarch = getLastSundayOfMonth(year, 2);
  const lastSundayOfOctober = getLastSundayOfMonth(year, 9);
  const isSummer = now >= lastSundayOfMarch && now < lastSundayOfOctober;
  const offsetMin = isSummer ? 180 : 120; // UTC+3 / UTC+2
  const ukraine = new Date(now.getTime() + offsetMin * 60_000);
  return returnDate ? ukraine : ukraine.toISOString();
};

/**
 * Конвертує UNIX timestamp (секунди) до часу України з урахуванням DST.
 * - returnDate=true повертає Date, інакше ISO-рядок.
 *
 * Приклад:
 * convertTimestampToUkrainianTime(1713878400) -> ISO рядок
 */
export const convertTimestampToUkrainianTime = (
  time: number,
  returnDate: boolean = false
): Date | string => {
  const now = new Date(time * 1000);
  const year = now.getFullYear();
  const lastSundayOfMarch = getLastSundayOfMonth(year, 2);
  const lastSundayOfOctober = getLastSundayOfMonth(year, 9);
  const isSummer = now >= lastSundayOfMarch && now < lastSundayOfOctober;
  const offsetMin = isSummer ? 180 : 120;
  const ukraine = new Date(now.getTime() + offsetMin * 60_000);
  return returnDate ? ukraine : ukraine.toISOString();
};

/* Демонстрація:
console.log(getCurrentDateTimeInUkraineTime());
console.log(convertTimestampToUkrainianTime(1713878400));
*/
