import axios from 'axios'
import { CONFIG } from '../config.js'
import { AWEvent } from '../types.js'

export class AWService {
  private async getBuckets() {
    const { data } = await axios.get(`${CONFIG.AW_URL}/buckets`)
    return Object.keys(data)
  }

  private buildSimpleQuery(bucketId: string) {
    return `events = query_bucket("${bucketId}"); RETURN = events;`
  }

  public async getData(
    start: string,
    end: string
  ): Promise<{ windowEvents: AWEvent[]; webEvents: AWEvent[] }> {
    const buckets = await this.getBuckets()

    // 1. Ищем бакеты
    const windowBucket = buckets.find((b) => b.includes('aw-watcher-window'))

    // 🔥 Ищем ВСЕ веб бакеты
    const webBuckets = buckets.filter((b) => b.includes('aw-watcher-web'))

    console.log(`📦 Sources: Window=[${windowBucket}], Web=[${webBuckets.length} buckets]`)

    if (!windowBucket) return { windowEvents: [], webEvents: [] }

    // 2. Запрашиваем Окна
    let windowEvents: AWEvent[] = []
    try {
      const query = this.buildSimpleQuery(windowBucket)
      const { data } = await axios.post(`${CONFIG.AW_URL}/query`, {
        query: [query],
        timeperiods: [`${start}/${end}`],
      })
      windowEvents = data[0] || []
      console.log(`✅ Window Events: ${windowEvents.length}`)
    } catch (e) {
      console.error('Window query error')
    }

    // 3. Запрашиваем Веб (со всех бакетов)
    let webEvents: AWEvent[] = []
    if (webBuckets.length > 0) {
      try {
        const queries = webBuckets.map((b) => this.buildSimpleQuery(b))
        const { data: results } = await axios.post(`${CONFIG.AW_URL}/query`, {
          query: queries,
          timeperiods: [`${start}/${end}`],
        })

        // Объединяем результаты
        results.forEach((res: any) => {
          if (Array.isArray(res)) webEvents = webEvents.concat(res)
        })

        console.log(`✅ Web Events (Merged): ${webEvents.length}`)
      } catch (e: any) {
        console.warn('Web query error:', e.message)
      }
    }

    return { windowEvents, webEvents }
  }
}

export const awService = new AWService()
