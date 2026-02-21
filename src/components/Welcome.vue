<script setup lang="ts">
import { Rocket, Wand2, ShieldCheck, Zap } from 'lucide-vue-next'

const features = [
  { icon: Wand2, title: 'Minimal Permissions', desc: 'Only 2 permissions. No background scripts, no data collection.' },
  { icon: Zap, title: 'Instant Execution', desc: '20 tools, zero network calls. Results in milliseconds.' },
  { icon: ShieldCheck, title: 'Secure by Design', desc: 'Tokens and states never leave your browser.' }
]
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
    
    <div class="relative group">
      <div class="absolute -inset-1 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
      <div class="relative bg-dark-900 ring-1 ring-gray-800 rounded-full p-6">
        <Rocket class="w-16 h-16 text-white" />
      </div>
    </div>

    <div class="space-y-4 max-w-md">
      <h2 class="text-3xl font-bold bg-gradient-to-br from-white to-gray-500 bg-clip-text text-transparent">Developer Swiss Army Knife</h2>
      <p class="text-gray-400">20 developer tools in one extension. Select from the sidebar or press <kbd class="bg-dark-700 px-1.5 py-0.5 rounded text-gray-300 text-xs font-mono">/</kbd> to search.</p>
    </div>

    <div class="grid grid-cols-3 gap-4 w-full mt-8">
      <div v-for="feat in features" :key="feat.title" class="glass-panel p-4 flex flex-col items-center text-center space-y-3 hover:-translate-y-1 transition-transform">
        <div class="p-2 bg-dark-700/50 rounded-lg text-neon-blue">
          <component :is="feat.icon" class="w-6 h-6" />
        </div>
        <h3 class="font-medium text-sm text-gray-200">{{ feat.title }}</h3>
        <p class="text-xs text-gray-500 leading-relaxed">{{ feat.desc }}</p>
      </div>
    </div>
  </div>
</template>