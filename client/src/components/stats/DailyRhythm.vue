<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { CustomChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components'
import { useTimeFormatter } from '@/composables/useTimeFormatter'

use([CanvasRenderer, CustomChart, GridComponent, TooltipComponent, DataZoomComponent])

const props = defineProps<{
  events: Array<{ name: string; value: number; category?: string; timestamp: string }>
}>()

const { formatTime } = useTimeFormatter()

const categoryColors: Record<string, string> = {
  Dev: '#3b82f6',
  AI: '#14b8a6',
  Social: '#a855f7',
  Media: '#ef4444',
  Work: '#22c55e',
  Design: '#ec4899',
  Web: '#f97316',
  Search: '#eab308',
  System: '#71717a',
  Other: '#52525b',
}

const timelineData = computed(() => {
  if (!props.events || props.events.length === 0) {
    return { data: [], categories: [] }
  }

  // Получаем уникальные категории для оси Y
  const categories = [...new Set(props.events.map((e) => e.category || 'Other'))]

  const data = props.events.map((event) => {
    const categoryIndex = categories.indexOf(event.category || 'Other')
    const startTime = new Date(event.timestamp)
    const endTime = new Date(startTime.getTime() + event.value * 1000)

    return {
      name: event.name,
      value: [
        categoryIndex, // 0: Индекс категории для оси Y
        startTime.getTime(), // 1: Время начала
        endTime.getTime(), // 2: Время конца
        event.value, // 3: Длительность в секундах
      ],
      itemStyle: {
        color: categoryColors[event.category || 'Other'],
      },
    }
  })

  return { data, categories }
})

const option = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    formatter: (params: any) => {
      return `<b>${params.data.name}</b><br/>${formatTime(params.data.value[3])}`
    },
  },
  grid: { top: 10, bottom: 50, left: 80, right: 20 },
  xAxis: {
    type: 'time',
    axisLabel: { color: '#71717a' },
    splitLine: { show: true, lineStyle: { color: '#ffffff09' } },
  },
  yAxis: {
    type: 'category',
    data: timelineData.value.categories,
    axisLabel: { color: '#a1a1aa' },
  },
  dataZoom: [
    {
      type: 'slider',
      filterMode: 'weakFilter',
      orient: 'horizontal',
      bottom: 10,
      height: 20,
      backgroundColor: '#ffffff05',
      borderColor: 'transparent',
      dataBackground: {
        lineStyle: { color: 'transparent' },
        areaStyle: { color: 'transparent' },
      },
      fillerColor: 'rgba(255, 107, 0, 0.2)',
      handleStyle: { color: '#ff6b00' },
      moveHandleStyle: { color: '#ff6b00' },
      textStyle: { color: '#a1a1aa' },
    },
  ],
  series: [
    {
      type: 'custom',
      renderItem: (params: any, api: any) => {
        const categoryIndex = api.value(0)
        const start = api.coord([api.value(1), categoryIndex])
        const end = api.coord([api.value(2), categoryIndex])
        const height = api.size([0, 1])[1] * 0.7

        if (end[0] - start[0] < 2) return // Не рендерим слишком мелкие события

        const rectShape = {
          x: start[0],
          y: start[1] - height / 2,
          width: end[0] - start[0],
          height: height,
        }

        return {
          type: 'rect',
          shape: rectShape,
          style: api.style(),
          styleEmphasis: {
            stroke: '#fff',
          },
        }
      },
      itemStyle: {
        opacity: 0.9,
        borderRadius: 2,
      },
      encode: {
        x: [1, 2],
        y: 0,
      },
      data: timelineData.value.data,
    },
  ],
}))
</script>

<template>
  <div class="bg-[#18181b] rounded-2xl border border-white/5 h-full flex flex-col p-4">
    <h3 class="text-xs font-bold text-[#52525b] uppercase tracking-widest pl-2 mb-2">
      Daily Rhythm
    </h3>
    <div
      v-if="events.length === 0"
      class="flex-1 flex items-center justify-center text-sm text-[#52525b]"
    >
      No activity to display
    </div>
    <v-chart v-else :option="option" autoresize class="flex-1 -ml-4" />
  </div>
</template>
