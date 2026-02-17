/*
  Валідація дат
*/

/**
 * Перевіряє валідність рядка формату 'dd.MM.yyyy'.
 * Додатково перевіряє коректність календарної дати (включно з високосними роками).
 *
 * Приклад:
 * isValidDdMmYyyy('29.02.2024') -> true
 * isValidDdMmYyyy('31.11.2025') -> false
 */
export const isValidDdMmYyyy = (value: string): boolean => {
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(value)) return false;
  const [dayStr, monthStr, yearStr] = value.split('.');
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  // Перевірка місяців з 30 днями
  if ([4, 6, 9, 11].includes(month) && day > 30) return false;
  // Лютий
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  if (month === 2 && day > (isLeap ? 29 : 28)) return false;
  // Перехресна перевірка з Date
  const date = new Date(`${yearStr}-${monthStr}-${dayStr}`);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

// Зворотна сумісність з наявною назвою
export const dateValidation = isValidDdMmYyyy;

/* Демонстрація:
console.log(isValidDdMmYyyy('29.02.2024')); // true
console.log(isValidDdMmYyyy('31.11.2025')); // false
*/
