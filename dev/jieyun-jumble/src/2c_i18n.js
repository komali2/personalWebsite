<script>
'use strict';
/* =========================================================================
   UI language: English / Taiwan Mandarin. Auto-detected from the browser's
   first preferred language until the player picks one.
   Rows are 橫排 and columns 直排 in Chinese (行/列 mean opposite things in
   Taiwan and China, so we avoid them).
   ========================================================================= */
let LANG = save.lang || (/^zh/i.test((navigator.languages && navigator.languages[0]) || navigator.language || '') ? 'zh' : 'en');
const SRC = 'https://github.com/komali2/personalWebsite/tree/master/dev/jieyun-jumble';
const STR = {
  en: {
    sub: 'One commuter per row, column and line.', cont: 'CONTINUE', play: 'PLAY', today: 'TODAY 今日', book: 'STAMPS 紀念章', about: 'HOW TO PLAY', credits: 'CREDITS',
    paused: 'Paused', resume: 'RESUME', quit: 'SAVE & QUIT TO MENU', undo: 'UNDO', clear: 'CLEAR', hint: 'HINT', hint2: 'SHOW ME',
    ruleRow: 'Row', ruleCol: 'Column', ruleLine: 'Line', ruleSpace: 'Space', rush: 'RUSH', dailyTag: 'TODAY',
    soundOn: 'SOUND: ON', soundOff: 'SOUND: OFF', motionFull: 'MOTION: FULL', motionLow: 'MOTION: LOW', langSwitch: '中文', autoOn: 'AUTO ✕: ON', autoOff: 'AUTO ✕: OFF',
    overWon: 'LAST TRAIN!', overFull: 'PLATFORM FULL', overWonSub: 'You kept Taipei moving from 06:00 to midnight.', overFullSub: 'The platform filled up (客滿) at {0}.',
    score: 'SCORE', carried: 'CARRIED', boards: 'BOARDS', clears: 'PLATFORM CLEARS', lines: 'LINES OPEN', best: 'BEST', newBest: 'NEW BEST!', time: 'TIME',
    newStamps: 'New stamps: {0}', newLost: 'Helped home: {0}', bikes: '{0} gave up on the crowd and rode a YouBike', again: 'AGAIN', share: 'SHARE', menu: 'MENU', back: 'BACK', bestLine: 'BEST {0}', streak: 'Daily streak {0}',
    todayDone: 'Today: {0} pts. A new day at midnight Taipei time.',
    bookTitle: 'Stamp Book 紀念章', tabStations: 'STATIONS', tabLost: 'LOST & FOUND', bookCount: '{0} / {1} stations stamped', lostCount: '{0} / {1} riders helped',
    notYet: 'Not stamped yet. A train has to stop here.', visits: 'Trains stopped here ×{0}', lostNot: 'Not met yet. Lost riders show up once all nine lines are open.', lostMet: 'Helped home ×{0}',
    wants: 'Looking for: {0}',
    open: '{0} opens!', rushBanner: 'RUSH HOUR', rushSub: 'Everyone counts double', clearBanner: 'PLATFORM CLEAR!', fullWarn: 'The platform is filling up!',
    lastTrain: 'LAST TRAIN', firstTrain: 'FIRST TRAIN 06:00', regular: 'A regular: this commuter stays put.', lostLeft: '{0} asked a station attendant and found the way.',
    solved: 'All aboard!',
    h_wrong: 'Someone is in the wrong spot (marked). Move them.', h_wrongX: 'A ✕ is covering a spot someone needs (marked red).',
    h_single_row: 'Only one spot left in this row.', h_single_col: 'Only one spot left in this column.', h_single_line: 'Only one spot left in the {0} area.',
    h_conf_line_row: 'The {0} area only fits in this row, so the rest of the row is out.', h_conf_line_col: 'The {0} area only fits in this column, so the rest of the column is out.',
    h_conf_row_line: 'Every spot left in this row is in the {0} area, so the rest of that area is out.', h_conf_col_line: 'Every spot left in this column is in the {0} area, so the rest of that area is out.',
    h_group_line_row: 'These {0} lines fit only in these {0} rows, so nobody else fits there.', h_group_line_col: 'These {0} lines fit only in these {0} columns, so nobody else fits there.',
    h_group_row_line: 'These {0} rows only reach {0} lines, so those lines can\'t use other rows.', h_group_col_line: 'These {0} columns only reach {0} lines, so those lines can\'t use other columns.',
    h_squeeze_row: 'Wherever this row\'s commuter sits, the marked blocks are ruled out.', h_squeeze_col: 'Wherever this column\'s commuter sits, the marked blocks are ruled out.',
    h_squeeze_line: 'Wherever the {0} commuter sits, the marked blocks are ruled out.', h_whatif: 'A commuter on the marked block would leave no room somewhere else.',
    h_place: 'Here\'s one.', h_none: 'Looks right so far. Keep going!',
    shareTxt: '🚇 Jieyun Jumble 捷運大風吹\n{line}\n{carried} commuters · {clears} platform clears · {score} pts\n{url}',
    shareWon: 'I kept Taipei moving until the last train. 🌙', shareFull: 'My platform filled up at {time}. 😵', shareDaily: '台北 {date} (v{v})',
    copied: 'Copied!', copiedChat: 'Copied! Paste it in the group chat', noCopy: 'Could not copy',
    credTitle: 'Credits', aboutTitle: 'How to play', aboutHead: 'About', whyTitle: 'Why?',
    rules0: 'Seat commuters on the map so that:',
    rules1: 'every <b>row</b> has exactly one,', rules2: 'every <b>column</b> has exactly one,',
    rules3: 'every colored <b>line area</b> has exactly one (each area belongs to the train inside it),',
    rules4: 'and nobody touches anybody: <b>personal space</b>, diagonals included.',
    rules5: '<b>Tap</b> a block once for ✕ (nobody here), twice for a commuter, three times to empty it. <b>Drag</b> to paint ✕s. Commuters already standing when a board appears are locked in place.',
    rules6: 'Solve it and the train boards the waiting crowd, then every line moves on and the areas reshuffle. The platform keeps filling, faster at rush hour. Keep it from filling up (客滿) until the last train at midnight. Stuck? <b>HINT</b> points out a mistake or the next logical step; press again to place a commuter. Hints let more people onto the platform.',
    about1: 'Hi! I\'m <a href="https://www.calebjay.com" target="_blank" rel="noopener">Caleb Rogers</a>, a software engineer living in Taipei.',
    about2: 'I build software with <a href="https://508.dev" target="_blank" rel="noopener">508.dev</a>, an engineering co-op. <b>We\'re looking for engineers. Come build with us!</b>',
    why: `Taipei's MRT is the best way to get around, and its riders are experts in leaving exactly one empty seat between strangers. This is the third game in the series after <a href="https://www.calebjay.com/games/taiwan-treats-trip/" target="_blank" rel="noopener">Taiwan Treats Trip</a> and <a href="https://www.calebjay.com/games/taiwan-battle-bugs/" target="_blank" rel="noopener">Taiwan Battle Bugs</a>. It's <a href="${SRC}" target="_blank" rel="noopener">open source</a>, so play with it or remix it.`,
    cred1: 'By <a href="https://www.calebjay.com" target="_blank" rel="noopener">Caleb Rogers</a>, with AI agents (Claude and GPT) on code, pixel art, writing and synth sound.',
    cred2: 'The map follows the real network: every transfer is a real transfer, bent to the grid the way the official map bends it. Station facts are real (we checked). Line colors on the tracks are the official ones. The arrival chime is our own tune; the door-closing beeps are the real pattern.',
    cred3: 'Font: Cubic 11 俐方體11號 by ACh &amp; the Cubic 11 Project Authors, SIL Open Font License 1.1. <a href="https://github.com/ACh-K/Cubic-11" target="_blank" rel="noopener">github.com/ACh-K/Cubic-11</a>',
    cred4: `Jieyun Jumble is free software under the GNU General Public License v3 or later. Not affiliated with Taipei Metro. Source: <a href="${SRC}" target="_blank" rel="noopener">github.com/komali2/personalWebsite</a>`,
  },
  zh: {
    sub: '每一橫排、每一直排、每條線，各一位乘客。', cont: '繼續', play: '開始', today: '今日 TODAY', book: '紀念章', about: '玩法', credits: '製作群',
    paused: '暫停', resume: '繼續', quit: '存檔並回主選單', undo: '復原', clear: '清除', hint: '提示', hint2: '直接告訴我',
    ruleRow: '橫排', ruleCol: '直排', ruleLine: '路線', ruleSpace: '距離', rush: '尖峰', dailyTag: '今日',
    soundOn: '音效：開', soundOff: '音效：關', motionFull: '動態：完整', motionLow: '動態：減少', langSwitch: 'EN', autoOn: '自動 ✕：開', autoOff: '自動 ✕：關',
    overWon: '末班車！', overFull: '月台客滿', overWonSub: '從早上六點到午夜，台北都順順地動著。', overFullSub: '月台在 {0} 客滿了。',
    score: '分數', carried: '載客', boards: '盤數', clears: '月台淨空', lines: '開通路線', best: '最佳', newBest: '新紀錄！', time: '時間',
    newStamps: '新紀念章：{0}', newLost: '幫忙回家：{0}', bikes: '{0} 人嫌太擠，改騎 YouBike', again: '再來一次', share: '分享', menu: '主選單', back: '返回', bestLine: '最佳 {0}', streak: '連續每日 {0} 天',
    todayDone: '今日：{0} 分。台北時間午夜換新的一天。',
    bookTitle: '紀念章', tabStations: '車站', tabLost: '失物招領', bookCount: '已蓋 {0} / {1} 站', lostCount: '已幫 {0} / {1} 位',
    notYet: '還沒蓋到。要有列車停靠這一站。', visits: '列車停靠 ×{0}', lostNot: '還沒遇過。九條線都通車後，迷路的乘客才會出現。', lostMet: '幫忙回家 ×{0}',
    wants: '要找：{0}',
    open: '{0}通車！', rushBanner: '尖峰時段', rushSub: '每位乘客分數加倍', clearBanner: '月台淨空！', fullWarn: '月台快滿了！',
    lastTrain: '末班車', firstTrain: '首班車 06:00', regular: '老乘客：這位不會動。', lostLeft: '{0}問了站務員，自己找到路了。',
    solved: '全部上車！',
    h_wrong: '有人站錯位置了（已標記），換個地方。', h_wrongX: '有個 ✕ 擋到需要的位置了（紅色標記）。',
    h_single_row: '這一橫排只剩一個位置。', h_single_col: '這一直排只剩一個位置。', h_single_line: '{0}區域只剩一個位置。',
    h_conf_line_row: '{0}區域只能在這一橫排，所以這排其他格子都不行。', h_conf_line_col: '{0}區域只能在這一直排，所以這排其他格子都不行。',
    h_conf_row_line: '這一橫排剩下的位置都在{0}區域，所以那區其他格子都不行。', h_conf_col_line: '這一直排剩下的位置都在{0}區域，所以那區其他格子都不行。',
    h_group_line_row: '這 {0} 條線只放得進這 {0} 橫排，其他人都不能放這裡。', h_group_line_col: '這 {0} 條線只放得進這 {0} 直排，其他人都不能放這裡。',
    h_group_row_line: '這 {0} 橫排只碰得到 {0} 條線，所以這些線不能用別排。', h_group_col_line: '這 {0} 直排只碰得到 {0} 條線，所以這些線不能用別排。',
    h_squeeze_row: '這一橫排的乘客不管坐哪，標記的格子都不行。', h_squeeze_col: '這一直排的乘客不管坐哪，標記的格子都不行。',
    h_squeeze_line: '{0}的乘客不管坐哪，標記的格子都不行。', h_whatif: '如果有人坐在標記的格子，別的地方就沒位置了。',
    h_place: '放這裡。', h_none: '目前都對，繼續加油！',
    shareTxt: '🚇 捷運大風吹 Jieyun Jumble\n{line}\n載客 {carried} 人・月台淨空 {clears} 次・{score} 分\n{url}',
    shareWon: '我讓台北順順地開到末班車。🌙', shareFull: '我的月台在 {time} 客滿了。😵', shareDaily: '台北 {date}（v{v}）',
    copied: '已複製！', copiedChat: '已複製！貼到群組吧', noCopy: '無法複製',
    credTitle: '製作群', aboutTitle: '玩法', aboutHead: '關於', whyTitle: '為什麼做這個？',
    rules0: '在地圖上安排乘客，讓：',
    rules1: '每一<b>橫排</b>剛好一位，', rules2: '每一<b>直排</b>剛好一位，',
    rules3: '每個顏色的<b>路線區域</b>剛好一位（每區屬於裡面那班列車），',
    rules4: '而且大家都不能相鄰：<b>保持距離</b>，斜的也不行。',
    rules5: '<b>點一下</b>格子是 ✕（不放人），點兩下放乘客，點三下清空。<b>拖曳</b>可以一次畫很多 ✕。盤面出現時就站著的乘客不能移動。',
    rules6: '解開之後，列車載走月台上的人潮，每條線往前開，區域重新洗牌。月台會一直進人，尖峰時段更快。午夜末班車之前別讓月台客滿。卡住了？<b>提示</b>會指出錯誤或下一步推理，再按一次直接幫你放一位。用提示時，月台會多進一些人。',
    about1: '嗨！我是 <a href="https://www.calebjay.com" target="_blank" rel="noopener">Caleb Rogers</a>，住在臺北的軟體工程師。',
    about2: '我和工程師合作社 <a href="https://508.dev" target="_blank" rel="noopener">508.dev</a> 一起打造軟體。<b>我們正在找工程師，歡迎加入！</b>',
    why: `臺北捷運是最好的交通工具，而它的乘客都是「陌生人之間留一個空位」的專家。這是繼<a href="https://www.calebjay.com/games/taiwan-treats-trip/" target="_blank" rel="noopener">《吃飽逃颱》</a>和<a href="https://www.calebjay.com/games/taiwan-battle-bugs/" target="_blank" rel="noopener">《台灣鬥蟲》</a>之後的第三款遊戲，一樣<a href="${SRC}" target="_blank" rel="noopener">開源</a>，歡迎拿去玩、拿去改。`,
    cred1: '作者 <a href="https://www.calebjay.com" target="_blank" rel="noopener">Caleb Rogers</a>，程式、像素美術、文字和合成音效有 AI 代理（Claude 和 GPT）幫忙。',
    cred2: '地圖照著真實路網：每個轉乘站都是真的轉乘站，再像官方路線圖那樣拉成格子。車站小知識都是真的（我們查過）。軌道用的是官方路線色。進站音樂是我們自己寫的，關門的嗶聲是真實的節奏。',
    cred3: '字型：俐方體11號（Cubic 11），作者 ACh 與 Cubic 11 專案貢獻者，採 SIL Open Font License 1.1 授權。<a href="https://github.com/ACh-K/Cubic-11" target="_blank" rel="noopener">github.com/ACh-K/Cubic-11</a>',
    cred4: `《捷運大風吹》是自由軟體，採 GNU 通用公共授權條款第 3 版或更新版本授權。與臺北捷運公司無關。原始碼：<a href="${SRC}" target="_blank" rel="noopener">github.com/komali2/personalWebsite</a>`,
  },
};
// T('key', {name: ...}) or T('key', [a, b]) for {0}/{1}
function T(k, o) {
  const s = (STR[LANG] && STR[LANG][k]) || STR.en[k] || k;
  if (o === undefined) return s;
  if (typeof o !== 'object') o = [o];
  return s.replace(/\{(\w+)\}/g, (m, p) => o[p] !== undefined ? o[p] : m);
}
// any {en, zh} object
const N = o => o ? (LANG === 'zh' ? o.zh : o.en) : '';
const stnName = id => STN[id] ? (LANG === 'zh' ? STN[id][1] : STN[id][0]) : id;
const lineName = id => LINES[id] ? N(LINES[id]) : id;
function applyLang() {
  document.documentElement.lang = LANG === 'zh' ? 'zh-Hant-TW' : 'en';
  document.querySelectorAll('[data-i]').forEach(el => { el.textContent = T(el.dataset.i); });
  document.querySelectorAll('[data-ih]').forEach(el => { el.innerHTML = T(el.dataset.ih); });
}
</script>
