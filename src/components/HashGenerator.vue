<script setup lang="ts">
import { ref, watch } from 'vue'
import { Fingerprint, Copy, Check } from 'lucide-vue-next'

const inputText = ref('')
const hashes = ref({
  'SHA-1': '',
  'SHA-256': '',
  'SHA-384': '',
  'SHA-512': ''
})
const copied = ref('')

const generateHashes = async () => {
  if (!inputText.value) {
    hashes.value = { 'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': '' }
    return
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(inputText.value)

  for (const algo of ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']) {
    const hashBuffer = await crypto.subtle.digest(algo, data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    hashes.value[algo as keyof typeof hashes.value] = hashHex
  }
}

watch(inputText, generateHashes)

const copyHash = async (algo: string, hash: string) => {
  if (!hash) return
  await navigator.clipboard.writeText(hash)
  copied.value = algo
  setTimeout(() => copied.value = '', 2000)
}
</script>

<template>
  <div class="h-full flex flex-col space-y-6 animate-in fade-in duration-300 overflow-y-auto pr-2">
    <div class="flex items-center gap-2">
      <Fingerprint class="w-5 h-5 text-neon-purple" />
      <h2 class="text-lg font-bold text-white">Secure Hash Generator</h2>
    </div>

    <div class="space-y-2">
      <label class="text-sm text-gray-400 font-medium">Input String</label>
      <textarea v-model="inputText" class="input-field h-24 resize-none font-mono text-sm" placeholder="Text to hash..."></textarea>
    </div>

    <div class="space-y-3">
      <div v-for="(hash, algo) in hashes" :key="algo" class="glass-panel p-3 flex flex-col gap-2 relative group">
        <div class="flex justify-between items-center">
          <span class="text-xs font-bold text-gray-500 tracking-wider">{{ algo }}</span>
          <button @click="copyHash(algo.toString(), hash)" class="text-gray-400 hover:text-white transition-colors p-1" :disabled="!hash" :title="'Copy ' + algo">
            <Check v-if="copied === algo" class="w-4 h-4 text-green-400" />
            <Copy v-else class="w-4 h-4" />
          </button>
        </div>
        <div class="bg-dark-900 border border-dark-700 rounded p-2 overflow-x-auto min-h-[2.5rem] flex items-center">
          <span v-if="hash" class="font-mono text-xs text-neon-cyan select-all break-all">{{ hash }}</span>
          <span v-else class="font-mono text-xs text-dark-600 italic">Awaiting input...</span>
        </div>
      </div>
    </div>
  </div>
</template>