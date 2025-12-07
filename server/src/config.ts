import dotenv from 'dotenv'
dotenv.config()

export const CONFIG = {
  PORT: process.env.PORT || 3000,
  AW_URL: process.env.AW_URL || 'http://localhost:5600/api/0',
  TELEGRAM: {
    TOKEN: process.env.BOT_TOKEN || '',
    CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
  },
}
