<script setup lang="ts">
import { ref, computed } from 'vue'
import { Copy, Check } from 'lucide-vue-next'

const input = ref(`# Hello World

This is a **bold** statement and this is *italic*.

## Features

- Item one
- Item two
- Item three

### Code Block

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

Inline \`code\` works too.

> This is a blockquote. It can span
> multiple lines.

| Column A | Column B | Column C |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

---

1. First ordered item
2. Second ordered item
3. Third ordered item

[Visit GitHub](https://github.com)

![Alt text](https://via.placeholder.com/100)
`)

const copied = ref(false)

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const rendered = computed(() => {
  let md = input.value

  // Code blocks (fenced)
  md = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    return `<pre class="md-pre"><code class="md-code">${escapeHtml(code.trimEnd())}</code></pre>`
  })

  // Inline code
  md = md.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')

  // Tables
  md = md.replace(/^(\|.+\|)\n(\|[-\s:|]+\|)\n((?:\|.+\|\n?)+)/gm, (_m, header, _sep, body) => {
    const ths = header.split('|').filter((c: string) => c.trim()).map((c: string) => `<th class="md-th">${c.trim()}</th>`).join('')
    const rows = body.trim().split('\n').map((row: string) => {
      const tds = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td class="md-td">${c.trim()}</td>`).join('')
      return `<tr>${tds}</tr>`
    }).join('')
    return `<table class="md-table"><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`
  })

  // Headings
  md = md.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
  md = md.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
  md = md.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')

  // Horizontal rule
  md = md.replace(/^---$/gm, '<hr class="md-hr"/>')

  // Blockquote
  md = md.replace(/^(?:>\s?(.*)(?:\n|$))+/gm, (match) => {
    const content = match.replace(/^>\s?/gm, '').trim()
    return `<blockquote class="md-blockquote">${content}</blockquote>`
  })

  // Images
  md = md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img"/>')

  // Links
  md = md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="md-link" target="_blank" rel="noopener">$1</a>')

  // Bold + italic
  md = md.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  md = md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  md = md.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Ordered list
  md = md.replace(/^(\d+)\.\s+(.+)$/gm, '<li class="md-oli">$2</li>')
  md = md.replace(/((?:<li class="md-oli">.*<\/li>\n?)+)/g, '<ol class="md-ol">$1</ol>')

  // Unordered list
  md = md.replace(/^[-*]\s+(.+)$/gm, '<li class="md-uli">$1</li>')
  md = md.replace(/((?:<li class="md-uli">.*<\/li>\n?)+)/g, '<ul class="md-ul">$1</ul>')

  // Paragraphs — wrap remaining loose text
  md = md.replace(/^(?!<[a-z/])(.+)$/gm, '<p class="md-p">$1</p>')

  // Clean up double line breaks
  md = md.replace(/\n{2,}/g, '\n')

  return md
})

async function copyHtml() {
  await navigator.clipboard.writeText(rendered.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <div class="h-full flex flex-col space-y-3">
    <div class="flex items-center justify-end">
      <button @click="copyHtml" class="btn-primary py-1.5 px-3 text-xs">
        <component :is="copied ? Check : Copy" class="w-3.5 h-3.5" />
        {{ copied ? 'Copied!' : 'Copy HTML' }}
      </button>
    </div>

    <div class="grid grid-cols-2 gap-3 flex-1 min-h-0">
      <div class="flex flex-col space-y-1.5">
        <label class="text-xs text-gray-500 font-medium">Markdown</label>
        <textarea
          v-model="input"
          class="input-field flex-1 resize-none font-mono text-xs leading-relaxed"
          placeholder="Type markdown here..."
          spellcheck="false"
        ></textarea>
      </div>

      <div class="flex flex-col space-y-1.5">
        <label class="text-xs text-gray-500 font-medium">Preview</label>
        <div class="glass-panel flex-1 p-4 overflow-y-auto md-preview" v-html="rendered"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.md-preview :deep(.md-h1) { font-size: 1.5rem; font-weight: 700; color: #f4f4f5; margin: 0.8em 0 0.4em; line-height: 1.3; }
.md-preview :deep(.md-h2) { font-size: 1.2rem; font-weight: 600; color: #e4e4e7; margin: 0.7em 0 0.3em; line-height: 1.3; }
.md-preview :deep(.md-h3) { font-size: 1rem; font-weight: 600; color: #d4d4d8; margin: 0.6em 0 0.3em; line-height: 1.3; }
.md-preview :deep(.md-p) { font-size: 0.8rem; color: #a1a1aa; margin: 0.3em 0; line-height: 1.6; }
.md-preview :deep(.md-pre) { background: #09090b; border: 1px solid #27272a; border-radius: 8px; padding: 12px; margin: 0.5em 0; overflow-x: auto; }
.md-preview :deep(.md-code) { font-family: SF Mono, Fira Code, Menlo, monospace; font-size: 0.75rem; color: #06b6d4; }
.md-preview :deep(.md-inline-code) { font-family: SF Mono, Fira Code, Menlo, monospace; font-size: 0.75rem; color: #06b6d4; background: #18181b; padding: 2px 6px; border-radius: 4px; }
.md-preview :deep(.md-blockquote) { border-left: 3px solid #3b82f6; padding: 0.4em 0.8em; margin: 0.5em 0; color: #a1a1aa; font-size: 0.8rem; background: rgba(59, 130, 246, 0.05); border-radius: 0 6px 6px 0; }
.md-preview :deep(.md-link) { color: #3b82f6; text-decoration: none; font-size: 0.8rem; }
.md-preview :deep(.md-link:hover) { text-decoration: underline; }
.md-preview :deep(.md-ul),
.md-preview :deep(.md-ol) { padding-left: 1.4em; margin: 0.3em 0; }
.md-preview :deep(.md-uli) { list-style: disc; font-size: 0.8rem; color: #a1a1aa; margin: 0.15em 0; }
.md-preview :deep(.md-oli) { list-style: decimal; font-size: 0.8rem; color: #a1a1aa; margin: 0.15em 0; }
.md-preview :deep(.md-hr) { border: none; border-top: 1px solid #27272a; margin: 0.8em 0; }
.md-preview :deep(.md-table) { width: 100%; border-collapse: collapse; margin: 0.5em 0; font-size: 0.75rem; }
.md-preview :deep(.md-th) { border: 1px solid #27272a; padding: 6px 10px; background: #18181b; color: #d4d4d8; text-align: left; font-weight: 600; }
.md-preview :deep(.md-td) { border: 1px solid #27272a; padding: 6px 10px; color: #a1a1aa; }
.md-preview :deep(.md-img) { max-width: 100%; border-radius: 6px; margin: 0.4em 0; }
.md-preview :deep(strong) { color: #e4e4e7; font-weight: 600; }
.md-preview :deep(em) { color: #d4d4d8; font-style: italic; }
</style>
