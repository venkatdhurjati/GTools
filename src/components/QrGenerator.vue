<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Copy, Check, Download } from 'lucide-vue-next'

const input = ref('https://github.com/venkatdhurjati/GTools')
const size = ref(256)
const fgColor = ref('#ffffff')
const bgColor = ref('#09090b')
const canvasRef = ref<HTMLCanvasElement | null>(null)
const copied = ref(false)

// QR Code generator — ISO 18004, Mode Byte, ECC Level M
// Implements Reed-Solomon error correction with GF(2^8)

const EC_LEVEL = 1 // 0=L, 1=M, 2=Q, 3=H

// Galois Field GF(2^8) with primitive polynomial 0x11d
const GF_EXP = new Uint8Array(512)
const GF_LOG = new Uint8Array(256)
;(() => {
  let x = 1
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x
    GF_LOG[x] = i
    x = x << 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255]
})()

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return GF_EXP[GF_LOG[a] + GF_LOG[b]]
}

function rsGenPoly(nsym: number): Uint8Array {
  let g = new Uint8Array([1])
  for (let i = 0; i < nsym; i++) {
    const ng = new Uint8Array(g.length + 1)
    for (let j = g.length - 1; j >= 0; j--) {
      ng[j + 1] ^= g[j]
      ng[j] ^= gfMul(g[j], GF_EXP[i])
    }
    g = ng
  }
  return g
}

function rsEncode(data: Uint8Array, nsym: number): Uint8Array {
  const gen = rsGenPoly(nsym)
  const out = new Uint8Array(data.length + nsym)
  out.set(data)
  for (let i = 0; i < data.length; i++) {
    const coef = out[i]
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        out[i + j] ^= gfMul(gen[j], coef)
      }
    }
  }
  return out.slice(data.length)
}

// QR version capacity table: [totalCodewords, ecCodewordsPerBlock, numBlocks]
const VERSION_TABLE: [number, number, number][][] = [
  // Version 1-10 for EC level M
  [], // dummy index 0
  [[26, 10, 1]], // v1
  [[44, 16, 1]], // v2
  [[70, 26, 1]], // v3
  [[100, 18, 2]], // v4
  [[134, 24, 2]], // v5
  [[172, 16, 4]], // v6
  [[196, 18, 4]], // v7
  [[242, 24, 4]], // v8 — 2 groups
  [[292, 30, 4]], // v9 — 2 groups
  [[346, 18, 6]], // v10 — 2+4 groups (simplified)
]

// Data capacity (bytes) per version at EC M
const DATA_CAP = [0, 16, 28, 44, 64, 86, 108, 124, 154, 182, 216]

function getVersion(len: number): number {
  for (let v = 1; v <= 10; v++) {
    if (len <= DATA_CAP[v]) return v
  }
  return 10 // cap at version 10
}

function getModuleCount(ver: number): number {
  return 17 + ver * 4
}

function encodeData(text: string, version: number): Uint8Array {
  const bytes = new TextEncoder().encode(text)
  const totalData = DATA_CAP[version]
  const data = new Uint8Array(totalData)
  let pos = 0

  // Mode indicator: Byte mode = 0100
  // Character count: 8 bits for v1-9, 16 bits for v10+
  const countBits = version <= 9 ? 8 : 16
  let bitBuf = 0
  let bitLen = 0

  function writeBits(val: number, len: number) {
    bitBuf = (bitBuf << len) | val
    bitLen += len
    while (bitLen >= 8) {
      bitLen -= 8
      if (pos < totalData) data[pos++] = (bitBuf >> bitLen) & 0xff
    }
  }

  writeBits(0b0100, 4) // Byte mode
  writeBits(bytes.length, countBits)
  for (const b of bytes) writeBits(b, 8)
  writeBits(0, 4) // Terminator

  // Flush remaining bits
  if (bitLen > 0 && pos < totalData) {
    data[pos++] = (bitBuf << (8 - bitLen)) & 0xff
  }

  // Pad with alternating bytes
  let padByte = 0xec
  while (pos < totalData) {
    data[pos++] = padByte
    padByte = padByte === 0xec ? 0x11 : 0xec
  }

  return data
}

