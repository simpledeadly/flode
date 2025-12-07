<script setup lang="ts">
import { useTimeFormatter } from '@/composables/useTimeFormatter'

defineProps<{
  data: Array<{ name: string; value: number; category?: string }>
}>()

const { formatTime } = useTimeFormatter()

// Функция для получения цвета категории (простой хеш или логика)
const getCategoryColor = (cat: string) => {
  if (cat === 'Dev') return 'bg-blue-500'
  if (cat === 'Web') return 'bg-orange-500'
  if (cat === 'Social') return 'bg-purple-500'
  return 'bg-gray-500'
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
    <div
      v-for="(item, index) in data"
      :key="item.name"
      class="bg-[#18181b] border border-white/5 hover:border-[#ff6b00]/30 rounded-xl p-4 transition-all hover:-translate-y-1 hover:shadow-lg group"
    >
      <div class="flex justify-between items-start mb-2">
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono text-[#52525b] group-hover:text-[#ff6b00]"
            >#{{ index + 1 }}</span
          >
          <div class="h-2 w-2 rounded-full" :class="getCategoryColor(item.category || '')"></div>
        </div>
        <span
          class="text-xs text-[#71717a] bg-[#27272a] px-2 py-0.5 rounded text-right truncate max-w-[100px]"
        >
          {{ item.category || 'Other' }}
        </span>
      </div>

      <div class="font-medium text-[#e4e4e7] truncate mb-1" :title="item.name">
        {{ item.name }}
      </div>

      <div class="text-2xl font-bold text-white tracking-tight">
        {{ formatTime(item.value) }}
      </div>
    </div>
  </div>
</template>
