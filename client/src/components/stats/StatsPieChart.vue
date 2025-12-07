<script setup lang="ts">
import { ref, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { EyeIcon, TagIcon, CheckCircleIcon } from '@heroicons/vue/24/solid'
import { useTimeFormatter } from '@/composables/useTimeFormatter'

const { formatTime } = useTimeFormatter()

const props = defineProps<{
  data: Array<{ name: string; value: number }>
  loading: boolean
}>()

use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, LegendComponent])

const chartRef = ref<any>(null)
const showLegend = ref(true)
const showLabels = ref(true)

defineExpose({ chartRef })

const chartOption = computed(() => ({
  backgroundColor: 'transparent',
  color: ['#ff6b00', '#fb923c', '#ea580c', '#f97316', '#fdba74', '#71717a', '#52525b', '#3f3f46'],
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    padding: 0,
    textStyle: { fontFamily: 'Inter, sans-serif' },
    extraCssText:
      'backdrop-filter: blur(12px); border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);',
    formatter: (params: any) => `
          <div style="padding: 12px; min-width: 150px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <div style="width: 6px; height: 6px; background-color: ${params.color}; border-radius: 50%; box-shadow: 0 0 10px ${params.color};"></div>
              <span style="font-size: 13px; font-weight: 600; color: #e4e4e7;">${params.name}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
               <span style="font-size: 18px; font-weight: 700; color: #fff;">${formatTime(params.value)}</span>
               <span style="font-size: 12px; color: #a1a1aa;">${params.percent}%</span>
            </div>
          </div>
        `,
  },
  legend: {
    show: showLegend.value,
    bottom: 0,
    left: 'center',
    type: 'scroll',
    pageIconColor: '#ff6b00',
    pageTextStyle: { color: '#a1a1aa' },
    textStyle: { color: '#a1a1aa', fontSize: 12, fontFamily: 'Inter' },
    itemWidth: 10,
    itemHeight: 10,
    padding: [20, 0, 0, 0],
  },
  series: [
    {
      name: 'Активность',
      type: 'pie',
      radius: ['55%', '80%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 4, borderColor: '#18181b', borderWidth: 2 },
      label: {
        show: showLabels.value,
        position: 'outside',
        formatter: (params: any) =>
          `{name|${params.name}}\n{time|${formatTime(params.value)}}  {pct|${params.percent}%}`,
        rich: {
          name: { color: '#e4e4e7', fontSize: 12, fontWeight: 600, lineHeight: 18 },
          time: { color: '#a1a1aa', fontSize: 11, lineHeight: 16 },
          pct: { color: '#ff6b00', fontSize: 11, fontWeight: 600 },
        },
      },
      emphasis: { label: { show: showLabels.value } },
      labelLine: {
        show: showLabels.value,
        length: 15,
        length2: 10,
        lineStyle: { color: '#3f3f46' },
      },
      data: props.data,
    },
  ],
}))
</script>

<template>
  <div>
    <div class="px-6 pt-6 flex gap-4">
      <button
        class="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 active:scale-95 select-none"
        :class="
          showLegend
            ? 'bg-[#ff6b00]/10 border-[#ff6b00]/20 text-[#ff6b00]'
            : 'bg-transparent border-white/5 text-[#71717a] hover:text-[#a1a1aa]'
        "
        @click="showLegend = !showLegend"
      >
        <component :is="showLegend ? CheckCircleIcon : EyeIcon" class="w-4 h-4" />
        Легенда
      </button>
      <button
        class="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 active:scale-95 select-none"
        :class="
          showLabels
            ? 'bg-[#ff6b00]/10 border-[#ff6b00]/20 text-[#ff6b00]'
            : 'bg-transparent border-white/5 text-[#71717a] hover:text-[#a1a1aa]'
        "
        @click="showLabels = !showLabels"
      >
        <component :is="showLabels ? CheckCircleIcon : TagIcon" class="w-4 h-4" />
        Метки
      </button>
    </div>

    <div class="py-4 relative min-h-[550px] w-full flex-1 flex items-center justify-center">
      <template v-if="loading">
        <div
          class="absolute inset-0 flex items-center justify-center bg-[#18181b]/50 z-20 backdrop-blur-[2px]"
        >
          <div
            class="w-8 h-8 border-2 border-[#ff6b00] border-t-transparent rounded-full animate-spin"
          />
        </div>
      </template>
      <v-chart
        ref="chartRef"
        :option="chartOption"
        autoresize
        class="w-full h-full min-h-[550px]"
      />
    </div>
  </div>
</template>
