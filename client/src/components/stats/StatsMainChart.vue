<script setup lang="ts">
import { ref, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, TreemapChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'
import { ChartPieIcon, Squares2X2Icon, LifebuoyIcon } from '@heroicons/vue/24/solid'
import BaseButton from '@/components/BaseButton.vue'
import { useTimeFormatter } from '@/composables/useTimeFormatter'

use([
  CanvasRenderer,
  PieChart,
  TreemapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
])

const props = defineProps<{
  data: Array<{ name: string; value: number; category?: string }>
  webData?: Array<{ name: string; value: number }>
  loading: boolean
}>()

const { formatTime } = useTimeFormatter()
const chartType = ref<'pie' | 'rose' | 'treemap'>('pie')
const chartRef = ref<any>(null)

defineExpose({ chartRef })

// Цвета для категорий (чтобы сайты были цветными)
// Внутри <script setup>
const categoryColors: Record<string, string> = {
  Dev: '#3b82f6', // Синий (VS Code, Cursor, Localhost, GitHub)
  AI: '#14b8a6', // Тиловый (ChatGPT, Claude)
  Social: '#a855f7', // Фиолетовый (Telegram)
  Media: '#ef4444', // Красный (YouTube, Yandex Music)
  Work: '#22c55e', // Зеленый (Slack, Zoom)
  Design: '#ec4899', // Розовый (Figma)
  Web: '#f97316', // Оранжевый (Brave, Chrome)
  Search: '#eab308', // Желтый
  System: '#71717a', // Серый
  Other: '#52525b',
}

const processedData = computed(() => {
  const top = props.data.slice(0, 15) // Берем больше данных для Treemap
  const others = props.data.slice(15)

  const result =
    others.length > 0
      ? [
          ...top,
          { name: 'Other', value: others.reduce((a, c) => a + c.value, 0), category: 'Other' },
        ]
      : top

  return result.map((item) => ({
    name: item.name,
    value: item.value,
    category: item.category || 'Other',
    itemStyle: {
      color: categoryColors[item.category || 'Other'] || '#71717a',
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

const treemapData = computed(() => {
  const groups: Record<string, any[]> = {}

  props.data.forEach((item) => {
    const cat = item.category || 'Other'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push({
      name: item.name,
      value: item.value,
      itemStyle: { color: categoryColors[cat] },
    })
  })

  return Object.keys(groups).map((cat) => ({
    name: cat,
    itemStyle: { color: categoryColors[cat] },
    children: groups[cat],
  }))
})

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

const roseOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: pieOption.value.tooltip,
  series: [
    {
      type: 'pie',
      radius: [20, 140],
      center: ['50%', '50%'],
      roseType: 'area', // Включает режим "Розы"
      itemStyle: { borderRadius: 4, borderColor: '#18181b', borderWidth: 2 },
      label: { show: true, color: '#e4e4e7', formatter: '{b}' },
      data: processedData.value,
    },
  ],
}))

const treemapOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    backgroundColor: 'rgba(24, 24, 27, 0.9)',
    borderColor: '#3f3f46',
    textStyle: { color: '#fff' },
    formatter: (params: any) => {
      return `<div class="font-bold text-sm">${params.name}</div>
              <div class="text-xs text-gray-400">${formatTime(params.value)}</div>`
    },
  },
  series: [
    {
      type: 'treemap',
      width: '100%',
      height: '100%',
      roam: false, // Отключаем зум
      nodeClick: false, // Отключаем проваливание
      breadcrumb: { show: false }, // Скрываем хлебные крошки
      itemStyle: {
        borderColor: '#18181b',
        borderWidth: 2,
        gapWidth: 2,
      },
      label: {
        show: true,
        formatter: '{b}',
        color: '#fff',
        fontWeight: 'bold',
      },
      levels: [
        {
          itemStyle: {
            borderColor: '#18181b',
            borderWidth: 4,
            gapWidth: 4,
          },
        },
        {
          colorSaturation: [0.3, 0.6],
          itemStyle: {
            borderColorSaturation: 0.7,
            gapWidth: 2,
            borderWidth: 2,
          },
        },
      ],
      data: treemapData.value,
    },
  ],
}))

const currentOption = computed(() => {
  if (chartType.value === 'pie') return pieOption.value
  if (chartType.value === 'treemap') return treemapOption.value
  return roseOption.value
})
</script>

<template>
  <!-- Контейнер теперь один, без лишних вложенностей -->
  <div class="flex flex-col h-full bg-[#18181b] rounded-2xl border border-white/5 relative p-6">
    <!-- Переключатель типов графика -->
    <div class="absolute top-6 right-6 z-20 flex bg-[#27272a] p-1 rounded-lg border border-white/5">
      <BaseButton
        v-for="type in ['pie', 'rose', 'treemap'] as const"
        :key="type"
        @click="chartType = type"
        class="p-2 rounded-md transition-all hover:bg-white/10"
        variant="secondary"
        :class="chartType === type ? 'bg-[#ff6b00] text-white shadow-lg' : 'text-[#71717a]'"
        :title="`${type.charAt(0).toUpperCase() + type.slice(1)} Chart`"
      >
        <component
          :is="{ pie: ChartPieIcon, rose: LifebuoyIcon, treemap: Squares2X2Icon }[type]"
          class="w-4 h-4"
        />
      </BaseButton>
    </div>

    <!-- Заголовок (был в центре, теперь слева для чистоты) -->
    <h3 class="text-xs font-bold text-[#52525b] uppercase tracking-widest pointer-events-none mb-4">
      Activity Distribution
    </h3>

    <div class="flex-1 w-full relative min-h-0">
      <!-- 🔥 ВОТ ФИКС: :key="chartType" полностью перерисовывает график -->
      <v-chart
        ref="chartRef"
        :key="chartType"
        :option="currentOption"
        autoresize
        class="w-full h-full"
      />

      <div
        v-if="loading"
        class="absolute inset-0 flex items-center justify-center bg-[#18181b]/60 backdrop-blur-sm z-20"
      >
        <div
          class="w-8 h-8 border-2 border-[#ff6b00] border-t-transparent rounded-full animate-spin"
        />
      </div>
    </div>
  </div>
</template>
