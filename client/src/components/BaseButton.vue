<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost'
  block?: boolean
  loading?: boolean
  icon?: Component
  active?: boolean
}
withDefaults(defineProps<Props>(), {
  variant: 'primary',
  block: false,
  loading: false,
  active: false,
})
</script>

<template>
  <button
    class="relative group flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ease-out active:scale-95 disabled:opacity-50 disabled:active:scale-100 cursor-pointer select-none"
    :class="[
      variant === 'primary'
        ? 'bg-[#ff6b00] text-white hover:bg-[#ea580c] shadow-[0_0_15px_rgba(255,107,0,0.4)]'
        : '',
      variant === 'secondary'
        ? active
          ? 'bg-[#3f3f46] text-white shadow-md ring-1 ring-white/10'
          : 'bg-transparent text-[#71717a] hover:text-[#e4e4e7] hover:bg-white/5'
        : '',
      variant === 'ghost' ? 'bg-transparent text-[#71717a] hover:text-white hover:bg-white/5' : '',
      block ? 'w-full' : '',
    ]"
    :disabled="loading"
  >
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
      <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    </div>
    <component :is="icon" v-if="icon" class="w-5 h-5 transition-transform group-hover:scale-110" />
    <span :class="{ 'opacity-0': loading }"><slot /></span>
  </button>
</template>
