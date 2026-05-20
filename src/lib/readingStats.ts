export interface ReadingStats {
  characters: number;
  words: number;
  readingTime: number;
}

export function countWords(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = text
    .replace(/[\u4e00-\u9fa5]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  
  return chineseChars + englishWords;
}

export function countCharacters(text: string): number {
  return text.length;
}

export function calculateReadingTime(text: string, wordsPerMinute: number = 400): number {
  const words = countWords(text);
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function getReadingStats(text: string): ReadingStats {
  const words = countWords(text);
  return {
    characters: countCharacters(text),
    words,
    readingTime: calculateReadingTime(words),
  };
}

export function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + "万";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}