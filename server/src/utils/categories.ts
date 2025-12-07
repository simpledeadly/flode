export const getDomainFromUrl = (url: string): string => {
  try {
    if (!url) return 'Unknown'
    const hostname = new URL(url).hostname
    return hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export const getDomainCategory = (domain: string): string => {
  const d = domain.toLowerCase()

  // AI (Тиловый / Бирюзовый)
  if (
    d.includes('aistudio') ||
    d.includes('chatgpt') ||
    d.includes('claude') ||
    d.includes('openai') ||
    d.includes('deepseek') ||
    d.includes('grok')
  )
    return 'AI'

  // Dev (Синий)
  if (
    d.includes('localhost') ||
    d.includes('github') ||
    d.includes('stackoverflow') ||
    d.includes('gitlab') ||
    d.includes('vercel') ||
    d.includes('console.groq')
  )
    return 'Dev'

  // Work (Зеленый)
  if (
    d.includes('figma') ||
    d.includes('notion') ||
    d.includes('jira') ||
    d.includes('trello') ||
    d.includes('linear') ||
    d.includes('google')
  )
    return 'Work'

  // Media (Красный)
  if (
    d.includes('youtube') ||
    d.includes('netflix') ||
    d.includes('twitch') ||
    d.includes('kinopoisk') ||
    d.includes('music') ||
    d.includes('yandex')
  )
    return 'Media'

  // Social (Фиолетовый)
  if (
    d.includes('telegram') ||
    d.includes('whatsapp') ||
    d.includes('discord') ||
    d.includes('slack') ||
    d.includes('dribbble') ||
    d.includes('vk.com')
  )
    return 'Social'

  // Search (Желтый)
  if (d.includes('bing') || d.includes('duckduckgo')) return 'Search'

  return 'Web' // Оранжевый
}

export const getAppCategory = (appName: string, title: string = ''): string => {
  const app = appName.toLowerCase()

  // Dev Tools
  if (
    app.includes('code') ||
    app.includes('vs') ||
    app.includes('terminal') ||
    app.includes('iterm') ||
    app.includes('warp')
  )
    return 'Dev'
  // Cursor - это редактор кода, пусть будет Dev (Синий), а не AI
  if (app.includes('cursor')) return 'Dev'

  // Design
  if (app.includes('figma') || app.includes('photoshop') || app.includes('blender')) return 'Design'

  // Social
  if (app.includes('telegram') || app.includes('discord') || app.includes('whatsapp'))
    return 'Social'

  // Work
  if (app.includes('slack') || app.includes('zoom') || app.includes('meet') || app.includes('mail'))
    return 'Work'

  // Browsers
  if (
    app.includes('brave') ||
    app.includes('chrome') ||
    app.includes('safari') ||
    app.includes('arc') ||
    app.includes('firefox')
  )
    return 'Web'

  // System
  if (
    app.includes('finder') ||
    app.includes('explorer') ||
    app.includes('settings') ||
    app.includes('system')
  )
    return 'System'

  return 'Other'
}
