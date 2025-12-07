<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { CustomChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components'

use([CanvasRenderer, CustomChart, GridComponent, TooltipComponent, DataZoomComponent])

const props = defineProps<{
  events: Array<{ name: string; value: number; category?: string; timestamp: string }>
}>()

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
  const categories = [...new Set(props.events.map((e) => e.category || 'Other'))]
  const data = props.events.map((event) => {
    const categoryIndex = categories.indexOf(event.category || 'Other')
    const startTime = new Date(event.timestamp)
    const endTime = new Date(startTime.getTime() + event.value * 1000)

    return {
      name: event.name,
      value: [categoryIndex, startTime.getTime(), endTime.getTime(), event.value],
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
    formatter: (params: any) =>
      `${params.marker} ${params.data.name}: <b>${(params.data.value[3] / 60).toFixed(1)} min</b>`,
  },
  grid: { top: 20, bottom: 40, left: 80, right: 20 },
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
      type: 'inside',
      filterMode: 'weakFilter',
      orient: 'horizontal',
    },
  ],
  series: [
    {
      type: 'custom',
      renderItem: (params: any, api: any) => {
        const categoryIndex = api.value(0)
        const start = api.coord([api.value(1), categoryIndex])
        const end = api.coord([api.value(2), categoryIndex])
        const height = api.size([0, 1])[1] * 0.8

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
        }
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
  <div class="bg-[#18181b] rounded-2xl border border-white/5 h-full p-4">
    <h3 class="text-xs font-bold text-[#52525b] uppercase tracking-widest pl-2 mb-2">
      Daily Timeline
    </h3>
    <v-chart :option="option" autoresize />
  </div>
</template>
