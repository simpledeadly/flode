import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'

export interface StatItem {
  name: string
  value: number
  category: string
}

export const useStatsStore = defineStore('stats', () => {
  const stats = ref<StatItem[]>([])
  const hourly = ref<number[]>(new Array(24).fill(0))
  const efficiency = ref<number>(0) // <-- Новое поле
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

      // Разбор ответа
      if (data && !Array.isArray(data)) {
        stats.value = data.stats || []
        hourly.value = data.hourly || new Array(24).fill(0)
        efficiency.value = data.efficiency || 0 // Получаем эффективность
      } else {
        stats.value = []
        hourly.value = new Array(24).fill(0)
        efficiency.value = 0
      }
    } catch (e) {
      console.error(e)
      error.value = 'Ошибка API'
    } finally {
      loading.value = false
    }
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

  return { stats, hourly, efficiency, loading, error, fetchStats, sendReport }
})
