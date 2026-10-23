<script>
'use strict';
/* =========================================================================
   Sprites, pixel text, audio
   ========================================================================= */
const SPR = {}; // filled by the art <script> near the end of the file
const DEBUG = /debug/.test(location.search);
const SLOT_DEFAULT = 'RBYe';
const sprCache = new Map();
// slots: string of palette keys replacing digits 1..4. mode: 'sil'/'shadow' silhouettes, 'white'/'red' flashes, 'dark' foliage depth
function spr(id, slots, flip, mode) {
  const key = id + '|' + (slots || '') + '|' + (flip ? 1 : 0) + (mode || '');
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
    if (ch >= '1' && ch <= '4') idx = C[(slots || SLOT_DEFAULT)[ch.charCodeAt(0) - 49] || SLOT_DEFAULT[ch.charCodeAt(0) - 49]];
    else idx = C[ch];
    if (idx === undefined) continue;
    if (mode === 'sil') idx = C.N; else if (mode === 'shadow') idx = C.F; else if (mode === 'white') idx = C.w; else if (mode === 'dark') idx = DARK[idx]; else if (mode === 'red') idx = C.R; else if (mode === 'black') idx = C.k;
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
  'x': '000101010101000', '!': '010010010000010', '?': '111001011000010' };
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
  const [r, g, b] = PAL_RGB[C[col]];
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
      if (n) { const [R, G, B] = PAL_RGB[C[outline]]; o[i * 4] = R; o[i * 4 + 1] = G; o[i * 4 + 2] = B; o[i * 4 + 3] = 255; }
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
const SFX = {
  ui() { AU.tone(660, .05, 'square', .05); },
  pick() { AU.tone(523, .06, 'square', .05); AU.tone(784, .08, 'square', .05, 0, .05); },
  whoosh() { AU.noise(.35, .12, 600, 'bandpass', 0, 3500); },
  rustle() { AU.noise(.25, .1, 2500, 'highpass'); AU.noise(.2, .08, 1800, 'bandpass', .12); },
  chomp(i) { AU.noise(.06, .14, 2600 - i * 300, 'lowpass'); AU.tone(180 - i * 20, .05, 'square', .06, 90); },
  leaf(stars) {
    const f = 523.25 * Math.pow(2, PENTA[Math.min(stars * 2, PENTA.length - 1)] / 12);
    AU.tone(f, .1, 'square', .06); AU.tone(f * 1.5, .1, 'triangle', .05, 0, .07);
    if (stars >= 3) [0, 4, 7, 12].forEach((s, i) => AU.tone(f * Math.pow(2, s / 12), .1, 'triangle', .05, 0, .14 + i * .05));
  },
  level() { [0, 4, 7, 12, 16].forEach((s, i) => AU.tone(392 * Math.pow(2, s / 12), .12, 'square', .07, 0, i * .07)); },
  hit(big) { AU.noise(big ? .25 : .12, big ? .3 : .2, big ? 900 : 1800, 'lowpass', 0, 200); AU.tone(big ? 110 : 180, big ? .2 : .1, 'square', .1, 60); },
  hurt() { AU.tone(300, .18, 'sawtooth', .1, 90); AU.noise(.15, .15, 700, 'lowpass'); },
  miss() { AU.tone(900, .08, 'triangle', .05, 1400); },
  wind() { AU.tone(220, .3, 'triangle', .04, 440); },
  special() { [0, 7, 12].forEach((s, i) => AU.tone(440 * Math.pow(2, s / 12), .09, 'square', .06, 0, i * .04)); },
  spray() { AU.noise(.5, .16, 3000, 'highpass', 0, 900); },
  web() { for (let i = 0; i < 4; i++) AU.tone(1200 - i * 150, .06, 'triangle', .05, 600, i * .05); },
  hop() { AU.tone(300, .15, 'square', .06, 900); },
  stance() { AU.tone(1400, .25, 'triangle', .05, 1500); },
  super() { [0, 7, 12, 19, 24].forEach((s, i) => AU.tone(330 * Math.pow(2, s / 12), .14, 'square', .07, 0, i * .05)); AU.noise(.6, .12, 700, 'bandpass', 0, 5000); },
  zap() { for (let i = 0; i < 6; i++) AU.tone(400 + Math.random() * 2400, .04, 'sawtooth', .07, 0, i * .03); },
  smack() { AU.noise(.12, .4, 1500, 'lowpass', 0, 150); AU.tone(90, .15, 'square', .14, 40); },
  heal() { [0, 4, 7].forEach((s, i) => AU.tone(660 * Math.pow(2, s / 12), .12, 'triangle', .06, 0, i * .06)); },
  ko() { [7, 4, 0].forEach((s, i) => AU.tone(330 * Math.pow(2, s / 12), .12, 'square', .07, 0, i * .08)); AU.noise(.3, .1, 900, 'lowpass', .2); },
  rumble() { AU.noise(1.4, .25, 200, 'lowpass', 0, 60); AU.tone(55, 1.2, 'sawtooth', .08, 40); },
  aunt() { [0, 3, 0, 5].forEach((s, i) => AU.tone(260 * Math.pow(2, s / 12), .09, 'square', .07, 0, i * .09)); },
  sigh() { AU.tone(500, .6, 'triangle', .07, 200); },
  jump() { AU.tone(200, .4, 'square', .07, 1200); AU.noise(.4, .08, 1500, 'bandpass', .1, 4000); },
  win() { [0, 4, 7, 12, 7, 12, 16, 19, 24].forEach((s, i) => AU.tone(392 * Math.pow(2, s / 12), .16, 'square', .07, 0, i * .11)); },
  over() { [12, 7, 4, 0, -5].forEach((s, i) => AU.tone(330 * Math.pow(2, s / 12), .25, 'square', .08, 0, i * .16)); },
};
</script>
