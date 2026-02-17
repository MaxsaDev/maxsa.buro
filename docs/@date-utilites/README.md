### Набір уніфікованих утиліт для роботи з датою і часом (`@/lib/date`)

- **Призначення**: єдина точка для форматування, парсингу, нормалізації (UTC/TZ) та розрахунків дат.
- **Мова коментарів**: українська. UI-рядки теж українською.
- **Залежності**: `date-fns` (без `date-fns-tz`, використовується `Intl`).

### Структура модулів

- `now.ts`
  - `getCurrentDate()`: повертає поточну дату `dd.MM.yyyy`.
- `format.ts`
  - `getDayOfWeekShort(index)`: коротка назва дня тижня (укр), 0 — неділя.
  - `formatDate(date|null)`: локальне відображення `dd.MM.yyyy` (якщо `null` — поточна).
  - `getLastDayOfCurrentMonthFormatted()`: останній день поточного місяця у `dd.MM.yyyy`.
  - `formatLocalDateTime(str, dateView, timeView, inverse, locale='uk-UA', timeZone?)`: універсальний форматер дати/часу з TZ.
  - Аліас сумісності: `getDateTimeToLocalFormat = formatLocalDateTime`.
- `parse.ts`
  - `parseDateForPostgres('dd.MM.yyyy') -> 'yyyy-MM-dd'`.
  - `parseLocalDate(str|Date|null) -> Date`: парсить локальний формат, ігнорує TZ.
- `utc.ts`
  - `convertToUTC(date: Date) -> 'yyyy-MM-dd HH:mm:ss.SSS'`.
  - `convertToUTCYMD(date: Date) -> 'yyyy-MM-dd'`.
  - `normalizeDateToUTC(date, timeZone) -> ISO`: зводить до 00:00:00 у вказаному TZ, повертає ISO (UTC).
- `tz.ts`
  - `getCurrentDateTimeInUkraineTime(returnDate=false)`: поточний час України з урахуванням DST.
  - `convertTimestampToUkrainianTime(unixSec, returnDate=false)`: конвертація UNIX-часу до часу України.
- `calc.ts`
  - `getYearsPassed(startDate)`: КІЛЬКІСТЬ ПОВНИХ років (без +1).
  - `getFullMonthsDifference(fromIso, toIso)`: кількість повних місяців.
  - `addMonthToYMD(dateIso, count)`: додає/віднімає місяці, повертає `yyyy-MM-dd`.
  - `compareLocalDates(a, b)`: різниця у хвилинах; компенсує ≈+2 години (±5 хв).
  - `isDateExpired(date, days)`: прострочена з урахуванням N днів.
  - `getDaysInMonth(year, month0..11)`.
- `validate.ts`
  - `isValidDdMmYyyy('dd.MM.yyyy')`: валідація + коректність календарної дати. Аліас: `dateValidation`.

### Узгодження і уніфікація неймінгу

- Форматери: `format*`
- Парсери: `parse*`
- UTC/TZ: `convert*`, `normalize*`
- Розрахунки: `get*`, `is*`, `add*`, `compare*`
- Валідатори: `is*` (+ аліаси для зворотної сумісності)

### Приклади використання

```ts
import {
  getCurrentDate,
  getDayOfWeekShort,
  formatDate,
  getLastDayOfCurrentMonthFormatted,
  formatLocalDateTime,
  parseDateForPostgres,
  parseLocalDate,
  convertToUTC,
  convertToUTCYMD,
  normalizeDateToUTC,
  getCurrentDateTimeInUkraineTime,
  convertTimestampToUkrainianTime,
  getYearsPassed,
  getFullMonthsDifference,
  addMonthToYMD,
  compareLocalDates,
  isDateExpired,
  getDaysInMonth,
  isValidDdMmYyyy,
} from '@/lib/date';

console.log(getCurrentDate()); // "16.11.2025"
console.log(getDayOfWeekShort(1)); // "пн"
console.log(formatDate(new Date('2025-11-16'))); // "16.11.2025"
console.log(getLastDayOfCurrentMonthFormatted()); // "30.11.2025" (залежить від місяця)
console.log(formatLocalDateTime('2025-05-01T10:15:20Z', true, true, false, 'uk-UA', 'Europe/Kyiv'));

console.log(parseDateForPostgres('16.11.2025')); // '2025-11-16'
console.log(parseLocalDate('2025-11-16 10:15:20.000 +00:00'));

console.log(convertToUTC(new Date()));
console.log(convertToUTCYMD(new Date()));
console.log(normalizeDateToUTC('2025-11-16T10:00:00Z', 'Europe/Kyiv'));

console.log(getCurrentDateTimeInUkraineTime());
console.log(convertTimestampToUkrainianTime(1713878400));

console.log(getYearsPassed(new Date('2020-11-16')));
console.log(getFullMonthsDifference('2023-01-15', '2025-07-01'));
console.log(addMonthToYMD('2025-11-16', 1));
console.log(compareLocalDates(new Date('2025-01-01T10:00:00'), new Date('2025-01-01T08:00:00')));
console.log(isDateExpired('2025-11-01', 10));
console.log(getDaysInMonth(2025, 1));
console.log(isValidDdMmYyyy('29.02.2024')); // true
```

### Примітки щодо якості

- Дублювання видалено, усі функції згруповані та уніфіковані за призначенням.
- `getYearsPassed`: виправлено помилку +1, тепер повертає саме повні роки.
- `normalizeDateToUTC`: перероблено без `date-fns-tz` через `Intl.DateTimeFormat.formatToParts`.
- Збережено зворотну сумісність через аліаси `getDateTimeToLocalFormat` та `dateValidation`.
