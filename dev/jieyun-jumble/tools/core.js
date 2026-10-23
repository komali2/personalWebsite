// Load the pure-logic parts of the game (no DOM) into node for headless tests and sims.
// usage: const core = require('./core'); core.genBoard(...)
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = path.dirname(__dirname);
const FILES = ['content.js', 'src/2a_map.js', 'src/4_puzzle.js', 'src/4b_run.js'];
const ctx = { console, Math, Set, Map, Array, Int8Array, Int16Array, Uint8Array, Int32Array, Object, JSON };
vm.createContext(ctx);
for (const f of FILES) {
  const p = path.join(SRC, f);
  if (!fs.existsSync(p)) continue;
  // top-level const/let/function in a vm script land in the context's script scope; re-export them via a trailer
  const js = fs.readFileSync(p, 'utf8').replace(/<\/?script>/g, '');
  const names = [...js.matchAll(/^(?:const|let|function)\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]);
  vm.runInContext(js + '\n' + names.map(n => `this.${n} = ${n};`).join('\n'), ctx, { filename: f });
}
module.exports = ctx;
