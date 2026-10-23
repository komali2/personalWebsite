<script>
'use strict';
/* =========================================================================
   The map: lines, stations and one schematic layout per board size.
   Layouts follow the real network (transfers are real transfers), bent to
   the grid the way the official map bends it. Pure data plus a parser;
   tools/core.js loads it into node too.

   Layout format: one string per line, cells in track order, each "cell:station".
   Cell = column letter (a = west) + row digit (0 = north). Diagonal steps are
   allowed (drawn at 45°); trains ride them, but catchments only spread along
   straight track steps, so every region stays in one piece.
   ========================================================================= */

// lines in opening order: the board starts with the first five, then one more every two solves
const LINE_IDS = ['BR', 'R', 'G', 'O', 'BL', 'A', 'V', 'Y', 'K'];
const LINES = {
  BR: { en: 'Wenhu Line', zh: '文湖線', year: 1996, col: '#c48c31' },
  R: { en: 'Tamsui–Xinyi Line', zh: '淡水信義線', year: 1997, col: '#e3002c' },
  G: { en: 'Songshan–Xindian Line', zh: '松山新店線', year: 1999, col: '#008659' },
  O: { en: 'Zhonghe–Xinlu Line', zh: '中和新蘆線', year: 1998, col: '#f8b61c' },
  BL: { en: 'Bannan Line', zh: '板南線', year: 1999, col: '#0070bd' },
  A: { en: 'Airport MRT', zh: '機場捷運', year: 2017, col: '#8246af' },
  V: { en: 'Danhai LRT', zh: '淡海輕軌', year: 2018, col: '#e2493b' },
  Y: { en: 'Circular Line', zh: '環狀線', year: 2020, col: '#ffdb00' },
  K: { en: 'Ankeng LRT', zh: '安坑輕軌', year: 2023, col: '#bfa66f' },
};

// station id: [English, 中文]
const STN = {
  tamsui: ['Tamsui', '淡水'], hongshulin: ['Hongshulin', '紅樹林'], beitou: ['Beitou', '北投'], shilin: ['Shilin', '士林'],
  minquanW: ['Minquan W. Rd.', '民權西路'], zhongshan: ['Zhongshan', '中山'], tpe: ['Taipei Main Station', '台北車站'],
  cks: ['Chiang Kai-shek Memorial Hall', '中正紀念堂'], dongmen: ['Dongmen', '東門'], daan: ['Daan', '大安'],
  xinyiAnhe: ['Xinyi Anhe', '信義安和'], tpe101: ['Taipei 101/World Trade Center', '台北101/世貿'], xiangshan: ['Xiangshan', '象山'],
  ximen: ['Ximen', '西門'], zxXinsheng: ['Zhongxiao Xinsheng', '忠孝新生'], zxFuxing: ['Zhongxiao Fuxing', '忠孝復興'],
  zxDunhua: ['Zhongxiao Dunhua', '忠孝敦化'], cityHall: ['Taipei City Hall', '市政府'], longshan: ['Longshan Temple', '龍山寺'],
  banqiao: ['Banqiao', '板橋'], tucheng: ['Tucheng', '土城'], dingpu: ['Dingpu', '頂埔'], nangangEx: ['Nangang Exhibition Center', '南港展覽館'],
  songshan: ['Songshan', '松山'], arena: ['Taipei Arena', '台北小巨蛋'], njFuxing: ['Nanjing Fuxing', '南京復興'],
  sjNanjing: ['Songjiang Nanjing', '松江南京'], beimen: ['Beimen', '北門'], xiaonanmen: ['Xiaonanmen', '小南門'],
  guting: ['Guting', '古亭'], taipower: ['Taipower Building', '台電大樓'], gongguan: ['Gongguan', '公館'],
  dapinglin: ['Dapinglin', '大坪林'], xindian: ['Xindian', '新店'],
  luzhou: ['Luzhou', '蘆洲'], daqiaotou: ['Daqiaotou', '大橋頭'], xingtian: ['Xingtian Temple', '行天宮'],
  dingxi: ['Dingxi', '頂溪'], jingan: ['Jingan', '景安'], nanshijiao: ['Nanshijiao', '南勢角'],
  zoo: ['Taipei Zoo', '動物園'], liuzhangli: ['Liuzhangli', '六張犁'], techBldg: ['Technology Building', '科技大樓'],
  zsJHS: ['Zhongshan Junior High School', '中山國中'], songshanAirport: ['Songshan Airport', '松山機場'], dazhi: ['Dazhi', '大直'],
  xihu: ['Xihu', '西湖'], neihu: ['Neihu', '內湖'], donghu: ['Donghu', '東湖'], nangangSoft: ['Nangang Software Park', '南港軟體園區'],
  sanchong: ['Sanchong', '三重'], xinbeiPark: ['New Taipei Industrial Park', '新北產業園區'], taishan: ['Taishan', '泰山'],
  airportT1: ['Airport Terminal 1', '機場第一航廈'],
  tamkang: ['Tamkang University', '淡江大學'], danhai: ['Danhai New Town', '淡海新市鎮'],
  oceanU: ['Taipei University of Marine Technology', '台北海洋大學'], wharf: ["Tamsui Fisherman's Wharf", '淡水漁人碼頭'],
  shisizhang: ['Shisizhang', '十四張'], zhonghe: ['Zhonghe', '中和'], banxin: ['Banxin', '板新'], touqianzhuang: ['Touqianzhuang', '頭前庄'],
  sunPark: ['Sunshine Sports Park', '陽光運動公園'], shuangcheng: ['Shuangcheng', '雙城'],
};

