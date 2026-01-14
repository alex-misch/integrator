export const isValidMessageText = (text?: string | null): boolean => {
  if (!text) return false;
  const cleaned = text.trim();
  if (!cleaned) return false;
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length < 2) return false;
  return /[а-яё]/i.test(cleaned);
};
