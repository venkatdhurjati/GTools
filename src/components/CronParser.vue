<script setup lang="ts">
import { ref, computed } from 'vue'
import { Copy, Check } from 'lucide-vue-next'

const expression = ref('*/15 * * * *')
const copied = ref(false)

const presets = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 min', value: '*/5 * * * *' },
  { label: 'Every 15 min', value: '*/15 * * * *' },
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Daily midnight', value: '0 0 * * *' },
  { label: 'Weekly Mon 9am', value: '0 9 * * 1' },
  { label: 'Monthly 1st', value: '0 0 1 * *' },
  { label: 'Weekdays 9am', value: '0 9 * * 1-5' },
]

const fieldLabels = ['Minute', 'Hour', 'Day (Month)', 'Month', 'Day (Week)']
const fieldRanges: [number, number][] = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 6],
]
const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function parseField(field: string, min: number, max: number): Set<number> | null {
  const values = new Set<number>()
  for (const part of field.split(',')) {
    const [range, stepStr] = part.split('/')
    const step = stepStr ? parseInt(stepStr) : 1
    if (isNaN(step) || step < 1) return null

    if (range === '*') {
      for (let i = min; i <= max; i += step) values.add(i)
    } else if (range.includes('-')) {
      const [s, e] = range.split('-').map(Number)
      if (isNaN(s) || isNaN(e) || s < min || e > max || s > e) return null
      for (let i = s; i <= e; i += step) values.add(i)
    } else {
      const val = parseInt(range)
      if (isNaN(val) || val < min || val > max) return null
      if (step > 1) {
        for (let i = val; i <= max; i += step) values.add(i)
      } else {
        values.add(val)
      }
    }
  }
  return values
}

interface ParseResult {
  fields: { minutes: Set<number>; hours: Set<number>; dom: Set<number>; months: Set<number>; dow: Set<number> } | null
  error: string
  explanations: string[]
}

const parsed = computed((): ParseResult => {
  const parts = expression.value.trim().split(/\s+/)
  if (parts.length !== 5) return { fields: null, error: 'Expected 5 fields: minute hour day month weekday', explanations: [] }

  const sets = parts.map((p, i) => parseField(p, fieldRanges[i][0], fieldRanges[i][1]))
  if (sets.some(s => s === null)) return { fields: null, error: 'Invalid field value. Check syntax.', explanations: [] }

  const [minutes, hours, dom, months, dow] = sets as Set<number>[]
  const explanations = parts.map((p, i) => explainField(p, i))

  return { fields: { minutes, hours, dom, months, dow }, error: '', explanations }
})

function explainField(field: string, idx: number): string {
  const label = fieldLabels[idx]
  if (field === '*') return `Every ${label.toLowerCase()}`
  if (field.startsWith('*/')) return `Every ${field.slice(2)} ${label.toLowerCase()}${parseInt(field.slice(2)) > 1 ? 's' : ''}`
  if (field.includes('-') && !field.includes('/')) {
    const [s, e] = field.split('-')
    if (idx === 4) return `${dayNames[+s] || s} through ${dayNames[+e] || e}`
    if (idx === 3) return `${monthNames[+s] || s} through ${monthNames[+e] || e}`
    return `${label} ${s} through ${e}`
  }
  if (field.includes(',')) {
    const vals = field.split(',').map(v => {
      if (idx === 4) return dayNames[+v] || v
      if (idx === 3) return monthNames[+v] || v
      return v
    })
    return `${label}: ${vals.join(', ')}`
  }
  if (idx === 4) return `On ${dayNames[+field] || field}`
  if (idx === 3) return `In ${monthNames[+field] || field}`
  return `At ${label.toLowerCase()} ${field}`
}

