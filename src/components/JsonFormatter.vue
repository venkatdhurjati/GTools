<script setup lang="ts">
import { ref, computed } from 'vue'
import { FileJson, Check, Copy, Trash2, AlignLeft, Minimize2 } from 'lucide-vue-next'

const rawJson = ref('')
const errorMsg = ref('')
const successMsg = ref('')

const formatJson = () => {
  try {
    errorMsg.value = ''
    successMsg.value = ''
    if (!rawJson.value.trim()) return
    const parsed = JSON.parse(rawJson.value)
    rawJson.value = JSON.stringify(parsed, null, 2)
    successMsg.value = 'JSON is valid and formatted.'
    setTimeout(() => successMsg.value = '', 3000)
  } catch (e: any) {
    errorMsg.value = `Invalid JSON: ${e.message}`
  }
}

const minifyJson = () => {
  try {
    errorMsg.value = ''
    successMsg.value = ''
    if (!rawJson.value.trim()) return
    const parsed = JSON.parse(rawJson.value)
    rawJson.value = JSON.stringify(parsed)
    successMsg.value = 'JSON minified successfully.'
    setTimeout(() => successMsg.value = '', 3000)
  } catch (e: any) {
    errorMsg.value = `Invalid JSON: ${e.message}`
  }
}

const clearJson = () => {
  rawJson.value = ''
  errorMsg.value = ''
  successMsg.value = ''
}

const copyJson = async () => {
  if (!rawJson.value) return
  try {
    await navigator.clipboard.writeText(rawJson.value)
    successMsg.value = 'Copied to clipboard!'
    setTimeout(() => successMsg.value = '', 3000)
  } catch (err) {
    console.error('Failed to copy', err)
  }
}
</script>

<template>
  <div class="h-full flex flex-col space-y-4 animate-in fade-in duration-300">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <FileJson class="w-5 h-5 text-neon-blue" />
        <h2 class="text-lg font-bold text-white">JSON Formatter</h2>
      </div>
      <div class="flex items-center gap-2 bg-dark-800 p-1.5 rounded-lg border border-dark-700">
        <button @click="formatJson" class="btn-secondary !py-1 !px-3 text-xs" title="Format/Prettify">
          <AlignLeft class="w-3.5 h-3.5" /> Format
        </button>
        <button @click="minifyJson" class="btn-secondary !py-1 !px-3 text-xs" title="Minify">
          <Minimize2 class="w-3.5 h-3.5" /> Minify
        </button>
        <div class="w-px h-4 bg-dark-600 mx-1"></div>
        <button @click="copyJson" class="text-gray-400 hover:text-white p-1 rounded transition-colors" title="Copy">
          <Copy class="w-4 h-4" />
        </button>
        <button @click="clearJson" class="text-gray-400 hover:text-red-400 p-1 rounded transition-colors" title="Clear">
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div v-if="errorMsg" class="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm flex items-center gap-2">
      {{ errorMsg }}
    </div>
    <div v-if="successMsg" class="p-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-sm flex items-center gap-2">
      <Check class="w-4 h-4" /> {{ successMsg }}
    </div>

    <div class="flex-1 min-h-0 relative group">
      <textarea 
        v-model="rawJson" 
        class="input-field h-full w-full resize-none font-mono text-sm leading-relaxed p-4" 
        placeholder='Paste your raw JSON here...&#10;{&#10;  "example": "data"&#10;}'
        spellcheck="false"
      ></textarea>
    </div>
  </div>
</template>