const MAPS = {
  5: {
    BR: 'e4:liuzhangli d4:techBldg d3:daan d2:zxFuxing d1:njFuxing d0:zsJHS e0:songshanAirport',
    R: 'b0:minquanW b1:zhongshan b2:tpe b3:cks c3:dongmen d3:daan e3:xinyiAnhe',
    G: 'e1:arena d1:njFuxing c1:sjNanjing b1:zhongshan a1:beimen a2:ximen a3:xiaonanmen b3:cks b4:guting c4:taipower',
    O: 'b4:guting c3:dongmen c2:zxXinsheng c1:sjNanjing c0:xingtian b0:minquanW a0:daqiaotou',
    BL: 'a2:ximen b2:tpe c2:zxXinsheng d2:zxFuxing e2:zxDunhua',
  },
  6: {
    BR: 'f5:liuzhangli e5:techBldg e4:daan e3:zxFuxing e2:njFuxing e1:songshanAirport e0:dazhi f0:neihu',
    R: 'c0:shilin c1:minquanW c2:zhongshan c3:tpe c4:cks d4:dongmen e4:daan f4:tpe101',
    G: 'f2:songshan e2:njFuxing d2:sjNanjing c2:zhongshan b2:beimen b3:ximen b4:xiaonanmen c4:cks c5:guting d5:gongguan',
    O: 'b0:luzhou b1:daqiaotou c1:minquanW d1:xingtian d2:sjNanjing d3:zxXinsheng d4:dongmen c5:guting b5:dingxi',
    BL: 'a5:banqiao a4:longshan b3:ximen c3:tpe d3:zxXinsheng e3:zxFuxing f3:cityHall',
    A: 'b2:tpe a2:sanchong a1:xinbeiPark a0:airportT1',
  },
  7: {
    BR: 'g6:zoo f6:liuzhangli f5:daan f4:zxFuxing f3:njFuxing f2:songshanAirport f1:dazhi g1:neihu',
    R: 'b1:tamsui c1:hongshulin d1:shilin d2:minquanW d3:zhongshan d4:tpe d5:cks e5:dongmen f5:daan g5:tpe101',
    G: 'g3:songshan f3:njFuxing e3:sjNanjing d3:zhongshan c3:beimen c4:ximen c5:xiaonanmen d5:cks d6:guting e6:gongguan',
    O: 'b2:luzhou c2:daqiaotou d2:minquanW e2:xingtian e3:sjNanjing e4:zxXinsheng e5:dongmen d6:guting c6:dingxi',
    BL: 'a6:tucheng a5:banqiao b5:longshan c4:ximen d4:tpe e4:zxXinsheng f4:zxFuxing g4:cityHall',
    A: 'c3:tpe b3:sanchong a3:xinbeiPark a2:airportT1',
    V: 'c1:hongshulin c0:tamkang b0:danhai a0:wharf',
  },
  8: {
    BR: 'h7:zoo h6:liuzhangli g6:techBldg g5:daan g4:zxFuxing g3:njFuxing g2:songshanAirport g1:dazhi h1:neihu',
    R: 'b1:tamsui c1:hongshulin d1:beitou e1:shilin e2:minquanW e3:zhongshan e4:tpe e5:cks f5:dongmen g5:daan h5:tpe101',
    G: 'h3:songshan g3:njFuxing f3:sjNanjing e3:zhongshan d3:beimen d4:ximen d5:xiaonanmen e5:cks e6:guting f6:gongguan f7:dapinglin',
    O: 'c2:luzhou d2:daqiaotou e2:minquanW f2:xingtian f3:sjNanjing f4:zxXinsheng f5:dongmen e6:guting d6:dingxi d7:jingan',
    BL: 'a7:dingpu a6:tucheng b5:banqiao c5:longshan d4:ximen e4:tpe f4:zxXinsheng g4:zxFuxing h4:cityHall',
    A: 'd3:tpe c3:sanchong b3:xinbeiPark a3:taishan a2:airportT1',
    V: 'c1:hongshulin c0:tamkang b0:danhai a0:oceanU a1:wharf',
    Y: 'f7:dapinglin e7:shisizhang d7:jingan c7:zhonghe b6:banxin b5:banqiao b4:touqianzhuang b3:xinbeiPark',
  },
  9: {
    BR: 'h8:zoo h7:liuzhangli g6:techBldg g5:daan g4:zxFuxing g3:njFuxing g2:songshanAirport g1:dazhi h1:xihu i1:neihu i2:donghu i3:nangangSoft i4:nangangEx',
    R: 'b1:tamsui c1:hongshulin d1:beitou e1:shilin e2:minquanW e3:zhongshan e4:tpe e5:cks f5:dongmen g5:daan h5:tpe101 i5:xiangshan',
    G: 'h3:songshan g3:njFuxing f3:sjNanjing e3:zhongshan d3:beimen d4:ximen d5:xiaonanmen e5:cks e6:guting f6:gongguan f7:dapinglin f8:xindian',
    O: 'c2:luzhou d2:daqiaotou e2:minquanW f2:xingtian f3:sjNanjing f4:zxXinsheng f5:dongmen e6:guting d6:dingxi d7:jingan c8:nanshijiao',
    BL: 'a7:dingpu a6:tucheng b5:banqiao c5:longshan d4:ximen e4:tpe f4:zxXinsheng g4:zxFuxing h4:cityHall i4:nangangEx',
    A: 'd3:tpe c3:sanchong b3:xinbeiPark a3:taishan a2:airportT1',
    V: 'c1:hongshulin c0:tamkang b0:danhai a0:oceanU a1:wharf',
    Y: 'f7:dapinglin e7:shisizhang d7:jingan c7:zhonghe b6:banxin b5:banqiao b4:touqianzhuang b3:xinbeiPark',
    K: 'e7:shisizhang e8:sunPark d8:shuangcheng',
  },
};

