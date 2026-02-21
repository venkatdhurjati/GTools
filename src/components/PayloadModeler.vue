<script setup lang="ts">
import { ref, computed } from 'vue'
import { FileCode2, Copy, Check } from 'lucide-vue-next'

const inputJson = ref(`{
  "id": 1,
  "name": "Jane Doe",
  "isActive": true,
  "roles": ["admin", "user"]
}`)
const targetLang = ref<'go'|'ts'>('go')
const copied = ref(false)
const errorMsg = ref('')

const generateStructs = () => {
  try {
    errorMsg.value = ''
    const parsed = JSON.parse(inputJson.value)
    
    if (targetLang.value === 'go') return jsonToGo(parsed, 'Root')
    else return jsonToTs(parsed, 'Root')
  } catch (e) {
    errorMsg.value = 'Invalid JSON: ' + (e as Error).message
    return ''
  }
}

const generatedCode = computed(() => generateStructs())

function jsonToGo(obj: any, name: string): string {
  if (typeof obj !== 'object' || obj === null) return ''
  let structStr = `type ${name} struct {
`
  for (const key in obj) {
    const val = obj[key]
    const goType = getGoType(val)
    const fieldName = key.charAt(0).toUpperCase() + key.slice(1)
    structStr += `\t${fieldName} ${goType} \`json:"${key}"\`\n`
  }
  structStr += '}'
  return structStr
}

function getGoType(val: any): string {
  if (typeof val === 'string') return 'string'
  if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'float64'
  if (typeof val === 'boolean') return 'bool'
  if (Array.isArray(val)) {
    if (val.length > 0) return `[]${getGoType(val[0])}`
    return '[]interface{}'
  }
  if (typeof val === 'object' && val !== null) return 'map[string]interface{}' // Simplified
  return 'interface{}'
}

function jsonToTs(obj: any, name: string): string {
  if (typeof obj !== 'object' || obj === null) return ''
  let tsStr = `export interface ${name} {
`
  for (const key in obj) {
    const val = obj[key]
    const tsType = getTsType(val)
    tsStr += `  ${key}: ${tsType};
`
  }
  tsStr += '}'
  return tsStr
}

function getTsType(val: any): string {
  if (typeof val === 'string') return 'string'
  if (typeof val === 'number') return 'number'
  if (typeof val === 'boolean') return 'boolean'
  if (Array.isArray(val)) {
    if (val.length > 0) return `${getTsType(val[0])}[]`
    return 'any[]'
  }
  if (typeof val === 'object' && val !== null) return 'Record<string, any>' // Simplified
  return 'any'
}

const copyToClipboard = async () => {
  if (!generatedCode.value) return
  try {
    await navigator.clipboard.writeText(generatedCode.value)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch (err) {
    console.error('Failed to copy', err)
  }
}
</script>

<template>
  <div class="h-full flex flex-col space-y-4">
    <div class="flex justify-between items-center bg-dark-800 p-2 rounded-lg border border-dark-700">
      <div class="flex bg-dark-900 rounded-md p-1 border border-dark-700">
        <button @click="targetLang = 'go'" :class="['px-4 py-1.5 text-sm font-medium rounded-md transition', targetLang === 'go' ? 'bg-neon-blue text-white shadow-md' : 'text-gray-400 hover:text-white']">Go Struct</button>
        <button @click="targetLang = 'ts'" :class="['px-4 py-1.5 text-sm font-medium rounded-md transition', targetLang === 'ts' ? 'bg-neon-blue text-white shadow-md' : 'text-gray-400 hover:text-white']">TypeScript</button>
      </div>
      <button @click="copyToClipboard" class="btn-primary py-1.5 px-3 text-sm" :disabled="!generatedCode">
        <component :is="copied ? Check : Copy" class="w-4 h-4" />
        {{ copied ? 'Copied!' : 'Copy Code' }}
      </button>
    </div>

    <div class="grid grid-cols-2 gap-4 flex-1 min-h-0">
      <div class="flex flex-col space-y-2">
        <label class="text-sm text-gray-400 font-medium flex items-center gap-2"><FileCode2 class="w-4 h-4"/> Raw JSON</label>
        <textarea v-model="inputJson" class="input-field flex-1 resize-none font-mono text-sm leading-relaxed" placeholder="Paste JSON here..."></textarea>
      </div>
      
      <div class="flex flex-col space-y-2">
        <label class="text-sm text-gray-400 font-medium flex items-center gap-2"><FileCode2 class="w-4 h-4"/> Generated {{ targetLang === 'go' ? 'Go' : 'TS' }}</label>
        <div class="glass-panel flex-1 p-4 font-mono text-sm overflow-auto relative">
          <div v-if="errorMsg" class="text-red-400 p-2 bg-red-400/10 rounded border border-red-400/20 text-xs">{{ errorMsg }}</div>
          <pre v-else class="text-neon-cyan leading-relaxed"><code v-html="generatedCode"></code></pre>
        </div>
      </div>
    </div>
  </div>
</template>