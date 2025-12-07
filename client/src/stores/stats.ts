import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'

// Определяем типы данных
export interface StatItem {
  name: string
  value: number
  category: string
}

export interface AWEvent {
  id: number
  timestamp: string
  duration: number
  data: {
    app?: string
    title?: string
    url?: string
    [key: string]: any
  }
}

export interface SankeyData {
  nodes: any[]
  links: any[]
}

// Помощник для определения категории (логика с твоего бэкенда)
const getCategoryByData = (eventData: AWEvent['data'], type: 'apps' | 'web'): string => {
  if (type === 'web') {
    const domain = eventData.url?.replace(/^www\./, '').split('/')[0] || ''
    if (domain.includes('aistudio') || domain.includes('grok')) return 'AI'
    if (domain.includes('localhost') || domain.includes('vercel')) return 'Dev'
    return 'Web'
  }

  const app = eventData.app?.toLowerCase() || ''
  if (app.includes('cursor') || app.includes('code')) return 'Dev'
  if (app.includes('telegram')) return 'Social'
  if (app.includes('brave') || app.includes('chrome')) return 'Web'
  return 'Other'
}

export const useStatsStore = defineStore('stats', () => {
  // Агрегированные данные для графиков
  const stats = ref<StatItem[]>([])
  const webStats = ref<StatItem[]>([])
  const hourly = ref<Array<Record<string, number>>>(new Array(24).fill({}))
  const rawAppEvents = ref<AWEvent[]>([]) // <-- ДОБАВЛЕНО
  const rawWebEvents = ref<AWEvent[]>([]) // <-- ДОБАВЛЕНО
  const sankeyApp = ref<SankeyData | null>(null) // <-- ДОБАВЛЕНО
  const sankeyWeb = ref<SankeyData | null>(null) // <-- ДОБАВЛЕНО
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchStats(start?: Date, end?: Date) {
    loading.value = true
    error.value = null

    try {
      const params: any = {}
      if (start) params.start = start.toISOString()
      if (end) params.end = end.toISOString()

      const response = await axios.get('http://localhost:3000/api/stats', { params })
      const data = response.data

      stats.value = data.stats || []
      webStats.value = data.webStats || []
      hourly.value = data.hourly || []

      rawAppEvents.value = data.rawWindowEvents || []
      rawWebEvents.value = data.rawWebEvents || []
      sankeyApp.value = data.sankeyApp
      sankeyWeb.value = data.sankeyWeb
    } catch (e) {
      console.error(e)
      error.value = 'Ошибка API'
    } finally {
      loading.value = false
    }
  }

  function getCategory(eventData: AWEvent['data'], type: 'apps' | 'web'): string {
    return getCategoryByData(eventData, type)
  }

  async function sendReport(imageBase64: string) {
    try {
      await axios.post('http://localhost:3000/api/telegram', { image: imageBase64 })
      // alert('Отчет отправлен!')
    } catch (e) {
      console.error(e)
      alert('Ошибка отправки отчета ❌')
    }
  }

  return {
    stats,
    webStats,
    hourly,
    loading,
    error,
    rawAppEvents,
    rawWebEvents,
    sankeyApp,
    sankeyWeb,
    fetchStats,
    sendReport,
    getCategory,
  }
})
