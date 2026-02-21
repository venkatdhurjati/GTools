<script setup lang="ts">
import { ref, computed } from 'vue'
import { Copy, Check } from 'lucide-vue-next'

interface DiffLine {
  type: 'add' | 'remove' | 'equal'
  text: string
  oldNum?: number
  newNum?: number
}

const oldText = ref('')
const newText = ref('')
const copied = ref(false)

const diff = computed((): DiffLine[] => {
  if (!oldText.value && !newText.value) return []
  return computeLCSDiff(oldText.value, newText.value)
})

const stats = computed(() => {
  const adds = diff.value.filter(l => l.type === 'add').length
  const removes = diff.value.filter(l => l.type === 'remove').length
  const unchanged = diff.value.filter(l => l.type === 'equal').length
  return { adds, removes, unchanged }
})

function computeLCSDiff(a: string, b: string): DiffLine[] {
  const oldLines = a.split('\n')
  const newLines = b.split('\n')
  const m = oldLines.length
  const n = newLines.length

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        oldLines[i - 1] === newLines[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  const result: DiffLine[] = []
  let i = m,
    j = n,
    oldNum = m,
    newNum = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: 'equal', text: oldLines[i - 1], oldNum: i, newNum: j })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'add', text: newLines[j - 1], newNum: j })
      j--
    } else {
      result.unshift({ type: 'remove', text: oldLines[i - 1], oldNum: i })
      i--
    }
  }

  return result
}

async function copyDiff() {
  const text = diff.value
    .map(l => {
      const prefix = l.type === 'add' ? '+ ' : l.type === 'remove' ? '- ' : '  '
      return prefix + l.text
    })
    .join('\n')
  await navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

function swap() {
  const tmp = oldText.value
  oldText.value = newText.value
  newText.value = tmp
}

function clear() {
  oldText.value = ''
  newText.value = ''
}
</script>

<template>
  <div class="h-full flex flex-col space-y-3">
    <div class="grid grid-cols-2 gap-3 min-h-0" style="flex: 0 0 38%">
      <div class="flex flex-col space-y-1.5">
        <label class="text-xs text-gray-500 font-medium">Original</label>
        <textarea
          v-model="oldText"
          class="input-field flex-1 resize-none font-mono text-xs leading-relaxed"
          placeholder="Paste original text..."
        ></textarea>
      </div>
      <div class="flex flex-col space-y-1.5">
        <label class="text-xs text-gray-500 font-medium">Modified</label>
        <textarea
          v-model="newText"
          class="input-field flex-1 resize-none font-mono text-xs leading-relaxed"
          placeholder="Paste modified text..."
        ></textarea>
      </div>
    </div>

    <div class="flex items-center justify-between bg-dark-800 px-4 py-2 rounded-lg border border-dark-700">
      <div class="flex gap-4 text-xs">
        <span v-if="diff.length" class="text-green-400">+{{ stats.adds }} added</span>
        <span v-if="diff.length" class="text-red-400">&minus;{{ stats.removes }} removed</span>
        <span v-if="diff.length" class="text-gray-500">{{ stats.unchanged }} unchanged</span>
        <span v-if="!diff.length" class="text-gray-500">Paste text to compare</span>
      </div>
      <div class="flex gap-2">
        <button @click="swap" class="btn-secondary py-1 px-2.5 text-xs">Swap</button>
        <button @click="clear" class="btn-secondary py-1 px-2.5 text-xs">Clear</button>
        <button v-if="diff.length" @click="copyDiff" class="btn-primary py-1 px-2.5 text-xs">
          <component :is="copied ? Check : Copy" class="w-3.5 h-3.5" />
          {{ copied ? 'Copied!' : 'Copy Diff' }}
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto glass-panel font-mono text-xs leading-relaxed min-h-0">
      <div v-if="!diff.length" class="flex items-center justify-center h-full text-gray-500 text-sm">
        Paste text in both fields to see the diff
      </div>
      <div v-else>
        <div
          v-for="(line, i) in diff"
          :key="i"
          :class="[
            'flex px-3 py-px border-l-2',
            line.type === 'add'
              ? 'bg-green-500/10 border-green-500 text-green-300'
              : line.type === 'remove'
                ? 'bg-red-500/10 border-red-500 text-red-300'
                : 'border-transparent text-gray-400',
          ]"
        >
          <span class="w-8 text-right pr-2 text-gray-600 select-none shrink-0">{{
            line.oldNum || ''
          }}</span>
          <span class="w-8 text-right pr-2 text-gray-600 select-none shrink-0">{{
            line.newNum || ''
          }}</span>
          <span class="w-4 shrink-0 text-center select-none opacity-60">{{
            line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '
          }}</span>
          <span class="whitespace-pre">{{ line.text || ' ' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
