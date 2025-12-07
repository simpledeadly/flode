<script setup lang="ts">
import PeriodPicker from '@/components/PeriodPicker.vue'
import BaseButton from '@/components/BaseButton.vue'
import { Squares2X2Icon, ChartPieIcon } from '@heroicons/vue/24/solid'

interface DateRange {
  start: Date
  end: Date
}

defineProps<{
  totalTime: string
  modelValueRange: DateRange
  modelValueMode: 'apps' | 'categories'
  loading: boolean
}>()

const emit = defineEmits(['update:modelValueRange', 'update:modelValueMode'])
</script>

<template>
  <div
    class="flex flex-col md:flex-row items-center justify-between gap-4 py-4 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8"
  >
    <!-- Лого и Тотал (Слева) -->
    <div class="flex items-baseline gap-6">
      <h1 class="text-xl font-bold tracking-tighter text-white">FLODE</h1>
      <div class="flex items-baseline gap-3">
        <span class="text-3xl font-mono font-bold text-[#ff6b00] leading-none">{{
          totalTime
        }}</span>
        <span class="text-xs text-[#52525b] uppercase font-bold tracking-wider"
          >Total Activity</span
        >
      </div>
    </div>

    <!-- Центр: Календарь -->
    <div class="flex-1 flex justify-center">
      <PeriodPicker
        :model-value="modelValueRange"
        @update:model-value="emit('update:modelValueRange', $event)"
      />
    </div>

    <!-- Справа: Переключатели -->
    <div class="flex items-center gap-2 bg-[#18181b] p-1 rounded-lg border border-white/10">
      <BaseButton
        v-for="m in ['apps', 'categories']"
        :key="m"
        @click="emit('update:modelValueMode', m as any)"
        class="px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2"
        :class="
          modelValueMode === m
            ? 'bg-[#27272a] text-white shadow-sm'
            : 'text-[#71717a] hover:text-[#a1a1aa]'
        "
      >
        <component :is="m === 'apps' ? Squares2X2Icon : ChartPieIcon" class="w-3.5 h-3.5" />
        {{ m === 'apps' ? 'Apps' : 'Cats' }}
      </BaseButton>
    </div>
  </div>
</template>
