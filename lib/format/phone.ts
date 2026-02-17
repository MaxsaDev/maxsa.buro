/*
  Утиліти форматування телефонних номерів (UA).
  Допустимі вхідні значення: рядки з цифрами та нецифровими розділювачами.
*/

/**
 * Нормалізує телефон до цифр, зберігаючи провідний «+», якщо він присутній.
 * Використовується як внутрішній хелпер.
 */
const normalizePhoneDigits = (input: string): string => {
  const trimmed = input.trim();
  const keepPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D+/g, '');
  return keepPlus ? `+${digits}` : digits;
};

/**
 * Форматує український номер у вигляді: +380(XX) XXX XX XX
 * Входи можуть містити пробіли, дужки, дефіси — вони будуть проігноровані.
 *
 * Демонстрація:
 * // formatPhoneUA('+380501112233')     -> '+380(50) 111 22 33'
 * // formatPhoneUA('380501112233')      -> '380(50) 111 22 33'
 * // formatPhoneUA('0501112233')        -> '050(111) 22 33' (часткова форма)
 */
export const formatPhoneUA = (phone: string): string => {
  const digits = normalizePhoneDigits(phone);
  const hasPlus = digits.startsWith('+');
  const body = hasPlus ? digits.slice(1) : digits;
  const cc = hasPlus ? `+${body.slice(0, 3)}` : body.slice(0, 3); // 380
  const area = body.slice(3, 5); // 2 цифри коду оператора (для UA зазвичай 2)
  const a = body.slice(5, 8);
  const b = body.slice(8, 10);
  const c = body.slice(10, 12);
  if (!body) return '';
  if (body.length <= 3) return hasPlus ? `+${body}` : body;
  return `${cc}(${area}) ${a} ${b} ${c}`.trim();
};

/**
 * Форматує український номер без коду країни: (XX) XXX XX XX
 *
 * Демонстрація:
 * // formatPhoneUAWithoutCountry('+380501112233') -> '(50) 111 22 33'
 * // formatPhoneUAWithoutCountry('380501112233')  -> '(50) 111 22 33'
 */
export const formatPhoneUAWithoutCountry = (phone: string): string => {
  const digits = normalizePhoneDigits(phone).replace(/^\+?380/, '');
  const area = digits.slice(0, 2);
  const a = digits.slice(2, 5);
  const b = digits.slice(5, 7);
  const c = digits.slice(7, 9);
  if (!digits) return '';
  return `(${area}) ${a} ${b} ${c}`.trim();
};

/* Демонстрація:
console.log(formatPhoneUA('+380501112233'));          // '+380(50) 111 22 33'
console.log(formatPhoneUAWithoutCountry('380501112233')); // '(50) 111 22 33'
*/
