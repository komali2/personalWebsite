<script>
'use strict';
/* =========================================================================
   Sprites, pixel text, audio
   ========================================================================= */
const SPR = {}; // filled by the art <script> near the end of the file
const DEBUG = /debug/.test(location.search);
const SLOT_DEFAULT = 'RBYe';
// greyscale for unstamped stations in the stamp book
const GREY = PAL_KEYS.split('').map(k => { const [r, g, b] = PAL_RGB[C[k]], v = (r * 3 + g * 4 + b) / 8; return v > 200 ? 'l' : v > 150 ? 'G' : v > 100 ? 'g' : v > 60 ? 'N' : 'n'; });
const sprCache = new Map();
// slots: string of palette keys replacing digits 1..4. mode: 'sil'/'shadow' silhouettes, 'white'/'red' flashes, 'dark' foliage depth
function spr(id, slots, flip, mode) {
  const key = id + '|' + (slots ? String(slots) : '') + '|' + (flip ? 1 : 0) + (mode || '');
  let c = sprCache.get(key);
  if (c !== undefined) return c;
  const rows = SPR[id];
  if (!rows) { sprCache.set(key, null); return null; }
  const h = rows.length, w = rows[0].length;
  c = document.createElement('canvas'); c.width = w; c.height = h;
  const cx = c.getContext('2d'), img = cx.createImageData(w, h), u = new Uint32Array(img.data.buffer);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][flip ? w - 1 - x : x];
    if (ch === '.' || ch === undefined) continue;
    let idx;
    if (ch >= '1' && ch <= '4') {
      // slots: palette keys ('RB') or an array that may hold hex colors (['#e3002c', 'k'])
      const sv = slots && slots[ch.charCodeAt(0) - 49];
      if (sv && sv[0] === '#' && !mode) { const [r, g, b] = hexRGB(sv); u[y * w + x] = (255 << 24 | b << 16 | g << 8 | r) >>> 0; continue; }
      idx = C[sv || SLOT_DEFAULT[ch.charCodeAt(0) - 49]];
    }
    else idx = C[ch];
    if (idx === undefined) continue;
    if (mode === 'sil') idx = C.N; else if (mode === 'shadow') idx = C.F; else if (mode === 'white') idx = C.w; else if (mode === 'red') idx = C.R; else if (mode === 'black') idx = C.k; else if (mode === 'grey') idx = C[GREY[idx]] ?? idx;
    u[y * w + x] = PAL32[idx];
  }
  cx.putImageData(img, 0, 0);
  sprCache.set(key, c);
  return c;
}
const urlCache = new Map();
function sprURL(id, slots, mode) {
  const k = id + '|' + (slots || '') + (mode || '');
  if (urlCache.has(k)) return urlCache.get(k);
  const c = spr(id, slots, false, mode);
  const u = c ? c.toDataURL() : '';
  urlCache.set(k, u);
  return u;
}

/* tiny 3x5 digits for in-world popups */
const DIG = { '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001', '5': '111100111001111',
  '6': '111100111101111', '7': '111001001001001', '8': '111101111101111', '9': '111101111001111', '+': '000010111010000', '-': '000000111000000',
  'x': '000101010101000', '!': '010010010000010', '?': '111001011000010', ':': '000010000010000', '/': '001001010100100',
  // capitals for line-code badges (BR R G O BL A V Y K)
  'A': '010101111101101', 'B': '110101110101110', 'G': '011100101101011', 'K': '101101110101101', 'L': '100100100100111',
  'O': '010101101101010', 'R': '110101110101101', 'V': '101101101101010', 'Y': '101101010010010' };
function drawDigits(ctx, str, x, y, col, shadow) {
  str = String(str);
  const w = str.length * 4 - 1; x = Math.round(x - w / 2); y = Math.round(y);
  for (let pass = shadow ? 0 : 1; pass < 2; pass++) {
    ctx.fillStyle = pass ? col : PAL_HEX[0];
    const o = pass ? 0 : 1;
    for (let i = 0; i < str.length; i++) {
      const g = DIG[str[i]]; if (!g) continue;
      for (let b = 0; b < 15; b++) if (g[b] === '1') {
        const px = x + i * 4 + b % 3, py = y + (b / 3 | 0);
        if (o) { ctx.fillRect(px - 1, py, 3, 1); ctx.fillRect(px, py - 1, 1, 3); }
        else ctx.fillRect(px, py, 1, 1);
      }
    }
  }
}

/* crisp pixel text: render with the pixel font, threshold alpha, optional 1px outline */
const txtCache = new Map();
function textSpr(str, col, outline) {
  const key = str + '|' + col + '|' + (outline || '');
  let c = txtCache.get(key);
  if (c) return c;
  const m = document.createElement('canvas').getContext('2d');
  m.font = '12px Cubic11';
  const w = Math.ceil(m.measureText(str).width) + 4, h = 16;
  c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.font = '12px Cubic11'; x.textBaseline = 'top'; x.fillStyle = '#fff';
  x.fillText(str, 2, 2);
  const img = x.getImageData(0, 0, w, h), d = img.data, out = x.createImageData(w, h), o = out.data;
  const [r, g, b] = col[0] === '#' ? hexRGB(col) : PAL_RGB[C[col]];
  const on = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) on[i] = d[i * 4 + 3] > 110 ? 1 : 0;
  for (let i = 0; i < w * h; i++) {
    if (on[i]) { o[i * 4] = r; o[i * 4 + 1] = g; o[i * 4 + 2] = b; o[i * 4 + 3] = 255; continue; }
    if (outline) {
      const px = i % w, py = i / w | 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = px + dx, Y = py + dy;
        if (X >= 0 && Y >= 0 && X < w && Y < h && on[Y * w + X]) n++;
      }
      if (n) { const [R, G, B] = outline[0] === '#' ? hexRGB(outline) : PAL_RGB[C[outline]]; o[i * 4] = R; o[i * 4 + 1] = G; o[i * 4 + 2] = B; o[i * 4 + 3] = 255; }
    }
  }
  x.putImageData(out, 0, 0);
  txtCache.set(key, c);
  return c;
}