// parse MAPS[n] into a layout: {n, ids, tracks: [[cell]], stn: [[station id]], straight: [[bool]]}
function parseLayout(n) {
  const src = MAPS[n], ids = LINE_IDS.slice(0, n), tracks = [], stn = [];
  for (const id of ids) {
    const t = [], s = [];
    for (const tok of src[id].trim().split(/\s+/)) {
      const [c, st] = tok.split(':');
      t.push((+c.slice(1)) * n + (c.charCodeAt(0) - 97));
      s.push(st);
    }
    tracks.push(t); stn.push(s);
  }
  return { n, ids, tracks, stn };
}
// problems with a layout (bad cells, gaps, loops, unknown stations); [] when fine
function checkLayout(lay) {
  const n = lay.n, errs = [];
  lay.tracks.forEach((t, l) => {
    const id = lay.ids[l], seen = new Set();
    t.forEach((c, i) => {
      const x = c % n, y = (c / n) | 0;
      if (x < 0 || y < 0 || x >= n || y >= n || !Number.isInteger(c)) errs.push(`${n}:${id} cell ${i} off the board`);
      if (seen.has(c)) errs.push(`${n}:${id} visits a cell twice`); seen.add(c);
      if (!STN[lay.stn[l][i]]) errs.push(`${n}:${id} unknown station ${lay.stn[l][i]}`);
      if (i) { const p = t[i - 1], dx = Math.abs(p % n - x), dy = Math.abs(((p / n) | 0) - y); if (dx > 1 || dy > 1) errs.push(`${n}:${id} gap before ${lay.stn[l][i]}`); }
    });
    if (t.length < 3) errs.push(`${n}:${id} track shorter than 3`);
  });
  return errs;
}
</script>
