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
  loading: boolean
}>()

const { formatTime } = useTimeFormatter()
const chartType = ref<'pie' | 'bar'>('pie')
const chartRef = ref<any>(null)

defineExpose({ chartRef })

// --- УМНАЯ ПОДГОТОВКА ДАННЫХ ---
const processedData = computed(() => {
  // Берем топ-9 приложений
  const top = props.data.slice(0, 11)
  // Остальные складываем в "Other"
  const others = props.data.slice(9)

  if (others.length > 0) {
    const otherValue = others.reduce((acc, curr) => acc + curr.value, 0)
    return [...top, { name: 'Прочее', value: otherValue, category: 'Other' }]
  }
  return top
})

// ОПЦИИ ДЛЯ PIE
const pieOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(9, 9, 11, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    padding: 0,
    extraCssText:
      'backdrop-filter: blur(8px); border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);',
    formatter: (params: any) => `
      <div style="padding: 10px 14px; font-family: 'Inter', sans-serif;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${params.color}; box-shadow: 0 0 8px ${params.color};"></div>
          <span style="font-size: 12px; color: #a1a1aa; font-weight: 500;">${params.name}</span>
        </div>
        <div style="display: flex; align-items: baseline; gap: 12px;">
          <span style="font-size: 16px; font-weight: 700; color: #fff;">${formatTime(params.value)}</span>
          <span style="font-size: 12px; color: #ff6b00; font-weight: 600;">${params.percent}%</span>
        </div>
      </div>
    `,
  },
  legend: {
    orient: 'vertical',
    right: 0,
    top: 'center',
    type: 'scroll',
    textStyle: { color: '#a1a1aa' },
    pageIconColor: '#ff6b00',
    pageTextStyle: { color: '#a1a1aa' },
  },
  series: [
    {
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['40%', '50%'], // Сдвигаем влево, чтобы легенда влезла справа
      itemStyle: { borderRadius: 5, borderColor: '#18181b', borderWidth: 2 },
      label: { show: false }, // Убираем линии с подписями, они создают хаос
      data: processedData.value, // Используем сгруппированные данные
    },
  ],
}))

// ОПЦИИ ДЛЯ BAR
const barOption = computed(() => {
  const dataReversed = [...processedData.value].reverse() // Чтобы топ был сверху
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(9, 9, 11, 0.9)',
      borderColor: '#3f3f46',
      textStyle: { color: '#e4e4e7' },
      formatter: (params: any) => {
        const item = params[0]
        return `${item.marker} <b>${item.name}</b><br/>${formatTime(item.value)}`
      },
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
        data: dataReversed.map((i) => i.value),
        itemStyle: { color: '#ff6b00', borderRadius: [0, 4, 4, 0] },
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
    <div class="flex justify-between items-center mb-4 z-10">
      <h3 class="text-lg font-semibold text-white">Распределение времени</h3>
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
