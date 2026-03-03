import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
}));

export const telegramConfig = registerAs('telegram', () => ({
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  adminIds: (process.env.ADMIN_TELEGRAM_IDS || '')
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id)),
}));

export const whatsappConfig = registerAs('whatsapp', () => ({
  sessionsPath: process.env.WA_SESSIONS_PATH || './wa-sessions',
  mediaPath: process.env.MEDIA_PATH || './media',
}));