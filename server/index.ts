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

    console.log('📦 Бакеты:', {
      window: windowBucket || 'НЕ НАЙДЕН',
      web: webBucket || 'НЕ НАЙДЕН',
      afk: afkBucket || 'НЕ НАЙДЕН',
    })

    if (!windowBucket || !afkBucket) {
      res.json({ stats: [], hourly: new Array(24).fill(0), efficiency: 0 })
      return
    }

    // 2. ЗАПРОС 1: ГЛАВНЫЕ ДАННЫЕ (ОКНА)
    // ВАЖНО: Никаких комментариев внутри строки запроса!
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

    // 3. ЗАПРОС 2: ВЕБ ДАННЫЕ (ОТДЕЛЬНО)
    let webEvents: any[] = []
    if (webBucket) {
      try {
        const queryWeb = `
                  web = query_bucket("${webBucket}");
                  afk = query_bucket("${afkBucket}");
                  not_afk = filter_keyvals(afk, "status", ["not-afk"]);
                  web = filter_period_intersect(web, not_afk);
                  RETURN = web;
                `
        const { data: resultWeb } = await axios.post(`${AW_URL}/query`, {
          query: [queryWeb],
          timeperiods: [`${startTime}/${endTime}`],
        })
        webEvents = resultWeb[0] || []
        console.log(`✅ Веб события: ${webEvents.length} (из ${webBucket})`)
      } catch (err) {
        console.warn('⚠️ Ошибка получения веб-данных:', err)
      }
    }

    // 4. СЛИЯНИЕ И АГРЕГАЦИЯ
    const appMap: Record<string, number> = {}
    const hourlyStats = new Array(24).fill(0)
    let totalDuration = 0
    let productiveDuration = 0

    // Хелпер для поиска веба
    const findWebEvent = (timestamp: string, duration: number) => {
      if (webEvents.length === 0) return null
      const tStart = new Date(timestamp).getTime()
      // Ищем вкладку активную в середине события окна
      const tMid = tStart + (duration * 1000) / 2

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

      // Попытка обогатить данные из Web
      const isBrowser =
        app.toLowerCase().includes('brave') ||
        app.toLowerCase().includes('chrome') ||
        app.toLowerCase().includes('firefox') ||
        app.toLowerCase().includes('safari')

      if (isBrowser) {
        const webEvt = findWebEvent(evt.timestamp, duration)
        if (webEvt && webEvt.data) {
          if (webEvt.data.title) title = webEvt.data.title
          if (webEvt.data.url) {
            if (webEvt.data.url.includes('chatgpt')) title = 'ChatGPT'
            else if (webEvt.data.url.includes('claude')) title = 'Claude'
            else if (webEvt.data.url.includes('github')) title = 'GitHub'
            else if (webEvt.data.url.includes('localhost')) title = 'Localhost'
          }
        }
      }

      // Определяем категорию
      const category = getCategory(app, title)

      // Определяем отображаемое имя
      let displayName = app
      if (category === 'AI' || (category === 'Dev' && isBrowser)) {
        if (title.toLowerCase().includes('chatgpt')) displayName = 'ChatGPT'
        else if (title.toLowerCase().includes('claude')) displayName = 'Claude'
        else if (title.toLowerCase().includes('github')) displayName = 'GitHub'
        else if (title.toLowerCase().includes('localhost')) displayName = 'Localhost'
      }

      // Суммируем
      if (!appMap[displayName]) appMap[displayName] = 0
      appMap[displayName] += duration

      if (hour >= 0 && hour < 24) {
        hourlyStats[hour] += duration
      }

      totalDuration += duration
      if (PRODUCTIVE_CATEGORIES.includes(category)) {
        productiveDuration += duration
      }
    })

    // Формируем результат
    const statsArray = Object.entries(appMap)
      .map(([name, value]) => ({
        name,
        value,
        category: getCategory(name, name),
      }))
      .sort((a, b) => b.value - a.value)

    const efficiency =
      totalDuration > 300 ? Math.round((productiveDuration / totalDuration) * 100) : 0

    // Защита от NaN в Heatmap
    const cleanHourly = hourlyStats.map((v) => Math.floor(v || 0))

    res.json({
      stats: statsArray,
      hourly: cleanHourly,
      efficiency,
    })
  } catch (e: any) {
    console.error('SERVER ERROR:', e.message)
    console.error(e.response?.data)
    res.status(500).json({ error: 'Internal Server Error' })
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
