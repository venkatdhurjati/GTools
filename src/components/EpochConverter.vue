<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Clock, Calendar, ArrowRight } from 'lucide-vue-next'

const currentEpoch = ref(Math.floor(Date.now() / 1000))
const inputEpoch = ref(currentEpoch.value.toString())
const inputDate = ref(new Date().toISOString().slice(0, 16))

let interval: number

onMounted(() => {
  interval = window.setInterval(() => {
    currentEpoch.value = Math.floor(Date.now() / 1000)
  }, 1000)
})

onUnmounted(() => {
  clearInterval(interval)
})

const parsedEpochToDate = computed(() => {
  const num = parseInt(inputEpoch.value)
  if (isNaN(num)) return 'Invalid timestamp'
  // Handle milliseconds vs seconds automatically
  const ms = inputEpoch.value.length > 11 ? num : num * 1000
  return new Date(ms).toLocaleString()
})

const parsedDateToEpoch = computed(() => {
  if (!inputDate.value) return ''
  return Math.floor(new Date(inputDate.value).getTime() / 1000).toString()
})
</script>

<template>
  <div class="h-full flex flex-col space-y-6 animate-in fade-in duration-300 overflow-y-auto pr-2">
    <div class="flex items-center gap-2">
      <Clock class="w-5 h-5 text-neon-blue" />
      <h2 class="text-lg font-bold text-white">Epoch & Time Converter</h2>
    </div>

    <div class="glass-panel p-6 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-dark-800 to-dark-900 border-neon-blue/20 border">
      <span class="text-sm text-gray-400 uppercase tracking-widest font-semibold">Current Unix Epoch</span>
      <span class="text-4xl font-mono text-neon-blue font-bold tracking-tight">{{ currentEpoch }}</span>
    </div>

    <div class="grid grid-cols-2 gap-6">
      <!-- Epoch to Date -->
      <div class="space-y-4 glass-panel p-5">
        <h3 class="text-sm font-semibold text-gray-300 flex items-center gap-2"><Clock class="w-4 h-4"/> Epoch to Human Date</h3>
        <input type="text" v-model="inputEpoch" class="input-field font-mono text-center text-lg" placeholder="1708459200" />
        <div class="flex justify-center text-gray-500"><ArrowRight class="w-5 h-5 rotate-90" /></div>
        <div class="bg-dark-900 border border-dark-700 rounded-lg p-3 text-center font-mono text-neon-cyan min-h-[3rem] flex items-center justify-center">
          {{ parsedEpochToDate }}
        </div>
      </div>

      <!-- Date to Epoch -->
      <div class="space-y-4 glass-panel p-5">
        <h3 class="text-sm font-semibold text-gray-300 flex items-center gap-2"><Calendar class="w-4 h-4"/> Human Date to Epoch</h3>
        <input type="datetime-local" v-model="inputDate" class="input-field font-mono text-center text-sm" />
        <div class="flex justify-center text-gray-500"><ArrowRight class="w-5 h-5 rotate-90" /></div>
        <div class="bg-dark-900 border border-dark-700 rounded-lg p-3 text-center font-mono text-neon-purple min-h-[3rem] flex items-center justify-center relative group">
          {{ parsedDateToEpoch }}
          <button @click="navigator.clipboard.writeText(parsedDateToEpoch)" class="absolute right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity bg-dark-800 p-1 rounded">Copy</button>
        </div>
      </div>
    </div>
  </div>
</template>