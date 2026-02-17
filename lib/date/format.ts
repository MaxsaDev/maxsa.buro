import { addDays, format as dfFormat, lastDayOfMonth } from 'date-fns';
import { uk } from 'date-fns/locale';

/*
  Форматування дат/часу
*/

/**
 * Повертає локалізоване коротке представлення дня тижня (укр), за індексом 0..6 (0 — неділя).
 *
 * Приклад:
 * getDayOfWeekShort(1) -> "пн"
 */
export const getDayOfWeekShort = (index: number): string => {
  const adjustedIndex = ((index % 7) + 7) % 7; // нормалізація до 0..6
  const date = addDays(new Date(1970, 0, 4), adjustedIndex); // 1970-01-04 — неділя
  return dfFormat(date, 'EEEEEE', { locale: uk });
};

/**
 * Форматує дату до рядка 'dd.MM.yyyy'. Якщо дата не задана — бере поточну.
 *
 * Приклад:
 * formatDate(new Date('2025-11-16')) -> "16.11.2025"
 */
export const formatDate = (date: Date | null): string => {
  const safe = date ?? new Date();
  return safe.toLocaleDateString('uk-UA');
};

/**
 * Форматує останній день поточного місяця до 'dd.MM.yyyy'.
 *
 * Приклад:
 * getLastDayOfCurrentMonthFormatted() -> "30.11.2025"
 */
export const getLastDayOfCurrentMonthFormatted = (): string => {
  const now = new Date();
  const last = lastDayOfMonth(now);
  return dfFormat(last, 'dd.MM.yyyy');
};

/**
 * Універсальний форматер локального представлення дати/часу.
 * - dateView/timeView контролюють видимість частин.
 * - inverse змінює порядок (час дата).
 * - locale за замовчуванням 'uk-UA'.
 * - timeZone (наприклад, 'UTC' | 'Europe/Kyiv') — застосовує часовий пояс під час форматування.
 *
 * Приклад:
 * formatLocalDateTime('2025-05-01T10:15:20Z', true, true, false, 'uk-UA', 'Europe/Kyiv')
 * -> "01.05.2025 13:15:20"
 */
export const formatLocalDateTime = (
  dateTimeStr: string,
  dateView: boolean,
  timeView: boolean,
  inverse: boolean,
  locale: string = 'uk-UA',
  timeZone?: string
): string => {
  const dateTime = new Date(dateTimeStr);
  if (Number.isNaN(dateTime.getTime())) return 'Недійсна дата';
  if (!dateView && !timeView) return 'Відсутні дані для відображення';

  const dateOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };
  if (timeZone) {
    dateOptions.timeZone = timeZone;
    timeOptions.timeZone = timeZone;
  }
  const datePart = dateTime.toLocaleDateString(locale, dateOptions);
  const timePart = dateTime.toLocaleTimeString(locale, timeOptions);
  if (dateView && timeView) return inverse ? `${timePart} ${datePart}` : `${datePart} ${timePart}`;
  if (dateView) return datePart;
  return timePart;
};

// Зворотна сумісність з наявними назвами
export const getDateTimeToLocalFormat = formatLocalDateTime;

/* Демонстрація:
console.log(getDayOfWeekShort(1)); // "пн"
console.log(formatDate(new Date('2025-11-16'))); // "16.11.2025"
console.log(getLastDayOfCurrentMonthFormatted()); // "30.11.2025" (залежить від місяця)
console.log(formatLocalDateTime('2025-05-01T10:15:20Z', true, true, false, 'uk-UA', 'Europe/Kyiv'));
*/
