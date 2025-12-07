import axios from 'axios'

const AW_URL = 'http://localhost:5600/api/0'

async function run() {
  try {
    console.log('🔍 Ищу бакеты...')
    const { data: buckets } = await axios.get(`${AW_URL}/buckets`)
    const windowBucket = Object.keys(buckets).find((id) => id.includes('aw-watcher-window'))

    if (!windowBucket) {
      console.error('❌ Бакет окон не найден')
      return
    }
    console.log(`✅ Бакет: ${windowBucket}`)

    // Берем данные за последние 24 часа
    const end = new Date()
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)

    // Простой запрос без limit, который точно работает
    const query = `events = query_bucket("${windowBucket}"); RETURN = events;`

    const { data: result } = await axios.post(`${AW_URL}/query`, {
      query: [query],
      timeperiods: [`${start.toISOString()}/${end.toISOString()}`],
    })

    const events = result[0]
    console.log(`📊 Найдено событий: ${events.length}`)

    if (events.length === 0) {
      console.log('⚠️ Событий за 24 часа нет. Активность не велась?')
      return
    }

    // Пытаемся найти что-то КРОМЕ браузера (Telegram, Code, Finder)
    const nonBrowser = events.find((e: any) => {
      const d = JSON.stringify(e.data).toLowerCase()
      return !d.includes('brave') && !d.includes('chrome') && !d.includes('safari')
    })

    console.log('\n--- ПРИМЕР СОБЫТИЯ (НЕ БРАУЗЕР) ---')
    if (nonBrowser) {
      console.log(JSON.stringify(nonBrowser.data, null, 2))
    } else {
      console.log('Не нашел приложений кроме браузера. Вот пример любого события:')
      console.log(JSON.stringify(events[0].data, null, 2))
    }

    console.log('\n--- ПРИМЕР СОБЫТИЯ (БРАУЗЕР) ---')
    const browser = events.find((e: any) => JSON.stringify(e.data).toLowerCase().includes('brave'))
    if (browser) {
      console.log(JSON.stringify(browser.data, null, 2))
    }
  } catch (e: any) {
    console.error('Ошибка:', e.message)
    if (e.response) console.error('Детали:', e.response.data)
  }
}

run()
