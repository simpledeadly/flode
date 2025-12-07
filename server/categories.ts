// server/categories.ts

export const CATEGORIES_CONFIG: Record<string, string[]> = {
  '👨‍💻 Работа': ['VS Code', 'Cursor', 'Terminal', 'iTerm2', 'Figma', 'Slack'],
  '🌐 Браузер (Разное)': ['Brave Browser', 'Google Chrome', 'Safari'],
  '💬 Общение': ['Telegram', 'Discord', 'Mail', 'Zoom'],
  '🛠 Утилиты': ['Finder', 'System Settings', 'CleanShot X', 'Raycast'],
  '🎵 Медиа': ['Spotify', 'Yandex Music', 'VLC'],
}

// Функция-помощник
export function getCategory(appName: string, windowTitle: string = ''): string {
  // Сначала проверяем конкретные сайты (если передал title)
  if (appName.includes('Brave') || appName.includes('Chrome')) {
    if (windowTitle.includes('YouTube')) return '🍿 YouTube'
    if (windowTitle.includes('GitHub')) return '👨‍💻 Работа'
    if (windowTitle.includes('ChatGPT')) return '🧠 AI Помощник'
    if (windowTitle.includes('localhost')) return '👨‍💻 Работа'
  }

  // Потом проверяем приложения
  for (const [category, apps] of Object.entries(CATEGORIES_CONFIG)) {
    if (apps.some((app) => appName.includes(app))) {
      return category
    }
  }

  return '📦 Прочее'
}
