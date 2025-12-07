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

export interface ProcessedStats {
  stats: StatItem[]
  webStats: StatItem[]
  hourly: Array<Record<string, number>>
  efficiency: number
}
