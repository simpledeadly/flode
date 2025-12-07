import axios from 'axios'
import { CONFIG } from '../config.js'
import { AWEvent } from '../types.js'

export class AWService {
  /**
   * Получаем словарь всех бакетов с их метаданными.
   */
  private async getBucketsMap() {
    try {
      const { data } = await axios.get(`${CONFIG.AW_URL}/buckets`)
      return data // Возвращает объект: { "bucket-id": { type: "...", ... }, ... }
    } catch (e) {
      console.error('⚠️ AW Error: Could not fetch buckets')
      return {}
    }
  }

  /**
   * Прямой запрос событий (самый надежный метод)
   */
  private async fetchEventsFromBucket(
    bucketId: string,
    start: string,
    end: string
  ): Promise<AWEvent[]> {
    try {
      const { data } = await axios.get(`${CONFIG.AW_URL}/buckets/${bucketId}/events`, {
        params: {
          start: start,
          end: end,
          limit: -1,
        },
      })
      return Array.isArray(data) ? data : []
    } catch (e: any) {
      return []
    }
  }

  public async getData(
    start: string,
    end: string
  ): Promise<{ windowEvents: AWEvent[]; webEvents: AWEvent[] }> {
    console.log(`📡 Fetching Data: ${start} -> ${end}`)

    const bucketsMap = await this.getBucketsMap()
    const bucketIds = Object.keys(bucketsMap)

    // 1. Ищем бакет Окон (обычно по типу "app.window.active" или имени)
    const windowBucketId = bucketIds.find(
      (id) => id.includes('aw-watcher-window') || bucketsMap[id].type === 'app.window.active'
    )

    // 2. Ищем бакеты Веба (ПО ТИПУ, а не только по имени)
    // Стандартный тип для веба: 'web.tab.current'
    const webBucketIds = bucketIds.filter((id) => {
      const type = bucketsMap[id].type || ''
      return type.includes('web.tab.current') || id.includes('aw-watcher-web')
    })

    // Логируем, куда именно мы стучимся, чтобы понять причину нулей
    console.log(`📦 Targets:`)
    console.log(`   🪟 Window: ${windowBucketId || 'NOT FOUND'}`)
    console.log(`   🌍 Web:    ${webBucketIds.join(', ') || 'NONE'}`)

    // 3. Запрос Окон
    let windowEvents: AWEvent[] = []
    if (windowBucketId) {
      windowEvents = await this.fetchEventsFromBucket(windowBucketId, start, end)
    }

    // 4. Запрос Веба (параллельно)
    let webEvents: AWEvent[] = []
    if (webBucketIds.length > 0) {
      const promises = webBucketIds.map((id) => this.fetchEventsFromBucket(id, start, end))
      const results = await Promise.all(promises)
      webEvents = results.flat()
    }

    console.log(`✅ Results: Window=${windowEvents.length}, Web=${webEvents.length}`)

    return { windowEvents, webEvents }
  }
}

export const awService = new AWService()
