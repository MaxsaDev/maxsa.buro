//Літери, літери+символи, цифри і різні варіації
// DIGIT
export const OnlyDigit = /^\d+$/;
export const OnlyDigitsAndComma = /^[0-9,.]+$/;
export const OnlyDigitsAndCommaAndMinus = /^[0-9,.-]+$/;
export const DateRegex = /^\d{2}\.\d{2}\.\d{4}$/;

// UA
export const OnlyUkrLetters = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ]+$/;
export const OnlyUkrLettersWithSpace = /^[а-яА-ЯіІїЇєЄґҐ ]+$/;
export const OnlyUkrLettersWithSpaceSymbols = /^[а-яА-ЯіІїЇєЄґҐ\s]+$/;

export const OnlySmallUkrLetters = /^[а-яіїєґ]+$/;

// Тільки українські букви (без російських Ё, Ъ, Ы, Э)
// Використовується для повних імен: дозволені пробіли, апостроф, дефіс
export const UkrFullName =
  /^[АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯабвгґдеєжзиіїйклмнопрстуфхцчшщьюя\s'-]+$/;

// EN
export const OnlyLatinLetters = /^[a-zA-Z]+$/;
export const OnlyLatinLettersWithSpace = /^[a-zйA-Z ]+$/;
export const OnlyLatinLettersWithSpaceSymbols = /^[a-zA-Z\s]+$/;

// UA EN
export const OnlyLatinAndUkrLettersWithSpace = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ ]+$/;
export const OnlyLatinAndUkrLettersWithSpaceSymbols = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ\s]+$/;

//UA EN DIGIT
export const OnlyLatinUkrLettersAndDigitsWithSpace = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9 ]+$/;
export const OnlyLatinUkrLettersAndDigitsWithSpaceSymbols = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9\s]+$/;

// Поддерживаемые телефонные коды стран
export const COUNTRY_CODES = [
  '380',
  '34',
  '48',
  '39',
  '31',
  '49',
  '44',
  '1',
  '1242',
  '1246',
  '1264',
  '1284',
  '1340',
  '1345',
  '1441',
  '1473',
  '1758',
  '1767',
  '1784',
  '1787',
  '1808',
  '1829',
  '1876',
  '20',
  '212',
  '213',
  '216',
  '218',
  '223',
  '224',
  '227',
  '234',
  '241',
  '242',
  '243',
  '244',
  '245',
  '248',
  '251',
  '255',
  '256',
  '269',
  '27',
  '291',
  '297',
  '298',
  '299',
  '30',
  '32',
  '33',
  '36',
  '370',
  '371',
  '372',
  '373',
  '374',
  '375',
  '376',
  '377',
  '378',
  '381',
  '382',
  '385',
  '386',
  '387',
  '389',
  '39',
  '40',
  '41',
  '420',
  '421',
  '423',
  '43',
  '44',
  '45',
  '46',
  '47',
  '48',
  '49',
  '501',
  '502',
  '503',
  '504',
  '505',
  '506',
  '507',
  '509',
  '51',
  '52',
  '53',
  '54',
  '55',
  '56',
  '57',
  '58',
  '590',
  '591',
  '592',
  '593',
  '594',
  '595',
  '596',
  '597',
  '598',
  '599',
  '60',
  '61',
  '62',
  '63',
  '64',
  '65',
  '66',
  '672',
  '673',
  '675',
  '81',
  '82',
  '84',
  '850',
  '852',
  '853',
  '855',
  '7',
  '679',
  '856',
  '86',
  '880',
  '886',
  '90',
  '91',
  '92',
  '93',
  '94',
  '95',
  '960',
  '961',
  '962',
  '963',
  '964',
  '965',
  '966',
  '967',
  '968',
  '971',
  '972',
  '973',
  '974',
  '975',
  '976',
  '977',
  '98',
  '992',
  '993',
  '994',
  '995',
  '996',
  '998',
];

// Динамически собранное регулярное выражение
export const REG_PHONE = new RegExp(`^(?:${COUNTRY_CODES.join('|')})\\d{9,10}$`);

