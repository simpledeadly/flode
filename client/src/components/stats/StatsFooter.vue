<!-- components/stats/StatsFooter.vue -->
<script setup lang="ts">
import { PaperAirplaneIcon } from '@heroicons/vue/24/solid'
import BaseButton from '@/components/BaseButton.vue'

defineProps<{
  loading: boolean
}>()

const emit = defineEmits(['send-report'])
</script>

<template>
  <div class="flex justify-between items-center w-full">
    <div
      class="flex items-center gap-2 text-[10px] text-[#52525b] font-mono uppercase tracking-wider"
    >
      <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      Live Sync
    </div>
    <BaseButton
      variant="primary"
      :loading="loading"
      :icon="PaperAirplaneIcon"
      @click="emit('send-report')"
    >
      Отправить отчет
    </BaseButton>
  </div>
</template>