function buildMatrix(text: string): boolean[][] | null {
  if (!text) return null
  const bytes = new TextEncoder().encode(text)
  if (bytes.length > DATA_CAP[10]) return null // Too long

  const version = getVersion(bytes.length)
  const n = getModuleCount(version)
  const matrix: (boolean | null)[][] = Array.from({ length: n }, () => Array(n).fill(null))

  // Place finder patterns
  function placeFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const mr = row + r, mc = col + c
        if (mr < 0 || mr >= n || mc < 0 || mc >= n) continue
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          matrix[mr][mc] = false // separator
        } else if ((r === 0 || r === 6) || (c === 0 || c === 6) || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          matrix[mr][mc] = true
        } else {
          matrix[mr][mc] = false
        }
      }
    }
  }

  placeFinder(0, 0)
  placeFinder(0, n - 7)
  placeFinder(n - 7, 0)

  // Timing patterns
  for (let i = 8; i < n - 8; i++) {
    if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0
    if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0
  }

  // Dark module
  matrix[n - 8][8] = true

  // Reserve format info areas
  for (let i = 0; i < 8; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false
    if (matrix[8][n - 1 - i] === null) matrix[8][n - 1 - i] = false
    if (matrix[i][8] === null) matrix[i][8] = false
    if (matrix[n - 1 - i][8] === null) matrix[n - 1 - i][8] = false
  }
  if (matrix[8][8] === null) matrix[8][8] = false

  // Alignment patterns (version >= 2)
  if (version >= 2) {
    const positions = getAlignmentPositions(version)
    for (const r of positions) {
      for (const c of positions) {
        if (matrix[r][c] !== null) continue // Skip if overlaps finder
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const dark = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0)
            matrix[r + dr][c + dc] = dark
          }
        }
      }
    }
  }

  // Encode data with error correction
  const dataBytes = encodeData(text, version)
  const [totalCw, ecPerBlock, numBlocks] = VERSION_TABLE[version][0]
  const dataPerBlock = Math.floor(dataBytes.length / numBlocks)

  // Generate EC codewords for each block
  const allData: number[] = []
  const allEc: number[][] = []

  for (let b = 0; b < numBlocks; b++) {
    const blockData = dataBytes.slice(b * dataPerBlock, (b + 1) * dataPerBlock)
    const ec = rsEncode(blockData, ecPerBlock)
    allEc.push(Array.from(ec))
    for (let i = 0; i < blockData.length; i++) {
      if (i >= allData.length / numBlocks * (b + 1) - allData.length / numBlocks * b || true) {
        // Interleave later
      }
    }
  }

  // Interleave data codewords
  const interleaved: number[] = []
  for (let i = 0; i < dataPerBlock; i++) {
    for (let b = 0; b < numBlocks; b++) {
      interleaved.push(dataBytes[b * dataPerBlock + i])
    }
  }
  // Interleave EC codewords
  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < numBlocks; b++) {
      interleaved.push(allEc[b][i])
    }
  }

  // Convert to bit stream
  const bits: boolean[] = []
  for (const byte of interleaved) {
    for (let bit = 7; bit >= 0; bit--) {
      bits.push(((byte >> bit) & 1) === 1)
    }
  }

  // Place data bits in zigzag pattern
  let bitIdx = 0
  let upward = true
  for (let col = n - 1; col >= 0; col -= 2) {
    if (col === 6) col = 5 // Skip timing column
    const rows = upward ? Array.from({ length: n }, (_, i) => n - 1 - i) : Array.from({ length: n }, (_, i) => i)
    for (const row of rows) {
      for (const dc of [0, -1]) {
        const c = col + dc
        if (c < 0) continue
        if (matrix[row][c] !== null) continue
        matrix[row][c] = bitIdx < bits.length ? bits[bitIdx++] : false
      }
    }
    upward = !upward
  }

  // Apply mask pattern 0 (checkerboard: (row + col) % 2 === 0)
  const masked = matrix.map((r, ri) => r.map((v, ci) => {
    if (isReserved(ri, ci, n, version)) return v as boolean
    const mask = (ri + ci) % 2 === 0
    return (v as boolean) !== mask
  }))

  // Write format info for mask 0, EC level M
  const formatBits = getFormatBits(EC_LEVEL, 0)
  writeFormatInfo(masked, n, formatBits)

  return masked as boolean[][]
}

function isReserved(r: number, c: number, n: number, _ver: number): boolean {
  // Finder + separator + format
  if (r <= 8 && c <= 8) return true
  if (r <= 8 && c >= n - 8) return true
  if (r >= n - 8 && c <= 8) return true
  // Timing
  if (r === 6 || c === 6) return true
  return false
}

