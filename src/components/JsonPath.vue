<script setup lang="ts">
import { ref, computed } from 'vue'
import { Copy, Check } from 'lucide-vue-next'

const jsonInput = ref(`{
  "store": {
    "books": [
      { "title": "The Great Gatsby", "author": "Fitzgerald", "price": 10.99, "tags": ["classic", "fiction"] },
      { "title": "1984", "author": "Orwell", "price": 8.99, "tags": ["dystopian", "fiction"] },
      { "title": "Clean Code", "author": "Martin", "price": 32.00, "tags": ["programming", "technical"] },
      { "title": "The Pragmatic Programmer", "author": "Hunt", "price": 42.50, "tags": ["programming"] }
    ],
    "location": {
      "city": "Austin",
      "state": "TX"
    }
  }
}`)

const pathInput = ref('$.store.books[*].title')
const copied = ref(false)
const errorMsg = ref('')

const presets = [
  { label: 'All titles', path: '$.store.books[*].title' },
  { label: 'First book', path: '$.store.books[0]' },
  { label: 'Last book', path: '$.store.books[-1]' },
  { label: 'All prices', path: '$.store.books[*].price' },
  { label: 'Location', path: '$.store.location' },
  { label: 'All tags', path: '$.store.books[*].tags[*]' },
]

interface PathResult {
  path: string
  value: any
}

const results = computed((): PathResult[] => {
  errorMsg.value = ''
  if (!jsonInput.value.trim() || !pathInput.value.trim()) return []

  try {
    const data = JSON.parse(jsonInput.value)
    const paths = evaluatePath(data, pathInput.value)
    return paths
  } catch (e) {
    errorMsg.value = (e as Error).message
    return []
  }
})

function evaluatePath(data: any, expr: string): PathResult[] {
  // Remove leading $
  let path = expr.trim()
  if (path.startsWith('$')) path = path.slice(1)
  if (path.startsWith('.')) path = path.slice(1)

  const results: PathResult[] = []
  resolve(data, path, '$', results)
  return results
}

