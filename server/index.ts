// server/index.ts
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import axios from 'axios'
import { Telegraf } from 'telegraf'
import { Buffer } from 'node:buffer'
import { getCategory } from './categories'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const AW_URL = process.env.AW_URL || 'http://localhost:5600/api/0'

// Настройка Telegram
const bot = new Telegraf(process.env.BOT_TOKEN || '')
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''

// Middleware
app.use(cors({ origin: 'http://localhost:5173' })) // Разрешаем фронтенд
app.use(express.json({ limit: '10mb' })) // Увеличиваем лимит для картинок

app.get('/', (req, res) => {
  res.json({
    status: 'Flode Server is running 🚀',
    endpoints: ['GET /api/stats', 'POST /api/telegram'],
  })
})

// --- API: Получение статистики (Activity Watch) ---
app.get('/api/stats', async (req, res) => {
  try {
    // Читаем параметры из URL (?start=...&end=...)
    const { start, end } = req.query

    // По умолчанию: Начало сегодняшнего дня - Сейчас
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const startTime = start ? String(start) : startOfDay.toISOString()
    const endTime = end ? String(end) : now.toISOString()

    // 1. Получаем список бакетов
    const { data: buckets } = await axios.get(`${AW_URL}/buckets`)
    const bucketIds = Object.keys(buckets)

    const windowBucket = bucketIds.find((id) => id.includes('aw-watcher-window'))
    const afkBucket = bucketIds.find((id) => id.includes('aw-watcher-afk'))

    if (!windowBucket || !afkBucket) {
      res.json([])
      return
    }

    // 2. Формируем запрос к AW
    const query = `
          events = query_bucket("${windowBucket}");
          afk = query_bucket("${afkBucket}");
          not_afk = filter_keyvals(afk, "status", ["not-afk"]);
          events = filter_period_intersect(events, not_afk);
          events = merge_events_by_keys(events, ["app"]);
          RETURN = sort_by_duration(events);
        `

    const timeParams = {
      query: [query],
      timeperiods: [`${startTime}/${endTime}`],
    }

    const { data: result } = await axios.post(`${AW_URL}/query`, timeParams)

    // 3. Обрабатываем данные
    const stats = result[0]
      .map((item: any) => {
        const appName = item.data.app || 'Unknown'
        return {
          name: appName,
          value: item.duration, // AW возвращает секунды
          category: getCategory(appName),
        }
      })
      .filter((i: any) => i.value > 60) // Фильтр меньше минуты
      .sort((a: any, b: any) => b.value - a.value)

    res.json(stats)
  } catch (e: any) {
    console.error('AW Error:', e.message)
    res.status(500).json({ error: 'Failed to fetch stats from Activity Watch' })
  }
})

// --- API: Отправка отчета в Telegram ---
app.post('/api/telegram', async (req, res) => {
  try {
    const { image } = req.body

    if (!image) {
      res.status(400).json({ error: 'No image provided' })
      return
    }

    if (!process.env.BOT_TOKEN || !CHAT_ID) {
      res.status(500).json({ error: 'Telegram not configured' })
      return
    }

    // Декодируем Base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    console.log(`📤 Sending report to Telegram (${buffer.length} bytes)...`)

    await bot.telegram.sendPhoto(CHAT_ID, { source: buffer }, { caption: `📊 Отчет активности` })

    res.json({ success: true })
  } catch (error: any) {
    console.error('Telegram Error:', error)
    res.status(500).json({ error: error.description || error.message })
  }
})

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`)
})

// Запуск Long-Polling для команд бота (необязательно, если бот только шлет сообщения)
bot.launch().catch((err) => console.error('Bot launch failed', err))
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
