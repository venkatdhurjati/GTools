<script setup lang="ts">
import { ref, computed } from 'vue'
import { Type, Copy, Check } from 'lucide-vue-next'

const paras = ref(3)
const format = ref<'paragraphs'|'sentences'|'words'>('paragraphs')
const copied = ref(false)

const loremText = computed(() => {
  const dictionary = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
    'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
    'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'ut',
    'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'dolor', 'in', 'reprehenderit'
  ]

  const generateSentence = () => {
    const wordCount = Math.floor(Math.random() * 8) + 5
    let sentence = []
    for (let i = 0; i < wordCount; i++) {
      sentence.push(dictionary[Math.floor(Math.random() * dictionary.length)])
    }
    const result = sentence.join(' ')
    return result.charAt(0).toUpperCase() + result.slice(1) + '.'
  }

  const generateParagraph = () => {
    const sentenceCount = Math.floor(Math.random() * 4) + 4
    let paragraph = []
    for (let i = 0; i < sentenceCount; i++) {
      paragraph.push(generateSentence())
    }
    return paragraph.join(' ')
  }

  let output = []
  if (format.value === 'paragraphs') {
    for (let i = 0; i < paras.value; i++) output.push(generateParagraph())
    return output.join(`\n\n`)
  } else if (format.value === 'sentences') {
    for (let i = 0; i < paras.value; i++) output.push(generateSentence())
    return output.join(' ')
  } else {
    for (let i = 0; i < paras.value; i++) output.push(dictionary[Math.floor(Math.random() * dictionary.length)])
    return output.join(' ')
  }
})

const copyText = async () => {
  await navigator.clipboard.writeText(loremText.value)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}
</script>

<template>
  <div class="h-full flex flex-col space-y-6 animate-in fade-in duration-300 overflow-y-auto pr-2">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Type class="w-5 h-5 text-neon-blue" />
        <h2 class="text-lg font-bold text-white">Lorem Ipsum Gen</h2>
      </div>
      <button @click="copyText" class="btn-primary !py-1.5 !px-3 text-sm">
        <Check v-if="copied" class="w-4 h-4" />
        <Copy v-else class="w-4 h-4" />
        {{ copied ? 'Copied' : 'Copy Text' }}
      </button>
    </div>

    <div class="flex items-center gap-4 bg-dark-800 p-3 rounded-xl border border-dark-700">
      <div class="flex items-center gap-3 flex-1">
        <label class="text-xs text-gray-400 font-medium uppercase tracking-wider">Count</label>
        <input type="number" v-model="paras" min="1" max="100" class="input-field w-20 text-center !py-1.5" />
      </div>

      <div class="w-px h-6 bg-dark-600"></div>

      <div class="flex items-center gap-1 bg-dark-900 rounded-lg p-1 border border-dark-700">
        <button v-for="f in ['paragraphs', 'sentences', 'words']" :key="f"
          @click="format = f as any"
          :class="['px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
            format === f ? 'bg-neon-blue text-white shadow-md' : 'text-gray-400 hover:text-white']">
          {{ f }}
        </button>
      </div>
    </div>

    <div class="flex-1 min-h-0 relative">
      <textarea 
        readonly
        :value="loremText" 
        class="input-field h-full w-full resize-none text-sm leading-relaxed p-4 bg-dark-900/50 text-gray-300 focus:ring-0" 
      ></textarea>
    </div>
  </div>
</template>