/* =========================================================================
   Audio: everything synthesized with WebAudio
   ========================================================================= */
const AU = {
  ctx: null, out: null, noiseBuf: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = this.ctx = new AC();
    this.out = c.createGain(); this.out.gain.value = save.mute ? 0 : .55; this.out.connect(c.destination);
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  },
  setMute(m) { save.mute = m; persist(); if (this.out) this.out.gain.setTargetAtTime(m ? 0 : .55, this.ctx.currentTime, .05); },
  tone(f, dur, type = 'square', vol = .15, f2 = 0, delay = 0) {
    const c = this.ctx; if (!c || save.mute) return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    o.connect(g); g.connect(this.out); o.start(t); o.stop(t + dur + .02);
  },
  noise(dur, vol = .2, freq = 1200, type = 'lowpass', delay = 0, f2 = 0) {
    const c = this.ctx; if (!c || save.mute) return;
    const t = c.currentTime + delay, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; s.loop = true; f.type = type; f.frequency.setValueAtTime(freq, t);
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    s.connect(f); f.connect(g); g.connect(this.out); s.start(t, Math.random()); s.stop(t + dur + .02);
  },
};
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
const note = (base, semi) => base * Math.pow(2, semi / 12);
const SFX = {
  ui() { AU.tone(660, .05, 'square', .05); },
  mark() { AU.tone(900, .03, 'triangle', .05); AU.noise(.03, .05, 3000, 'highpass'); },
  unmark() { AU.tone(500, .04, 'triangle', .04); },
  // each commuter placed climbs the pentatonic scale a little
  place(i) { const f = note(523.25, PENTA[clamp(i, 0, PENTA.length - 1)]); AU.tone(f, .08, 'square', .06); AU.tone(f * 2, .06, 'triangle', .03, 0, .03); },
  clash() { AU.tone(392, .12, 'triangle', .07); AU.tone(330, .16, 'triangle', .07, 0, .1); },
  undo() { AU.tone(700, .05, 'triangle', .04, 400); },
  // our own arrival tune (not Taipei Metro's): a bright bell arpeggio
  chime() { [0, 4, 7, 12, 9, 7].forEach((s, i) => { const f = note(659.25, s); AU.tone(f, .45, 'sine', .07, 0, i * .13); AU.tone(f * 2, .2, 'triangle', .02, 0, i * .13); }); },
  // the real door-closing pattern: quick even beeps
  doors() { for (let i = 0; i < 7; i++) AU.tone(1046, .07, 'square', .045, 0, i * .14); },
  depart() { AU.noise(1.3, .12, 300, 'lowpass', 0, 1400); AU.tone(70, 1.1, 'sawtooth', .04, 160); },
  board() { for (let i = 0; i < 8; i++) AU.noise(.04, .05, 1800 + Math.random() * 1200, 'bandpass', i * .07); },
  clear() { [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => AU.tone(note(523.25, s), .14, 'square', .06, 0, i * .07)); AU.noise(.5, .08, 6000, 'highpass', .3); },
  open() { [0, 7, 12, 16, 12, 19, 24].forEach((s, i) => AU.tone(note(392, s), .2, 'square', .07, 0, i * .12)); [0, 12].forEach((s, i) => AU.tone(note(196, s), .8, 'triangle', .06, 0, .84 + i * .02)); },
  rush() { for (let i = 0; i < 3; i++) { AU.tone(880, .12, 'square', .06, 0, i * .3); AU.tone(660, .12, 'square', .06, 0, i * .3 + .15); } },
  warn() { AU.tone(740, .1, 'square', .05); AU.tone(740, .1, 'square', .05, 0, .18); },
  full() { [7, 4, 0, -5, -8].forEach((s, i) => AU.tone(note(330, s), .3, 'square', .07, 0, i * .18)); AU.noise(1.2, .1, 900, 'bandpass', .2); },
  last() { [12, 7, 9, 4, 5, 0].forEach((s, i) => AU.tone(note(523.25, s), .5, 'sine', .07, 0, i * .26)); },
  hint() { [0, 7, 12, 19].forEach((s, i) => AU.tone(note(784, s), .09, 'triangle', .05, 0, i * .05)); },
  lost() { AU.tone(500, .1, 'triangle', .06, 700); AU.tone(700, .14, 'triangle', .06, 520, .12); },
  deliver() { [0, 4, 7, 12, 7, 12].forEach((s, i) => AU.tone(note(659.25, s), .12, 'square', .06, 0, i * .09)); },
  solved() { [0, 4, 7].forEach((s, i) => AU.tone(note(523.25, s + 12), .1, 'square', .06, 0, i * .05)); },
};
</script>
