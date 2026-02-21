<script setup lang="ts">
import { ref, computed } from 'vue'
import { Copy, Check } from 'lucide-vue-next'

const inputValue = ref('255')
const inputBase = ref(10)
const copiedField = ref('')

const bases = [
  { id: 2, label: 'Binary', prefix: '0b', placeholder: '11111111' },
  { id: 8, label: 'Octal', prefix: '0o', placeholder: '377' },
  { id: 10, label: 'Decimal', prefix: '', placeholder: '255' },
  { id: 16, label: 'Hex', prefix: '0x', placeholder: 'FF' },
]

function parseInput(): number | null {
  const clean = inputValue.value
    .trim()
    .replace(/^0[bB]/, '')
    .replace(/^0[oO]/, '')
    .replace(/^0[xX]/, '')
    .replace(/[\s_]/g, '')
  if (!clean) return null
  const n = parseInt(clean, inputBase.value)
  return isNaN(n) ? null : n
}

const parsedNum = computed(() => parseInput())
const isValid = computed(() => parsedNum.value !== null)

function convert(base: number): string {
  const n = parsedNum.value
  if (n === null) return ''
  const raw = n.toString(base)
  if (base === 16) return raw.toUpperCase()
  return raw
}

function formatBinary(val: string): string {
  if (!val) return ''
  const padded = val.padStart(Math.ceil(val.length / 4) * 4, '0')
  return padded.match(/.{1,4}/g)?.join(' ') || val
}

async function copyValue(base: number) {
  const val = convert(base)
  if (!val) return
  const prefix = bases.find(b => b.id === base)?.prefix || ''
  await navigator.clipboard.writeText(prefix + val)
  copiedField.value = `${base}`
  setTimeout(() => (copiedField.value = ''), 1500)
}

const bitLength = computed(() => {
  const n = parsedNum.value
  if (n === null) return 0
  if (n === 0) return 1
  return Math.floor(Math.log2(Math.abs(n))) + 1
})

const byteSize = computed(() => {
  return Math.ceil(bitLength.value / 8)
})
</script>

<template>
  <div class="h-full flex flex-col space-y-5">
    <!-- Input Section -->
    <div class="glass-panel p-5 space-y-4">
      <div class="flex items-end gap-4">
        <div class="flex-1 space-y-2">
          <label class="text-xs text-gray-500 font-medium">Input Value</label>
          <input
            v-model="inputValue"
            class="input-field font-mono text-lg"
            :placeholder="bases.find(b => b.id === inputBase)?.placeholder"
            spellcheck="false"
          />
        </div>
        <div class="space-y-2">
          <label class="text-xs text-gray-500 font-medium">Base</label>
          <div class="flex bg-dark-900 rounded-md p-0.5 border border-dark-700">
            <button
              v-for="b in bases"
              :key="b.id"
              @click="inputBase = b.id"
              :class="[
                'px-3 py-2 text-xs font-medium rounded-md transition',
                inputBase === b.id
                  ? 'bg-neon-blue text-white shadow-md'
                  : 'text-gray-400 hover:text-white',
              ]"
            >
              {{ b.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Info Bar -->
      <div v-if="isValid" class="flex gap-6 text-xs text-gray-500 pt-1 border-t border-dark-700/50">
        <span>{{ bitLength }} bits</span>
        <span>{{ byteSize }} byte{{ byteSize !== 1 ? 's' : '' }}</span>
        <span v-if="parsedNum !== null && parsedNum >= 0 && parsedNum <= 127" class="text-neon-cyan">
          ASCII: '{{ String.fromCharCode(parsedNum) }}'
        </span>
      </div>
    </div>

    <!-- Conversion Results -->
    <div class="flex-1 space-y-3 overflow-y-auto">
      <div
        v-for="b in bases"
        :key="b.id"
        class="glass-panel p-4 flex items-center justify-between group hover:border-dark-600 transition"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ b.label }}</span>
            <span v-if="b.prefix" class="text-[10px] font-mono text-gray-600 bg-dark-900 px-1.5 py-0.5 rounded">{{
              b.prefix
            }}</span>
          </div>
          <code
            v-if="isValid"
            class="font-mono text-sm text-neon-cyan select-all break-all leading-relaxed"
          >
            {{ b.id === 2 ? formatBinary(convert(b.id)) : convert(b.id) }}
          </code>
          <span v-else class="text-sm text-gray-600 italic">Invalid input</span>
        </div>
        <button
          v-if="isValid"
          @click="copyValue(b.id)"
          class="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-dark-700 rounded-md ml-3 shrink-0"
        >
          <component
            :is="copiedField === `${b.id}` ? Check : Copy"
            :class="['w-4 h-4', copiedField === `${b.id}` ? 'text-green-400' : 'text-gray-400']"
          />
        </button>
      </div>
    </div>
  </div>
</template>
