<script setup lang="ts">
import { ref } from 'vue'
import { Hash, Code2, Link, FileText, ArrowRightLeft } from 'lucide-vue-next'

const inputText = ref('')
const outputText = ref('')
const mode = ref('base64')
const operation = ref<'encode'|'decode'>('encode')
const errorMsg = ref('')

const modes = [
  { id: 'base64', name: 'Base64', icon: Hash },
  { id: 'url', name: 'URL / URI', icon: Link },
  { id: 'html', name: 'HTML Entities', icon: Code2 }
]

const processText = () => {
  errorMsg.value = ''
  if (!inputText.value) {
    outputText.value = ''
    return
  }

  try {
    if (mode.value === 'base64') {
      if (operation.value === 'encode') {
        outputText.value = btoa(inputText.value)
      } else {
        outputText.value = atob(inputText.value)
      }
    } else if (mode.value === 'url') {
      if (operation.value === 'encode') {
        outputText.value = encodeURIComponent(inputText.value)
      } else {
        outputText.value = decodeURIComponent(inputText.value)
      }
    } else if (mode.value === 'html') {
      if (operation.value === 'encode') {
        outputText.value = inputText.value.replace(/[\u00A0-\u9999<>\&]/g, (i) => `&#${i.charCodeAt(0)};`)
      } else {
        const textarea = document.createElement('textarea')
        textarea.innerHTML = inputText.value
        outputText.value = textarea.value
      }
    }
  } catch (e: any) {
    errorMsg.value = `Error parsing ${mode.value.toUpperCase()}: Invalid format.`
  }
}

const swapOperation = () => {
  operation.value = operation.value === 'encode' ? 'decode' : 'encode'
  inputText.value = outputText.value
  processText()
}
</script>

<template>
  <div class="h-full flex flex-col space-y-6 animate-in fade-in zoom-in duration-300">
    <div class="flex items-center gap-4 bg-dark-800 p-2 rounded-xl border border-dark-700">
      <div class="flex space-x-1 p-1 bg-dark-900 rounded-lg">
        <button v-for="m in modes" :key="m.id"
          @click="mode = m.id; processText()"
          :class="['px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2',
            mode === m.id ? 'bg-neon-blue text-white shadow-md' : 'text-gray-400 hover:text-white']">
          <component :is="m.icon" class="w-4 h-4" />
          {{ m.name }}
        </button>
      </div>

      <div class="w-px h-6 bg-dark-600"></div>

      <div class="flex space-x-1 p-1 bg-dark-900 rounded-lg">
        <button @click="operation = 'encode'; processText()" :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-all', operation === 'encode' ? 'bg-white text-dark-900' : 'text-gray-400 hover:text-white']">Encode</button>
        <button @click="operation = 'decode'; processText()" :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-all', operation === 'decode' ? 'bg-white text-dark-900' : 'text-gray-400 hover:text-white']">Decode</button>
      </div>
    </div>

    <div v-if="errorMsg" class="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
      {{ errorMsg }}
    </div>

    <div class="flex-1 grid grid-cols-2 gap-4 min-h-0">
      <div class="flex flex-col space-y-2">
        <label class="text-sm text-gray-400 font-medium flex items-center gap-2">
          <FileText class="w-4 h-4"/> Input
        </label>
        <textarea 
          v-model="inputText" 
          @input="processText"
          class="input-field h-full w-full resize-none font-mono text-sm leading-relaxed p-4" 
          placeholder="Type or paste here..."></textarea>
      </div>
      
      <div class="flex flex-col space-y-2 relative">
        <div class="absolute -left-6 top-1/2 -translate-y-1/2 z-10">
          <button @click="swapOperation" class="bg-dark-700 p-2 rounded-full border border-dark-600 hover:border-neon-blue hover:text-neon-blue transition-colors shadow-lg" title="Swap and convert">
            <ArrowRightLeft class="w-4 h-4" />
          </button>
        </div>
        <label class="text-sm text-gray-400 font-medium flex items-center gap-2">
          <FileText class="w-4 h-4"/> Output
        </label>
        <textarea 
          v-model="outputText" 
          readonly
          class="input-field h-full w-full resize-none font-mono text-sm leading-relaxed p-4 bg-dark-800/50 text-neon-cyan focus:ring-0" 
          placeholder="Result appears here..."></textarea>
      </div>
    </div>
  </div>
</template>