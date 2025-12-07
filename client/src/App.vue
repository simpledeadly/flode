<script setup lang="ts">
import StatsDashboard from '@/components/stats/StatsDashboard.vue'
</script>

<template>
  <div
    class="min-h-screen bg-[#09090b] text-[#e4e4e7] pb-10 font-sans selection:bg-[#ff6b00] selection:text-white flex flex-col"
  >
    <!-- Подключаем шрифт через CSS, а не через тег Link, так надежнее в Vue SPA -->
    <main class="w-full max-w-[1920px] mx-auto mt-6 px-6 flex-1 flex flex-col">
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
}
</style>
