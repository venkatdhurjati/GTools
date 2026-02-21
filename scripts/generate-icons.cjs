#!/usr/bin/env node
/**
 * Generate PNG icons for Chrome extension from pixel data.
 * Pure Node.js — no external dependencies.
 * Run: node scripts/generate-icons.js
 */
const { createWriteStream } = require('fs');
const { join } = require('path');
const zlib = require('zlib');

const SIZES = [16, 48, 128];
const OUT_DIR = join(__dirname, '..', 'public', 'icons');

// Colors
const BLUE = [59, 130, 246];   // #3b82f6
const PURPLE = [139, 92, 246]; // #8b5cf6
const WHITE = [255, 255, 255];

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function lerpColor(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function generateIcon(size) {
  const radius = Math.round(size * 0.19);
  const pixels = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const t = (x + y) / (2 * size);
      const [r, g, b] = lerpColor(BLUE, PURPLE, t);

      // Rounded rect mask with anti-aliasing
      let alpha = 255;
      const corners = [
        [radius, radius],
        [size - radius - 1, radius],
        [radius, size - radius - 1],
        [size - radius - 1, size - radius - 1],
      ];

      if (
        (x < radius && y < radius) ||
        (x >= size - radius && y < radius) ||
        (x < radius && y >= size - radius) ||
        (x >= size - radius && y >= size - radius)
      ) {
        let cx, cy;
        if (x < radius && y < radius) { cx = radius; cy = radius; }
        else if (x >= size - radius && y < radius) { cx = size - radius - 1; cy = radius; }
        else if (x < radius && y >= size - radius) { cx = radius; cy = size - radius - 1; }
        else { cx = size - radius - 1; cy = size - radius - 1; }

        const d = dist(x, y, cx, cy);
        if (d > radius + 0.5) alpha = 0;
        else if (d > radius - 0.5) alpha = Math.round(255 * (radius + 0.5 - d));
      }

      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
      pixels[idx + 3] = alpha;
    }
  }

  // Draw ">_" terminal symbol
  drawTerminalSymbol(pixels, size);

  return pixels;
}

function setPixel(pixels, size, x, y, r, g, b, a) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || x >= size || y < 0 || y >= size) return;
  const idx = (y * size + x) * 4;
  const srcA = a / 255;
  const dstA = pixels[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA === 0) return;
  pixels[idx] = Math.round((r * srcA + pixels[idx] * dstA * (1 - srcA)) / outA);
  pixels[idx + 1] = Math.round((g * srcA + pixels[idx + 1] * dstA * (1 - srcA)) / outA);
  pixels[idx + 2] = Math.round((b * srcA + pixels[idx + 2] * dstA * (1 - srcA)) / outA);
  pixels[idx + 3] = Math.round(outA * 255);
}

function drawThickLine(pixels, size, x0, y0, x1, y1, thickness) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.ceil(len * 2);

  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const cx = x0 + dx * t;
    const cy = y0 + dy * t;
    const r = thickness / 2;

    for (let iy = Math.floor(cy - r - 1); iy <= Math.ceil(cy + r + 1); iy++) {
      for (let ix = Math.floor(cx - r - 1); ix <= Math.ceil(cx + r + 1); ix++) {
        const d = dist(ix, iy, cx, cy);
        if (d <= r + 0.5) {
          const alpha = d > r - 0.5 ? Math.round(255 * (r + 0.5 - d)) : 255;
          setPixel(pixels, size, ix, iy, 255, 255, 255, alpha);
        }
      }
    }
  }
}

function drawTerminalSymbol(pixels, size) {
  const thick = Math.max(1.5, size * 0.06);

  // ">" chevron
  const cx = size * 0.32;
  const cy = size * 0.48;
  const chevW = size * 0.16;
  const chevH = size * 0.24;

  drawThickLine(pixels, size, cx - chevW / 2, cy - chevH / 2, cx + chevW / 2, cy, thick);
  drawThickLine(pixels, size, cx + chevW / 2, cy, cx - chevW / 2, cy + chevH / 2, thick);

  // "_" underscore
  const ux = size * 0.52;
  const uy = cy + chevH / 2;
  drawThickLine(pixels, size, ux, uy, ux + size * 0.2, uy, thick);
}

function encodePNG(pixels, width, height) {
  // Build raw scanlines with filter byte (0 = None)
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: None
    pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  const chunks = [];

  // Signature
  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  chunks.push(makeChunk('IHDR', ihdr));

  // IDAT
  chunks.push(makeChunk('IDAT', compressed));

  // IEND
  chunks.push(makeChunk('IEND', Buffer.alloc(0)));

  return Buffer.concat(chunks);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type, 'ascii');
  const crc = crc32(Buffer.concat([typeB, data]));
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crc >>> 0);
  return Buffer.concat([len, typeB, data, crcB]);
}

// CRC-32 for PNG
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Generate
const fs = require('fs');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

for (const size of SIZES) {
  const pixels = generateIcon(size);
  const png = encodePNG(pixels, size, size);
  const path = join(OUT_DIR, `icon-${size}.png`);
  fs.writeFileSync(path, png);
  console.log(`Generated ${path} (${png.length} bytes)`);
}

console.log('Done! Icons saved to public/icons/');