function resolve(current: any, remaining: string, currentPath: string, results: PathResult[]) {
  if (!remaining) {
    results.push({ path: currentPath, value: current })
    return
  }

  if (current === null || current === undefined) return

  // Parse next segment
  let segment: string
  let rest: string

  if (remaining.startsWith('[')) {
    const closeIdx = remaining.indexOf(']')
    if (closeIdx === -1) throw new Error('Unmatched bracket in path')
    segment = remaining.slice(0, closeIdx + 1)
    rest = remaining.slice(closeIdx + 1)
    if (rest.startsWith('.')) rest = rest.slice(1)
  } else {
    const dotIdx = remaining.indexOf('.')
    const bracketIdx = remaining.indexOf('[')
    let endIdx: number

    if (dotIdx === -1 && bracketIdx === -1) endIdx = remaining.length
    else if (dotIdx === -1) endIdx = bracketIdx
    else if (bracketIdx === -1) endIdx = dotIdx
    else endIdx = Math.min(dotIdx, bracketIdx)

    segment = remaining.slice(0, endIdx)
    rest = remaining.slice(endIdx)
    if (rest.startsWith('.')) rest = rest.slice(1)
  }

  // Handle wildcard
  if (segment === '*' || segment === '[*]') {
    if (Array.isArray(current)) {
      current.forEach((item, i) => {
        resolve(item, rest, `${currentPath}[${i}]`, results)
      })
    } else if (typeof current === 'object' && current !== null) {
      Object.keys(current).forEach(key => {
        resolve(current[key], rest, `${currentPath}.${key}`, results)
      })
    }
    return
  }

  // Handle array index
  if (segment.startsWith('[') && segment.endsWith(']')) {
    const inner = segment.slice(1, -1).trim()

    // Negative index
    if (inner.startsWith('-') && Array.isArray(current)) {
      const idx = current.length + parseInt(inner)
      if (idx >= 0 && idx < current.length) {
        resolve(current[idx], rest, `${currentPath}[${idx}]`, results)
      }
      return
    }

    // Numeric index
    const idx = parseInt(inner)
    if (!isNaN(idx) && Array.isArray(current)) {
      if (idx >= 0 && idx < current.length) {
        resolve(current[idx], rest, `${currentPath}[${idx}]`, results)
      }
      return
    }

    // Slice [start:end]
    if (inner.includes(':') && Array.isArray(current)) {
      const [startStr, endStr] = inner.split(':')
      const start = startStr ? parseInt(startStr) : 0
      const end = endStr ? parseInt(endStr) : current.length
      for (let i = start; i < Math.min(end, current.length); i++) {
        resolve(current[i], rest, `${currentPath}[${i}]`, results)
      }
      return
    }

    // Quoted key
    const quotedMatch = inner.match(/^['"](.+)['"]$/)
    if (quotedMatch && typeof current === 'object' && current !== null) {
      const key = quotedMatch[1]
      if (key in current) {
        resolve(current[key], rest, `${currentPath}['${key}']`, results)
      }
      return
    }
  }

  // Plain property access
  if (typeof current === 'object' && current !== null && segment in current) {
    resolve(current[segment], rest, `${currentPath}.${segment}`, results)
  }
}

function formatValue(val: any): string {
  if (typeof val === 'object') return JSON.stringify(val, null, 2)
  return String(val)
}

async function copyResults() {
  const text = results.value.map(r => formatValue(r.value)).join('\n')
  await navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <div class="h-full flex flex-col space-y-3">
    <!-- Path Input -->
    <div class="glass-panel p-3 space-y-2.5">
      <div class="flex items-center gap-3">
        <input
          v-model="pathInput"
          class="input-field flex-1 font-mono text-sm"
          placeholder="$.store.books[*].title"
          spellcheck="false"
        />
        <button v-if="results.length" @click="copyResults" class="btn-primary py-2 px-3 text-xs shrink-0">
          <component :is="copied ? Check : Copy" class="w-3.5 h-3.5" />
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="p in presets"
          :key="p.path"
          @click="pathInput = p.path"
          :class="[
            'px-2 py-1 rounded-md text-[10px] font-medium transition border',
            pathInput === p.path
              ? 'bg-neon-blue/20 border-neon-blue/50 text-neon-blue'
              : 'bg-dark-800 border-dark-700 text-gray-500 hover:text-white hover:border-dark-600',
          ]"
        >{{ p.label }}</button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 flex-1 min-h-0">
      <!-- JSON Input -->
      <div class="flex flex-col space-y-1.5">
        <label class="text-xs text-gray-500 font-medium">JSON</label>
        <textarea
          v-model="jsonInput"
          class="input-field flex-1 resize-none font-mono text-xs leading-relaxed"
          placeholder="Paste JSON here..."
          spellcheck="false"
        ></textarea>
      </div>

      <!-- Results -->
      <div class="flex flex-col space-y-1.5">
        <label class="text-xs text-gray-500 font-medium">
          Results
          <span v-if="results.length" class="text-neon-blue ml-1">({{ results.length }} match{{ results.length !== 1 ? 'es' : '' }})</span>
        </label>
        <div class="glass-panel flex-1 overflow-y-auto p-3 space-y-2">
          <div v-if="errorMsg" class="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">{{ errorMsg }}</div>
          <div v-else-if="!results.length && pathInput" class="text-gray-600 text-sm italic p-2">No matches found</div>
          <div v-else-if="!pathInput" class="text-gray-600 text-sm italic p-2">Enter a JSONPath expression</div>

          <div
            v-for="(r, i) in results"
            :key="i"
            class="bg-dark-900/60 rounded-lg border border-dark-700/50 p-3 space-y-1.5"
          >
            <div class="text-[10px] text-gray-600 font-mono truncate">{{ r.path }}</div>
            <pre class="text-xs font-mono text-neon-cyan leading-relaxed whitespace-pre-wrap break-all">{{ formatValue(r.value) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
