import express from 'express'
import cors from 'cors'
import { CONFIG } from './config.js'
import { awService } from './services/aw.js'
import { processStats } from './services/processor.js'

// Инициализация
const app = express()
app.use(cors({ origin: '*' })) // Разрешаем всё для простоты разработки
app.use(express.json({ limit: '10mb' }))

// Роуты
app.get('/', (req, res) => res.json({ status: 'Flode Server Running 🚀' }))

app.get('/api/stats', async (req, res) => {
  try {
    const { start, end } = req.query
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const startTime = start ? String(start) : startOfDay.toISOString()
    const endTime = end ? String(end) : now.toISOString()

    console.log(`➡️ Request: ${startTime} -> ${endTime}`)

    // 1. Получаем сырые данные (со всех бакетов!)
    const { windowEvents, webEvents } = await awService.getData(startTime, endTime)

    // 2. Обрабатываем их
    const result = processStats(windowEvents, webEvents)

    console.log(`⬅️ Response: Apps=${result.stats.length}, Web=${result.webStats.length}`)
    res.json(result)
  } catch (e: any) {
    console.error('❌ Error:', e.message)
    res.status(500).json({ error: e.message || 'Internal Server Error' })
  }
})

// Telegram (можно вынести в отдельный контроллер, но пока оставим тут)
import { Telegraf } from 'telegraf'
const bot = new Telegraf(CONFIG.TELEGRAM.TOKEN)
app.post('/api/telegram', async (req, res) => {
  try {
    const { image } = req.body
    if (!image) return res.sendStatus(400)
    const buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    await bot.telegram.sendPhoto(
      CONFIG.TELEGRAM.CHAT_ID,
      { source: buffer },
      { caption: '📊 Flode Report' }
    )
    res.json({ success: true })
  } catch {
    res.sendStatus(500)
  }
})

app.listen(CONFIG.PORT, () => {
  console.log(`✅ Flode Server started on port ${CONFIG.PORT}`)
})
