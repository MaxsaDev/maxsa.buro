/*
  Утиліти "поточні значення" (today/now)
*/

/**
 * Повертає поточну дату у форматі dd.MM.yyyy.
 *
 * Приклад:
 * const today = getCurrentDate(); // "16.11.2025"
 */
export const getCurrentDate = (): string => {
  const currentDate = new Date();
  const day = currentDate.getDate().toString().padStart(2, '0');
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const year = currentDate.getFullYear().toString();
  return `${day}.${month}.${year}`;
};

/* Демонстрація:
// Виведе рядок поточної дати у форматі dd.MM.yyyy
console.log(getCurrentDate());
*/
