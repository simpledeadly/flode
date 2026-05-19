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
  const cleanEvents = events
    .filter((e) => e.duration > 3) // Игнорируем короткие события
    .map((e) => ({ ...e, _ts: new Date(e.timestamp).getTime() }))
    .sort((a, b) => a._ts - b._ts)

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
  webEvents: AWEvent[],
  inputEvents: AWEvent[]
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
  const fragmentationByHour: number[] = Array(24).fill(0)
  const intensityByHour: number[] = Array(24).fill(0)
  const webEventsForHeatmap: AWEvent[] = []

  // 1. Пре-парсим веб-события для супербыстрого поиска по времени
  const parsedWeb = webEvents
    .map((e) => {
      const url = e.data.url || e.data.title || ''
      return {
        domain: getDomainFromUrl(url),
        ts: new Date(e.timestamp).getTime(),
      }
    })
    .filter((e) => e.domain && e.domain !== 'Unknown' && e.domain !== 'newtab')
    .sort((a, b) => a.ts - b.ts)

  // ==========================================
  // 2. ОБРАБОТКА ОКОННЫХ И ВЕБ СОБЫТИЙ (УНИФИЦИРОВАННАЯ)
  // ==========================================
  windowEvents.forEach((evt) => {
    let duration = evt.duration || 0
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

    if (!app && (d.url || d.tabCount !== undefined)) app = 'Brave Browser'
    if (!app) app = 'Unknown'

    if (app.includes('/')) app = app.split('/').pop()?.replace('.app', '') || app
    const lowerApp = app.toLowerCase()
    
    // Проверяем, является ли приложение браузером
    const isBrowser =
      lowerApp.includes('brave') ||
      lowerApp.includes('chrome') ||
      lowerApp.includes('safari') ||
      lowerApp.includes('firefox') ||
      lowerApp.includes('arc')

    if (lowerApp.includes('brave') || lowerApp.includes('chrome') || lowerApp.includes('safari'))
      app = 'Brave Browser'
    else if (lowerApp.includes('code') || lowerApp.includes('visual studio'))
      app = 'Cursor'
    else if (lowerApp.includes('telegram')) app = 'Telegram'

    const category = getAppCategory(app, title)

    // Применяем лимиты AFK
    if (category === 'Media' || app === 'Brave Browser') {
      if (duration > 7200) duration = 7200 // Ограничиваем 2 часами
    } else {
      if (duration > 1800) duration = 1800 // Ограничиваем 30 минутами
    }

    // Записываем статистику по приложению
    if (!appMap[app]) appMap[app] = 0
    appMap[app] += duration

    let resolvedDomain = 'Unknown'

    // Если это браузер, сопоставляем его с открытым сайтом
    if (isBrowser) {
      const winTime = new Date(evt.timestamp).getTime()

      // Бинарный поиск ближайшего веб-события
      let low = 0
      let high = parsedWeb.length - 1
      let bestIdx = -1

      while (low <= high) {
        const mid = Math.floor((low + high) / 2)
        if (parsedWeb[mid].ts <= winTime + 5000) {
          bestIdx = mid
          low = mid + 1
        } else {
          high = mid - 1
        }
      }

      if (bestIdx !== -1) {
        const best = parsedWeb[bestIdx]
        if (winTime - best.ts < 3600000) { // Активная вкладка не старше 1 часа
          resolvedDomain = best.domain
        }
      }

      // Если по времени не сопоставилось, парсим по ключевым словам из заголовка окна
      if (resolvedDomain === 'Unknown') {
        const lowerTitle = title.toLowerCase()
        if (lowerTitle.includes('youtube.com') || lowerTitle.includes('youtube') || lowerTitle.includes('ютуб')) resolvedDomain = 'youtube.com'
        else if (lowerTitle.includes('vkvideo.ru') || lowerTitle.includes('vk video') || lowerTitle.includes('вк видео')) resolvedDomain = 'vkvideo.ru'
        else if (lowerTitle.includes('github.com') || lowerTitle.includes('github')) resolvedDomain = 'github.com'
        else if (lowerTitle.includes('aistudio.google.com') || lowerTitle.includes('google ai studio') || lowerTitle.includes('ai studio')) resolvedDomain = 'aistudio.google.com'
        else if (lowerTitle.includes('chatgpt') || lowerTitle.includes('openai')) resolvedDomain = 'chatgpt.com'
        else if (lowerTitle.includes('claude.ai') || lowerTitle.includes('claude')) resolvedDomain = 'claude.ai'
        else if (lowerTitle.includes('vk.com') || lowerTitle.includes('вконтакте') || lowerTitle.includes('vkontakte')) resolvedDomain = 'vk.com'
        else if (lowerTitle.includes('yandex.ru') || lowerTitle.includes('яндекс')) resolvedDomain = 'yandex.ru'
        else if (lowerTitle.includes('kinopoisk.ru') || lowerTitle.includes('кинопоиск')) resolvedDomain = 'kinopoisk.ru'
        else if (lowerTitle.includes('localhost') || lowerTitle.includes('127.0.0.1')) resolvedDomain = 'localhost'
        else if (lowerTitle.includes('figma.com') || lowerTitle.includes('figma')) resolvedDomain = 'figma.com'
        else if (lowerTitle.includes('stackoverflow.com') || lowerTitle.includes('stackoverflow')) resolvedDomain = 'stackoverflow.com'
      }

      if (resolvedDomain && resolvedDomain !== 'Unknown' && resolvedDomain !== 'newtab' && !resolvedDomain.startsWith('chrome')) {
        if (!webMap[resolvedDomain]) webMap[resolvedDomain] = 0
        webMap[resolvedDomain] += duration

        // Добавляем виртуальное событие для хитмапа веб-активности
        webEventsForHeatmap.push({
          ...evt,
          duration: duration,
          data: { url: resolvedDomain }
        })
      }
    }

    // Heatmap (Apps)
    const date = new Date(evt.timestamp)
    const hour = date.getHours()
    if (hour >= 0 && hour < 24) {
      let cat = category
      // Если это браузер, красим ячейку хитмапа в категорию сайта (если она не просто Web)
      if (app === 'Brave Browser' && resolvedDomain !== 'Unknown') {
        const domainCat = getDomainCategory(resolvedDomain)
        if (domainCat !== 'Web') {
          cat = domainCat
        }
      }
      if (!hourlyByCat[hour][cat]) hourlyByCat[hour][cat] = 0
      hourlyByCat[hour][cat] += duration
      fragmentationByHour[hour]++
    }
  })

  // Записываем интенсивность кликов/нажатий
  if (inputEvents && inputEvents.length > 0) {
    inputEvents.forEach((event) => {
      const hour = new Date(event.timestamp).getHours()
      if (hour >= 0 && hour < 24) {
        if (event.data && (event.data.presses || event.data.clicks)) {
          intensityByHour[hour] += (event.data.presses || 0) + (event.data.clicks || 0)
        }
      }
    })
  }

  // ==========================================
  // 4. ГЕНЕРАЦИЯ HEATMAP И ФОРМАТ
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

  const generateHeatmap = (events: AWEvent[], type: 'app' | 'web') => {
    if (!events || events.length === 0) return { data: [], categories: [] }

    const categoriesSet = new Set<string>()
    events.forEach(e => {
        let cat = 'Other'
        if (type === 'app') {
           const d = e.data
           let title = d.title || d.name || ''
           let app = d.app || d.appname || d.bundle_id || d.name || ''
           if (!app) {
               if (title.includes(' — ')) app = title.split(' — ').pop() || ''
               else if (title.includes(' - ')) {
                   const part = title.split(' - ').pop()
                   if (part && !part.includes('http') && !part.includes('/')) app = part
               }
           }
           if (!app && (d.url || d.tabCount !== undefined)) app = 'Brave Browser'
           if (!app) app = 'Unknown'
           if (app.includes('/')) app = app.split('/').pop()?.replace('.app', '') || app
           cat = getAppCategory(app, title)
        } else {
           const domain = getDomainFromUrl(e.data.url || '')
           cat = getDomainCategory(domain)
        }
        categoriesSet.add(cat)
    })
    
    const categories = Array.from(categoriesSet).sort()
    const grid: number[][] = Array.from({ length: 24 }, () => Array(categories.length).fill(0))

    events.forEach(e => {
        let cat = 'Other'
        if (type === 'app') {
           const d = e.data
           let title = d.title || d.name || ''
           let app = d.app || d.appname || d.bundle_id || d.name || ''
           if (!app) {
               if (title.includes(' — ')) app = title.split(' — ').pop() || ''
               else if (title.includes(' - ')) {
                   const part = title.split(' - ').pop()
                   if (part && !part.includes('http') && !part.includes('/')) app = part
               }
           }
           if (!app && (d.url || d.tabCount !== undefined)) app = 'Brave Browser'
           if (!app) app = 'Unknown'
           if (app.includes('/')) app = app.split('/').pop()?.replace('.app', '') || app
           cat = getAppCategory(app, title)
        } else {
           const domain = getDomainFromUrl(e.data.url || '')
           cat = getDomainCategory(domain)
        }
        
        const categoryIndex = categories.indexOf(cat)
        const hour = new Date(e.timestamp).getHours()
        if (categoryIndex !== -1 && hour >= 0 && hour < 24) {
            grid[hour][categoryIndex] += e.duration || 0
        }
    })

    const data: [number, number, number][] = []
    for (let hour = 0; hour < 24; hour++) {
      for (let catIdx = 0; catIdx < categories.length; catIdx++) {
        if (grid[hour][catIdx] > 0) {
          data.push([hour, catIdx, grid[hour][catIdx]])
        }
      }
    }
    return { data, categories }
  }

  return {
    stats: formatList(appMap, 'app'),
    webStats: formatList(webMap, 'web'),
    hourly: hourlyByCat,
    fragmentation: fragmentationByHour,
    intensity: intensityByHour,
    heatmapApp: generateHeatmap(windowEvents, 'app'),
    heatmapWeb: generateHeatmap(webEventsForHeatmap, 'web'),
    sankeyApp: processSankey(windowEvents, appMap, 'app'),
    sankeyWeb: processSankey(webEvents, webMap, 'web'),
  }
}
