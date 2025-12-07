// server/categories.ts

export const getCategory = (appName: string, title: string = ''): string => {
  const app = appName.toLowerCase()
  const t = title.toLowerCase() // Заголовок окна или URL

  // --- 1. ПРИОРИТЕТ: ИСКУССТВЕННЫЙ ИНТЕЛЛЕКТ (AI) ---
  // Если в заголовке есть эти слова — это 100% работа, даже если открыто в Chrome
  if (
    t.includes('chatgpt') ||
    t.includes('claude') ||
    t.includes('deepseek') ||
    t.includes('gemini') ||
    t.includes('copilot') ||
    t.includes('openai')
  ) {
    return 'AI'
  }

  // --- 2. РАЗРАБОТКА (Dev) ---
  // Локальный сервер, GitHub, документация
  if (
    t.includes('localhost') ||
    t.includes('github') ||
    t.includes('gitlab') ||
    t.includes('stackoverflow') ||
    t.includes('mdn')
  ) {
    return 'Dev'
  }
  if (t.includes('figma') || t.includes('trello') || t.includes('jira')) {
    return 'Work'
  }

  // --- 3. ОБЫЧНЫЕ ПРАВИЛА ПО ПРИЛОЖЕНИЯМ ---

  // Игры
  if (app.includes('game') || app.includes('steam') || app.includes('dota')) return 'Games'

  // Соцсети
  if (
    app.includes('telegram') ||
    app.includes('discord') ||
    app.includes('whatsapp') ||
    t.includes('telegram') ||
    t.includes('discord')
  )
    return 'Social'

  // Медиа (YouTube может быть и обучением, но пока в Media)
  if (
    app.includes('youtube') ||
    t.includes('youtube') ||
    app.includes('netflix') ||
    app.includes('music') ||
    app.includes('spotify') ||
    app.includes('yandex music')
  )
    return 'Media'

  // Разработка (Приложения)
  if (
    app.includes('code') ||
    app.includes('vs') ||
    app.includes('intellij') ||
    app.includes('terminal') ||
    app.includes('iterm') ||
    app.includes('warp')
  )
    return 'Dev'
  if (app.includes('figma') || app.includes('photoshop') || app.includes('blender')) return 'Design'
  if (app.includes('slack') || app.includes('zoom') || app.includes('meet')) return 'Work'
  if (app.includes('cursor')) return 'AI'

  // Система
  if (
    app.includes('finder') ||
    app.includes('explorer') ||
    app.includes('window') ||
    app.includes('desktop') ||
    app.includes('system')
  )
    return 'System'

  // Браузеры (Если мы дошли сюда, значит заголовок не содержал AI/Dev ключевых слов)
  if (
    app.includes('chrome') ||
    app.includes('firefox') ||
    app.includes('brave') ||
    app.includes('safari') ||
    app.includes('edge') ||
    app.includes('arc')
  )
    return 'Web'

  return 'Other'
}

// Список категорий, которые повышают Эффективность
export const PRODUCTIVE_CATEGORIES = ['Dev', 'Design', 'Work', 'AI']