function getAlignmentPositions(ver: number): number[] {
  if (ver === 1) return []
  const positions: number[][] = [
    [], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
    [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]
  ]
  return positions[ver] || []
}

function getFormatBits(ecLevel: number, mask: number): boolean[] {
  const ecBits = [1, 0, 3, 2][ecLevel] // L=01, M=00, Q=11, H=10
  let data = (ecBits << 3) | mask
  let rem = data
  for (let i = 0; i < 10; i++) {
    rem = (rem << 1) ^ ((rem >> 9) * 0x537)
  }
  const bits15 = ((data << 10) | rem) ^ 0x5412
  const result: boolean[] = []
  for (let i = 14; i >= 0; i--) {
    result.push(((bits15 >> i) & 1) === 1)
  }
  return result
}

function writeFormatInfo(matrix: boolean[][], n: number, bits: boolean[]) {
  // Around top-left finder
  const positions1: [number, number][] = [
    [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[7,8],[8,8],
    [8,7],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0]
  ]
  // Split between right of top-left and below top-right
  const positions2: [number, number][] = [
    [8,n-1],[8,n-2],[8,n-3],[8,n-4],[8,n-5],[8,n-6],[8,n-7],[8,n-8],
    [n-7,8],[n-6,8],[n-5,8],[n-4,8],[n-3,8],[n-2,8],[n-1,8]
  ]
  for (let i = 0; i < 15; i++) {
    matrix[positions1[i][0]][positions1[i][1]] = bits[i]
    matrix[positions2[i][0]][positions2[i][1]] = bits[i]
  }
}

function drawQR() {
  const canvas = canvasRef.value
  if (!canvas) return
  const matrix = buildMatrix(input.value)
  if (!matrix) return

  const modules = matrix.length
  const cellSize = Math.floor(size.value / (modules + 8)) // 4-module quiet zone
  const totalSize = cellSize * (modules + 8)
  canvas.width = totalSize
  canvas.height = totalSize

  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = bgColor.value
  ctx.fillRect(0, 0, totalSize, totalSize)

  const offset = cellSize * 4 // quiet zone
  ctx.fillStyle = fgColor.value

  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (matrix[r][c]) {
        ctx.fillRect(offset + c * cellSize, offset + r * cellSize, cellSize, cellSize)
      }
    }
  }
}

watch([input, size, fgColor, bgColor], drawQR)
onMounted(drawQR)

async function copyDataUrl() {
  const canvas = canvasRef.value
  if (!canvas) return
  const dataUrl = canvas.toDataURL('image/png')
  await navigator.clipboard.writeText(dataUrl)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

function downloadPng() {
  const canvas = canvasRef.value
  if (!canvas) return
  const link = document.createElement('a')
  link.download = 'qrcode.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}
</script>

<template>
  <div class="h-full flex flex-col space-y-4">
    <div class="space-y-3">
      <textarea
        v-model="input"
        class="input-field resize-none font-mono text-sm"
        rows="3"
        placeholder="Enter text or URL..."
      ></textarea>

      <div class="flex items-center gap-4 flex-wrap">
        <div class="flex items-center gap-2">
          <label class="text-xs text-gray-500">Size:</label>
          <input type="range" v-model.number="size" min="128" max="512" step="64" class="w-24 accent-blue-500" />
          <span class="text-xs text-gray-500 w-10">{{ size }}px</span>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs text-gray-500">FG:</label>
          <input type="color" v-model="fgColor" class="w-7 h-7 rounded cursor-pointer border border-dark-700 bg-transparent" />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs text-gray-500">BG:</label>
          <input type="color" v-model="bgColor" class="w-7 h-7 rounded cursor-pointer border border-dark-700 bg-transparent" />
        </div>
        <div class="flex gap-2 ml-auto">
          <button @click="copyDataUrl" class="btn-secondary py-1.5 px-3 text-xs">
            <component :is="copied ? Check : Copy" class="w-3.5 h-3.5" />
            {{ copied ? 'Copied!' : 'Copy Data URL' }}
          </button>
          <button @click="downloadPng" class="btn-primary py-1.5 px-3 text-xs">
            <Download class="w-3.5 h-3.5" /> Download PNG
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 flex items-center justify-center">
      <div class="glass-panel p-6 inline-block">
        <canvas ref="canvasRef"></canvas>
      </div>
    </div>
  </div>
</template>
