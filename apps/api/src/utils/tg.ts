export const getBotToken = () => {
  const BOT_TOKEN = process.env.TG_BOT_TOKEN;
  if (!BOT_TOKEN) throw new Error('TG_BOT_TOKEN not found in env');
  return BOT_TOKEN;
};
