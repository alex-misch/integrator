export const getTwoLatinSymbols = (input: string): string | null => {
  let result = '';
  for (const char of input) {
    if (/[A-Za-z]/.test(char)) {
      result += char;
    } else if (cyrillicToLatinMap[char]) {
      result += cyrillicToLatinMap[char];
    }
    if (result.length === 2) break;
  }
  return result.length === 2 ? result.toUpperCase() : null;
};

export const randomLetter = (): string => {
  const A = 'A'.charCodeAt(0);
  const Z = 'Z'.charCodeAt(0);
  return String.fromCharCode(Math.floor(Math.random() * (Z - A + 1)) + A);
};

const cyrillicToLatinMap: Record<string, string> = {
  А: 'A',
  Б: 'B',
  В: 'V',
  Г: 'G',
  Д: 'D',
  Е: 'E',
  З: 'Z',
  И: 'I',
  Й: 'Y',
  К: 'K',
  Л: 'L',
  М: 'M',
  Н: 'N',
  О: 'O',
  П: 'P',
  Р: 'R',
  С: 'S',
  Т: 'T',
  У: 'U',
  Ф: 'F',
  Ы: 'Y',
  Э: 'E',
  а: 'A',
  б: 'B',
  в: 'V',
  г: 'G',
  д: 'D',
  е: 'E',
  з: 'Z',
  и: 'I',
  й: 'Y',
  к: 'K',
  л: 'L',
  м: 'M',
  н: 'N',
  о: 'O',
  п: 'P',
  р: 'R',
  с: 'S',
  т: 'T',
  у: 'U',
  ф: 'F',
  ы: 'Y',
  э: 'E',
};
