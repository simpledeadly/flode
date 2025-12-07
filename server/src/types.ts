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
  fragmentation: number[]
  intensity: number[]
  rawInputEvents: AWEvent[]
  rawWindowEvents: AWEvent[]
  rawWebEvents: AWEvent[]
  sankeyApp: SankeyData
  sankeyWeb: SankeyData
}

export interface SankeyNode {
  name: string
}

export interface SankeyLink {
  source: string
  target: string
  value: number
}

export interface SankeyData {
  nodes: SankeyNode[]
  links: SankeyLink[]
}