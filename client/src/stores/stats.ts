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
  const webStats = ref<StatItem[]>([])
  // hourly теперь хранит сложную структуру: [{ 'Dev': 300, 'Web': 100 }, ...]
  const hourly = ref<Array<Record<string, number>>>(new Array(24).fill({}))
  const efficiency = ref<number>(0)
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
      hourly.value = data.hourly || new Array(24).fill({})
      efficiency.value = data.efficiency || 0
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

  return { stats, webStats, hourly, efficiency, loading, error, fetchStats, sendReport }
})
