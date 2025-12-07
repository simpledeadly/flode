import { AWEvent, ProcessedStats, StatItem } from '../types.js'
import { getAppCategory, getDomainCategory, getDomainFromUrl } from '../utils/categories.js'

export const processStats = (windowEvents: AWEvent[], webEvents: AWEvent[]): ProcessedStats => {
  const appMap: Record<string, number> = {}
  const webMap: Record<string, number> = {}
  const hourlyByCat: Array<Record<string, number>> = Array.from({ length: 24 }, () => ({}))

  // ==========================================
  // 1. APPS
  // ==========================================
  windowEvents.forEach((evt) => {
    let duration = evt.duration || 0
    if (duration > 600) duration = 10 // Срез AFK

    const d = evt.data
    let title = d.title || d.name || ''
    let app = d.app || d.appname || d.bundle_id || d.name

    // Если имени нет, пробуем парсить заголовок (для macOS)
    if (!app) {
      if (title.includes(' — ')) app = title.split(' — ').pop()
      else if (title.includes(' - ')) {
        const part = title.split(' - ').pop()
        if (part && !part.includes('http') && !part.includes('/')) app = part
      }
    }

    // Если есть признаки браузера (URL) - это Браузер
    if (!app && (d.url || d.tabCount !== undefined)) app = 'Brave Browser'

    if (!app) app = 'Unknown'

    // Нормализация
    if (app.includes('/')) app = app.split('/').pop()?.replace('.app', '') || app
    const lower = app.toLowerCase()

    if (lower.includes('brave') || lower.includes('chrome') || lower.includes('safari'))
      app = 'Brave Browser'
    else if (lower.includes('code') || lower.includes('visual studio'))
      app = 'Cursor' // или VS Code
    else if (lower.includes('telegram')) app = 'Telegram'

    const category = getAppCategory(app, title)

    // Статистика по приложениям
    if (!appMap[app]) appMap[app] = 0
    appMap[app] += duration

    // Heatmap
    const date = new Date(evt.timestamp)
    const hour = date.getHours()
    if (hour >= 0 && hour < 24) {
      // Для браузера красим по контенту, для остальных по приложению
      const cat = app === 'Brave Browser' ? getAppCategory('Brave', title) : category
      if (!hourlyByCat[hour][cat]) hourlyByCat[hour][cat] = 0
      hourlyByCat[hour][cat] += duration
    }
  })

  // ==========================================
  // 2. WEB
  // ==========================================

  const addWebStat = (urlOrTitle: string, duration: number) => {
    if (!urlOrTitle) return
    let domain = ''

    if (urlOrTitle.includes('.') && !urlOrTitle.includes(' ')) {
      if (urlOrTitle.startsWith('http') || urlOrTitle.startsWith('www')) {
        domain = getDomainFromUrl(urlOrTitle)
      } else {
        domain = urlOrTitle.split('/')[0]
      }
    } else if (urlOrTitle.includes('localhost')) {
      domain = 'localhost'
    }

    if (!domain || domain === 'newtab' || domain.includes('Unknown') || domain.startsWith('chrome'))
      return

    if (!webMap[domain]) webMap[domain] = 0
    webMap[domain] += duration
  }

  // Веб события (с фиксом нулевой длительности)
  webEvents.forEach((evt) => {
    // 🔥 ФИКС: Если длительности нет, считаем за 5 сек (просмотр страницы)
    let duration = evt.duration || 5
    if (duration > 600) duration = 10
    addWebStat(evt.data.url || evt.data.title || '', duration)
  })

  // Окна (дополнение из URL в заголовках окон)
  windowEvents.forEach((evt) => {
    const d = evt.data
    if (d.url) {
      let duration = evt.duration || 0
      if (duration > 600) duration = 10
      addWebStat(d.url, duration)
    }
  })

  // ==========================================
  // 3. ФОРМАТ
  // ==========================================
  const formatList = (map: Record<string, number>, type: 'app' | 'web'): StatItem[] => {
    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
        category: type === 'app' ? getAppCategory(name) : getDomainCategory(name),
      }))
      .sort((a, b) => b.value - a.value)
      .filter((i) => i.value > 5) // Показываем даже мелкие (> 5 сек)
  }

  return {
    stats: formatList(appMap, 'app'),
    webStats: formatList(webMap, 'web'),
    hourly: hourlyByCat,
    efficiency: 0, // Заглушка, расчетов нет
  }
}
