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
import { GlobeAltIcon, CommandLineIcon } from '@heroicons/vue/24/solid' // Иконки

const store = useStatsStore()
const { formatTime } = useTimeFormatter()

const selectedRange = ref({ start: startOfDay(new Date()), end: new Date() })
// Новый переключатель: 'apps' или 'web'
const dataSource = ref<'apps' | 'web'>('apps')
// Переключатель группировки (оставим для apps, для веба он не нужен)
const groupMode = ref<'all' | 'category'>('all')

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

// Главные данные для отображения
const displayData = computed(() => {
  // 1. Если выбран WEB - показываем сайты
  if (dataSource.value === 'web') {
    return store.webStats || []
  }

  // 2. Если выбраны APPS
  const raw = store.stats || []
  if (groupMode.value === 'category') {
    // Группировка по категориям
    const groups: Record<string, number> = {}
    raw.forEach((item) => {
      const cat = item.category || '📦 Other'
      groups[cat] = (groups[cat] || 0) + item.value
    })
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value, category: name }))
      .sort((a, b) => b.value - a.value)
  }
  return raw
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
    <!-- Передаем v-model-mode="groupMode" если нужно, но у нас теперь dataSource главнее -->
    <StatsToolbar
      v-model:model-value-range="selectedRange"
      model-value-mode="apps"
      :total-time="totalTime"
      :loading="store.loading"
    />

    <div class="flex-1 p-4 md:p-6 flex flex-col gap-6">
      <!-- ВЕРХНИЙ РЯД -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[500px]">
        <!-- ГРАФИК -->
        <div class="lg:col-span-8 2xl:col-span-9 h-full flex flex-col relative">
          <!-- ПЕРЕКЛЮЧАТЕЛЬ ИСТОЧНИКА (APPS / WEB) -->
          <!-- Плавающий переключатель внутри зоны графика или над ним -->
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

        <!-- ПРАВАЯ КОЛОНКА -->
        <div class="lg:col-span-4 2xl:col-span-3 flex flex-col gap-6 h-full">
          <div style="flex: 3" class="min-h-0">
            <StatsHeatmap :data="store.hourly" />
          </div>
          <div
            style="flex: 2"
            class="min-h-0 bg-[#18181b] border border-white/5 rounded-2xl p-4 relative overflow-hidden flex flex-col justify-center"
          >
            <div class="z-10 relative px-2">
              <div class="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">
                Productivity Score
              </div>
              <div class="text-4xl font-bold text-white tracking-tighter">
                {{ store.efficiency }}%
              </div>
            </div>
            <div class="absolute right-0 bottom-0 opacity-20 translate-y-2 translate-x-2">
              <svg width="140" height="70" viewBox="0 0 120 60" fill="none">
                <path
                  d="M0 60 L40 40 L80 50 L120 10 V60 H0 Z"
                  :fill="store.efficiency > 50 ? '#a855f7' : '#ef4444'"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- ТАБЛИЦА -->
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
