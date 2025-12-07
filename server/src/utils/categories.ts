export const PRODUCTIVE_CATEGORIES = ['Dev', 'Design', 'Work', 'AI']

export const getDomainFromUrl = (url: string): string => {
  try {
    if (!url) return 'Unknown'
    const hostname = new URL(url).hostname
    return hostname.replace(/^www\./, '')
  } catch {
    // Если это не URL, возвращаем как есть (например localhost)
    return url
  }
}

export const getDomainCategory = (domain: string): string => {
  const d = domain.toLowerCase()

  // AI
  if (
    d.includes('aistudio') ||
    d.includes('chatgpt') ||
    d.includes('claude') ||
    d.includes('openai') ||
    d.includes('deepseek') ||
    d.includes('grok')
  )
    return 'AI'

  // Dev
  if (
    d.includes('localhost') ||
    d.includes('github') ||
    d.includes('stackoverflow') ||
    d.includes('gitlab') ||
    d.includes('vercel') ||
    d.includes('console.groq')
  )
    return 'Dev'

  // Work
  if (
    d.includes('figma') ||
    d.includes('notion') ||
    d.includes('jira') ||
    d.includes('trello') ||
    d.includes('linear') ||
    d.includes('google')
  )
    return 'Work'

  // Media
  if (
    d.includes('youtube') ||
    d.includes('netflix') ||
    d.includes('twitch') ||
    d.includes('kinopoisk') ||
    d.includes('music')
  )
    return 'Media'

  // Social
  if (
    d.includes('telegram') ||
    d.includes('whatsapp') ||
    d.includes('discord') ||
    d.includes('slack') ||
    d.includes('dribbble')
  )
    return 'Social'

  // Search
  if (d.includes('yandex') || d.includes('bing') || d.includes('duckduckgo')) return 'Search'

  return 'Web' // Дефолтная категория
}

export const getAppCategory = (appName: string, title: string = ''): string => {
  const app = appName.toLowerCase()

  // Спец. правила
  if (
    app.includes('code') ||
    app.includes('vs') ||
    app.includes('terminal') ||
    app.includes('iterm')
  )
    return 'Dev'
  if (app.includes('figma') || app.includes('photoshop')) return 'Design'
  if (app.includes('telegram') || app.includes('discord')) return 'Social'
  if (app.includes('slack') || app.includes('zoom') || app.includes('meet')) return 'Work'
  if (app.includes('cursor')) return 'AI'

  // Браузеры всегда Web (пока не заглянем внутрь)
  if (
    app.includes('brave') ||
    app.includes('chrome') ||
    app.includes('safari') ||
    app.includes('arc') ||
    app.includes('firefox')
  )
    return 'Web'

  if (app.includes('finder') || app.includes('explorer')) return 'System'

  return 'Other'
}
