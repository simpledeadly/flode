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
import BaseButton from '@/components/BaseButton.vue'

const store = useStatsStore()
const { formatTime } = useTimeFormatter()

// Состояние фильтров
const selectedRange = ref({ start: startOfDay(new Date()), end: new Date() })
const dataSource = ref<'apps' | 'web'>('apps') // Источник: Приложения или Сайты
const viewMode = ref<'apps' | 'categories'>('apps') // Режим: Список или Категории (Apps/Cats)
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

// Главная логика отображения данных
const displayData = computed(() => {
  // 1. Выбираем источник (Apps или Web)
  const rawData = dataSource.value === 'web' ? store.webStats || [] : store.stats || []

  // 2. Если включен режим "Cats", группируем по категориям
  if (viewMode.value === 'categories') {
    const catMap: Record<string, number> = {}

    rawData.forEach((item) => {
      const cat = item.category || 'Other'
      if (!catMap[cat]) catMap[cat] = 0
      catMap[cat] += item.value
    })

    // Превращаем обратно в массив для графиков
    return Object.entries(catMap)
      .map(([name, value]) => ({
        name, // Имя теперь = Категория (напр. "Work", "Social")
        value,
        category: name, // Для раскраски графиков
      }))
      .sort((a, b) => b.value - a.value)
  }

  // Иначе возвращаем как есть (список приложений/сайтов)
  return rawData
})

const sendReport = async () => {
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
    <!-- ТУЛБАР: Исправлен v-model для кнопок Apps/Cats -->
    <StatsToolbar
      v-model:model-value-range="selectedRange"
      v-model:model-value-mode="viewMode"
      :total-time="totalTime"
      :loading="store.loading"
    />

    <div class="flex-1 p-4 md:p-6 flex flex-col gap-6">
      <!-- ВЕРХНИЙ РЯД -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[500px]">
        <!-- ГРАФИК (ЛЕВО) -->
        <div class="lg:col-span-8 2xl:col-span-9 h-full flex flex-col relative">
          <!-- Переключатель Applications / Web Sites -->
          <div
            class="absolute top-6 left-6 z-20 flex bg-[#09090b]/80 backdrop-blur-md border border-white/10 rounded-lg p-1"
          >
            <BaseButton
              @click="dataSource = 'apps'"
              variant="secondary"
              class="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all"
              :class="
                dataSource === 'apps'
                  ? 'bg-[#ff6b00] text-white'
                  : 'text-[#71717a] hover:text-white'
              "
            >
              Applications
            </BaseButton>
            <BaseButton
              @click="dataSource = 'web'"
              variant="secondary"
              class="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all"
              :class="
                dataSource === 'web' ? 'bg-[#3b82f6] text-white' : 'text-[#71717a] hover:text-white'
              "
            >
              Web Sites
            </BaseButton>
          </div>

          <StatsMainChart
            ref="mainChartRef"
            :data="displayData"
            :web-data="store.webStats"
            :loading="store.loading"
          />
        </div>

        <!-- РИТМ ДНЯ (ПРАВО) -->
        <div class="lg:col-span-4 2xl:col-span-3 h-full">
          <StatsHeatmap :data="store.hourly" />
        </div>
      </div>

      <!-- ТАБЛИЦА (НИЗ) -->
      <div class="pb-10">
        <h3 class="text-xs font-bold text-[#52525b] uppercase tracking-widest mb-4 px-1">
          {{
            viewMode === 'categories'
              ? 'Categories Summary'
              : dataSource === 'web'
                ? 'Web History'
                : 'Application Log'
          }}
        </h3>
        <StatsTable :data="displayData" />
      </div>

      <StatsFooter @send-report="sendReport" :loading="false" />
    </div>
  </div>
</template>
