// Checks content.js and the map data before a build. usage: node tools/check_content.js
// Exit code 1 (with messages) if anything is missing or too long.
const fs = require('fs'), path = require('path');
const core = require('./core');
const DEV = path.dirname(__dirname), errs = [], warns = [];
const sprites = new Set();
for (const f of ['riders', 'scene']) {
  const p = path.join(DEV, 'art', f + '.js');
  if (fs.existsSync(p)) for (const m of fs.readFileSync(p, 'utf8').matchAll(/SPR\.(\w+)\s*=/g)) sprites.add(m[1]);
}
const haveArt = sprites.size > 0;
const txt = (o, where, maxEn, maxZh) => {
  if (!o || typeof o.en !== 'string' || typeof o.zh !== 'string' || !o.en || !o.zh) { errs.push(`${where}: needs both en and zh`); return; }
  if (maxEn && o.en.length > maxEn) errs.push(`${where}: en is ${o.en.length} chars (max ${maxEn})`);
  if (maxZh && [...o.zh].length > maxZh) errs.push(`${where}: zh is ${[...o.zh].length} chars (max ${maxZh})`);
};
const spr = (id, where) => { if (haveArt && !sprites.has(id)) warns.push(`${where}: sprite ${id} not drawn yet`); };
for (const n of [5, 6, 7, 8, 9]) for (const e of core.checkLayout(core.parseLayout(n))) errs.push('map ' + e);
for (const id of core.LINE_IDS) {
  const r = core.RIDERS[id];
  if (!r) { errs.push(`RIDERS.${id} missing`); continue; }
  txt(r, `RIDERS.${id}`, 22, 8); spr(r.sprite, `RIDERS.${id}`);
}
const lostIds = new Set();
for (const l of core.LOST) {
  const w = `LOST.${l.id}`;
  if (lostIds.has(l.id)) errs.push(`${w}: duplicate id`); lostIds.add(l.id);
  if (!core.LINES[l.want]) errs.push(`${w}: want "${l.want}" is not a line id`);
  if (l.need && !core.LINES[l.need]) errs.push(`${w}: need "${l.need}" is not a line id`);
  if (!['tw', 'en', 'zh'].includes(l.voice)) errs.push(`${w}: voice must be tw, en or zh`);
  txt(l, w, 40, 14); spr(l.sprite, w);
  for (const k of ['ask', 'thanks']) {
    txt(l[k], `${w}.${k}`, 48, 24);
    if (l.voice === 'tw' && l[k] && (!l[k].tw || !l[k].tl)) errs.push(`${w}.${k}: 台語 voice needs tw and tl`);
    if (l[k] && l[k].tw && [...l[k].tw].length > 14) errs.push(`${w}.${k}: tw longer than 14`);
  }
}
for (const k in core.TICKER) txt(core.TICKER[k], `TICKER.${k}`, 48, 24);
for (const k of ['touch', 'row', 'col', 'line']) {
  if (!core.CLASH[k] || !core.CLASH[k].length) errs.push(`CLASH.${k} needs at least one line`);
  else core.CLASH[k].forEach((c, i) => txt(c, `CLASH.${k}[${i}]`, 44, 18));
}
const missing = Object.keys(core.STN).filter(id => !core.FACTS[id]);
if (missing.length) warns.push(`FACTS missing for ${missing.length} stations: ${missing.slice(0, 8).join(' ')}${missing.length > 8 ? ' …' : ''}`);
for (const id in core.FACTS) {
  if (!core.STN[id]) errs.push(`FACTS.${id}: not a station id`);
  txt(core.FACTS[id], `FACTS.${id}`, 160, 70);
  if (core.FACTS[id].icon) spr(core.FACTS[id].icon, `FACTS.${id}`);
}
for (const w of warns) console.log('warning: ' + w);
if (errs.length) { console.error(errs.map(e => 'ERROR ' + e).join('\n')); process.exit(1); }
console.log(`content ok: ${core.LOST.length} lost riders, ${Object.keys(core.FACTS).length}/${Object.keys(core.STN).length} station facts`);
