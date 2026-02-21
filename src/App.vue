<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Hexagon, Lock, GitBranch, Link, Terminal, Menu, X, FileJson, ArrowRightLeft, Regex, Clock, Fingerprint, Palette, BoxSelect, Type, ShieldCheck, KeyRound, Split, Timer, Binary, Search, Eye, QrCode, FileCode, Braces, Maximize2, Minimize2 } from 'lucide-vue-next'
import PayloadModeler from './components/PayloadModeler.vue'
import JwtInspector from './components/JwtInspector.vue'
import TicketToGit from './components/TicketToGit.vue'
import StateSurgeon from './components/StateSurgeon.vue'
import JsonFormatter from './components/JsonFormatter.vue'
import StringConverter from './components/StringConverter.vue'
import RegexTester from './components/RegexTester.vue'
import EpochConverter from './components/EpochConverter.vue'
import HashGenerator from './components/HashGenerator.vue'
import ColorConverter from './components/ColorConverter.vue'
import CSSShadowGen from './components/CSSShadowGen.vue'
import LoremGenerator from './components/LoremGenerator.vue'
import UuidGenerator from './components/UuidGenerator.vue'
import DiffViewer from './components/DiffViewer.vue'
import CronParser from './components/CronParser.vue'
import NumberBase from './components/NumberBase.vue'
import MarkdownPreview from './components/MarkdownPreview.vue'
import QrGenerator from './components/QrGenerator.vue'
import XmlSqlFormatter from './components/XmlSqlFormatter.vue'
import JsonPath from './components/JsonPath.vue'
import About from './components/About.vue'
import Welcome from './components/Welcome.vue'

const activeTool = ref('welcome')
const isSidebarOpen = ref(true)
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

// Detect if running in a full tab (not the popup)
const isTabMode = ref(false)

function detectMode() {
  // Chrome extension popups have a max width of 800px and are constrained.
  // When opened as a tab, the page gets the full viewport.
  // We check if the URL was opened with ?tab=1 or if we're wider than popup max.
  const params = new URLSearchParams(window.location.search)
  isTabMode.value = params.has('tab') || window.innerWidth > 820
}

function popOutToTab() {
  // Open this extension's index.html in a new tab
  const url = typeof chrome !== 'undefined' && chrome.runtime?.getURL
    ? chrome.runtime.getURL('index.html?tab=1')
    : window.location.origin + window.location.pathname + '?tab=1'

  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    chrome.tabs.create({ url })
    window.close() // Close the popup
  } else {
    // Fallback for dev mode
    window.open(url, '_blank')
  }
}

const tools = [
  { id: 'modeler', name: 'Payload Modeler', icon: Hexagon, desc: 'JSON to Go & TS', category: 'transform' },
  { id: 'json', name: 'JSON Formatter', icon: FileJson, desc: 'Prettify & Validate', category: 'transform' },
  { id: 'jwt', name: 'JWT Inspector', icon: Lock, desc: 'Decode & Validate Auth', category: 'security' },
  { id: 'string', name: 'String Utils', icon: ArrowRightLeft, desc: 'Base64 & URL Encode', category: 'transform' },
  { id: 'regex', name: 'Regex Tester', icon: Regex, desc: 'Test Patterns', category: 'transform' },
  { id: 'epoch', name: 'Epoch Time', icon: Clock, desc: 'Unix Timestamp Gen', category: 'convert' },
  { id: 'hash', name: 'Hash Generator', icon: Fingerprint, desc: 'SHA-256, SHA-512', category: 'security' },
  { id: 'color', name: 'Color Converter', icon: Palette, desc: 'HEX, RGB, HSL', category: 'convert' },
  { id: 'shadow', name: 'CSS Shadow', icon: BoxSelect, desc: 'Visual Builder', category: 'css' },
  { id: 'lorem', name: 'Lorem Ipsum', icon: Type, desc: 'Mock Text Gen', category: 'generate' },
  { id: 'uuid', name: 'UUID Generator', icon: KeyRound, desc: 'UUID v4, Batch Gen', category: 'generate' },
  { id: 'diff', name: 'Diff Viewer', icon: Split, desc: 'Compare Text', category: 'transform' },
  { id: 'cron', name: 'Cron Parser', icon: Timer, desc: 'Explain & Schedule', category: 'convert' },
  { id: 'base', name: 'Number Base', icon: Binary, desc: 'Bin, Oct, Dec, Hex', category: 'convert' },
  { id: 'markdown', name: 'Markdown Preview', icon: Eye, desc: 'Live Render', category: 'transform' },
  { id: 'qr', name: 'QR Generator', icon: QrCode, desc: 'Text & URL to QR', category: 'generate' },
  { id: 'xmlsql', name: 'XML / SQL', icon: FileCode, desc: 'Format & Minify', category: 'transform' },
  { id: 'jsonpath', name: 'JSON Path', icon: Braces, desc: 'Query & Extract', category: 'transform' },
  { id: 'git', name: 'Ticket-to-Git', icon: GitBranch, desc: 'One-click Branch Gen', category: 'git' },
  { id: 'surgeon', name: 'State Surgeon', icon: Link, desc: 'Nuke State & Edit URL', category: 'browser' },
  { id: 'about', name: 'Privacy & Legal', icon: ShieldCheck, desc: 'Zero Data Collection', category: 'info' }
]

