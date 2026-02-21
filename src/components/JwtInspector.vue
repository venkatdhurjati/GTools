<script setup lang="ts">
import { ref, computed } from 'vue'
import { ShieldAlert, ShieldCheck, Clock, Key } from 'lucide-vue-next'

const jwtInput = ref('')
const decodedHeader = ref('')
const decodedPayload = ref<any>(null)
const errorMsg = ref('')

const isExpired = computed(() => {
  if (!decodedPayload.value?.exp) return false
  return (decodedPayload.value.exp * 1000) < Date.now()
})

const timeRemaining = computed(() => {
  if (!decodedPayload.value?.exp) return ''
  const diff = (decodedPayload.value.exp * 1000) - Date.now()
  if (diff < 0) return 'Expired'
  const min = Math.floor(diff / 60000)
  return `Expires in ~${min} mins`
})

const decodeJwt = () => {
  errorMsg.value = ''
  decodedHeader.value = ''
  decodedPayload.value = null

  if (!jwtInput.value) return

  try {
    const parts = jwtInput.value.split('.')
    if (parts.length !== 3) throw new Error('Invalid JWT format')
    
    decodedHeader.value = JSON.stringify(JSON.parse(atob(parts[0])), null, 2)
    decodedPayload.value = JSON.parse(atob(parts[1]))
  } catch (e) {
    errorMsg.value = 'Failed to decode JWT. Ensure it is a valid token.'
  }
}
</script>

<template>
  <div class="flex flex-col h-full space-y-6">
    <div class="space-y-2">
      <label class="text-sm text-gray-400 font-medium">Paste JWT Token</label>
      <textarea 
        v-model="jwtInput" 
        @input="decodeJwt"
        class="input-field h-24 resize-none font-mono text-xs break-all" 
        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."></textarea>
    </div>

    <div v-if="errorMsg" class="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm flex items-center gap-2">
      <ShieldAlert class="w-5 h-5" /> {{ errorMsg }}
    </div>

    <div v-if="decodedPayload" class="flex-1 grid grid-cols-2 gap-4 overflow-hidden animate-in fade-in duration-300">
      <div class="flex flex-col space-y-4 overflow-y-auto">
        
        <!-- Status Card -->
        <div :class="['glass-panel p-4 flex items-center gap-4 transition-colors', isExpired ? 'border-red-500/50 bg-red-500/5' : 'border-green-500/30 bg-green-500/5']">
          <div :class="['p-3 rounded-full', isExpired ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400']">
            <ShieldAlert v-if="isExpired" class="w-6 h-6" />
            <ShieldCheck v-else class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-bold text-lg" :class="isExpired ? 'text-red-400' : 'text-green-400'">
              {{ isExpired ? 'Token Expired' : 'Token Active' }}
            </h3>
            <p v-if="decodedPayload.exp" class="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <Clock class="w-3 h-3" /> {{ timeRemaining }}
            </p>
          </div>
        </div>

        <div class="glass-panel p-4 space-y-2">
          <h4 class="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2"><Key class="w-3 h-3"/> Header</h4>
          <pre class="text-xs text-neon-cyan font-mono overflow-x-auto">{{ decodedHeader }}</pre>
        </div>
      </div>

      <div class="glass-panel p-4 flex flex-col space-y-2">
        <h4 class="text-xs font-semibold text-gray-500 uppercase">Payload</h4>
        <pre class="text-xs text-neon-blue font-mono overflow-auto flex-1">{{ JSON.stringify(decodedPayload, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>