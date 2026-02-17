# Набір утиліт форматування (`lib/format`)

Набір уніфікованих утиліт для форматування чисел, валюти, телефонів, тексту (транслітерація) та допоміжних форматів для дат/часу. Основні загальні утиліти дат знаходяться в `lib/date`, а тут — прикладні вузькі форматери.

## Структура

- `lib/format/number.ts` — числові й валютні форматери
- `lib/format/phone.ts` — форматування телефонів UA
- `lib/format/text.ts` — нормалізація й транслітерація
- `lib/format/date.ts` — допоміжні форматери дат (UNIX → рядок, назви місяців, інтервали, відносний час)
- `lib/format/index.ts` — агрегований експорт

## Використання

```ts
import {
  formatMoneyUA,
  formatCurrencyIntl,
  removeTrailingZeros,
  formatNumberLoose,
  formatIntUAWithSign,
  formatPercentRounded,
} from '@/lib/format';

import { formatPhoneUA, formatPhoneUAWithoutCountry } from '@/lib/format';

import { normalizeAndTransliterate } from '@/lib/format';

import {
  formatUnixToDateString,
  formatUnixToDateStringPostgres,
  formatMonthNameNominative,
  formatMonthNameGenitive,
  formatDateInterval,
  formatDaysFromDate,
  formatInterval,
  formatRelativeToNow,
} from '@/lib/format';
```

## Числа й валюта

- **formatNumberLoose(value)**: прибирає «зайві нулі», десятковий розділювач — кома.
- **formatMoneyUA(value, fractionDigits = 2)**: локалізоване форматування грошей (uk-UA).
- **formatCurrencyIntl(value, options?)**: Intl-валюта (за замовчуванням UAH), для некоректного значення повертає `'-'`.
- **removeTrailingZeros(value)**: видаляє нулі в кінці дробової частини, підтримує кому/крапку.
- **removeLeadingMinus(value)**: повертає додатне значення (рядком).
- **formatIntUA(value)** / **formatIntUAWithSign(value)**: цілі числа з/без знаку.
- **formatPercentRounded(percentage)**: округлення до цілих, межі `<1%` і `100%`.

## Телефони (UA)

- **formatPhoneUA(phone)**: `+380(XX) XXX XX XX`
- **formatPhoneUAWithoutCountry(phone)**: `(XX) XXX XX XX`

Вхід може містити пробіли, дужки, дефіси; спершу все нормалізується.

## Текст

- **normalizeAndTransliterate(input)**: нормалізація (нижній регістр, пробіли → дефіси) + офіційна транслітерація КМУ.

## Дата/час (допоміжні)

- **formatUnixToDateString(unixSeconds)**: `dd.MM.yyyy`
- **formatUnixToDateStringPostgres(unixSeconds)**: `yyyy-MM-dd`
- **formatMonthNameNominative(month 1..12)** / **formatMonthNameGenitive(month 1..12)**
- **formatDateInterval(date | string, inDays?)**: «роки місяці дні» або лише «N днів»
- **formatDaysFromDate(date | string)**: «N днів»
- **formatInterval(PostgresIntervalLike | string)**: «N днів», підтримка половинок; рядок — різниця до «зараз»
- **formatRelativeToNow(date, { addSuffix? })**: «X часу тому/через X», локалізовано українською (на базі date-fns)

## Примітки з продуктивності

- Використовуються чисті функції; React Compiler (Next.js 16) добре оптимізує їх без ручних мемоізацій.
- Форматування чисел/валюти — через Intl (оптимізовано в рантаймі браузера/Node).

## Локаль та узгодженість

Всі текстові результати — українською. Формати чисел/валюти — `uk-UA`. Для дат головні загальні функції лишаються в `lib/date`, щоб уникати дублювання; цей модуль лише доповнює специфічними форматами.
