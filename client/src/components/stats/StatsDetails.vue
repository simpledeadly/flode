<!-- components/stats/StatsDetails.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { ListBulletIcon, ChevronDownIcon } from '@heroicons/vue/24/solid'
import { useTimeFormatter } from '@/composables/useTimeFormatter'

const { formatTime } = useTimeFormatter()

defineProps({
  data: {
    type: Array as () => Array<{ name: string, value: number }>,
    required: true
  }
})

const showDetails = ref(false)
</script>

<template>
  <div class="px-2 pb-2">
    <div
      class="flex items-center gap-3 cursor-pointer p-4 text-sm font-medium text-[#a1a1aa] hover:text-white transition-all rounded-xl hover:bg-white/5 select-none active:scale-[0.99] duration-150"
      @click="showDetails = !showDetails"
    >
      <ListBulletIcon class="w-5 h-5" />
      <span>Детальная статистика</span>
      <ChevronDownIcon
        class="ml-auto w-5 h-5 transition-transform duration-300"
        :class="{ 'rotate-180': showDetails }"
      />
    </div>

    <Transition
      enter-active-class="transition-[max-height] duration-300 ease-in-out overflow-hidden"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-[500px] opacity-100"
      leave-active-class="transition-[max-height] duration-300 ease-in-out overflow-hidden"
      leave-from-class="max-h-[500px] opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div
        v-if="showDetails"
        class="px-2 pb-4"
      >
        <div class="mt-2 pl-2 pr-2 overflow-y-auto border-t border-white/5 pt-2 space-y-1">
          <div
            v-for="(item, index) in data"
            :key="item.name"
            class="flex justify-between py-3 px-3 rounded-lg text-sm transition-colors hover:bg-white/5 group border border-transparent hover:border-white/5"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex items-center justify-center w-6 h-6 rounded-md bg-[#27272a] text-[#71717a] text-xs font-mono group-hover:text-white transition-colors"
              >
                {{ index + 1 }}
              </div>
              <span class="text-[#e4e4e7] font-medium">{{ item.name }}</span>
            </div>
            <span
              class="font-mono text-[#71717a] group-hover:text-[#ff6b00] transition-colors font-medium"
            >
              {{ formatTime(item.value) }}
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