// ✅ Універсальний набір RegEx для соцмереж та месенджерів (2025)
export const REGEX = {
  // 🔹 Facebook — підтримує класичні та мобільні версії
  // Приклади:
  // https://facebook.com/username
  // https://fb.com/profile.php?id=123456
  // username або @username
  facebook:
    /^(?:https?:\/\/)?(?:www\.|m\.|mbasic\.)?(facebook|fb)\.(com|me)\/(?:profile\.php\?id=\d+|[A-Za-z0-9.\-_]+)(?:\/)?$|^@?[A-Za-z0-9.\-_]+$/,

  // 🔹 Instagram — класичний формат профілю + username
  // Приклади:
  // https://instagram.com/username
  // https://www.instagram.com/username/
  // @username або username
  instagram:
    /^(?:https?:\/\/)?(?:www\.)?(instagram\.com|instagr\.am)\/([A-Za-z0-9_.]+)\/?$|^@?[A-Za-z0-9_.]+$/,

  // 🔹 Email — базова перевірка адрес
  // Приклади:
  // user@example.com
  // my.mail+tag@domain.org
  email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,

  // 🔹 Telegram — підтримує @username та посилання
  // Приклади:
  // @username
  // username
  // https://t.me/username
  // https://telegram.me/username
  telegram: /^(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([A-Za-z0-9_]{5,32})$|^@?[A-Za-z0-9_]{5,32}$/,

  // 🔹 Messenger — посилання на профілі або чати + username
  // Приклади:
  // https://m.me/username
  // https://messenger.com/t/username
  // @username або username
  messenger:
    /^(?:https?:\/\/)?(?:www\.|m\.)?(messenger\.com\/t|m\.me)\/[A-Za-z0-9._-]+\/?$|^@?[A-Za-z0-9._-]+$/,

  // 🔹 WhatsApp — посилання для чатів та повідомлень
  // Приклади:
  // https://wa.me/380501234567
  // https://api.whatsapp.com/send?phone=380501234567
  // https://wa.me/message/ABCDEF123XYZ
  whatsapp:
    /^(?:https?:\/\/)?(?:www\.)?(wa\.me|api\.whatsapp\.com)\/(?:message\/)?([0-9]{6,15}|[A-Za-z0-9]+)\/?$/,

  // 🔹 Viber — посилання та deep-link’и
  // Приклади:
  // https://viber.com/chat/username
  // viber://chat?number=%2B380501234567
  viber:
    /^(?:https?:\/\/)?(?:www\.)?viber\.com\/(?:invite|chat|add)\/[A-Za-z0-9._-]+\/?$|^viber:\/\/chat\?number=%2B?[0-9]+$/,

  // 🔹 TikTok — формат з @username + username
  // Приклади:
  // https://www.tiktok.com/@username
  // https://tiktok.com/@username
  // @username або username
  tiktok: /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([A-Za-z0-9._]+)\/?$|^@?[A-Za-z0-9._]+$/,

  // 🔹 LinkedIn — профілі користувачів + username
  // Приклади:
  // https://linkedin.com/in/username
  // https://www.linkedin.com/in/username/
  // username
  linkedin:
    /^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9-_%]+\/?$|^[A-Za-z0-9-_%]+$/,

  // 🔹 YouTube — підтримує всі види каналів та короткі посилання + username
  // Приклади:
  // https://youtube.com/@channelname
  // https://youtu.be/abc123XYZ
  // https://youtube.com/channel/UC12345
  // @channelname або channelname
  youtube:
    /^(?:https?:\/\/)?(?:www\.)?(youtube\.com\/(?:@?[A-Za-z0-9._-]+|channel\/[A-Za-z0-9_-]+|c\/[A-Za-z0-9_-]+)|youtu\.be\/[A-Za-z0-9_-]+)\/?$|^@?[A-Za-z0-9._-]+$/,

  // 🔹 Threads — формат подібний до Instagram + username
  // Приклади:
  // https://threads.net/@username
  // @username або username
  threads: /^(?:https?:\/\/)?(?:www\.)?threads\.net\/@([A-Za-z0-9._]+)\/?$|^@?[A-Za-z0-9._]+$/,

  // 🔹 X (Twitter) — підтримує старі та нові домени + username
  // Приклади:
  // https://x.com/username
  // https://twitter.com/username
  // @username або username
  x: /^(?:https?:\/\/)?(?:www\.)?(x\.com|twitter\.com)\/([A-Za-z0-9_]+)\/?$|^@?[A-Za-z0-9_]+$/,

  // 🔹 Snapchat — додавання за іменем користувача + username
  // Приклади:
  // https://snapchat.com/add/username
  // username
  snapchat:
    /^(?:https?:\/\/)?(?:www\.)?snapchat\.com\/add\/([A-Za-z0-9._-]+)\/?$|^[A-Za-z0-9._-]+$/,

  // 🔹 Pinterest — підтримує міжнародні домени + username
  // Приклади:
  // https://pinterest.com/username
  // https://www.pinterest.fr/username
  // username
  pinterest:
    /^(?:https?:\/\/)?(?:www\.)?pinterest\.(com|co\.uk|de|fr|ca|au)\/([A-Za-z0-9._-]+)\/?$|^[A-Za-z0-9._-]+$/,

  // 🔹 Reddit — формат профілів користувачів + username
  // Приклади:
  // https://reddit.com/user/username
  // https://www.reddit.com/user/username/
  // username або u/username
  reddit:
    /^(?:https?:\/\/)?(?:www\.)?reddit\.com\/user\/([A-Za-z0-9._-]+)\/?$|^u\/[A-Za-z0-9._-]+$|^[A-Za-z0-9._-]+$/,
} as const;

// Приклад використання:
// const url = 'https://www.reddit.com/user/Maxsa';
// if (REGEX.reddit.test(url)) {
//   console.log('Это Reddit профиль ✅');
// }
