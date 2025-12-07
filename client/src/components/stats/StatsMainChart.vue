<script setup lang="ts">
import { ref, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { ChartPieIcon, ChartBarIcon } from '@heroicons/vue/24/solid'
import { useTimeFormatter } from '@/composables/useTimeFormatter'

use([CanvasRenderer, PieChart, BarChart, GridComponent, TooltipComponent, LegendComponent])

const props = defineProps<{
  data: Array<{ name: string; value: number; category?: string }>
  webData?: Array<{ name: string; value: number }>
  loading: boolean
}>()

const { formatTime } = useTimeFormatter()
const chartType = ref<'pie' | 'bar'>('pie')
const chartRef = ref<any>(null)

defineExpose({ chartRef })

// Цвета для категорий (чтобы сайты были цветными)
// Внутри <script setup>
  const categoryColors: Record<string, string> = {
  Dev: '#3b82f6',     // Синий (VS Code, Cursor, Localhost, GitHub)
  AI: '#14b8a6',      // Тиловый (ChatGPT, Claude)
  Social: '#a855f7',  // Фиолетовый (Telegram)
  Media: '#ef4444',   // Красный (YouTube, Yandex Music)
  Work: '#22c55e',    // Зеленый (Slack, Zoom)
  Design: '#ec4899',  // Розовый (Figma)
  Web: '#f97316',     // Оранжевый (Brave, Chrome)
  Search: '#eab308',  // Желтый
  System: '#71717a',  // Серый
  Other: '#52525b'
}

const processedData = computed(() => {
  const top = props.data.slice(0, 9)
  const others = props.data.slice(9)
  const result =
    others.length > 0
      ? [
          ...top,
          { name: 'Прочее', value: others.reduce((a, c) => a + c.value, 0), category: 'Other' },
        ]
      : top

  // Добавляем цвет в данные, чтобы ECharts его подхватил
  return result.map((item) => ({
    ...item,
    itemStyle: {
      color: categoryColors[item.category || 'Other'] || '#71717a',
      borderColor: '#18181b',
      borderWidth: 2,
    },
  }))
})

// Генератор списка сайтов для тултипа
const getWebTooltip = () => {
  if (!props.webData || props.webData.length === 0) return ''
  // Берем топ-5 сайтов
  const topSites = props.webData.slice(0, 5)
  let html =
    '<div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">'
  html +=
    '<div style="font-size: 9px; color: #71717a; text-transform: uppercase; font-weight: 700; margin-bottom: 6px;">Active Tabs</div>'
  topSites.forEach((site) => {
    html += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-size: 11px;">
             <span style="color: #d4d4d8;">${site.name}</span>
             <span style="color: #a1a1aa; font-family: monospace;">${formatTime(site.value)}</span>
          </div>`
  })
  html += '</div>'
  return html
}

const pieOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(9, 9, 11, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    padding: 0,
    extraCssText:
      'backdrop-filter: blur(12px); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.6);',
    formatter: (params: any) => {
      const isBrowser =
        params.name.toLowerCase().includes('brave') ||
        params.name.toLowerCase().includes('chrome') ||
        params.name.toLowerCase().includes('web')

      let content = `
            <div style="padding: 16px; font-family: 'Inter', sans-serif; min-width: 200px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${params.color}; box-shadow: 0 0 10px ${params.color};"></div>
                <span style="font-size: 14px; color: #fff; font-weight: 600;">${params.name}</span>
              </div>
              <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 16px;">
                <span style="font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.5px;">${formatTime(params.value)}</span>
                <span style="font-size: 12px; color: ${params.color}; font-weight: 700; background: ${params.color}20; padding: 2px 6px; border-radius: 4px;">${params.percent}%</span>
              </div>
          `

      // 🔥 ВОТ ОНО: Если навели на Браузер, показываем сайты!
      if (isBrowser) {
        content += getWebTooltip()
      }

      content += `</div>`
      return content
    },
  },
  legend: {
    orient: 'vertical',
    right: 0,
    top: 'center',
    type: 'scroll',
    pageIconColor: '#ff6b00',
    pageTextStyle: { color: '#a1a1aa' },
    textStyle: { color: '#a1a1aa', fontSize: 12, fontFamily: 'Inter' },
    formatter: (name: string) => (name.length > 20 ? name.substr(0, 20) + '...' : name),
  },
  series: [
    {
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      itemStyle: { borderRadius: 4, borderColor: '#18181b', borderWidth: 2 },
      label: { show: false },
      data: processedData.value,
    },
  ],
}))

// BarChart с цветами
const barOption = computed(() => {
  const dataReversed = [...processedData.value].reverse()
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(24, 24, 27, 0.95)',
      borderColor: '#3f3f46',
      textStyle: { color: '#e4e4e7' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#71717a', formatter: (val: number) => formatTime(val) },
      splitLine: { lineStyle: { color: '#27272a' } },
    },
    yAxis: {
      type: 'category',
      data: dataReversed.map((i) => i.name),
      axisLabel: { color: '#e4e4e7', width: 120, overflow: 'truncate' },
    },
    series: [
      {
        type: 'bar',
        data: dataReversed.map((i) => ({
          value: i.value,
          itemStyle: {
            color: categoryColors[i.category || 'Other'] || '#ff6b00',
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barWidth: '60%',
      },
    ],
  }
})

const currentOption = computed(() =>
  chartType.value === 'pie' ? pieOption.value : barOption.value,
)
</script>

<template>
  <div class="flex flex-col h-full bg-[#18181b] rounded-2xl border border-white/5 p-6 relative">
    <div class="flex justify-between items-center mb-4 z-10 pl-36">
      <h3 class="text-lg font-semibold text-white opacity-0 md:opacity-100">Распределение</h3>
      <div class="flex bg-[#27272a] p-1 rounded-lg">
        <button
          @click="chartType = 'pie'"
          class="p-2 rounded-md transition-all"
          :class="
            chartType === 'pie'
              ? 'bg-[#ff6b00] text-white shadow-lg'
              : 'text-[#71717a] hover:text-white'
          "
        >
          <ChartPieIcon class="w-5 h-5" />
        </button>
        <button
          @click="chartType = 'bar'"
          class="p-2 rounded-md transition-all"
          :class="
            chartType === 'bar'
              ? 'bg-[#ff6b00] text-white shadow-lg'
              : 'text-[#71717a] hover:text-white'
          "
        >
          <ChartBarIcon class="w-5 h-5" />
        </button>
      </div>
    </div>
    <div class="flex-1 w-full relative min-h-0">
      <v-chart ref="chartRef" :option="currentOption" autoresize class="w-full h-full" />
      <div
        v-if="loading"
        class="absolute inset-0 flex items-center justify-center bg-[#18181b]/60 backdrop-blur-sm z-20"
      >
        <div
          class="w-10 h-10 border-2 border-[#ff6b00] border-t-transparent rounded-full animate-spin"
        />
      </div>
    </div>
  </div>
</template>
