<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { startOfDay } from 'date-fns'
import { useStatsStore } from '@/stores/stats'
import { useTimeFormatter } from '@/composables/useTimeFormatter'
import { GlobeAltIcon, CommandLineIcon } from '@heroicons/vue/24/solid'

import StatsToolbar from './StatsToolbar.vue'
import StatsMainChart from './StatsMainChart.vue'
import StatsSankey from './StatsSankey.vue'
import StatsTable from './StatsTable.vue'
import DailyRhythm from './DailyRhythm.vue'

const store = useStatsStore()
const { formatTime } = useTimeFormatter()

const selectedRange = ref({ start: startOfDay(new Date()), end: new Date() })
const dataSource = ref<'apps' | 'web'>('apps')
const viewMode = ref<'apps' | 'categories'>('apps')
const selectedFilter = ref<string | null>(null)

watch(
  selectedRange,
  (newRange) => {
    if (newRange.start && newRange.end) store.fetchStats(newRange.start, newRange.end)
  },
  { immediate: true, deep: true },
)

const totalTime = computed(() => {
  const source = (dataSource.value === 'apps' ? store.stats : store.webStats) || []
  return formatTime(source.reduce((acc, i) => acc + (i.value || 0), 0))
})

const heatmapData = computed(() => {
  return dataSource.value === 'apps' ? store.heatmapApp : store.heatmapWeb
})

const sankeyData = computed(() => {
  return dataSource.value === 'apps' ? store.sankeyApp : store.sankeyWeb
})

function handleItemSelect(itemName: string) {
  // Если нажать на тот же элемент еще раз - сбрасываем фильтр
  if (selectedFilter.value === itemName) {
    selectedFilter.value = null
  } else {
    selectedFilter.value = itemName
  }
}

const displayData = computed(() => {
  // Шаг 1: Получаем сырые данные
  let sourceData = (dataSource.value === 'apps' ? store.stats : store.webStats) || []

  // Шаг 2: Группируем по категориям, если нужно
  if (viewMode.value === 'categories') {
    const catMap: Record<string, any> = {}
    sourceData.forEach((item) => {
      const cat = item.category || 'Other'
      if (!catMap[cat]) catMap[cat] = { name: cat, value: 0, category: cat }
      catMap[cat].value += item.value || 0
    })
    sourceData = Object.values(catMap).sort((a, b) => b.value - a.value)
  }

  // 🔥 Шаг 3: ФИЛЬТРУЕМ, если фильтр активен
  if (selectedFilter.value) {
    return sourceData.filter(
      (item) => item.name === selectedFilter.value || item.category === selectedFilter.value,
    )
  }

  return sourceData
})
</script>

<template>
  <div class="flex flex-col h-screen bg-[#09090b] text-white">
    <StatsToolbar
      v-model:model-value-range="selectedRange"
      v-model:model-value-mode="viewMode"
      :total-time="totalTime"
      :loading="store.loading"
    />

    <!-- НОВАЯ СЕТКА КОКПИТА: 2 КОЛОНКИ -->
    <main class="flex-1 grid grid-cols-3 xl:grid-cols-5 gap-px bg-white/5">
      <!-- ЛЕВАЯ КОЛОНКА (Главная) -->
      <div class="col-span-3 xl:col-span-3 bg-[#09090b] flex flex-col">
        <!-- Верхний блок: Sankey -->
        <div class="h-[45%] p-4">
          <StatsSankey :data="sankeyData" @item-selected="handleItemSelect" />
        </div>

        <!-- Разделитель -->
        <div class="h-px bg-white/5 mx-4"></div>

        <!-- Нижний блок: Daily Rhythm -->
        <div class="flex-1 p-4 min-h-0">
          <DailyRhythm
            :heatmap="heatmapData"
            :hourly="store.hourly"
            :fragmentation="store.fragmentation"
            :intensity="store.intensity"
            @item-selected="handleItemSelect"
          />
        </div>
      </div>

      <!-- ПРАВАЯ КОЛОНКА (Второстепенная) -->
      <div class="col-span-3 xl:col-span-2 bg-[#09090b] flex flex-col">
        <!-- Верхний блок: Распределение -->
        <div class="h-[45%] p-4">
          <StatsMainChart
            :data="displayData"
            :web-data="store.webStats"
            :loading="store.loading"
            @item-selected="handleItemSelect"
          />
        </div>

        <!-- Разделитель -->
        <div class="h-px bg-white/5 mx-4"></div>

        <!-- Нижний блок: Таблица с деталями -->
        <div class="flex-1 p-4 flex flex-col min-h-0">
          <div class="mb-2 flex items-center justify-between">
            <h3 class="text-xs font-bold text-[#52525b] uppercase tracking-widest">Details</h3>

            <div
              v-if="selectedFilter"
              class="flex items-center gap-2 text-xs bg-[#18181b] border border-white/10 rounded-lg p-1 pr-2"
            >
              <span class="text-gray-400">Filtering by:</span>
              <span class="font-bold text-white">{{ selectedFilter }}</span>
              <button @click="selectedFilter = null" class="ml-1 text-gray-500 hover:text-white">
                &times;
              </button>
            </div>

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
                  dataSource === 'web'
                    ? 'bg-[#3b82f6] text-white'
                    : 'text-[#71717a] hover:text-white'
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
      </div>
    </main>
  </div>
</template>
