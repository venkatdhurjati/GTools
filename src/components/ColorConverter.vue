<script setup lang="ts">
import { ref, computed } from 'vue'
import { Palette, Copy, Check } from 'lucide-vue-next'

const hexColor = ref('#3b82f6')
const copied = ref('')

const hexToRgb = (hex: string) => {
  let r = 0, g = 0, b = 0
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16)
    g = parseInt(hex[2] + hex[2], 16)
    b = parseInt(hex[3] + hex[3], 16)
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16)
    g = parseInt(hex.substring(3, 5), 16)
    b = parseInt(hex.substring(5, 7), 16)
  }
  return isNaN(r) ? 'rgb(0,0,0)' : `rgb(${r}, ${g}, ${b})`
}

const hexToHsl = (hex: string) => {
  let r = 0, g = 0, b = 0
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16) / 255
    g = parseInt(hex[2] + hex[2], 16) / 255
    b = parseInt(hex[3] + hex[3], 16) / 255
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16) / 255
    g = parseInt(hex.substring(3, 5), 16) / 255
    b = parseInt(hex.substring(5, 7), 16) / 255
  }

  if(isNaN(r)) return 'hsl(0, 0%, 0%)'

  let max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2

  if (max !== min) {
    let d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}

const rgbValue = computed(() => hexToRgb(hexColor.value))
const hslValue = computed(() => hexToHsl(hexColor.value))

const copyColor = async (format: string, value: string) => {
  await navigator.clipboard.writeText(value)
  copied.value = format
  setTimeout(() => copied.value = '', 2000)
}
</script>

<template>
  <div class="h-full flex flex-col space-y-6 animate-in fade-in duration-300">
    <div class="flex items-center gap-2">
      <Palette class="w-5 h-5 text-neon-blue" />
      <h2 class="text-lg font-bold text-white">Color Converter</h2>
    </div>

    <div class="flex items-center gap-6">
      <input type="color" v-model="hexColor" class="w-24 h-24 rounded cursor-pointer bg-dark-900 border border-dark-700 p-1" />
      <div class="flex-1 space-y-4">
        
        <div class="relative group">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">HEX</label>
          <div class="flex items-center">
            <input type="text" v-model="hexColor" class="input-field font-mono uppercase rounded-r-none" />
            <button @click="copyColor('hex', hexColor.toUpperCase())" class="bg-dark-700 px-4 py-2 border border-l-0 border-dark-700 rounded-r-lg hover:bg-dark-600 transition-colors">
              <Check v-if="copied === 'hex'" class="w-5 h-5 text-green-400" />
              <Copy v-else class="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div class="relative group">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">RGB</label>
          <div class="flex items-center">
            <input type="text" :value="rgbValue" readonly class="input-field font-mono bg-dark-900/50 rounded-r-none" />
            <button @click="copyColor('rgb', rgbValue)" class="bg-dark-700 px-4 py-2 border border-l-0 border-dark-700 rounded-r-lg hover:bg-dark-600 transition-colors">
              <Check v-if="copied === 'rgb'" class="w-5 h-5 text-green-400" />
              <Copy v-else class="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div class="relative group">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">HSL</label>
          <div class="flex items-center">
            <input type="text" :value="hslValue" readonly class="input-field font-mono bg-dark-900/50 rounded-r-none" />
            <button @click="copyColor('hsl', hslValue)" class="bg-dark-700 px-4 py-2 border border-l-0 border-dark-700 rounded-r-lg hover:bg-dark-600 transition-colors">
              <Check v-if="copied === 'hsl'" class="w-5 h-5 text-green-400" />
              <Copy v-else class="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>