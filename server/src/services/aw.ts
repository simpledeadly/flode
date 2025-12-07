import axios from 'axios'
import { CONFIG } from '../config.js'
import { AWEvent } from '../types.js'

export class AWService {
  private async getBucketsMap() {
    try {
      const { data } = await axios.get(`${CONFIG.AW_URL}/buckets`)
      return data
    } catch (e) {
      console.error('⚠️ AW Error: Could not fetch buckets')
      return {}
    }
  }

  private async fetchEventsFromBucket(
    bucketId: string,
    start: string,
    end: string
  ): Promise<AWEvent[]> {
    try {
      const { data } = await axios.get(`${CONFIG.AW_URL}/buckets/${bucketId}/events`, {
        params: { start, end, limit: -1 },
      })
      return Array.isArray(data) ? data : []
    } catch (e: any) {
      return []
    }
  }

  public async getData(
    start: string,
    end: string
  ): Promise<{ windowEvents: AWEvent[]; webEvents: AWEvent[]; inputEvents: AWEvent[] }> {
    console.log(`📡 Fetching Data: ${start} -> ${end}`)

    const bucketsMap = await this.getBucketsMap()
    const bucketIds = Object.keys(bucketsMap)

    // 1. Ищем бакеты по их назначению
    const windowBucketId = bucketIds.find((id) => id.includes('aw-watcher-window'))
    const webBucketIds = bucketIds.filter((id) => id.includes('aw-watcher-web'))
    const inputBucketId = bucketIds.find((id) => id.includes('aw-watcher-input'))

    console.log(`📦 Targets:`)
    console.log(`   🪟 Window: ${windowBucketId || 'NOT FOUND'}`)
    console.log(`   🌍 Web:    ${webBucketIds.join(', ') || 'NONE'}`)
    console.log(`   ⌨️ Input:  ${inputBucketId || 'NOT FOUND'}`)

    // 2. 🔥 ФИКС ЗДЕСЬ: Создаем промисы и выполняем их через Promise.all для максимальной скорости и безопасности типов
    const windowPromise = windowBucketId
      ? this.fetchEventsFromBucket(windowBucketId, start, end)
      : Promise.resolve([])
    const webPromises = webBucketIds.map((id) => this.fetchEventsFromBucket(id, start, end))
    const inputPromise = inputBucketId
      ? this.fetchEventsFromBucket(inputBucketId, start, end)
      : Promise.resolve([])

    // Ждем выполнения всех запросов
    const [windowEvents, webEventsNested, inputEvents] = await Promise.all([
      windowPromise,
      Promise.all(webPromises), // Важно: Promise.all для массива промисов
      inputPromise,
    ])

    // Объединяем результаты из нескольких веб-бакетов
    const webEvents = webEventsNested.flat()

    console.log(
      `✅ Results: Window=${windowEvents.length}, Web=${webEvents.length}, Input=${inputEvents.length}`
    )

    return { windowEvents, webEvents, inputEvents }
  }
}

export const awService = new AWService()
