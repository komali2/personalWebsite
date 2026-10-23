<script>
'use strict';
/* =========================================================================
   UI language: English / Taiwan Mandarin. Auto-detected from the browser's
   first preferred language until the player picks one.
   ========================================================================= */
let LANG = save.lang || (/^zh/i.test((navigator.languages && navigator.languages[0]) || navigator.language || '') ? 'zh' : 'en');
const SRC = 'https://github.com/komali2/personalWebsite/tree/master/dev/taiwan-battle-bugs';
const STR = {
  en: {
    sub: 'Climb the tea. Eat the best leaves. Beat Auntie.', cont: 'CONTINUE', play: 'PLAY', log: 'BUG LOG 圖鑑', credits: 'CREDITS', about: 'ABOUT',
    pickBug: 'Pick your bug', go: 'GO!', paused: 'Paused', resume: 'RESUME', quit: 'SAVE & QUIT TO MENU',
    squashed: 'SQUASHED!', newBest: 'NEW BEST!', again: 'AGAIN', share: 'SHARE', menu: 'MENU', winTitle: 'THE TEA IS YOURS',
    logTitle: 'Bug Log 圖鑑', back: 'BACK', credTitle: 'Credits', aboutTitle: 'About', whyTitle: 'Why?', bestLine: 'BEST {0}',
    soundOn: 'SOUND: ON', soundOff: 'SOUND: OFF', motionFull: 'MOTION: FULL', motionLow: 'MOTION: LOW', langSwitch: '中文',
    atk: 'ATK', spa: 'SP.ATK', hp: 'HP', spd: 'SPD',
    bushLbl: 'Bush {0}/3 · {1}', climbLbl: 'Leaves {0}/{1}', lvl: 'Lv {0}', trayHead: '+{0} to spend: tap a stat', trayHead1: '+1 to spend: tap a stat',
    special: 'Special', super: 'Super', trait: 'Trait', size: 'Size',
    levelUp: 'LEVEL UP!', ambush: 'AMBUSH!', fled: '{0} ran off!', elite: 'ELITE!', auntie: 'AUNTIE IS COMING', jump: 'NEXT BUSH!', patience: 'Patience 耐心',
    bushTitle: 'BUSH {0}', miss: 'MISS', counter: 'COUNTER!', stun: 'STUN', blocked: 'BLOCK',
    by: 'Squashed by {0} on bush {1}.', byAunt: "Squashed by Auntie's {0} on bush {1}.",
    score: 'SCORE', leaves: 'LEAVES', beaten: 'BUGS BEATEN', level: 'LEVEL', best: 'BEST', time: 'TIME',
    winSub: 'The {0} beat Auntie three times. The hat, the sleeves and all six boots are its now.',
    discovered: '{0} / {1} met', unknown: 'Not met yet. Keep climbing.', met: 'Met ×{0}', played: 'Wins as this bug: {0}',
    pests: 'Tea garden pests', players: 'Playable bugs', farmer: 'The farmer', auntSays: 'What Auntie says', notHeard: 'Not heard yet',
    copied: 'Copied!', copiedChat: 'Copied! Paste it in the group chat', noCopy: 'Could not copy',
    shareTxt: '🍵 Taiwan Battle Bugs 台灣鬥蟲\n{line}\n{stars}★ of leaves · {beaten} bugs beaten · Lv {lv} · {score} pts\n{url}',
    shareWin: 'My {bug} beat Auntie three times and took her hat. 👒', shareLose: 'My {bug} got squashed on bush {bush}. 🩴',
    about1: 'Hi! I\'m <a href="https://www.calebjay.com" target="_blank" rel="noopener">Caleb Rogers</a>, a software engineer living in Taipei.',
    about2: 'I build software with <a href="https://508.dev" target="_blank" rel="noopener">508.dev</a>, an engineering co-op. <b>We\'re looking for engineers. Come build with us!</b>',
    why: `Taiwan's bugs are amazing, its tea is amazing, and its tea-farm aunties are the final boss of both. This is the second game in the series after <a href="https://www.calebjay.com/games/taiwan-treats-trip/" target="_blank" rel="noopener">Taiwan Treats Trip</a>. It's <a href="${SRC}" target="_blank" rel="noopener">open source</a>, so play with it or remix it.`,
    cred1: 'By <a href="https://www.calebjay.com" target="_blank" rel="noopener">Caleb Rogers</a>, with AI agents (Claude and GPT) on code, pixel art, writing and synth sound.',
    cred2: 'Bug facts are real (we checked). The bugs eating tea leaves is not: mantises and spiders are predators, and adult rhino beetles drink sap. The leafhopper really does eat tea, and that is how Oriental Beauty tea gets its honey aroma.',
    cred3: 'Font: Cubic 11 俐方體11號 by ACh &amp; the Cubic 11 Project Authors, SIL Open Font License 1.1. <a href="https://github.com/ACh-K/Cubic-11" target="_blank" rel="noopener">github.com/ACh-K/Cubic-11</a>',
    cred4: `Taiwan Battle Bugs is free software under the GNU General Public License v3 or later. Source: <a href="${SRC}" target="_blank" rel="noopener">github.com/komali2/personalWebsite</a>`,
  },
  zh: {
    sub: '爬上茶欉，吃最好吃的葉子，打敗阿姨。', cont: '繼續', play: '開始', log: '昆蟲圖鑑', credits: '製作群', about: '關於',
    pickBug: '選一隻蟲', go: '出發！', paused: '暫停', resume: '繼續', quit: '存檔並回主選單',
    squashed: '被打扁了！', newBest: '新紀錄！', again: '再來一次', share: '分享', menu: '主選單', winTitle: '茶園是你的了',
    logTitle: '昆蟲圖鑑', back: '返回', credTitle: '製作群', aboutTitle: '關於', whyTitle: '為什麼做這個？', bestLine: '最佳 {0}',
    soundOn: '音效：開', soundOff: '音效：關', motionFull: '動態：完整', motionLow: '動態：減少', langSwitch: 'EN',
    atk: '攻擊', spa: '特攻', hp: '體力', spd: '速度',
    bushLbl: '茶欉 {0}/3・{1}', climbLbl: '葉子 {0}/{1}', lvl: 'Lv {0}', trayHead: '有 {0} 點可以加：點一項能力', trayHead1: '有 1 點可以加：點一項能力',
    special: '特技', super: '必殺', trait: '天賦', size: '體型',
    levelUp: '升級！', ambush: '埋伏！', fled: '{0}逃跑了！', elite: '精英！', auntie: '阿姨來了', jump: '跳到下一欉！', patience: '耐心 Patience',
    bushTitle: '茶欉 {0}', miss: '沒中', counter: '反擊！', stun: '暈眩', blocked: '擋下',
    by: '在第 {1} 欉被{0}打倒了。', byAunt: '在第 {1} 欉被阿姨的{0}打扁了。',
    score: '分數', leaves: '葉子', beaten: '打倒', level: '等級', best: '最佳', time: '時間',
    winSub: '{0}打敗阿姨三次。斗笠、袖套和六隻雨鞋，現在都是牠的了。',
    discovered: '已遇見 {0} / {1}', unknown: '還沒遇過，繼續往上爬。', met: '遇見 ×{0}', played: '用牠贏了 {0} 次',
    pests: '茶園害蟲', players: '可選的蟲', farmer: '茶農', auntSays: '阿姨講啥', notHeard: '還沒聽過',
    copied: '已複製！', copiedChat: '已複製！貼到群組吧', noCopy: '無法複製',
    shareTxt: '🍵 台灣鬥蟲 Taiwan Battle Bugs\n{line}\n吃了 {stars}★ 的葉子・打倒 {beaten} 隻蟲・Lv {lv}・{score} 分\n{url}',
    shareWin: '我的{bug}打敗阿姨三次，還搶到她的斗笠。👒', shareLose: '我的{bug}在第 {bush} 欉被打扁了。🩴',
    about1: '嗨！我是 <a href="https://www.calebjay.com" target="_blank" rel="noopener">Caleb Rogers</a>，住在臺北的軟體工程師。',
    about2: '我和工程師合作社 <a href="https://508.dev" target="_blank" rel="noopener">508.dev</a> 一起打造軟體。<b>我們正在找工程師，歡迎加入！</b>',
    why: `臺灣的蟲很厲害，臺灣的茶很厲害，而茶園阿姨是兩者的最終魔王。這是繼<a href="https://www.calebjay.com/games/taiwan-treats-trip/" target="_blank" rel="noopener">《吃飽逃颱》</a>之後的第二款遊戲，一樣<a href="${SRC}" target="_blank" rel="noopener">開源</a>，歡迎拿去玩、拿去改。`,
    cred1: '作者 <a href="https://www.calebjay.com" target="_blank" rel="noopener">Caleb Rogers</a>，程式、像素美術、文字和合成音效有 AI 代理（Claude 和 GPT）幫忙。',
    cred2: '圖鑑裡的昆蟲知識都是真的（我們查過）。蟲吃茶葉這件事就不一定了：螳螂和蜘蛛吃肉，獨角仙成蟲喝樹液。只有小綠葉蟬真的吃茶，東方美人的蜜香就是這樣來的。',
    cred3: '字型：俐方體11號（Cubic 11），作者 ACh 與 Cubic 11 專案貢獻者，採 SIL Open Font License 1.1 授權。<a href="https://github.com/ACh-K/Cubic-11" target="_blank" rel="noopener">github.com/ACh-K/Cubic-11</a>',
    cred4: `《台灣鬥蟲》是自由軟體，採 GNU 通用公共授權條款第 3 版或更新版本授權。原始碼：<a href="${SRC}" target="_blank" rel="noopener">github.com/komali2/personalWebsite</a>`,
  },
};
// T('key', {name: ...}) or T('key', [a, b]) for {0}/{1}
function T(k, o) {
  const s = (STR[LANG] && STR[LANG][k]) || STR.en[k] || k;
  return o ? s.replace(/\{(\w+)\}/g, (m, p) => o[p] !== undefined ? o[p] : m) : s;
}
// names: bugs, foes and moves carry {en, zh}
const N = o => LANG === 'zh' ? o.zh : o.en;
const NB = o => LANG === 'zh' ? o.zh : `${o.en} ${o.zh}`;
const D = o => LANG === 'zh' ? (o.dz || o.d) : o.d;
const who = id => BUGS[id] || FOES[id];
function applyLang() {
  document.documentElement.lang = LANG === 'zh' ? 'zh-Hant-TW' : 'en';
  document.querySelectorAll('[data-i]').forEach(el => { el.textContent = T(el.dataset.i); });
  document.querySelectorAll('[data-ih]').forEach(el => { el.innerHTML = T(el.dataset.ih); });
}
</script>
