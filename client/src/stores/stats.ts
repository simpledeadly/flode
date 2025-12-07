// client/src/stores/stats.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'

// 1. Описываем, как выглядит наша статистика
export interface StatItem {
  name: string
  value: number
  category: string
}

export const useStatsStore = defineStore('stats', () => {
  // 2. Используем этот тип вместо any
  const stats = ref<StatItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchStats(start?: Date, end?: Date) {
    loading.value = true
    error.value = null

    try {
      // 3. Указываем строгий тип для параметров
      const params: Record<string, string> = {}

      if (start) params.start = start.toISOString()
      if (end) params.end = end.toISOString()

      const response = await axios.get<StatItem[]>('http://localhost:3000/api/stats', { params })
      stats.value = response.data
    } catch (e) {
      // Ошибку приводим к типу Error или unknown
      console.error('Ошибка загрузки:', e)
      error.value = 'Не удалось загрузить статистику'
    } finally {
      loading.value = false
    }
  }

  async function sendReport(imageBase64: string) {
    try {
      await axios.post('http://localhost:3000/api/telegram', {
        image: imageBase64,
      })
      alert('Отчет успешно отправлен в Telegram! ✈️')
    } catch (e) {
      console.error(e)
      alert('Ошибка отправки отчета ❌')
    }
  }

  return { stats, loading, error, fetchStats, sendReport }
})
