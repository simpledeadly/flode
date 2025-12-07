<template>
  <div
    class="bg-[#18181b] rounded-2xl border border-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_4px_20px_-4px_rgba(0,0,0,0.1)] overflow-hidden w-full"
  >
    <div v-if="$slots.header" class="px-6 py-5 border-b border-white/5">
      <slot name="header" />
    </div>
    <div class="p-6">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-6 py-4 bg-[#18181b] border-t border-white/5">
      <slot name="footer" />
    </div>
  </div>
</template>
