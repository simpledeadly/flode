<!-- components/stats/StatsHeader.vue -->
<script setup lang="ts">
import { Squares2X2Icon, ChartPieIcon, BoltIcon } from '@heroicons/vue/24/solid'
import PeriodPicker from '@/components/PeriodPicker.vue'
import BaseButton from '@/components/BaseButton.vue'

// 1. Описываем, что такое "Диапазон дат"
interface DateRange {
  start: Date
  end: Date
}

// 2. Используем этот тип в пропсах вместо object
defineProps<{
  totalTime: string
  appCount: number
  loading: boolean
  modelValueRange: DateRange // <--- БЫЛО: object, СТАЛО: DateRange
  modelValueMode: 'apps' | 'categories'
}>()

const emit = defineEmits(['update:modelValueRange', 'update:modelValueMode'])

// Приводим тип value к DateRange
const onRangeUpdate = (value: any) => {
  emit('update:modelValueRange', value)
}
const onModeUpdate = (value: 'apps' | 'categories') => {
  emit('update:modelValueMode', value)
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="flex justify-between items-start">
      <div>
        <div class="text-[#71717a] text-xs font-bold uppercase tracking-widest mb-2">
          Total Activity
        </div>
        <div
          class="text-6xl font-extrabold text-white tracking-tighter flex items-baseline gap-4 leading-none"
        >
          {{ totalTime }}
          <span
            v-if="!loading && appCount > 0"
            class="text-sm font-bold text-[#ff6b00] bg-[#ff6b00]/10 px-3 py-1 rounded-full border border-[#ff6b00]/20 tracking-normal"
          >
            +{{ appCount }} Apps
          </span>
        </div>
      </div>
      <div
        class="hidden sm:flex w-12 h-12 rounded-2xl bg-[#27272a] border border-white/5 items-center justify-center shadow-lg"
      >
        <BoltIcon class="text-[#ff6b00] w-6 h-6" />
      </div>
    </div>

    <div class="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
      <ClientOnly>
        <!-- Используем v-model через пропсы и события -->
        <PeriodPicker :model-value="modelValueRange" @update:model-value="onRangeUpdate" />
      </ClientOnly>

      <div
        class="grid grid-cols-2 bg-[#27272a]/50 p-1 rounded-xl border border-white/5 w-full md:w-auto"
      >
        <BaseButton
          variant="secondary"
          :active="modelValueMode === 'apps'"
          size="sm"
          :icon="Squares2X2Icon"
          @click="onModeUpdate('apps')"
        >
          Приложения
        </BaseButton>
        <BaseButton
          variant="secondary"
          :active="modelValueMode === 'categories'"
          size="sm"
          :icon="ChartPieIcon"
          @click="onModeUpdate('categories')"
        >
          Категории
        </BaseButton>
      </div>
    </div>
  </div>
</template>
