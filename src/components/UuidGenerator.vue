<script setup lang="ts">
import { ref } from 'vue'
import { Copy, Check, RefreshCw } from 'lucide-vue-next'

const count = ref(5)
const format = ref<'standard' | 'uppercase' | 'bare'>('standard')
const uuids = ref<string[]>([])
const copiedIdx = ref(-1)
const copiedAll = ref(false)

function uuidv4(): string {
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

function fmt(u: string): string {
  if (format.value === 'uppercase') return u.toUpperCase()
  if (format.value === 'bare') return u.replace(/-/g, '')
  return u
}

function generate() {
  uuids.value = Array.from({ length: count.value }, () => fmt(uuidv4()))
}

generate()

async function copyOne(u: string, i: number) {
  await navigator.clipboard.writeText(u)
  copiedIdx.value = i
  setTimeout(() => (copiedIdx.value = -1), 1500)
}

async function copyAll() {
  await navigator.clipboard.writeText(uuids.value.join('\n'))
  copiedAll.value = true
  setTimeout(() => (copiedAll.value = false), 1500)
}
</script>

<template>
  <div class="h-full flex flex-col space-y-4">
    <div class="flex items-center justify-between bg-dark-800 p-3 rounded-lg border border-dark-700">
      <div class="flex items-center gap-4">
        <div class="flex bg-dark-900 rounded-md p-0.5 border border-dark-700">
          <button
            v-for="f in [
              { id: 'standard', label: 'Standard' },
              { id: 'uppercase', label: 'UPPER' },
              { id: 'bare', label: 'No Dash' },
            ]"
            :key="f.id"
            @click="format = f.id as any; generate()"
            :class="[
              'px-3 py-1.5 text-xs font-medium rounded-md transition',
              format === f.id
                ? 'bg-neon-blue text-white shadow-md'
                : 'text-gray-400 hover:text-white',
            ]"
          >
            {{ f.label }}
          </button>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs text-gray-500">Count:</label>
          <input
            type="number"
            v-model.number="count"
            min="1"
            max="100"
            class="input-field !w-16 !py-1 text-center text-sm"
            @change="generate()"
          />
        </div>
      </div>
      <div class="flex gap-2">
        <button @click="generate()" class="btn-secondary py-1.5 px-3 text-sm">
          <RefreshCw class="w-3.5 h-3.5" /> Generate
        </button>
        <button @click="copyAll()" class="btn-primary py-1.5 px-3 text-sm">
          <component :is="copiedAll ? Check : Copy" class="w-3.5 h-3.5" />
          {{ copiedAll ? 'Copied!' : 'Copy All' }}
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto space-y-1.5 pr-1">
      <div
        v-for="(u, i) in uuids"
        :key="i"
        class="flex items-center justify-between group bg-dark-800/50 hover:bg-dark-800 px-4 py-2.5 rounded-lg border border-dark-700/50 transition"
      >
        <code class="font-mono text-sm text-neon-cyan select-all">{{ u }}</code>
        <button
          @click="copyOne(u, i)"
          class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-dark-700 rounded-md"
        >
          <component
            :is="copiedIdx === i ? Check : Copy"
            :class="['w-4 h-4', copiedIdx === i ? 'text-green-400' : 'text-gray-400']"
          />
        </button>
      </div>
    </div>
  </div>
</template>
