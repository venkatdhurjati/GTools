<script setup lang="ts">
import { ShieldCheck, FileText, Scale, Heart } from 'lucide-vue-next'
</script>

<template>
  <div class="h-full flex flex-col space-y-8 animate-in fade-in duration-300 overflow-y-auto pr-2 pb-8">
    
    <div class="text-center space-y-4 max-w-2xl mx-auto pt-8">
      <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 text-white mb-2 ring-1 ring-white/10 shadow-xl">
        <ShieldCheck class="w-10 h-10 text-neon-blue" />
      </div>
      <h2 class="text-3xl font-bold text-white tracking-tight">Privacy & Legal</h2>
      <p class="text-gray-400 text-sm">Built by developers, for developers. We respect your data.</p>
    </div>

    <div class="max-w-3xl mx-auto w-full space-y-6">
      
      <!-- Privacy Policy -->
      <div class="glass-panel p-6 space-y-4">
        <h3 class="text-lg font-bold text-white flex items-center gap-2 border-b border-dark-700 pb-2">
          <FileText class="w-5 h-5 text-neon-blue"/> Privacy Policy
        </h3>
        <div class="space-y-3 text-sm text-gray-300 leading-relaxed">
          <p><strong>Zero Data Collection:</strong> GTools operates entirely locally within your browser. We do not track, collect, store, or transmit any of your personal data, source code, tokens, URLs, or usage metrics to any external servers.</p>
          <p><strong>Local Processing:</strong> All parsing, formatting, hashing, and encoding happens strictly in the client-side JavaScript of this extension. Your sensitive JSON payloads, JWTs, and API keys never leave your device.</p>
          <p><strong>Minimal Permissions (2 only):</strong></p>
          <ul class="list-disc pl-5 space-y-1 text-gray-400">
            <li><code class="text-neon-cyan bg-dark-900 px-1 py-0.5 rounded">activeTab</code>: Used exclusively by the "Ticket-to-Git" and "State Surgeon" tools to read the current tab's title and URL when you explicitly click the tool. No background access.</li>
            <li><code class="text-neon-cyan bg-dark-900 px-1 py-0.5 rounded">scripting</code>: Required for the "State Surgeon" tool to execute the local script that clears localStorage and sessionStorage for the active tab. Only runs on user action.</li>
          </ul>
          <p class="text-gray-500 text-xs mt-2">Clipboard operations use the standard <code class="text-neon-cyan bg-dark-900 px-1 py-0.5 rounded">navigator.clipboard</code> API triggered by user gestures — no extra permission required.</p>
        </div>
      </div>

      <!-- Legal Disclaimer -->
      <div class="glass-panel p-6 space-y-4">
        <h3 class="text-lg font-bold text-white flex items-center gap-2 border-b border-dark-700 pb-2">
          <Scale class="w-5 h-5 text-neon-purple"/> Legal Disclaimer
        </h3>
        <div class="space-y-3 text-sm text-gray-300 leading-relaxed">
          <p><strong>"AS IS" Basis:</strong> GTools is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
          <p><strong>Limitation of Liability:</strong> In no event shall the authors (Venkat Dhurjati & Nandak Dhurjati) or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the software.</p>
          <p><strong>Data Loss:</strong> Tools like "State Surgeon" are designed to aggressively delete browser state. Use these tools at your own risk. The authors are not responsible for any accidental loss of unsaved work or login sessions.</p>
        </div>
      </div>

      <div class="text-center text-xs text-gray-500 pt-8 pb-4 flex items-center justify-center gap-1">
        Made with <Heart class="w-3 h-3 text-red-500 mx-1 inline" /> by Venkat Dhurjati & Nandak Dhurjati &copy; {{ new Date().getFullYear() }}
      </div>

    </div>
  </div>
</template>