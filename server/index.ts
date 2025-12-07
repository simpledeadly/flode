import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { Telegraf } from 'telegraf'

// Загружаем переменные окружения (.env)
dotenv.config()

const app = express()
const PORT = 3000

// Разрешаем фронтенду (Port 5173) обращаться к серверу
app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
)

app.use(express.json())

// --- БАЗОВАЯ ПРОВЕРКА ---
app.get('/', (req, res) => {
  res.json({ status: 'Flode Server is running 🚀' })
})

// --- ЗДЕСЬ БУДЕТ ВАШ БОТ ---
// Если есть токен, запускаем бота
if (process.env.BOT_TOKEN) {
  const bot = new Telegraf(process.env.BOT_TOKEN)

  bot.start((ctx) => ctx.reply('Flode Bot снова в строю!'))

  bot
    .launch()
    .then(() => {
      console.log('🤖 Telegram bot started')
    })
    .catch((err) => {
      console.error('Bot launch error:', err)
    })

  // Остановка бота при выключении сервера
  process.once('SIGINT', () => bot.stop('SIGINT'))
  process.once('SIGTERM', () => bot.stop('SIGTERM'))
} else {
  console.warn('⚠️ BOT_TOKEN не найден в .env, бот не запущен.')
}

// --- ЗАПУСК ---
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`)
})
