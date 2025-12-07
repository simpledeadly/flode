<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { HeatmapChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import { useTimeFormatter } from '@/composables/useTimeFormatter'

use([CanvasRenderer, HeatmapChart, GridComponent, TooltipComponent, VisualMapComponent])

const props = defineProps<{
  heatmap: {
    data: [number, number, number][]
    categories: string[]
  }
}>()

const { formatTime } = useTimeFormatter()

const option = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    position: 'top',
    formatter: (params: any) => {
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
    max: Math.max(...props.heatmap.data.map((d) => d[2]), 1800), // Максимум - 30 минут для градиента
    calculable: false,
    orient: 'horizontal',
    left: 'center',
    bottom: '0%',
    inRange: {
      color: ['#1d2c3b', '#2c4358', '#3b82f6', '#ff6b00'], // От темно-синего к оранжевому
    },
    show: false, // Скрываем сам контрол, оставляем только цвета
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
</script>

<template>
  <div class="bg-[#18181b] rounded-2xl border border-white/5 h-full flex flex-col p-4">
    <h3 class="text-xs font-bold text-[#52525b] uppercase tracking-widest pl-2 mb-2">
      Daily Rhythm
    </h3>
    <div
      v-if="!heatmap.data || heatmap.data.length === 0"
      class="flex-1 flex items-center justify-center text-sm text-[#52525b]"
    >
      No activity to display
    </div>
    <v-chart v-else :option="option" autoresize class="flex-1" />
  </div>
</template>
