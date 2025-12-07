<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { useTimeFormatter } from '@/composables/useTimeFormatter'

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent])

const props = defineProps<{
  data: Array<Record<string, number>>
}>()

const { formatTime } = useTimeFormatter()

// Цвета категорий
const colors: Record<string, string> = {
  Dev: '#3b82f6', // Blue
  Web: '#f97316', // Orange
  Social: '#a855f7', // Purple
  Work: '#22c55e', // Green
  Media: '#ef4444', // Red
  Design: '#ec4899', // Pink
  AI: '#14b8a6', // Teal
  Other: '#71717a',
}

const option = computed(() => {
  // 1. Собираем все уникальные категории, которые есть в данных
  const categories = new Set<string>()
  props.data.forEach((hour) => Object.keys(hour).forEach((k) => categories.add(k)))
  const catsArray = Array.from(categories)

  // 2. Формируем серии для графика (одна серия = один цвет)
  const series = catsArray.map((cat) => ({
    name: cat,
    type: 'bar',
    stack: 'total', // Это делает график стековым (наслоение)
    itemStyle: {
      color: colors[cat] || colors.Other,
      borderRadius: [0, 0, 0, 0], // Квадратные куски
    },
    // Данные по часам (0..23)
    data: props.data.map((hour) => hour[cat] || 0),
  }))

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(24, 24, 27, 0.95)',
      borderColor: '#3f3f46',
      textStyle: { color: '#e4e4e7' },
      formatter: (params: any) => {
        // Кастомный тултип для часа
        const hour = params[0].dataIndex
        let html = `<div class="font-bold mb-2 text-white">${hour}:00 — ${hour + 1}:00</div>`
        params.forEach((p: any) => {
          if (p.value > 0) {
            html += `
                <div class="flex justify-between gap-4 text-xs mb-1">
                  <span style="color: ${p.color}">● ${p.seriesName}</span>
                  <span class="font-mono text-gray-300">${formatTime(p.value)}</span>
                </div>
              `
          }
        })
        return html
      },
    },
    grid: { top: 10, right: 0, bottom: 20, left: 0 },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => i),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#52525b', fontSize: 10, interval: 3 }, // Показываем метки раз в 3 часа
    },
    yAxis: { show: false },
    series: series,
  }
})
</script>

<template>
  <div class="bg-[#18181b] rounded-2xl border border-white/5 p-5 h-full flex flex-col">
    <div class="flex justify-between items-center mb-2">
      <h3 class="text-sm font-bold text-[#e4e4e7] uppercase tracking-wide flex items-center gap-2">
        <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        Ритм Дня
      </h3>
    </div>
    <div class="flex-1 min-h-0 w-full">
      <v-chart :option="option" autoresize class="w-full h-full" />
    </div>
  </div>
</template>