const filteredTools = computed(() => {
  if (!searchQuery.value.trim()) return tools
  const q = searchQuery.value.toLowerCase()
  return tools.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.desc.toLowerCase().includes(q) ||
    t.category.includes(q)
  )
})

const componentMap: Record<string, any> = {
  modeler: PayloadModeler,
  json: JsonFormatter,
  jwt: JwtInspector,
  string: StringConverter,
  regex: RegexTester,
  epoch: EpochConverter,
  hash: HashGenerator,
  color: ColorConverter,
  shadow: CSSShadowGen,
  lorem: LoremGenerator,
  uuid: UuidGenerator,
  diff: DiffViewer,
  cron: CronParser,
  base: NumberBase,
  markdown: MarkdownPreview,
  qr: QrGenerator,
  xmlsql: XmlSqlFormatter,
  jsonpath: JsonPath,
  git: TicketToGit,
  surgeon: StateSurgeon,
  about: About,
}

const currentComponent = computed(() => componentMap[activeTool.value] || Welcome)

function onKeydown(e: KeyboardEvent) {
  if (e.key === '/' && !isInputFocused()) {
    e.preventDefault()
    searchInputRef.value?.focus()
  }
  if (e.key === 'Escape') {
    searchQuery.value = ''
    searchInputRef.value?.blur()
  }
}

function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

onMounted(() => {
  detectMode()
  document.addEventListener('keydown', onKeydown)
  // Update body class for tab mode styling
  if (isTabMode.value) {
    document.body.classList.add('tab-mode')
  }
})
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div :class="['flex h-screen overflow-hidden bg-dark-900 text-gray-200', isTabMode ? 'w-full' : 'w-[800px]']">
    <!-- Sidebar -->
    <aside :class="['bg-dark-800 border-r border-dark-700 transition-all duration-300 flex flex-col', isSidebarOpen ? 'w-64' : 'w-16']">
      <div class="h-14 flex items-center justify-between px-4 border-b border-dark-700">
        <div class="flex items-center gap-2 overflow-hidden whitespace-nowrap" v-if="isSidebarOpen">
          <Terminal class="w-5 h-5 text-neon-blue" />
          <span class="font-bold text-base bg-gradient-to-r from-neon-blue to-neon-purple text-transparent bg-clip-text tracking-wide">GTools</span>
        </div>
        <button @click="isSidebarOpen = !isSidebarOpen" class="p-1 hover:bg-dark-700 rounded-md transition-colors text-gray-400 hover:text-white">
          <Menu class="w-5 h-5" v-if="!isSidebarOpen" />
          <X class="w-5 h-5" v-else />
        </button>
      </div>

      <!-- Search -->
      <div v-if="isSidebarOpen" class="px-2.5 pt-3 pb-1">
        <div class="relative">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="w-full bg-dark-900/60 border border-dark-700 rounded-lg pl-8 pr-8 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-neon-blue/40 focus:border-neon-blue/40 transition"
            placeholder="Search tools...  /"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <X class="w-3 h-3" />
          </button>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        <button v-for="tool in filteredTools" :key="tool.id"
          @click="activeTool = tool.id; searchQuery = ''"
          :class="['w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                   activeTool === tool.id ? 'bg-dark-700 shadow-md shadow-black/20 text-white' : 'hover:bg-dark-700/50 text-gray-400 hover:text-gray-200']">

          <component :is="tool.icon" :class="['w-[18px] h-[18px] shrink-0 transition-colors', activeTool === tool.id ? 'text-neon-blue' : 'group-hover:text-neon-blue/70']" />

          <div class="flex flex-col items-start text-left overflow-hidden transition-opacity duration-200" v-if="isSidebarOpen">
            <span class="font-medium text-[13px] leading-tight whitespace-nowrap">{{ tool.name }}</span>
            <span class="text-[10px] text-gray-500 truncate w-full leading-tight">{{ tool.desc }}</span>
          </div>

          <!-- Active Indicator -->
          <div v-if="activeTool === tool.id" class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-neon-blue rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
        </button>

        <div v-if="searchQuery && !filteredTools.length" class="text-center py-6 text-gray-600 text-xs">
          No tools match "{{ searchQuery }}"
        </div>
      </nav>

      <div class="px-4 py-3 border-t border-dark-700 text-[10px] text-center text-gray-600 overflow-hidden whitespace-nowrap transition-opacity duration-300" :class="isSidebarOpen ? 'opacity-100' : 'opacity-0'">
        v1.0.0 &bull; Venkat Dhurjati & Nandak Dhurjati
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col relative bg-gradient-to-br from-dark-900 to-dark-800">
      <header class="h-14 flex items-center justify-between px-6 border-b border-dark-800 bg-dark-900/50 backdrop-blur-md absolute top-0 w-full z-10">
        <h1 class="text-lg font-semibold text-gray-100">{{ tools.find(t => t.id === activeTool)?.name || 'Welcome to GTools' }}</h1>
        <button
          v-if="!isTabMode"
          @click="popOutToTab"
          class="p-1.5 hover:bg-dark-700 rounded-lg transition-colors text-gray-500 hover:text-white group"
          title="Open in full tab"
        >
          <Maximize2 class="w-4 h-4 transition-transform group-hover:scale-110" />
        </button>
      </header>

      <div class="flex-1 overflow-y-auto mt-14 p-5 scroll-smooth">
        <transition name="fade" mode="out-in">
          <component :is="currentComponent" :key="activeTool" />
        </transition>
      </div>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