const nextRuns = computed((): string[] => {
  if (!parsed.value.fields) return []
  const { minutes, hours, dom, months, dow } = parsed.value.fields
  const results: string[] = []
  const d = new Date()
  d.setSeconds(0, 0)
  d.setMinutes(d.getMinutes() + 1)

  const limit = new Date(d)
  limit.setFullYear(limit.getFullYear() + 2)

  while (results.length < 5 && d < limit) {
    if (!months.has(d.getMonth() + 1)) {
      d.setMonth(d.getMonth() + 1, 1)
      d.setHours(0, 0, 0, 0)
      continue
    }
    if (!dom.has(d.getDate())) {
      d.setDate(d.getDate() + 1)
      d.setHours(0, 0, 0, 0)
      continue
    }
    if (!dow.has(d.getDay())) {
      d.setDate(d.getDate() + 1)
      d.setHours(0, 0, 0, 0)
      continue
    }
    if (!hours.has(d.getHours())) {
      d.setHours(d.getHours() + 1, 0, 0, 0)
      continue
    }
    if (!minutes.has(d.getMinutes())) {
      d.setMinutes(d.getMinutes() + 1, 0, 0)
      continue
    }
    results.push(
      d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) +
        ' ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    )
    d.setMinutes(d.getMinutes() + 1)
  }

  return results
})

async function copyExpression() {
  await navigator.clipboard.writeText(expression.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <div class="h-full flex flex-col space-y-4">
    <!-- Expression Input -->
    <div class="glass-panel p-4 space-y-4">
      <div class="flex items-center gap-3">
        <input
          v-model="expression"
          class="input-field flex-1 font-mono text-lg tracking-widest text-center"
          placeholder="* * * * *"
          spellcheck="false"
        />
        <button @click="copyExpression" class="btn-primary py-2 px-3 text-sm shrink-0">
          <component :is="copied ? Check : Copy" class="w-4 h-4" />
        </button>
      </div>
      <div class="flex justify-center gap-6 text-[10px] text-gray-500 font-mono">
        <span v-for="label in fieldLabels" :key="label">{{ label }}</span>
      </div>
    </div>

    <!-- Presets -->
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="p in presets"
        :key="p.value"
        @click="expression = p.value"
        :class="[
          'px-2.5 py-1 rounded-md text-xs font-medium transition border',
          expression === p.value
            ? 'bg-neon-blue/20 border-neon-blue/50 text-neon-blue'
            : 'bg-dark-800 border-dark-700 text-gray-400 hover:text-white hover:border-dark-600',
        ]"
      >
        {{ p.label }}
      </button>
    </div>

    <!-- Error -->
    <div v-if="parsed.error" class="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
      {{ parsed.error }}
    </div>

    <div v-if="!parsed.error" class="flex-1 grid grid-cols-2 gap-4 min-h-0">
      <!-- Explanation -->
      <div class="glass-panel p-4 space-y-3 overflow-y-auto">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Breakdown</h3>
        <div class="space-y-2">
          <div
            v-for="(exp, i) in parsed.explanations"
            :key="i"
            class="flex items-start gap-3 text-sm"
          >
            <span class="text-[10px] font-mono text-gray-600 bg-dark-900 px-1.5 py-0.5 rounded shrink-0 mt-0.5">{{
              fieldLabels[i].slice(0, 3)
            }}</span>
            <span class="text-gray-300">{{ exp }}</span>
          </div>
        </div>
      </div>

      <!-- Next Runs -->
      <div class="glass-panel p-4 space-y-3 overflow-y-auto">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Next 5 Runs</h3>
        <div v-if="nextRuns.length" class="space-y-2">
          <div
            v-for="(run, i) in nextRuns"
            :key="i"
            class="flex items-center gap-3 text-sm text-gray-300"
          >
            <span class="w-5 h-5 flex items-center justify-center rounded-full bg-dark-900 text-[10px] text-gray-500 shrink-0">{{
              i + 1
            }}</span>
            <span class="font-mono text-xs">{{ run }}</span>
          </div>
        </div>
        <div v-else class="text-sm text-gray-500">No upcoming runs found within 2 years.</div>
      </div>
    </div>
  </div>
</template>
