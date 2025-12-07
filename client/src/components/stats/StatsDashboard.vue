<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { startOfDay } from 'date-fns'
import { useStatsStore } from '@/stores/stats'
import { useTimeFormatter } from '@/composables/useTimeFormatter'

import StatsToolbar from '@/components/stats/StatsToolbar.vue'
import StatsMainChart from '@/components/stats/StatsMainChart.vue'
import StatsHeatmap from '@/components/stats/StatsHeatmap.vue'
import StatsTable from '@/components/stats/StatsTable.vue'
import StatsFooter from '@/components/stats/StatsFooter.vue'
import { GlobeAltIcon, CommandLineIcon } from '@heroicons/vue/24/solid'

const store = useStatsStore()
const { formatTime } = useTimeFormatter()

const selectedRange = ref({ start: startOfDay(new Date()), end: new Date() })
const dataSource = ref<'apps' | 'web'>('apps')
const mainChartRef = ref<any>(null)

watch(
  selectedRange,
  (newRange) => {
    if (newRange.start && newRange.end) store.fetchStats(newRange.start, newRange.end)
  },
  { immediate: true, deep: true },
)

const totalTime = computed(() => {
  if (!store.stats) return '0м'
  return formatTime(store.stats.reduce((acc, i) => acc + i.value, 0))
})

const displayData = computed(() => {
  return dataSource.value === 'web' ? store.webStats || [] : store.stats || []
})

const sendReport = async () => {
  // Логика отправки...
  if (!mainChartRef.value?.chartRef) return
  const base64 = mainChartRef.value.chartRef.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#18181b',
  })
  await store.sendReport(base64)
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-[#09090b]">
    <StatsToolbar
      v-model:model-value-range="selectedRange"
      model-value-mode="apps"
      :total-time="totalTime"
      :loading="store.loading"
    />

    <div class="flex-1 p-4 md:p-6 flex flex-col gap-6">
      <!-- ВЕРХНИЙ РЯД -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[500px]">
        <!-- ГРАФИК (ЛЕВО) -->
        <div class="lg:col-span-8 2xl:col-span-9 h-full flex flex-col relative">
          <div
            class="absolute top-6 left-6 z-20 flex bg-[#09090b]/80 backdrop-blur-md border border-white/10 rounded-lg p-1"
          >
            <button
              @click="dataSource = 'apps'"
              class="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all"
              :class="
                dataSource === 'apps'
                  ? 'bg-[#ff6b00] text-white'
                  : 'text-[#71717a] hover:text-white'
              "
            >
              <CommandLineIcon class="w-4 h-4" />
              Applications
            </button>
            <button
              @click="dataSource = 'web'"
              class="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all"
              :class="
                dataSource === 'web' ? 'bg-[#3b82f6] text-white' : 'text-[#71717a] hover:text-white'
              "
            >
              <GlobeAltIcon class="w-4 h-4" />
              Web Sites
            </button>
          </div>

          <StatsMainChart
            ref="mainChartRef"
            :data="displayData"
            :web-data="store.webStats"
            :loading="store.loading"
          />
        </div>

        <!-- РИТМ ДНЯ (ПРАВО) - ТЕПЕРЬ НА ВСЮ ВЫСОТУ -->
        <div class="lg:col-span-4 2xl:col-span-3 h-full">
          <StatsHeatmap :data="store.hourly" />
        </div>
      </div>

      <!-- ТАБЛИЦА (НИЗ) -->
      <div class="pb-10">
        <h3 class="text-xs font-bold text-[#52525b] uppercase tracking-widest mb-4 px-1">
          {{ dataSource === 'web' ? 'Web History' : 'Application Log' }}
        </h3>
        <StatsTable :data="displayData" />
      </div>

      <StatsFooter @send-report="sendReport" :loading="false" />
    </div>
  </div>
</template>
