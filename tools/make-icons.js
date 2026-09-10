/* Arcanum Machina — app icon generator.
   Run: node tools/make-icons.js
   Writes icon-192.png and icon-512.png with no dependencies (raw PNG + zlib).
   The art: the relic slab, its channel lines, and the ley lines under it. */
const zlib = require('zlib'), fs = require('fs'), path = require('path');

const CRC = (() => { const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return b => { let c = -1; for (let i = 0; i < b.length; i++) c = t[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ -1) >>> 0; };
})();

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(CRC(td), 0);
  return Buffer.concat([len, td, crc]);
}

function png(w, h, rgb) {
  const stride = w * 3, raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const BG = hex('#07070f'), SLAB = hex('#0d0d1c'), GOLD = hex('#fbbf24'), GOLD_DIM = hex('#7a5a00'),
      MANA = hex('#7b9cff'), MANA_DIM = hex('#3a5299'), BRIGHT = hex('#f2f7ff');

function draw(size) {
  const buf = Buffer.alloc(size * size * 3);
  const px = (x, y, c) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 3; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
  };
  /* everything in a 32-unit grid so both sizes look identical */
  const u = size / 32;
  const rect = (x0, y0, x1, y1, c) => { for (let y = y0 * u; y < y1 * u; y++) for (let x = x0 * u; x < x1 * u; x++) px(x, y, c); };
  const frame = (x0, y0, x1, y1, t, c) => {
    rect(x0, y0, x1, y0 + t, c); rect(x0, y1 - t, x1, y1, c);
    rect(x0, y0, x0 + t, y1, c); rect(x1 - t, y0, x1, y1, c);
  };

  rect(0, 0, 32, 32, BG);

  /* the relic slab, inside the maskable safe zone (art stays within 6..26) */
  frame(9.5, 6.5, 22.5, 19.5, 0.9, GOLD_DIM);          // the glow around it
  rect(10, 7, 22, 19, SLAB);
  frame(10, 7, 22, 19, 0.6, GOLD);                      // the slab edge

  /* channel lines across the face */
  rect(11.6, 9.4, 20.4, 10.0, MANA_DIM);
  rect(11.6, 16.0, 20.4, 16.6, MANA_DIM);

  /* the glyph at the centre: a diamond, brightest at its heart */
  const cx = 16, cy = 13;
  for (let dy = -3.2; dy <= 3.2; dy += 1 / u) for (let dx = -3.2; dx <= 3.2; dx += 1 / u) {
    const d = Math.abs(dx) + Math.abs(dy);
    if (d > 3.2) continue;
    px((cx + dx) * u, (cy + dy) * u, d < 1.1 ? BRIGHT : (d < 2.3 ? GOLD : GOLD_DIM));
  }

  /* three ley lines beneath, dashed, dimming outward */
  [[22.6, MANA], [25.0, MANA_DIM], [27.4, MANA_DIM]].forEach(([y, c], row) => {
    for (let x = 5; x < 27; x += 2.4) rect(x, y, Math.min(x + 1.5, 27), y + (row === 0 ? 0.7 : 0.5), c);
  });

  return png(size, size, buf);
}

const out = path.join(__dirname, '..');
const made = {};
for (const size of [192, 512]) {
  const file = path.join(out, 'icon-' + size + '.png');
  made[size] = draw(size);
  fs.writeFileSync(file, made[size]);
  console.log('wrote ' + path.basename(file) + '  ' + fs.statSync(file).size + ' bytes');
}

/* A Windows .ico for the desktop shortcut — a PNG embedded whole, which Vista and later read fine */
const p = made[192];
const dir = Buffer.alloc(6);
dir.writeUInt16LE(0, 0); dir.writeUInt16LE(1, 2); dir.writeUInt16LE(1, 4);
const ent = Buffer.alloc(16);
ent[0] = 192; ent[1] = 192; ent[2] = 0; ent[3] = 0;
ent.writeUInt16LE(1, 4); ent.writeUInt16LE(32, 6);
ent.writeUInt32LE(p.length, 8); ent.writeUInt32LE(22, 12);
const ico = path.join(out, 'icon.ico');
fs.writeFileSync(ico, Buffer.concat([dir, ent, p]));
console.log('wrote icon.ico  ' + fs.statSync(ico).size + ' bytes');
