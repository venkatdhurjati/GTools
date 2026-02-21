<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { GitBranch, Copy, Check, RefreshCw, TerminalSquare } from 'lucide-vue-next'

const tabTitle = ref('Loading active tab...')
const branchName = ref('')
const branchPrefix = ref('feat/')
const copied = ref(false)

const sanitizeTitle = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
}

const updateBranch = () => {
  branchName.value = sanitizeTitle(tabTitle.value)
}

onMounted(async () => {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.title) {
        tabTitle.value = tab.title
        updateBranch()
      } else {
        tabTitle.value = 'Local Development Mode'
        branchName.value = 'implement-awesome-feature'
      }
    } catch (e) {
      tabTitle.value = 'Implement User Authentication Flow (JIRA-123)'
      updateBranch()
    }
  } else {
    // Fallback for local testing outside extension
    tabTitle.value = 'Implement User Authentication Flow (JIRA-123)'
    updateBranch()
  }
})

const copyCommand = async () => {
  const cmd = `git checkout -b ${branchPrefix.value}${branchName.value}`
  try {
    await navigator.clipboard.writeText(cmd)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch (e) {
    console.error('Failed to copy', e)
  }
}
</script>

<template>
  <div class="h-full flex flex-col items-center justify-center space-y-8 animate-in slide-in-from-bottom-4 duration-300">
    
    <div class="text-center space-y-2 max-w-md w-full">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 text-neon-purple mb-4 ring-1 ring-neon-purple/50">
        <GitBranch class="w-8 h-8" />
      </div>
      <h2 class="text-xl font-bold text-white">Ticket-to-Git</h2>
      <p class="text-sm text-gray-400 line-clamp-2">{{ tabTitle }}</p>
    </div>

    <div class="glass-panel w-full max-w-md p-6 space-y-6">
      
      <div class="space-y-3">
        <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch Prefix</label>
        <div class="flex space-x-2">
          <button v-for="p in ['feat/', 'fix/', 'chore/', '']" :key="p"
            @click="branchPrefix = p"
            :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border', 
              branchPrefix === p ? 'bg-neon-purple/20 border-neon-purple text-neon-purple' : 'bg-dark-900 border-dark-700 text-gray-400 hover:text-white']">
            {{ p || 'none' }}
          </button>
        </div>
      </div>

      <div class="space-y-3">
        <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between">
          <span>Branch Name</span>
          <button @click="updateBranch" class="text-neon-blue flex items-center gap-1 hover:underline"><RefreshCw class="w-3 h-3"/> Reset</button>
        </label>
        <div class="flex items-center gap-2">
          <span class="text-gray-500 font-mono">{{ branchPrefix }}</span>
          <input type="text" v-model="branchName" class="input-field flex-1 font-mono text-sm py-1.5" />
        </div>
      </div>

      <div class="pt-4 border-t border-dark-700/50">
        <div class="relative group">
          <div class="absolute -inset-0.5 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
          <button @click="copyCommand" class="relative w-full bg-dark-900 text-white font-mono flex items-center justify-between p-4 rounded-xl border border-dark-700 hover:border-neon-blue/50 transition-colors">
            <div class="flex items-center gap-3 overflow-hidden">
              <TerminalSquare class="w-5 h-5 text-gray-400 shrink-0" />
              <span class="truncate text-neon-cyan">git checkout -b {{ branchPrefix }}{{ branchName }}</span>
            </div>
            <component :is="copied ? Check : Copy" :class="['w-5 h-5 shrink-0 transition-colors', copied ? 'text-green-400' : 'text-gray-400']" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>