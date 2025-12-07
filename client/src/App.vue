<script setup lang="ts">
import StatsDashboard from '@/components/stats/StatsDashboard.vue'
</script>

<template>
  <div
    class="min-h-screen bg-[#09090b] text-[#e4e4e7] pb-10 font-sans selection:bg-[#ff6b00] selection:text-white flex flex-col"
  >
    <!-- max-w-[1920px] ограничивал нас. Ставим max-w-full, но с отступами -->
    <main class="w-full h-full flex-1 flex flex-col px-4 md:px-8 pt-6">
      <StatsDashboard />
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
  background-color: #09090b;
  margin: 0;
  overflow-x: hidden; /* На всякий случай */
}

/* Кастомный скроллбар для кибер-вида */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #09090b;
}
::-webkit-scrollbar-thumb {
  background: #27272a;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #3f3f46;
}
</style>
