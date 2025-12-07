<script setup lang="ts">
import { useTimeFormatter } from '@/composables/useTimeFormatter'

defineProps<{ data: any[] }>()
const { formatTime } = useTimeFormatter()

const getBarWidth = (val: number, max: number) => {
  return Math.max(5, (val / max) * 100) + '%'
}
</script>

<template>
  <div class="bg-[#18181b] rounded-2xl border border-white/5 overflow-hidden">
    <table class="w-full border-collapse text-left text-sm">
      <thead class="bg-[#27272a]/50 text-[#71717a] text-xs uppercase font-semibold">
        <tr>
          <th class="py-3 px-6 font-medium">Rank</th>
          <th class="py-3 px-6 font-medium">App / Category</th>
          <th class="py-3 px-6 font-medium w-1/3">Activity Bar</th>
          <th class="py-3 px-6 font-medium text-right">Time</th>
          <th class="py-3 px-6 font-medium text-right">%</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5">
        <tr
          v-for="(item, idx) in data.slice(0, 10)"
          :key="item.name"
          class="group hover:bg-white/[0.02] transition-colors"
        >
          <td class="py-3 px-6 font-mono text-[#52525b] text-xs">
            #{{ idx + 1 < 10 ? '0' + (idx + 1) : idx + 1 }}
          </td>

          <td class="py-3 px-6">
            <div class="font-medium text-[#e4e4e7]">{{ item.name }}</div>
            <div class="text-xs text-[#71717a]">{{ item.category || 'Other' }}</div>
          </td>

          <td class="py-3 px-6">
            <div class="h-1.5 w-full bg-[#27272a] rounded-full overflow-hidden">
              <div
                class="h-full bg-[#ff6b00] rounded-full group-hover:brightness-110 transition-all duration-500"
                :style="{ width: getBarWidth(item.value, data[0]?.value || 1) }"
              ></div>
            </div>
          </td>

          <td class="py-3 px-6 text-right font-mono font-medium text-[#e4e4e7]">
            {{ formatTime(item.value) }}
          </td>
          <td class="py-3 px-6 text-right text-xs text-[#71717a]">
            {{ ((item.value / data.reduce((a: any, b: any) => a + b.value, 0)) * 100).toFixed(1) }}%
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
