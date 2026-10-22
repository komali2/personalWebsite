<script>
'use strict';
/* =========================================================================
   UI language: English / Taiwan Mandarin. Auto-detected from the browser's
   first preferred language until the player picks one.
   ========================================================================= */
let LANG = save.lang || (/^zh/i.test((navigator.languages && navigator.languages[0]) || navigator.language || '') ? 'zh' : 'en');
const STR = {
  en: {
    sub: 'Eat your fill. Outrun Typhoon Hangry.', play: 'PLAY', log: 'SNACK LOG 圖鑑', credits: 'CREDITS',
    pickRide: 'Pick your ride', whoLeads: "Who's leading?", go: 'GO!', paused: 'Paused', resume: 'RESUME', quit: 'QUIT TO MENU',
    caught: 'HANGRY CAUGHT YOU', near: 'near {0}', score: 'SCORE', snacks: 'SNACKS', best: 'BEST', newBest: 'NEW BEST!',
    eaten: 'Snacks eaten', crewSays: 'The crew says', again: 'AGAIN', share: 'SHARE', menu: 'MENU',
    logTitle: 'Snack Log 圖鑑', back: 'BACK', credTitle: 'Credits', bestLine: 'BEST {0}', hangryKm: 'Hangry {0} km',
    isBack: '{0} is back!', blown: '{0} got blown away!', copiedChat: 'Copied! Paste it in the group chat', copied: 'Copied!', noCopy: 'Could not copy',
    nothing: 'Nothing. Hangry is proud of you.',
    hatch: 'Hatchback', hatchD: 'Steady and quick. One car, one chance.',
    squad: 'Scooter Squad', squadD: 'Five scooters, wide sweeps, chaos. Hangry eats the back one first.',
    everywhere: 'Everywhere 到處都有', truckGroup: 'Fell off a blue truck 藍色小貨車', discovered: '{0} / {1} discovered',
    eatenFound: 'Eaten ×{0} · found {1}', whereC: 'everywhere', whereR: 'anywhere, rarely (most in Taichung)', whereG: 'on the back of blue trucks',
    notYetC: 'Not eaten yet. It turns up everywhere.', notYetR: 'Not eaten yet. Rare, but most common around Taichung.', notYetG: 'Not eaten yet. Watch the back of blue trucks.', notYetS: 'Not eaten yet. Look around {0}.',
    soundOn: 'SOUND: ON', soundOff: 'SOUND: OFF', motionFull: 'MOTION: FULL', motionLow: 'MOTION: LOW', langSwitch: '中文',
    shareTxt: '🌀 Taiwan Treats Trip 吃飽逃颱\n{route} 🌀\n🥟 {n} snacks · {score} pts · best combo {combo}\nLeader: {lead} · {veh}\n{url}',
    vehCar: '🚗 Hatchback', vehScooter: '🛵 Scooter Squad',
    cred1: "Made for the crew's 2026 road trip through the middle of Taiwan: Jeremy, Riley, Caleb, Lauren &amp; Rachel.",
    cred2: 'By <a href="https://www.calebjay.com" target="_blank" rel="noopener">Caleb Rogers</a>, with AI agents (Claude and GPT) on code, pixel art and synth sound.',
    about: 'ABOUT', aboutTitle: 'About', whyTitle: 'Why?',
    about1: 'Hi! I\'m <a href="https://www.calebjay.com" target="_blank" rel="noopener">Caleb Rogers</a>, a software engineer living in Taipei.',
    about2: 'I build software with <a href="https://508.dev" target="_blank" rel="noopener">508.dev</a>, an engineering co-op. <b>We\'re looking for engineers. Come build with us!</b>',
    why: 'My friends and I were having a bit of a contest to see who could generate the most fun game on our road trip, pitting our LLM harness and agent setups against each other. I think mine is pretty fun, so I\'m <a href="https://github.com/komali2/personalWebsite/tree/master/dev/taiwan-treats-trip" target="_blank" rel="noopener">open sourcing it</a> so anyone can play with it or modify it for their friends.',
    cred4: 'Font: Cubic 11 俐方體11號 by ACh &amp; the Cubic 11 Project Authors, derived from JF Dot M+H 12 and M+ Bitmap Fonts. Licensed under the SIL Open Font License 1.1. Tone vowels added for pinyin. <a href="https://github.com/ACh-K/Cubic-11" target="_blank" rel="noopener">github.com/ACh-K/Cubic-11</a>',
    cred5: 'Taiwan Treats Trip is free software under the GNU General Public License v3 or later. Source: <a href="https://github.com/komali2/personalWebsite/tree/master/dev/taiwan-treats-trip" target="_blank" rel="noopener">github.com/komali2/personalWebsite/tree/master/dev/taiwan-treats-trip</a>',
    cred6: 'No typhoons were harmed. Several snacks were.',
    q_j1: '{name} ate {n} {fav} while flying the drone one-handed.', q_j2: "{name}'s drone got 4K footage of Hangry eating us.", q_j3: '{name} says the drone saw Hangry coming. Nobody listened.',
    q_r1: '{name} ate {n} {fav} and blamed it on a race condition.', q_r2: "{name} tried to hack the typhoon's firmware. Typhoons don't have firmware.", q_r3: '{name} is still picking crumbs out of the keyboard.',
    q_c1: "{name}'s hair survived. That's what matters.", q_c2: '{name} never took the sunglasses off. Not even inside the typhoon.', q_c3: '{name} ate {n} {fav}. Very coolly.',
    q_l1: '{name} wants to adopt a stray dog and name it Hangry Jr.', q_l2: '{name} ate {n} {fav} and called it a spiritual experience.', q_l3: '{name} saw the golden bubble tea and screamed.',
    q_a1: '{name} kicked {k} things off the road.', q_a2: '{name} ate {n} {fav}. Kung fu burns calories.', q_a3: '{name} says Hangry fights dirty.',
    q_hits: '{name} would like a different driver next time.', q_km: '{name} says {km} km is a personal record for snacking.',
    q_lost: '{name} got blown away near {region}. Still waving at the bus stop.',
  },
  zh: {
    sub: '吃到飽，甩掉颱風餓餓！', play: '開始', log: '小吃圖鑑', credits: '製作群',
    pickRide: '選擇座駕', whoLeads: '誰來帶隊？', go: '出發！', paused: '暫停', resume: '繼續', quit: '回主選單',
    caught: '被颱風餓餓追上了！', near: '在{0}附近', score: '分數', snacks: '小吃', best: '最高分', newBest: '新紀錄！',
    eaten: '吃了什麼', crewSays: '旅伴們說', again: '再玩一次', share: '分享', menu: '主選單',
    logTitle: '小吃圖鑑', back: '返回', credTitle: '製作群', bestLine: '最高分 {0}', hangryKm: '颱風餓餓 {0} 公里',
    isBack: '{0} 回來了！', blown: '{0} 被吹走了！', copiedChat: '已複製！貼到群組吧', copied: '已複製！', noCopy: '無法複製',
    nothing: '什麼都沒吃到。颱風餓餓以你為榮。',
    hatch: '掀背車', hatchD: '又穩又快。一台車，一條命。',
    squad: '機車小隊', squadD: '五台機車，大範圍掃貨，一片混亂。颱風餓餓會先吃掉最後一台。',
    everywhere: '到處都有', truckGroup: '從藍色小貨車掉下來的', discovered: '已發現 {0} / {1}',
    eatenFound: '吃過 ×{0} · 出沒地點：{1}', whereC: '到處都有', whereR: '各地都有但很稀有（臺中最多）', whereG: '藍色小貨車的車斗',
    notYetC: '還沒吃過。到處都找得到。', notYetR: '還沒吃過。很稀有，臺中最常出現。', notYetG: '還沒吃過。注意藍色小貨車的車斗。', notYetS: '還沒吃過。去{0}找找看。',
    soundOn: '音效：開', soundOff: '音效：關', motionFull: '動態：完整', motionLow: '動態：減少', langSwitch: 'English',
    shareTxt: '🌀 吃飽逃颱 Taiwan Treats Trip\n{route} 🌀\n🥟 吃了 {n} 份小吃 · {score} 分 · 最高連擊 {combo}\n隊長：{lead} · {veh}\n{url}',
    vehCar: '🚗 掀背車', vehScooter: '🛵 機車小隊',
    cred1: '為了 2026 年穿越臺灣中部的公路旅行而做，獻給 Jeremy、Riley、Caleb、Lauren 和 Rachel。',
    cred2: '<a href="https://www.calebjay.com" target="_blank" rel="noopener">Caleb Rogers</a> 製作，AI 代理（Claude 與 GPT）協助程式、像素美術和合成音效。',
    about: '關於', aboutTitle: '關於', whyTitle: '為什麼做這個？',
    about1: '嗨！我是 <a href="https://www.calebjay.com" target="_blank" rel="noopener">Caleb Rogers</a>，住在臺北的軟體工程師。',
    about2: '我和工程師合作社 <a href="https://508.dev" target="_blank" rel="noopener">508.dev</a> 一起打造軟體。<b>我們正在找工程師，歡迎加入！</b>',
    why: '這趟公路旅行途中，我和朋友們辦了個小比賽，看誰能生成最好玩的遊戲，讓各自的 LLM 工具鏈和 AI 代理設定互相較勁。我覺得我這款還蠻好玩的，所以把它<a href="https://github.com/komali2/personalWebsite/tree/master/dev/taiwan-treats-trip" target="_blank" rel="noopener">開源</a>，讓大家都能玩，也能改成送給自己朋友的版本。',
    cred4: '字型：俐方體11號（Cubic 11），作者 ACh 與 Cubic 11 專案貢獻者，衍生自 JF Dot M+H 12 與 M+ Bitmap Fonts，採 SIL Open Font License 1.1 授權，並補上拼音聲調母音。<a href="https://github.com/ACh-K/Cubic-11" target="_blank" rel="noopener">github.com/ACh-K/Cubic-11</a>',
    cred5: '《吃飽逃颱》是自由軟體，採 GNU 通用公共授權條款第 3 版或更新版本授權。原始碼：<a href="https://github.com/komali2/personalWebsite/tree/master/dev/taiwan-treats-trip" target="_blank" rel="noopener">github.com/komali2/personalWebsite/tree/master/dev/taiwan-treats-trip</a>',
    cred6: '製作過程中沒有颱風受傷，但犧牲了好幾份小吃。',
    q_j1: '{name} 一手開空拍機，一手吃了 {n} 份{fav}。', q_j2: '{name} 的空拍機拍到了颱風餓餓吃掉我們的 4K 畫面。', q_j3: '{name} 說空拍機早就看到颱風餓餓了，只是沒人在聽。',
    q_r1: '{name} 吃了 {n} 份{fav}，然後說是 race condition 害的。', q_r2: '{name} 想駭進颱風的韌體。颱風沒有韌體。', q_r3: '{name} 還在從鍵盤裡挖餅乾屑。',
    q_c1: '{name} 的髮型保住了。這才是重點。', q_c2: '{name} 從頭到尾沒拿下墨鏡，連在颱風裡也是。', q_c3: '{name} 很酷地吃了 {n} 份{fav}。',
    q_l1: '{name} 想收養一隻流浪狗，取名叫小餓餓。', q_l2: '{name} 吃了 {n} 份{fav}，說這是一種靈性體驗。', q_l3: '{name} 看到金色珍奶的時候尖叫了。',
    q_a1: '{name} 今天把 {k} 個東西踢出馬路。', q_a2: '{name} 吃了 {n} 份{fav}。練功夫很耗熱量。', q_a3: '{name} 說颱風餓餓偷襲，太卑鄙了。',
    q_hits: '{name} 下次想換人開車。', q_km: '{name} 說 {km} 公里是吃小吃的個人紀錄。',
    q_lost: '{name} 在{region}附近被吹走了，還在公車站揮手。',
  },
};
// T('key', {name: ...}) or T('key', [a, b]) for {0}/{1}
function T(k, o) {
  const s = (STR[LANG] && STR[LANG][k]) || STR.en[k] || k;
  return o ? s.replace(/\{(\w+)\}/g, (m, p) => o[p] !== undefined ? o[p] : m) : s;
}
const rName = id => LANG === 'zh' ? REG[id].zh : REG[id].en;
const rBoth = id => LANG === 'zh' ? REG[id].zh : `${REG[id].en} ${REG[id].zh}`;
const sName = id => LANG === 'zh' ? SNACKS[id].zh : SNACKS[id].en;
const sDesc = id => (LANG === 'zh' && typeof ZH_SNACK !== 'undefined' && ZH_SNACK[id]) || SNACKS[id].d;
const fDesc = id => (LANG === 'zh' && typeof ZH_FRIEND !== 'undefined' && ZH_FRIEND[id]) || FRIENDS[id].desc;
const fAbility = id => LANG === 'zh' ? FRIENDS[id].zh : `${FRIENDS[id].ab} ${FRIENDS[id].zh}`;
function applyLang() {
  document.documentElement.lang = LANG === 'zh' ? 'zh-Hant-TW' : 'en';
  document.querySelectorAll('[data-i]').forEach(el => { el.textContent = T(el.dataset.i); });
  document.querySelectorAll('[data-ih]').forEach(el => { el.innerHTML = T(el.dataset.ih); });
}
</script>
