<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { startOfDay } from 'date-fns'
import { useStatsStore } from '@/stores/stats' // Наш стор
import { useTimeFormatter } from '@/composables/useTimeFormatter'

// Импорты компонентов (заменили ~ на @)
import StatsHeader from '@/components/stats/StatsHeader.vue'
import StatsFooter from '@/components/stats/StatsFooter.vue'
import StatsPieChart from '@/components/stats/StatsPieChart.vue'
import StatsDetails from '@/components/stats/StatsDetails.vue'
import BaseCard from '@/components/BaseCard.vue'

// Инициализация
const store = useStatsStore()
const { formatTime } = useTimeFormatter()

const selectedRange = ref({
  start: startOfDay(new Date()),
  end: new Date(),
})

const mode = ref<'apps' | 'categories'>('apps')
const sending = ref(false)
const pieChartRef = ref<any>(null)

// Следим за изменением даты и загружаем данные
watch(
  selectedRange,
  (newRange) => {
    if (newRange.start && newRange.end) {
      store.fetchStats(newRange.start, newRange.end)
    }
  },
  { immediate: true, deep: true },
) // immediate запустит загрузку при старте

const totalTime = computed(() => {
  if (!store.stats) return '0м'
  const total = store.stats.reduce((acc, i) => acc + i.value, 0)
  return formatTime(total)
})

const currentData = computed(() => {
  const raw = store.stats || []
  if (mode.value === 'apps') return raw

  const groups: Record<string, number> = {}
  raw.forEach((item) => {
    const cat = item.category || '📦 Прочее'
    groups[cat] = (groups[cat] || 0) + item.value
  })
  return Object.entries(groups)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
})

const sendReport = async () => {
  if (!pieChartRef.value?.chartRef) return
  sending.value = true
  try {
    const base64 = pieChartRef.value.chartRef.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#18181b',
    })
    await store.sendReport(base64)
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div>
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform -translate-y-2 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
    >
      <div
        v-if="store.error"
        class="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-2"
      >
        <span>⚠️</span> <span>Ошибка API: {{ store.error }}</span>
      </div>
    </Transition>

    <BaseCard class="flex-1 flex flex-col">
      <template #header>
        <StatsHeader
          v-model:model-value-range="selectedRange"
          v-model:model-value-mode="mode"
          :total-time="totalTime"
          :app-count="currentData.length"
          :loading="store.loading"
        />
      </template>

      <StatsPieChart ref="pieChartRef" :data="currentData" :loading="store.loading" />
      <StatsDetails :data="currentData" />

      <template #footer>
        <StatsFooter :loading="sending" @send-report="sendReport" />
      </template>
    </BaseCard>
  </div>
</template>
