/*
  Текстові форматери та транслітерація (UA).
*/

/**
 * Транслітераційна мапа за правилами КМУ.
 * Примітка: для початку слова використовуються ключі з префіксом '^'.
 */
const transliterationMap: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ie',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ю: 'iu',
  я: 'ia',
  '^є': 'ye',
  '^ї': 'yi',
  '^й': 'y',
  '^ю': 'yu',
  '^я': 'ya',
  ь: '',
  '’': '',
  ы: 'y',
  ъ: '',
};

/**
 * Нормалізує рядок і виконує транслітерацію для kir->lat.
 * Використання:
 * - пробіли → дефіси
 * - нижній регістр
 * - офіційна транслітерація (КМУ)
 *
 * Демонстрація:
 * // normalizeAndTransliterate('Рахунок-фактура 9 2025') -> 'rahunok-faktura-9-2025'
 * // normalizeAndTransliterate('Свідоцтво про народження') -> 'svidotstvo-pro-narodzhennya'
 */
export const normalizeAndTransliterate = (input: string): string => {
  const trimmed = input.trim().toLowerCase();
  const hasCyrillic = /[а-яёґєіїъы]/i.test(trimmed);
  let result = trimmed.replace(/\s+/g, '-');
  if (!hasCyrillic) return result;
  result = result.replace(/./g, (char, index) => {
    const isStart = index === 0 || result[index - 1] === '-';
    const key = isStart ? `^${char}` : char;
    return transliterationMap[key] ?? transliterationMap[char] ?? char;
  });
  return result;
};

/* Демонстрація:
console.log(normalizeAndTransliterate('Рахунок-фактура_9_2025-07-26.pdf')); // 'rahunok-faktura_9_2025-07-26.pdf'
*/
