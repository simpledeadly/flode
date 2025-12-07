import { AWEvent, ProcessedStats, StatItem } from '../types.js'
import {
  getAppCategory,
  getDomainCategory,
  getDomainFromUrl,
  PRODUCTIVE_CATEGORIES,
} from '../utils/categories.js'

export const processStats = (windowEvents: AWEvent[], webEvents: AWEvent[]): ProcessedStats => {
  const appMap: Record<string, number> = {}
  const webMap: Record<string, number> = {}
  const hourlyByCat: Array<Record<string, number>> = Array.from({ length: 24 }, () => ({}))

  let totalDuration = 0
  let productiveDuration = 0

  // --- 1. APPS ---
  windowEvents.forEach((evt) => {
    let duration = evt.duration || 0
    if (duration > 600) duration = 10

    const d = evt.data
    let title = d.title || d.name || ''
    let app = d.app || d.appname || d.bundle_id || d.name

    // Восстановление имени (как мы уже сделали)
    if (!app) {
      if (title.includes(' — ')) app = title.split(' — ').pop()
      else if (title.includes(' - ')) {
        const part = title.split(' - ').pop()
        // Защита от попадания заголовков вкладок в имя приложения
        if (part && !part.includes('http') && !part.includes('Use strict')) app = part
      }
    }

    if (!app && (d.url || d.tabCount !== undefined)) app = 'Brave Browser'
    if (!app) app = 'Unknown'

    // Нормализация
    if (app.includes('/')) app = app.split('/').pop()?.replace('.app', '') || app
    const lower = app.toLowerCase()

    if (lower.includes('brave') || lower.includes('chrome') || lower.includes('safari'))
      app = 'Brave Browser'
    else if (app === 'Code' || lower.includes('visual studio') || lower.includes('cursor'))
      app = 'Cursor'
    else if (lower.includes('telegram')) app = 'Telegram'

    const category = getAppCategory(app, title)

    if (!appMap[app]) appMap[app] = 0
    appMap[app] += duration

    // Heatmap
    const hour = new Date(evt.timestamp).getHours()
    if (hour >= 0 && hour < 24) {
      const cat = app === 'Brave Browser' ? getAppCategory('Brave', title) : category
      if (!hourlyByCat[hour][cat]) hourlyByCat[hour][cat] = 0
      hourlyByCat[hour][cat] += duration
    }

    totalDuration += duration
    if (PRODUCTIVE_CATEGORIES.includes(category)) productiveDuration += duration
  })

  // --- 2. WEB ---

  const addWebStat = (url: string | undefined, title: string | undefined, duration: number) => {
    let domain = ''

    // Приоритет 1: URL
    if (url) {
      domain = getDomainFromUrl(url)
    }
    // Приоритет 2: Заголовок (Только если похож на домен)
    else if (title) {
      // Если в заголовке есть точка и нет пробелов -> это домен
      if (title.includes('.') && !title.includes(' ')) {
        domain = title
      }
      // Иначе пытаемся вырезать домен (например "Google - google.com")
      // Но лучше просто игнорировать мусорные заголовки
    }

    if (domain && domain !== 'Unknown' && domain !== 'newtab' && !domain.startsWith('chrome')) {
      if (!webMap[domain]) webMap[domain] = 0
      webMap[domain] += duration
    }
  }

  // Веб события
  webEvents.forEach((evt) => {
    let duration = evt.duration || 0
    if (duration > 600) duration = 10
    addWebStat(evt.data.url, evt.data.title, duration)
  })

  // Окна (если веб события пусты, или для дополнения)
  // НО: Добавляем только если есть URL! Заголовки игнорируем, чтобы не было "Вкладка..."
  windowEvents.forEach((evt) => {
    const d = evt.data
    if (d.url) {
      let duration = evt.duration || 0
      if (duration > 600) duration = 10
      addWebStat(d.url, undefined, duration)
    }
  })

  // --- 3. FORMAT ---
  const formatList = (map: Record<string, number>, type: 'app' | 'web'): StatItem[] => {
    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
        category: type === 'app' ? getAppCategory(name) : getDomainCategory(name),
      }))
      .sort((a, b) => b.value - a.value)
      .filter((i) => i.value > 10)
  }

  const efficiency =
    totalDuration > 300 ? Math.round((productiveDuration / totalDuration) * 100) : 0

  return {
    stats: formatList(appMap, 'app'),
    webStats: formatList(webMap, 'web'),
    hourly: hourlyByCat,
    efficiency,
  }
}
