import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import axios from 'axios'
import { Telegraf } from 'telegraf'
import { Buffer } from 'node:buffer'
import { getCategory, PRODUCTIVE_CATEGORIES } from './categories.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const AW_URL = process.env.AW_URL || 'http://localhost:5600/api/0'

const bot = new Telegraf(process.env.BOT_TOKEN || '')
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '10mb' }))

app.get('/', (req, res) => res.json({ status: 'Flode Server OK' }))

app.get('/api/stats', async (req, res) => {
  try {
    const { start, end } = req.query
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const startTime = start ? String(start) : startOfDay.toISOString()
    const endTime = end ? String(end) : now.toISOString()

    console.log(`📡 ЗАПРОС: ${startTime} -> ${endTime}`)

    // 1. Ищем бакеты
    const { data: buckets } = await axios.get(`${AW_URL}/buckets`)
    const bucketIds = Object.keys(buckets)

    const windowBucket = bucketIds.find((id) => id.includes('aw-watcher-window'))
    const afkBucket = bucketIds.find((id) => id.includes('aw-watcher-afk'))
    const webBucket = bucketIds.find((id) => id.includes('aw-watcher-web'))

    if (!windowBucket || !afkBucket) {
      res.json({ stats: [], hourly: new Array(24).fill(0), efficiency: 0 })
      return
    }

    // 2. ЗАПРОС 1: ОКНА (С учетом AFK - это важно для точности времени)
    const queryWindow = `
        events = query_bucket("${windowBucket}");
        afk = query_bucket("${afkBucket}");
        not_afk = filter_keyvals(afk, "status", ["not-afk"]);
        events = filter_period_intersect(events, not_afk);
        RETURN = events;
      `

    const { data: resultWindow } = await axios.post(`${AW_URL}/query`, {
      query: [queryWindow],
      timeperiods: [`${startTime}/${endTime}`],
    })
    const windowEvents = resultWindow[0] || []
    console.log(`✅ Основные события: ${windowEvents.length}`)

    // 3. ЗАПРОС 2: ВЕБ (Забираем "сырые" данные, фильтруем сами)
    let webEvents: any[] = []
    if (webBucket) {
      try {
        // Просто берем события из веба, без сложной фильтрации на стороне БД
        // Это гораздо быстрее и надежнее, а лишнее мы отсеем при слиянии
        const queryWeb = `
                web = query_bucket("${webBucket}");
                RETURN = web;
              `
        const { data: resultWeb } = await axios.post(`${AW_URL}/query`, {
          query: [queryWeb],
          timeperiods: [`${startTime}/${endTime}`],
        })
        webEvents = resultWeb[0] || []
        console.log(`✅ Веб события (Raw): ${webEvents.length}`)
      } catch (err) {
        console.warn('⚠️ Web query warning:', err)
      }
    }

    // 4. СЛИЯНИЕ И АГРЕГАЦИЯ
    const appMap: Record<string, number> = {}
    const hourlyStats = new Array(24).fill(0)
    let totalDuration = 0
    let productiveDuration = 0

    // Оптимизация поиска вкладок
    // (Сортируем веб-события по времени, если они вдруг не отсортированы)
    // webEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const findWebEvent = (timestamp: string, duration: number) => {
      if (webEvents.length === 0) return null
      const tStart = new Date(timestamp).getTime()
      // Ищем вкладку, которая была активна в середине жизненного цикла окна
      const tMid = tStart + (duration * 1000) / 2

      // Простой перебор (можно оптимизировать бинарным поиском, но для 3000 событий и так быстро)
      return webEvents.find((w: any) => {
        const wStart = new Date(w.timestamp).getTime()
        const wEnd = wStart + w.duration * 1000
        return tMid >= wStart && tMid <= wEnd
      })
    }

    windowEvents.forEach((evt: any) => {
      const duration = evt.duration || 0
      const app = evt.data.app || 'Unknown'
      let title = evt.data.title || ''
      const timestamp = new Date(evt.timestamp)
      const hour = timestamp.getHours()

      const isBrowser =
        app.toLowerCase().includes('brave') ||
        app.toLowerCase().includes('chrome') ||
        app.toLowerCase().includes('firefox') ||
        app.toLowerCase().includes('safari') ||
        app.toLowerCase().includes('arc')

      // Подтягиваем данные из веба
      if (isBrowser) {
        const webEvt = findWebEvent(evt.timestamp, duration)
        if (webEvt && webEvt.data) {
          if (webEvt.data.title) title = webEvt.data.title
          if (webEvt.data.url) {
            // Хак: иногда URL полезнее заголовка
            if (webEvt.data.url.includes('chatgpt')) title = 'ChatGPT'
            else if (webEvt.data.url.includes('claude')) title = 'Claude'
            else if (webEvt.data.url.includes('localhost')) title = 'Localhost'
          }
        }
      }

      // Очистка заголовков
      title = title.replace(/ - Brave| - Google Chrome| - Mozilla Firefox/g, '')

      const category = getCategory(app, title)

      // Формируем красивое имя для Легенды
      let displayName = app

      // Если это Браузер, пытаемся назвать его именем сайта
      if (isBrowser) {
        const t = title.toLowerCase()

        if (t.includes('chatgpt')) displayName = 'ChatGPT'
        else if (t.includes('claude')) displayName = 'Claude'
        else if (t.includes('gemini')) displayName = 'Gemini'
        else if (t.includes('ai studio')) displayName = 'AI Studio'
        else if (t.includes('grok')) displayName = 'Grok'
        else if (t.includes('deepseek')) displayName = 'DeepSeek'
        else if (t.includes('github')) displayName = 'GitHub'
        else if (t.includes('localhost') || t.includes('127.0.0.1')) displayName = 'Localhost'
        else if (t.includes('figma')) displayName = 'Figma'
        else if (t.includes('youtube')) displayName = 'YouTube'
        else if (t.includes('music')) displayName = 'Music'
        else if (t.includes('telegram')) displayName = 'Telegram Web'
        else if (t.includes('whatsapp')) displayName = 'WhatsApp'
        else if (t.includes('notion')) displayName = 'Notion'
        else if (t.includes('jira')) displayName = 'Jira'
        else if (t.includes('google docs')) displayName = 'Google Docs'

        // Если ничего интересного, оставляем "Brave Browser" (или можем сменить на "Web Surfing")
      }

      if (!appMap[displayName]) appMap[displayName] = 0
      appMap[displayName] += duration

      if (hour >= 0 && hour < 24) hourlyStats[hour] += duration

      totalDuration += duration
      if (PRODUCTIVE_CATEGORIES.includes(category)) productiveDuration += duration
    })

    const statsArray = Object.entries(appMap)
      .map(([name, value]) => ({
        name,
        value,
        category: getCategory(name, name),
      }))
      .sort((a, b) => b.value - a.value)

    const efficiency =
      totalDuration > 300 ? Math.round((productiveDuration / totalDuration) * 100) : 0
    const cleanHourly = hourlyStats.map((v) => Math.floor(v || 0))

    console.log(`📤 Итог: ${statsArray.length} приложений, Эфф: ${efficiency}%`)

    res.json({ stats: statsArray, hourly: cleanHourly, efficiency })
  } catch (e: any) {
    console.error('SERVER ERROR:', e.message)
    res.status(500).json({ error: 'Server Error' })
  }
})

app.post('/api/telegram', async (req, res) => {
  try {
    const { image } = req.body
    if (!image) return
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    await bot.telegram.sendPhoto(
      CHAT_ID,
      { source: Buffer.from(base64Data, 'base64') },
      { caption: `📊 Отчет` }
    )
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({})
  }
})

app.listen(PORT, () => console.log(`✅ Server running on ${PORT}`))
