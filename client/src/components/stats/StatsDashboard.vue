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

const store = useStatsStore()
const { formatTime } = useTimeFormatter()

const selectedRange = ref({ start: startOfDay(new Date()), end: new Date() })
const mode = ref<'apps' | 'categories'>('apps')
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

const currentData = computed(() => {
  const raw = store.stats || []
  if (mode.value === 'apps') return raw
  const groups: Record<string, number> = {}
  raw.forEach((item) => {
    const cat = item.category || '📦 Other'
    groups[cat] = (groups[cat] || 0) + item.value
  })
  return Object.entries(groups)
    .map(([name, value]) => ({ name, value, category: name }))
    .sort((a, b) => b.value - a.value)
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
      v-model:model-value-mode="mode"
      :total-time="totalTime"
      :loading="store.loading"
    />

    <div class="flex-1 p-4 md:p-6 flex flex-col gap-6">
      <!-- ВЕРХНИЙ РЯД: График + Heatmap -->
      <!-- Задаем фиксированную высоту 450px, чтобы интерфейс был стабильным -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[450px]">
        <!-- Главный график (8 колонок) -->
        <div class="lg:col-span-8 2xl:col-span-9 h-full">
          <StatsMainChart ref="mainChartRef" :data="currentData" :loading="store.loading" />
        </div>

        <!-- Правая колонка (4 колонки): Heatmap + Заглушка -->
        <div class="lg:col-span-4 2xl:col-span-3 flex flex-col gap-6 h-full">
          <!-- Heatmap (60% высоты) -->
          <div style="flex: 3" class="min-h-0">
            <StatsHeatmap :data="store.hourly" />
          </div>

          <!-- Productivity Trend / Efficiency (40% высоты) -->
          <div
            style="flex: 2"
            class="min-h-0 bg-[#18181b] border border-white/5 rounded-2xl p-4 relative overflow-hidden flex flex-col justify-center"
          >
            <div class="z-10 relative px-2">
              <div class="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">
                Productivity Score
              </div>

              <!-- Реальное значение -->
              <div class="text-4xl font-bold text-white tracking-tighter">
                {{ store.efficiency }}%
              </div>

              <!-- Динамический текст -->
              <div class="text-[10px] text-[#71717a] mt-2">
                {{
                  store.efficiency > 70
                    ? 'Отличная работа! 🔥'
                    : store.efficiency > 40
                      ? 'Неплохо, но можно лучше'
                      : 'Слишком много отвлекаешься 👀'
                }}
              </div>
            </div>

            <!-- Фон-график -->
            <div class="absolute right-0 bottom-0 opacity-20 translate-y-2 translate-x-2">
              <svg width="140" height="70" viewBox="0 0 120 60" fill="none">
                <!-- Меняем цвет графика в зависимости от эффективности -->
                <path
                  d="M0 60 L40 40 L80 50 L120 10 V60 H0 Z"
                  :fill="store.efficiency > 50 ? '#a855f7' : '#ef4444'"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- НИЖНИЙ РЯД: Таблица -->
      <div class="pb-10">
        <h3 class="text-xs font-bold text-[#52525b] uppercase tracking-widest mb-4 px-1">
          Detailed Log
        </h3>
        <StatsTable :data="currentData" />
      </div>

      <!-- Footer -->
      <StatsFooter @send-report="sendReport" :loading="false" />
    </div>
  </div>
</template>
