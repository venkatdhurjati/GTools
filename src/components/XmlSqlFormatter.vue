<script setup lang="ts">
import { ref, computed } from 'vue'
import { Copy, Check } from 'lucide-vue-next'

const mode = ref<'xml' | 'sql'>('xml')
const input = ref('')
const copied = ref(false)
const errorMsg = ref('')

const formatted = computed(() => {
  errorMsg.value = ''
  if (!input.value.trim()) return ''

  try {
    if (mode.value === 'xml') return formatXml(input.value)
    return formatSql(input.value)
  } catch (e) {
    errorMsg.value = (e as Error).message
    return ''
  }
})

function formatXml(xml: string): string {
  // Remove existing whitespace between tags
  let formatted = xml.replace(/>\s*</g, '><').trim()
  let indent = 0
  const tab = '  '
  const lines: string[] = []

  // Tokenize by tags
  const tokens = formatted.match(/<[^>]+>|[^<]+/g)
  if (!tokens) throw new Error('Invalid XML: no tags found')

  for (const token of tokens) {
    if (token.startsWith('<?')) {
      // Processing instruction
      lines.push(tab.repeat(indent) + token)
    } else if (token.startsWith('</')) {
      // Closing tag
      indent = Math.max(0, indent - 1)
      lines.push(tab.repeat(indent) + token)
    } else if (token.startsWith('<') && token.endsWith('/>')) {
      // Self-closing
      lines.push(tab.repeat(indent) + token)
    } else if (token.startsWith('<')) {
      // Opening tag
      lines.push(tab.repeat(indent) + token)
      indent++
    } else {
      // Text content
      const text = token.trim()
      if (text) {
        // If there's an opening tag before and closing tag after, inline it
        if (lines.length > 0) {
          const lastLine = lines[lines.length - 1]
          lines[lines.length - 1] = lastLine + text
          indent = Math.max(0, indent - 1)
        } else {
          lines.push(tab.repeat(indent) + text)
        }
      }
    }
  }

  // Post-process: merge inline text with closing tag
  const result: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const next = lines[i + 1]
    if (next && next.trim().startsWith('</') && !line.trim().startsWith('</') && !line.trim().endsWith('/>') && !line.includes('><')) {
      // Check if current line is an opening tag with text
      const textMatch = line.match(/^(\s*<[^>]+>)(.+)$/)
      if (textMatch) {
        result.push(textMatch[0] + next.trim())
        i++ // skip next
        continue
      }
    }
    result.push(line)
  }

  return result.join('\n')
}

function formatSql(sql: string): string {
  // Normalize whitespace
  let s = sql.replace(/\s+/g, ' ').trim()

  // Keywords to put on new lines
  const majorKeywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY',
    'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
    'INNER JOIN', 'OUTER JOIN', 'FULL JOIN', 'CROSS JOIN',
    'ON', 'SET', 'VALUES', 'INSERT INTO', 'UPDATE', 'DELETE FROM',
    'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'UNION', 'UNION ALL',
    'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'AS', 'IN', 'NOT IN',
    'EXISTS', 'NOT EXISTS', 'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL'
  ]

  // Sort by length descending to match longer keywords first
  const sorted = [...majorKeywords].sort((a, b) => b.length - a.length)

  // Uppercase keywords and add newlines before major ones
  const upperSql = s.replace(
    new RegExp(`\\b(${sorted.map(k => k.replace(/\s+/g, '\\s+')).join('|')})\\b`, 'gi'),
    (match) => match.toUpperCase()
  )

  // Add newlines before major clause keywords
  const clauseKeywords = [
    'SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING',
    'LIMIT', 'OFFSET', 'INSERT INTO', 'UPDATE', 'DELETE FROM',
    'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'UNION', 'UNION ALL',
    'VALUES', 'SET'
  ]

  const joinKeywords = [
    'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
    'FULL JOIN', 'CROSS JOIN', 'JOIN'
  ]

  const subKeywords = ['AND', 'OR', 'ON', 'WHEN', 'THEN', 'ELSE', 'END']

  let result = upperSql

  // Add newlines before clause keywords
  for (const kw of clauseKeywords) {
    const re = new RegExp(`\\b${kw}\\b`, 'g')
    result = result.replace(re, `\n${kw}`)
  }

  // Newline + indent for joins
  for (const kw of joinKeywords) {
    const re = new RegExp(`\\b${kw}\\b`, 'g')
    result = result.replace(re, `\n  ${kw}`)
  }

  // Newline + indent for sub-keywords
  for (const kw of subKeywords) {
    const re = new RegExp(`\\b${kw}\\b`, 'g')
    result = result.replace(re, `\n    ${kw}`)
  }

  // Indent field lists after SELECT
  result = result.replace(/\nSELECT\s+/g, '\nSELECT\n  ')
  result = result.replace(/,\s*/g, ',\n  ')

  // Clean up
  result = result.replace(/^\n+/, '').replace(/\n{3,}/g, '\n\n')

  // Trim each line
  result = result.split('\n').map(l => l.trimEnd()).join('\n')

  return result
}

