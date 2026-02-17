// DIGIT
export const OnlyDigit = /^\d+$/;
export const OnlyDigitsAndComma = /^[0-9,.]+$/;
export const DateRegex = /^\d{2}\.\d{2}\.\d{4}$/;

// UA
export const OnlyUkrLetters = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ]+$/;
export const OnlyUkrLettersWithSpace = /^[а-яА-ЯіІїЇєЄґҐ ]+$/;
export const OnlyUkrLettersWithSpaceSymbols = /^[а-яА-ЯіІїЇєЄґҐ\s]+$/;

export const OnlySmallUkrLetters = /^[а-яіїєґ]+$/;

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
