<script setup lang="ts">
import { ref, computed } from 'vue'
import { DatePicker } from 'v-calendar'
import {
  format,
  isSameDay,
  sub,
  startOfDay,
  endOfDay,
  startOfYesterday,
  endOfYesterday,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import 'v-calendar/style.css'
import { CalendarDaysIcon, ChevronDownIcon } from '@heroicons/vue/24/solid'

// Типизируем props
interface DateRange {
  start: Date
  end: Date
}
const props = defineProps<{ modelValue: DateRange }>()
const emit = defineEmits(['update:modelValue'])
const isOpen = ref(false)

const ranges = [
  { label: 'Сегодня', value: 'today' },
  { label: 'Вчера', value: 'yesterday' },
  { label: 'Неделя', value: 'week' },
  { label: 'Месяц', value: 'month' },
]

function selectRange(value: string) {
  let start = new Date()
  let end = new Date()

  switch (value) {
    case 'today':
      start = startOfDay(new Date())
      break
    case 'yesterday':
      start = startOfYesterday()
      end = endOfYesterday()
      break
    case 'week':
      start = startOfDay(sub(new Date(), { days: 7 }))
      end = endOfDay(new Date())
      break
    case 'month':
      start = startOfDay(sub(new Date(), { days: 30 }))
      end = endOfDay(new Date())
      break
  }
  emit('update:modelValue', { start, end })
  isOpen.value = false
}

const label = computed(() => {
  const { start, end } = props.modelValue
  if (!start || !end) return 'Выберите период'
  const timeFormat = 'HH:mm'
  const dateFormat = 'd MMM'

  // Добавляем проверку на валидность дат (на всякий случай)
  if (!(start instanceof Date) || !(end instanceof Date)) return 'Неверная дата'

  if (isSameDay(start, end)) {
    return `${format(start, dateFormat, { locale: ru })}, ${format(start, timeFormat)} — ${format(end, timeFormat)}`
  }
  return `${format(start, dateFormat, { locale: ru })}, ${format(start, timeFormat)} — ${format(end, dateFormat, { locale: ru })}, ${format(end, timeFormat)}`
})

function onDateUpdate(value: any) {
  if (value?.start && value?.end) {
    const start = startOfDay(value.start)
    const end = endOfDay(value.end)
    emit('update:modelValue', { start, end })
  }
}
</script>

<template>
  <div class="relative w-full md:w-auto">
    <button
      class="group flex items-center justify-between w-full md:w-[320px] px-3 py-2 bg-[#18181b] hover:bg-[#27272a] text-[#e4e4e7] rounded-lg border border-white/5 hover:border-white/10 transition-all duration-100 active:scale-[0.98] cursor-pointer shadow-sm select-none"
      @click="isOpen = !isOpen"
    >
      <div class="flex items-center gap-3 text-sm">
        <CalendarDaysIcon
          class="w-5 h-5 text-[#71717a] group-hover:text-[#ff6b00] transition-colors"
        />
        <span class="font-medium">{{ label }}</span>
      </div>
      <ChevronDownIcon
        class="w-4 h-4 text-[#52525b] transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0 -translate-y-1"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 -translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute top-full left-0 mt-2 z-50 bg-[#18181b] rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col sm:flex-row overflow-hidden min-w-[320px]"
      >
        <div
          class="flex flex-row sm:flex-col p-1.5 gap-1 border-b sm:border-b-0 sm:border-r border-white/5 bg-[#27272a]/30"
        >
          <button
            v-for="r in ranges"
            :key="r.value"
            class="px-3 py-2 text-xs font-medium text-left rounded-lg transition-all duration-150 active:scale-95 select-none text-[#a1a1aa] hover:bg-white/5 hover:text-white"
            @click="selectRange(r.value)"
          >
            {{ r.label }}
          </button>
        </div>
        <div class="p-3">
          <DatePicker
            :model-value="modelValue"
            mode="date"
            is-range
            is-dark
            transparent
            borderless
            :is24hr="true"
            @update:model-value="onDateUpdate"
          />
        </div>
      </div>
    </Transition>
    <div v-if="isOpen" class="fixed inset-0 z-40 bg-transparent" @click="isOpen = false" />
  </div>
</template>
