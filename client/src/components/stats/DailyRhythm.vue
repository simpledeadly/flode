<script setup lang="ts">
import { ref, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { HeatmapChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import { useTimeFormatter } from '@/composables/useTimeFormatter'
import { TableCellsIcon, ChartBarIcon } from '@heroicons/vue/24/solid'

use([CanvasRenderer, HeatmapChart, BarChart, GridComponent, TooltipComponent, VisualMapComponent])

const props = defineProps<{
  heatmap: { data: [number, number, number][]; categories: string[] }
  hourly: Array<Record<string, number>>
}>()

const { formatTime } = useTimeFormatter()
const viewMode = ref<'heatmap' | 'bars'>('heatmap')

// --- Опции для Heatmap ---
const heatmapOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    position: 'top',
    formatter: (params: any) => {
      if (!props.heatmap.categories[params.value[1]]) return ''
      const category = props.heatmap.categories[params.value[1]]
      return `<b>${category}</b>: ${formatTime(params.value[2])}`
    },
  },
  grid: {
    top: '5%',
    bottom: '15%',
    left: '12%',
    right: '5%',
  },
  xAxis: {
    type: 'category',
    data: Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')),
    splitArea: { show: true, areaStyle: { color: ['#ffffff04', 'transparent'] } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#71717a' },
  },
  yAxis: {
    type: 'category',
    data: props.heatmap.categories,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#a1a1aa' },
  },
  visualMap: {
    min: 0,
    max: Math.max(...(props.heatmap.data || []).map((d) => d[2]), 1800),
    calculable: false,
    orient: 'horizontal',
    left: 'center',
    bottom: '0%',
    inRange: {
      color: ['#1d2c3b', '#2c4358', '#3b82f6', '#ff6b00'],
    },
    show: false,
  },
  series: [
    {
      name: 'Activity',
      type: 'heatmap',
      data: props.heatmap.data,
      label: { show: false },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
  ],
}))

// --- Опции для Столбиков ---
const barsOption = computed(() => {
  const categories = Object.keys(
    (props.hourly || []).reduce((acc, hour) => ({ ...acc, ...hour }), {}),
  )
  const series = categories.map((cat) => ({
    name: cat,
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    data: (props.hourly || []).map((hourData) => hourData[cat] || 0),
  }))

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        let tooltip = `${params[0].name}:00<br/>`
        let total = 0
        params.forEach((param: any) => {
          if (param.value > 0) {
            tooltip += `${param.marker} ${param.seriesName}: ${formatTime(param.value)}<br/>`
            total += param.value
          }
        })
        tooltip += `<b>Total: ${formatTime(total)}</b>`
        return tooltip
      },
    },
    grid: { top: '15%', bottom: '15%', left: '5%', right: '5%', containLabel: true },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')),
      axisLabel: { color: '#71717a' },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#a1a1aa' },
      splitLine: { lineStyle: { color: '#ffffff09' } },
    },
    series: series,
  }
})

const currentOption = computed(() =>
  viewMode.value === 'heatmap' ? heatmapOption.value : barsOption.value,
)
</script>

<template>
  <div class="bg-[#18181b] rounded-2xl border border-white/5 h-full flex flex-col p-4">
    <div class="flex justify-between items-center pl-2 mb-2">
      <h3 class="text-xs font-bold text-[#52525b] uppercase tracking-widest">Daily Rhythm</h3>
      <div class="flex bg-[#09090b] p-1 rounded-lg border border-white/10">
        <button
          @click="viewMode = 'heatmap'"
          class="p-1.5 rounded-md transition-colors"
          :class="
            viewMode === 'heatmap' ? 'bg-[#ff6b00] text-white' : 'text-[#71717a] hover:bg-white/10'
          "
        >
          <TableCellsIcon class="w-4 h-4" />
        </button>
        <button
          @click="viewMode = 'bars'"
          class="p-1.5 rounded-md transition-colors"
          :class="
            viewMode === 'bars' ? 'bg-[#ff6b00] text-white' : 'text-[#71717a] hover:bg-white/10'
          "
        >
          <ChartBarIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
    <div class="flex-1 min-h-0">
      <v-chart :option="currentOption" autoresize />
    </div>
  </div>
</template>
