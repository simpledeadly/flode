<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { startOfDay } from 'date-fns'
import { useStatsStore } from '@/stores/stats'
import { useTimeFormatter } from '@/composables/useTimeFormatter'
import { GlobeAltIcon, CommandLineIcon } from '@heroicons/vue/24/solid'

// Импортируем наши компоненты
import StatsToolbar from './StatsToolbar.vue'
import StatsMainChart from './StatsMainChart.vue'
import StatsSankey from './StatsSankey.vue'
import StatsTable from './StatsTable.vue'

const store = useStatsStore()
const { formatTime } = useTimeFormatter()

// Состояние UI
const selectedRange = ref({ start: startOfDay(new Date()), end: new Date() })
const dataSource = ref<'apps' | 'web'>('apps')
const viewMode = ref<'apps' | 'categories'>('apps')

// Загрузка данных при смене даты
watch(
  selectedRange,
  (newRange) => {
    if (newRange.start && newRange.end) store.fetchStats(newRange.start, newRange.end)
  },
  { immediate: true, deep: true },
)

const totalTime = computed(() => {
  const source = dataSource.value === 'apps' ? store.stats : store.webStats
  return formatTime((source || []).reduce((acc, i) => acc + i.value, 0))
})

// Данные для Sankey
const sankeyData = computed(() => {
  return dataSource.value === 'apps' ? store.sankeyApp : store.sankeyWeb
})

// Данные для таблицы и графика распределения
const displayData = computed(() => {
  const rawData = dataSource.value === 'apps' ? store.stats : store.webStats
  if (viewMode.value === 'categories') {
    const catMap: Record<string, any> = {}
    ;(rawData || []).forEach((item) => {
      const cat = item.category || 'Other'
      if (!catMap[cat]) catMap[cat] = { name: cat, value: 0, category: cat }
      catMap[cat].value += item.value
    })
    return Object.values(catMap).sort((a, b) => b.value - a.value)
  }
  return rawData || []
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-[#09090b] text-white">
    <StatsToolbar
      v-model:model-value-range="selectedRange"
      v-model:model-value-mode="viewMode"
      :total-time="totalTime"
      :loading="store.loading"
    />

    <main class="flex-1 p-4 md:p-6 grid grid-cols-3 gap-6">
      <!-- ЛЕВАЯ КОЛОНКА (2/3) - ГЛАВНЫЕ ДАННЫЕ -->
      <div class="col-span-3 lg:col-span-2 flex flex-col gap-6">
        <div class="h-[350px]">
          <StatsSankey :data="sankeyData" />
        </div>
        <div class="flex-1 min-h-[300px]">
          <StatsMainChart :data="displayData" :web-data="store.webStats" :loading="store.loading" />
        </div>
      </div>

      <!-- ПРАВАЯ КОЛОНКА (1/3) - ДЕТАЛИ -->
      <div class="col-span-3 lg:col-span-1 flex flex-col">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="text-xs font-bold text-[#52525b] uppercase tracking-widest">Details</h3>
          <div class="flex bg-[#18181b] border border-white/10 rounded-lg p-1">
            <button
              @click="dataSource = 'apps'"
              class="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all"
              :class="
                dataSource === 'apps'
                  ? 'bg-[#ff6b00] text-white'
                  : 'text-[#71717a] hover:text-white'
              "
            >
              <CommandLineIcon class="w-4 h-4" /> Apps
            </button>
            <button
              @click="dataSource = 'web'"
              class="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all"
              :class="
                dataSource === 'web' ? 'bg-[#3b82f6] text-white' : 'text-[#71717a] hover:text-white'
              "
            >
              <GlobeAltIcon class="w-4 h-4" /> Web
            </button>
          </div>
        </div>
        <div class="flex-1 bg-[#18181b] rounded-2xl border border-white/5 overflow-y-auto">
          <StatsTable :data="displayData" />
        </div>
      </div>
    </main>
  </div>
</template>
