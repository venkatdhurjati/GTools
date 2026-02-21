<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Link, Trash2, Save, RefreshCw, AlertTriangle, X } from 'lucide-vue-next'

const urlParams = ref<{key: string, value: string}[]>([])
const currentUrl = ref('')
const loading = ref(false)
const showNukeConfirm = ref(false)

const loadTabState = async () => {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.url) {
      currentUrl.value = tab.url
      const url = new URL(tab.url)
      const params = Array.from(url.searchParams.entries())
      urlParams.value = params.map(([key, value]) => ({ key, value }))
    }
  } else {
    // Mock for local dev
    currentUrl.value = 'http://localhost:3000/dashboard?user=123&theme=dark'
    urlParams.value = [{ key: 'user', value: '123' }, { key: 'theme', value: 'dark' }]
  }
}

onMounted(loadTabState)

const addParam = () => urlParams.value.push({ key: '', value: '' })

const removeParam = (index: number) => urlParams.value.splice(index, 1)

const updateUrl = async () => {
  if (typeof chrome === 'undefined' || !chrome.tabs) return

  loading.value = true
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id && currentUrl.value) {
    try {
      const url = new URL(currentUrl.value)
      url.search = '' // Clear existing
      urlParams.value.forEach(p => {
        if (p.key) url.searchParams.append(p.key, p.value)
      })
      
      await chrome.tabs.update(tab.id, { url: url.toString() })
      setTimeout(loadTabState, 500)
    } catch (e) {
      console.error(e)
    }
  }
  loading.value = false
}

const confirmNuke = () => {
  showNukeConfirm.value = true
}

const cancelNuke = () => {
  showNukeConfirm.value = false
}

const nukeState = async () => {
  showNukeConfirm.value = false

  if (typeof chrome === 'undefined' || !chrome.scripting || !chrome.tabs) {
    return
  }

  loading.value = true
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        localStorage.clear()
        sessionStorage.clear()
        
        // Also clear cookies for current domain
        const cookies = document.cookie.split(';')
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i]
          const eqPos = cookie.indexOf('=')
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
        }
        
        window.location.reload()
      }
    })
    setTimeout(loadTabState, 1000)
  }
  loading.value = false
}
</script>

<template>
  <div class="h-full flex flex-col space-y-6">
    
    <div class="glass-panel p-6 border-red-500/20 bg-gradient-to-r from-red-500/10 to-transparent">
      <div v-if="!showNukeConfirm" class="flex items-center justify-between">
        <div class="space-y-1">
          <h3 class="text-red-400 font-bold flex items-center gap-2"><AlertTriangle class="w-5 h-5"/> Danger Zone</h3>
          <p class="text-xs text-gray-400">Wipe localStorage, sessionStorage, and cookies for this tab.</p>
        </div>
        <button @click="confirmNuke" class="btn-primary !bg-gradient-to-r !from-red-600 !to-red-500 !shadow-red-500/20 whitespace-nowrap" :disabled="loading">
          <Trash2 class="w-4 h-4"/> Nuke State
        </button>
      </div>
      <div v-else class="space-y-3">
        <p class="text-red-300 text-sm font-medium flex items-center gap-2">
          <AlertTriangle class="w-4 h-4 shrink-0"/> This will permanently clear all storage and cookies for the current tab. You may be logged out.
        </p>
        <div class="flex gap-2 justify-end">
          <button @click="cancelNuke" class="btn-secondary py-1.5 px-4 text-sm">Cancel</button>
          <button @click="nukeState" class="btn-primary !bg-gradient-to-r !from-red-600 !to-red-500 !shadow-red-500/20 py-1.5 px-4 text-sm">
            <Trash2 class="w-4 h-4"/> Confirm Nuke
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col min-h-0 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-gray-200 flex items-center gap-2"><Link class="w-4 h-4"/> Query Parameters</h3>
        <button @click="addParam" class="text-xs text-neon-blue hover:underline">+ Add Param</button>
      </div>

      <div class="flex-1 overflow-y-auto space-y-2 pr-2">
        <div v-if="urlParams.length === 0" class="text-center p-8 text-gray-500 text-sm border border-dashed border-dark-600 rounded-xl">
          No query parameters found in the current URL.
        </div>
        
        <div v-for="(param, i) in urlParams" :key="i" class="flex gap-2 items-center group">
          <input v-model="param.key" placeholder="Key" class="input-field flex-1 !py-1.5 font-mono text-sm" />
          <span class="text-gray-500">=</span>
          <input v-model="param.value" placeholder="Value" class="input-field flex-1 !py-1.5 font-mono text-sm" />
          <button @click="removeParam(i)" class="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="pt-4 border-t border-dark-700 flex justify-end gap-3">
        <button @click="loadTabState" class="btn-secondary py-1.5 text-sm" :disabled="loading">
          <RefreshCw class="w-4 h-4"/> Reload URL
        </button>
        <button @click="updateUrl" class="btn-primary py-1.5 text-sm" :disabled="loading">
          <Save class="w-4 h-4"/> Apply Changes
        </button>
      </div>
    </div>
  </div>
</template>