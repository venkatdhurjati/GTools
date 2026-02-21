<script setup lang="ts">
import { ref, computed } from 'vue'
import { Regex, Search, AlertCircle } from 'lucide-vue-next'

const pattern = ref('')
const flags = ref('g')
const testString = ref(`The quick brown fox jumps over the lazy dog. 
123-456-7890
user@example.com`)
const errorMsg = ref('')

const matches = computed(() => {
  errorMsg.value = ''
  if (!pattern.value) return []
  
  try {
    const regex = new RegExp(pattern.value, flags.value)
    if (!flags.value.includes('g')) {
      const match = testString.value.match(regex)
      return match ? [match[0]] : []
    }
    return Array.from(testString.value.matchAll(regex)).map(m => m[0])
  } catch (e: any) {
    errorMsg.value = e.message
    return []
  }
})

const highlightedText = computed(() => {
  if (!pattern.value || errorMsg.value) return testString.value
  try {
    const regex = new RegExp(`(${pattern.value})`, flags.value)
    // Basic escape for HTML to prevent XSS in preview
    const escape = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return escape(testString.value).replace(regex, '<mark class="bg-neon-blue/30 text-neon-blue rounded px-0.5">$1</mark>')
  } catch {
    return testString.value
  }
})
</script>

<template>
  <div class="h-full flex flex-col space-y-4 animate-in fade-in duration-300">
    <div class="flex items-center gap-2 mb-2">
      <Regex class="w-5 h-5 text-neon-purple" />
      <h2 class="text-lg font-bold text-white">Regex Tester</h2>
    </div>

    <div class="flex gap-2">
      <div class="flex-1 flex items-center bg-dark-800 border border-dark-700 rounded-lg px-3 focus-within:border-neon-purple focus-within:ring-1 ring-neon-purple transition-all">
        <span class="text-gray-500 font-mono">/</span>
        <input v-model="pattern" type="text" class="bg-transparent border-none outline-none w-full text-gray-200 font-mono py-2 px-1" placeholder="^([a-z0-9_\.-]+)@..." />
        <span class="text-gray-500 font-mono">/</span>
      </div>
      <input v-model="flags" type="text" class="w-16 input-field font-mono text-center" placeholder="gmi" title="Flags (e.g., g, i, m)" />
    </div>

    <div v-if="errorMsg" class="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm flex items-center gap-2">
      <AlertCircle class="w-4 h-4" /> {{ errorMsg }}
    </div>

    <div class="flex-1 grid grid-cols-2 gap-4 min-h-0">
      <div class="flex flex-col space-y-2">
        <label class="text-sm text-gray-400 font-medium flex items-center gap-2"><Search class="w-4 h-4"/> Test String</label>
        <textarea v-model="testString" class="input-field flex-1 resize-none font-mono text-sm leading-relaxed" placeholder="Text to test against..."></textarea>
      </div>
      
      <div class="flex flex-col space-y-2">
        <label class="text-sm text-gray-400 font-medium flex items-center justify-between">
          <span>Matches <span class="bg-dark-700 px-2 py-0.5 rounded text-xs ml-2">{{ matches.length }}</span></span>
        </label>
        <div class="glass-panel flex-1 p-4 font-mono text-sm overflow-auto whitespace-pre-wrap text-gray-300" v-html="highlightedText"></div>
      </div>
    </div>
  </div>
</template>