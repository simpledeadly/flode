import { AWEvent, ProcessedStats, StatItem, SankeyData } from '../types'
import { getAppCategory, getDomainCategory, getDomainFromUrl } from '../utils/categories'

const processSankey = (
  events: AWEvent[],
  totalTimeMap: Record<string, number>,
  type: 'app' | 'web'
): SankeyData => {
  // 1. Нормализация и фильтрация имен
  const normalizeName = (name: string): string => {
    if (!name) return ''
    const lower = name.toLowerCase()
    if (['brave', 'chrome', 'safari', 'arc'].some((b) => lower.includes(b))) return 'Browser'
    if (['cursor', 'code', 'webstorm'].some((c) => lower.includes(c))) return 'Code Editor'
    if (lower.includes('telegram')) return 'Telegram'
    if (lower.includes('figma')) return 'Figma'
    // Игнорируем системный шум
    if (
      ['loginwindow', 'finder', 'dock', 'system', 'unknown', 'window server'].some((n) =>
        lower.includes(n)
      )
    )
      return ''
    return name
  }

  // 2. Создаем рейтинг приложений по общему времени использования
  const sortedNodes = Object.entries(totalTimeMap)
    .map(([name, time]) => ({ name: normalizeName(name), time }))
    .filter((n) => n.name && n.time > 60) // Учитываем только значимые (>1 мин)
    .sort((a, b) => b.time - a.time)
    .map((n) => n.name)

  // Создаем карту рангов: чем меньше индекс, тем выше ранг
  const rankMap = new Map(sortedNodes.map((name, index) => [name, index]))

  if (rankMap.size < 2) return { nodes: [], links: [] }

  // 3. Считаем переходы, учитывая иерархию
  const linksMap: Map<string, { source: string; target: string; value: number }> = new Map()
  const cleanEvents = [...events]
    .filter((e) => e.duration > 3) // Игнорируем короткие события
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  for (let i = 1; i < cleanEvents.length; i++) {
    const sourceName = normalizeName(
      type === 'web'
        ? getDomainFromUrl(cleanEvents[i - 1].data.url || '')
        : cleanEvents[i - 1].data.app || ''
    )

    const targetName = normalizeName(
      type === 'web'
        ? getDomainFromUrl(cleanEvents[i].data.url || '')
        : cleanEvents[i].data.app || ''
    )

    // Пропускаем переходы на самого себя или на "мусор"
    if (
      sourceName === targetName ||
      !sourceName ||
      !targetName ||
      !rankMap.has(sourceName) ||
      !rankMap.has(targetName)
    ) {
      continue
    }

    // 🔥 ГЛАВНЫЙ ФИКС: Создаем связь, только если она идет "вниз" по иерархии
    // От приложения с большим временем к приложению с меньшим. Это ГАРАНТИРУЕТ отсутствие циклов.
    if (rankMap.get(sourceName)! < rankMap.get(targetName)!) {
      const linkKey = `${sourceName} -> ${targetName}`
      const link = linksMap.get(linkKey)
      if (link) {
        link.value++
      } else {
        linksMap.set(linkKey, { source: sourceName, target: targetName, value: 1 })
      }
    }
  }

  // 4. Формируем финальный результат
  return {
    nodes: sortedNodes.map((name) => ({ name })),
    links: Array.from(linksMap.values()),
  }
}

export const processStats = (
  initialWindowEvents: AWEvent[], // Переименовали для ясности
  webEvents: AWEvent[]
): ProcessedStats => {
  const windowEvents = initialWindowEvents.filter((event) => {
    if (!event.data.app) return true // Сохраняем события без имени приложения
    const app = event.data.app.toLowerCase()

    // Игнорируем системные процессы, если они длятся неоправданно долго (больше 10 минут)
    const noisyApps = ['loginwindow', 'finder', 'dock', 'window server']
    if (noisyApps.some((noise) => app.includes(noise)) && event.duration > 600) {
      return false // Вырезаем это событие
    }

    return true // Оставляем все остальные события
  })

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
    rawWindowEvents: windowEvents, // Сырые события для Timeline/Sankey
    rawWebEvents: webEvents,
    sankeyApp: processSankey(windowEvents, appMap, 'app'),
    sankeyWeb: processSankey(webEvents, webMap, 'web'),
  }
}
