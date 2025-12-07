<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { SankeyChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'

use([CanvasRenderer, SankeyChart, TooltipComponent])

const props = defineProps<{
  data: {
    nodes: Array<{ name: string }>
    links: Array<{ source: string; target: string; value: number }>
  } | null
}>()

const option = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    triggerOn: 'mousemove',
    backgroundColor: 'rgba(9, 9, 11, 0.9)',
    borderColor: '#3f3f46',
    textStyle: { color: '#fff' },
  },
  series: [
    {
      type: 'sankey',
      top: '5%',
      bottom: '5%',
      left: '5%',
      right: '15%',
      emphasis: { focus: 'adjacency' },
      lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.6 },
      label: { color: '#e4e4e7', fontFamily: 'Inter', fontSize: 12 },
      data: props.data?.nodes || [],
      links: props.data?.links || [],
    },
  ],
}))
</script>

<template>
  <div class="bg-[#18181b] rounded-2xl border border-white/5 h-full p-4 flex flex-col">
    <h3 class="text-xs font-bold text-[#52525b] uppercase tracking-widest pl-2 mb-2">
      Workflow & Distractions
    </h3>
    <div
      v-if="!data || data.nodes.length < 2"
      class="flex-1 flex items-center justify-center text-sm text-[#52525b]"
    >
      Not enough data to show flows
    </div>
    <v-chart v-else :option="option" autoresize class="flex-1" />
  </div>
</template>
