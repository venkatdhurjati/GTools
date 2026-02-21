<script setup lang="ts">
import { ref, computed } from 'vue'
import { BoxSelect, Copy, Check } from 'lucide-vue-next'

const offsetX = ref(10)
const offsetY = ref(10)
const blur = ref(15)
const spread = ref(-3)
const color = ref('#000000')
const opacity = ref(50)
const isInset = ref(false)
const copied = ref(false)

const boxShadowCss = computed(() => {
  const hexToRgba = (hex: string, alpha: number) => {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
  }
  const rgba = hexToRgba(color.value, opacity.value)
  return `box-shadow: ${isInset.value ? 'inset ' : ''}${offsetX.value}px ${offsetY.value}px ${blur.value}px ${spread.value}px ${rgba};`
})

const copyCss = async () => {
  await navigator.clipboard.writeText(boxShadowCss.value)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}
</script>

<template>
  <div class="h-full flex flex-col space-y-6 animate-in fade-in duration-300 overflow-y-auto pr-2">
    <div class="flex items-center gap-2">
      <BoxSelect class="w-5 h-5 text-neon-purple" />
      <h2 class="text-lg font-bold text-white">CSS Box Shadow Gen</h2>
    </div>

    <div class="flex-1 grid grid-cols-2 gap-6 min-h-0">
      
      <!-- Controls -->
      <div class="space-y-4 overflow-y-auto pr-2">
        <div class="space-y-1">
          <label class="text-xs text-gray-400 font-medium flex justify-between">Offset X <span>{{ offsetX }}px</span></label>
          <input type="range" v-model="offsetX" min="-50" max="50" class="w-full accent-neon-blue" />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-gray-400 font-medium flex justify-between">Offset Y <span>{{ offsetY }}px</span></label>
          <input type="range" v-model="offsetY" min="-50" max="50" class="w-full accent-neon-blue" />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-gray-400 font-medium flex justify-between">Blur Radius <span>{{ blur }}px</span></label>
          <input type="range" v-model="blur" min="0" max="100" class="w-full accent-neon-blue" />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-gray-400 font-medium flex justify-between">Spread Radius <span>{{ spread }}px</span></label>
          <input type="range" v-model="spread" min="-50" max="50" class="w-full accent-neon-blue" />
        </div>
        
        <div class="flex items-center gap-4 pt-2">
          <div class="flex-1 space-y-1">
            <label class="text-xs text-gray-400 font-medium">Color</label>
            <input type="color" v-model="color" class="w-full h-8 rounded bg-dark-900 border border-dark-700 cursor-pointer" />
          </div>
          <div class="flex-1 space-y-1">
            <label class="text-xs text-gray-400 font-medium flex justify-between">Opacity <span>{{ opacity }}%</span></label>
            <input type="range" v-model="opacity" min="0" max="100" class="w-full accent-neon-blue" />
          </div>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <input type="checkbox" id="inset" v-model="isInset" class="accent-neon-blue w-4 h-4 rounded" />
          <label for="inset" class="text-sm text-gray-300 select-none cursor-pointer">Inset Shadow</label>
        </div>
      </div>

      <!-- Preview -->
      <div class="flex flex-col space-y-4">
        <div class="flex-1 bg-white rounded-xl flex items-center justify-center relative overflow-hidden pattern-dots">
          <!-- Background Grid for transparency visualization -->
          <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 20px 20px;"></div>
          
          <!-- Preview Box -->
          <div class="w-32 h-32 bg-white rounded-lg transition-all duration-75 relative z-10 flex items-center justify-center text-dark-900 font-bold"
               :style="boxShadowCss">
            Preview
          </div>
        </div>

        <div class="glass-panel p-3 border border-dark-700 relative group flex items-center">
          <pre class="text-xs font-mono text-neon-cyan flex-1 overflow-x-auto whitespace-pre-wrap">{{ boxShadowCss }}</pre>
          <button @click="copyCss" class="p-2 text-gray-400 hover:text-white transition-colors bg-dark-800 rounded ml-2">
            <Check v-if="copied" class="w-4 h-4 text-green-400" />
            <Copy v-else class="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.pattern-dots {
  background-color: #e5e5f7;
}
</style>