<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: number[]
}>()

// Безопасный максимум (если данных нет, берем 1, чтобы не делить на 0)
const maxVal = computed(() => {
  if (!props.data || props.data.length === 0) return 1
  return Math.max(...props.data, 1)
})

const getHeight = (val: number) => {
  // Защита от NaN и отрицательных чисел
  const cleanVal = Math.max(0, val || 0)
  const pct = (cleanVal / maxVal.value) * 100
  // Минимальная высота 4px, чтобы пустые часы хоть чуть-чуть намечались (линия низа)
  return Math.max(2, pct) + '%'
}

const getColor = (val: number) => {
  const v = val || 0
  if (v <= 60) return 'bg-[#27272a]' // Меньше минуты - считаем пустым
  const ratio = v / maxVal.value
  if (ratio < 0.3) return 'bg-[#ea580c]/40'
  if (ratio < 0.7) return 'bg-[#ea580c]/80'
  return 'bg-[#ff6b00] shadow-[0_0_12px_rgba(255,107,0,0.5)]'
}
</script>

<template>
  <div
    class="bg-[#18181b] rounded-2xl border border-white/5 p-5 h-full flex flex-col justify-between"
  >
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-sm font-bold text-[#e4e4e7] uppercase tracking-wide flex items-center gap-2">
        <div class="w-2 h-2 bg-[#ff6b00] rounded-full animate-pulse"></div>
        Ритм Дня
      </h3>
    </div>

    <div class="flex-1 flex items-end justify-between gap-1 min-h-[100px]">
      <div v-for="(val, h) in data" :key="h" class="relative flex-1 group h-full flex items-end">
        <!-- Столбик -->
        <div
          class="w-full rounded-t-sm transition-all duration-500 ease-out"
          :class="getColor(val)"
          :style="{ height: getHeight(val) }"
        ></div>

        <!-- Тултип -->
        <div
          class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 border border-white/10 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 shadow-xl"
        >
          <span class="font-bold text-[#ff6b00]">{{ h }}:00</span> —
          {{ Math.round((val || 0) / 60) }} мин
        </div>

        <!-- Метка часа -->
        <div
          v-if="h % 4 === 0"
          class="absolute top-full mt-2 text-[9px] text-[#52525b] left-0 font-mono"
        >
          {{ h < 10 ? '0' + h : h }}
        </div>
      </div>
    </div>
  </div>
</template>