function minify() {
  if (mode.value === 'xml') {
    input.value = input.value.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim()
  } else {
    input.value = input.value.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',').trim()
  }
}

function prettify() {
  if (formatted.value && !errorMsg.value) {
    input.value = formatted.value
  }
}

async function copyOutput() {
  const text = formatted.value || input.value
  await navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

const placeholder = computed(() => {
  if (mode.value === 'xml') return '<root><item id="1"><name>Test</name></item></root>'
  return 'SELECT id, name, email FROM users WHERE active = 1 AND role IN (\'admin\', \'editor\') ORDER BY name ASC LIMIT 100'
})
</script>

<template>
  <div class="h-full flex flex-col space-y-3">
    <div class="flex items-center justify-between bg-dark-800 p-2.5 rounded-lg border border-dark-700">
      <div class="flex bg-dark-900 rounded-md p-0.5 border border-dark-700">
        <button
          @click="mode = 'xml'; input = ''"
          :class="['px-4 py-1.5 text-xs font-medium rounded-md transition', mode === 'xml' ? 'bg-neon-blue text-white shadow-md' : 'text-gray-400 hover:text-white']"
        >XML / HTML</button>
        <button
          @click="mode = 'sql'; input = ''"
          :class="['px-4 py-1.5 text-xs font-medium rounded-md transition', mode === 'sql' ? 'bg-neon-blue text-white shadow-md' : 'text-gray-400 hover:text-white']"
        >SQL</button>
      </div>
      <div class="flex gap-2">
        <button @click="minify" class="btn-secondary py-1.5 px-3 text-xs">Minify</button>
        <button @click="prettify" class="btn-secondary py-1.5 px-3 text-xs">Prettify</button>
        <button @click="copyOutput" class="btn-primary py-1.5 px-3 text-xs">
          <component :is="copied ? Check : Copy" class="w-3.5 h-3.5" />
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 flex-1 min-h-0">
      <div class="flex flex-col space-y-1.5">
        <label class="text-xs text-gray-500 font-medium">Input {{ mode === 'xml' ? 'XML / HTML' : 'SQL' }}</label>
        <textarea
          v-model="input"
          class="input-field flex-1 resize-none font-mono text-xs leading-relaxed"
          :placeholder="placeholder"
          spellcheck="false"
        ></textarea>
      </div>

      <div class="flex flex-col space-y-1.5">
        <label class="text-xs text-gray-500 font-medium">Formatted</label>
        <div class="glass-panel flex-1 p-4 font-mono text-xs overflow-auto">
          <div v-if="errorMsg" class="text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">{{ errorMsg }}</div>
          <pre v-else-if="formatted" class="text-neon-cyan leading-relaxed whitespace-pre"><code>{{ formatted }}</code></pre>
          <span v-else class="text-gray-600 italic">Paste {{ mode === 'xml' ? 'XML/HTML' : 'SQL' }} to format</span>
        </div>
      </div>
    </div>
  </div>
</template>
