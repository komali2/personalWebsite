<script>
'use strict';
/* =========================================================================
   Jieyun Jumble 捷運大風吹 — editable content
   -------------------------------------------------------------------------
   Everything a person might want to tweak by hand lives here: the riders,
   the lost riders and what they say, the LED ticker lines, the etiquette
   jokes, and the station-stamp facts. Edit, then rebuild:
       python3 tools/build.py
   The build checks this file (every text has en + zh, lengths fit the
   screen, sprite ids exist) and stops with a message if something is off.

   Text rules: zh is Taiwan Mandarin (臺灣用語). tw is 台語 in Han characters
   (教育部推薦用字) with tl = Tâi-lô. Keep riders "they" in English.
   ========================================================================= */

/* The regular rider of each line. sprite = id in art/riders.js.
   en/zh = short label shown when you tap a commuter (≤ 22 chars en / 8 zh). */
const RIDERS = {
  BR: { sprite: 'r_BR', en: 'Neihu engineer', zh: '內湖工程師' },
  R: { sprite: 'r_R', en: 'Night-market foodie', zh: '夜市吃貨' },
  G: { sprite: 'r_G', en: 'Gongguan student', zh: '公館學生' },
  O: { sprite: 'r_O', en: 'Auntie with a cart', zh: '推菜籃車的阿姨' },
  BL: { sprite: 'r_BL', en: 'Office worker', zh: '上班族' },
  A: { sprite: 'r_A', en: 'Traveler', zh: '旅客' },
  V: { sprite: 'r_V', en: 'Sunset photographer', zh: '夕陽攝影師' },
  Y: { sprite: 'r_Y', en: 'Delivery rider', zh: '外送員' },
  K: { sprite: 'r_K', en: 'Schoolkid', zh: '小學生' },
};

/* Lost riders: they wait in the wrong line's area until `want` reaches them.
   need = a line that must be on the map for them to appear (optional).
   voice: 'tw' (台語 bubble + subtitle), 'en' (English bubble + zh subtitle) or 'zh'.
   ask = what they say while lost, thanks = when their train comes. */
const LOST = [
  { id: 'suitcase', sprite: 'l_suitcase', want: 'A', voice: 'en', en: 'Lost traveler', zh: '迷路的旅客',
    ask: { en: 'Is this the train to the airport?', zh: '這班車有到機場嗎？' },
    thanks: { en: 'Airport line! My flight thanks you!', zh: '機場線！我的班機謝謝你！' } },
  { id: 'ama', sprite: 'l_ama', want: 'BL', voice: 'tw', en: 'Grandma going to Longshan Temple', zh: '要去龍山寺的阿嬤',
    ask: { tw: '龍山寺欲按怎去？', tl: 'Liông-san-sī beh án-tsuánn khì?', en: 'How do I get to Longshan Temple?', zh: '龍山寺要怎麼去？' },
    thanks: { tw: '多謝，好心有好報！', tl: 'To-siā, hó-sim ū hó-pò!', en: 'Thanks! May your kindness come back to you!', zh: '謝謝，好心有好報！' } },
  { id: 'tourist', sprite: 'l_tourist', want: 'R', voice: 'en', en: 'Tourist with a map', zh: '拿地圖的觀光客',
    ask: { en: 'Which way to Tamsui for the sunset?', zh: '淡水看夕陽要往哪邊？' },
    thanks: { en: 'Red line to Tamsui. Sunset, here I come!', zh: '紅線到淡水，夕陽我來了！' } },
  { id: 'student', sprite: 'l_student', want: 'G', voice: 'zh', en: 'Late student', zh: '快遲到的學生',
    ask: { en: 'I have an exam at Gongguan in ten minutes!', zh: '我十分鐘後在公館考試！' },
    thanks: { en: 'Made it! Probably!', zh: '趕上了！應該吧！' } },
  { id: 'kid', sprite: 'l_kid', want: 'BR', voice: 'zh', en: 'Kid going to the zoo', zh: '要去動物園的小朋友',
    ask: { en: 'Does this train go to the pandas?', zh: '這班車有到貓熊那裡嗎？' },
    thanks: { en: 'Zoo train! Do pandas need tickets too?', zh: '動物園的車！貓熊也要買票嗎？' } },
  { id: 'abo', sprite: 'l_abo', want: 'O', voice: 'tw', en: 'Grandpa going to Xingtian Temple', zh: '要去行天宮的阿伯',
    ask: { tw: '行天宮欲按怎去？', tl: 'Hîng-thian-kiong beh án-tsuánn khì?', en: 'How do I get to Xingtian Temple?', zh: '行天宮要怎麼去？' },
    thanks: { tw: '多謝！來泡茶！', tl: 'To-siā! Lâi phàu-tê!', en: 'Thanks! Come over for tea!', zh: '謝謝！有空來泡茶！' } },
];

/* LED ticker phrases. {stn} = station name. */
const TICKER = {
  next: { en: 'Next station: {stn}', zh: '下一站 {stn}' },
  transfer: { en: 'Transfer here for {line}', zh: '{line}轉乘站' },
  rush: { en: 'Rush hour: the whole city is here.', zh: '尖峰時段，全台北都來了。' },
  clear: { en: 'Platform clear. Even the pigeons left.', zh: '月台淨空，連鴿子都走了。' },
  full: { en: 'Platform filling up. Make some room!', zh: '月台快客滿了，幫忙找位子！' },
  last: { en: 'Last train. Night owls, this is yours.', zh: '末班車，夜貓子請上車。' },
  open: { en: '{line} opens! {year}', zh: '{line}通車！{year}年' },
};

/* Clash jokes: shown (one at random) when two commuters break a rule.
   kind: row, col, line (two on the same line's area) or touch (no personal space). */
const CLASH = {
  touch: [
    { en: 'Personal space, please.', zh: '請保持社交距離。' },
    { en: 'Your backpack wants its own ticket.', zh: '背包也想買一張票。' },
    { en: 'Backpack in front, not in my face.', zh: '背包往前背，不是往臉背。' },
    { en: 'Close friends. Too close.', zh: '感情好，也不用黏這麼緊。' },
    { en: 'Even diagonally, elbows need room.', zh: '斜對角也要留點手肘空間。' },
  ],
  row: [
    { en: 'Two in one row. Someone move.', zh: '同一排兩個人，誰讓一下。' },
    { en: 'One per row. Your bento can wait.', zh: '一排一位，便當先忍一下。' },
    { en: 'This row is not a night-market queue.', zh: '這排不是夜市排隊區。' },
    { en: 'Let this row off before boarding.', zh: '這排先下車，再上車。' },
    { en: 'One per row. No saving seats for bags.', zh: '一排一位，包包不能佔位。' },
  ],
  col: [
    { en: 'Two in one column. Awkward.', zh: '同一行兩個人，好尷尬。' },
    { en: 'This column is not a doorstop.', zh: '這行不是拿來擋車門的。' },
    { en: 'One per column. Bubble tea stays sealed.', zh: '一行一位，珍奶先別開。' },
    { en: 'Queue lines, not conga lines.', zh: '排候車線，不是排火車舞。' },
    { en: 'This column needs an exit, not a duet.', zh: '這行要留出口，不是開演唱會。' },
  ],
  line: [
    { en: 'One rider per line, please.', zh: '一條線只等一位。' },
    { en: 'One per line. No plus-ones today.', zh: '一線一位，今天不能帶朋友。' },
    { en: 'This line already has a regular.', zh: '這條線已經有熟客了。' },
    { en: 'One per line. The doors are not a hug.', zh: '一線一位，車門不是抱抱區。' },
    { en: 'Same line? Save the reunion for outside.', zh: '同一條線？出站再敘舊。' },
  ],
};

/* Station-stamp facts: one true, fun sentence per station (≤ 140 chars en). */
const FACTS = {
  // Verification links (2026-10-23) are editorial notes, not displayed text.
  // https://en.wikipedia.org/wiki/Tamsui_metro_station
  tamsui: { en: 'Before MRT trains arrived, Tamsui was already a stop on the old Tamsui railway.', zh: '捷運來之前，淡水就已經是舊台鐵淡水線的車站。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Hongshulin_station
  hongshulin: { en: 'Hongshulin takes its name from the protected mangrove habitat beside the station.', zh: '紅樹林站的名字，就來自站旁受保護的紅樹林。', icon: 'st_tree' },
  // https://en.wikipedia.org/wiki/Tamsui%E2%80%93Xinyi_line
  beitou: { en: 'Beitou is where you change to the Xinbeitou branch for the hot-spring neighborhood.', zh: '去新北投溫泉區，要在北投站換搭新北投支線。', icon: 'st_spring' },
  // https://parks.gov.taipei/parks/en/en_parks.php?pmsid=245
  shilin: { en: 'Shilin Residence Park is a garden escape reached from this station, not from Jiantan.', zh: '想逛士林官邸公園，要從士林站出發，不是劍潭站。', icon: 'st_tree' },
  // https://en.wikipedia.org/wiki/Minquan_West_Road_metro_station
  minquanW: { en: 'At Minquan W. Rd., the Red Line runs beneath a park while the Orange Line runs beneath the road.', zh: '民權西路站的紅線在公園下，橘線則在民權西路下。', icon: 'st_tree' },
  // https://en.wikipedia.org/wiki/Zhongshan_metro_station
  zhongshan: { en: 'Zhongshan sits in the middle of an underground shopping street: shopping need not wait for sunshine.', zh: '中山站就在中山地下街中段，逛街不用等天晴。', icon: 'st_market' },
  // https://en.wikipedia.org/wiki/Taipei_Main_Station
  tpe: { en: 'Taipei Main Station links to the Airport MRT and Taipei Bus Station through underground passages.', zh: '台北車站能沿地下通道連到機場捷運與台北轉運站。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Chiang_Kai-shek_Memorial_Hall
  cks: { en: 'The nearby memorial hall wears a blue octagonal roof above its white walls.', zh: '附近的中正紀念堂，以白牆配上藍色八角屋頂。', icon: 'st_hall' },
  // https://en.wikipedia.org/wiki/Dongmen_metro_station
  dongmen: { en: 'Dongmen lets you swap between Red and Orange Line trains across the same platform.', zh: '東門站可在同一座月台兩側，換搭紅線與橘線。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Daan_metro_station
  daan: { en: 'At Daan, the Brown Line rides above the street while the Red Line runs underground.', zh: '大安站的文湖線在高架上，紅線則在地下。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Xinyi_Anhe_metro_station
  xinyiAnhe: { en: 'Xinyi Anhe was going to be called Anhe Road; its final name pinpoints the crossing streets.', zh: '信義安和原本預定叫安和路站，後來以兩條交會道路命名。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Taipei_101/World_Trade_Center_metro_station
  tpe101: { en: 'An underground exit connects straight into Taipei 101: the skyscraper visit starts below street level.', zh: '車站出口直通台北101地下樓層，逛摩天樓先從地下開始。', icon: 'st_101' },
  // https://en.wikipedia.org/wiki/Xiangshan_metro_station
  xiangshan: { en: 'Xiangshan station celebrates nearby tree-frog habitat with frog-themed artwork.', zh: '象山站以樹蛙藝術，呼應附近的臺北樹蛙棲地。', icon: 'st_mountain' },
  // https://en.wikipedia.org/wiki/Ximen_metro_station
  ximen: { en: 'Ximen is named for Taipei city wall\'s former west gate, which once stood near the station.', zh: '西門站以臺北城的舊西門命名，城門原址就在車站附近。', icon: 'st_lantern' },
  // https://en.wikipedia.org/wiki/Zhongxiao_Xinsheng_metro_station
  zxXinsheng: { en: 'Zhongxiao Xinsheng serves both Guang Hua Digital Plaza and Huashan 1914 Creative Park.', zh: '忠孝新生站附近，既有光華商場，也有華山1914文化創意產業園區。', icon: 'st_tower' },
  // https://en.wikipedia.org/wiki/Zhongxiao_Fuxing_metro_station
  zxFuxing: { en: 'Long escalators at Zhongxiao Fuxing link the underground Blue Line to the elevated Brown Line.', zh: '忠孝復興的長電扶梯，把地下藍線與高架文湖線串起來。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Zhongxiao_Dunhua_metro_station
  zxDunhua: { en: 'The East Metro Mall connects Zhongxiao Dunhua to Zhongxiao Fuxing without going outdoors.', zh: '忠孝敦化可沿東區地下街走到忠孝復興，不用到戶外。', icon: 'st_market' },
  // https://en.wikipedia.org/wiki/Taipei_City_Hall_metro_station
  cityHall: { en: 'Taipei City Hall station connects to a bus terminal, shopping mall and hotel above it.', zh: '市政府站連著樓上的轉運站、商場與旅館，轉車也能順便逛街。', icon: 'st_tower' },
  // https://www.travel.taipei/en/media/audio-guide/details/47
  longshan: { en: 'Nearby Longshan Temple was founded in 1738, long before anyone could tap an EasyCard.', zh: '附近的龍山寺創建於1738年，比悠遊卡早了好幾個世紀。', icon: 'st_temple' },
  // https://en.wikipedia.org/wiki/Banqiao_station
  banqiao: { en: 'Banqiao gathers conventional rail, high-speed rail and two metro lines at one transport hub.', zh: '板橋把台鐵、高鐵與兩條捷運線，集合在同一座轉運樞紐。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Tucheng_metro_station
  tucheng: { en: 'Tucheng\'s public art looks like an archaeological display, but the artifacts are deliberately invented.', zh: '土城站的公共藝術像考古展示，不過展出的文物是刻意創作的。', icon: 'st_books' },
  // https://en.wikipedia.org/wiki/Dingpu_metro_station
  dingpu: { en: 'Dingpu marks the western end of the Blue Line: blue trains turn back here.', zh: '頂埔是板南線的西端，藍線列車到這裡就要折返。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Taipei_Nangang_Exhibition_Center_metro_station
  nangangEx: { en: 'Both the Blue and Brown Lines end at Nangang Exhibition Center, one below ground and one above.', zh: '南港展覽館是藍線與文湖線的端點，一條在地下、一條在高架上。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Songshan_station
  songshan: { en: 'Songshan puts Raohe Street Night Market just outside the station: save your appetite for the exit.', zh: '松山站旁就是饒河街觀光夜市，食慾留到出站再開動。', icon: 'st_cutlet' },
  // https://en.wikipedia.org/wiki/Taipei_Arena_metro_station
  arena: { en: 'Taipei Arena station was originally going to be called Taipei Stadium station.', zh: '台北小巨蛋站原本預定叫臺北體育場站。', icon: 'st_dome' },
  // https://en.wikipedia.org/wiki/Nanjing_Fuxing_metro_station
  njFuxing: { en: 'Nanjing Fuxing used to be Nanjing East Road, before the Green Line brought a new name.', zh: '南京復興以前叫南京東路站，綠線通車時才換了名字。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Songjiang_Nanjing_metro_station
  sjNanjing: { en: 'Songjiang Nanjing is near the Miniatures Museum of Taiwan: a small world outside a big interchange.', zh: '松江南京站附近有袖珍博物館，大轉乘站旁藏著小小世界。', icon: 'st_tower' },
  // https://en.wikipedia.org/wiki/Beimen_metro_station
  beimen: { en: 'Beimen has an underground connection to Taipei Main Station through Taipei City Mall.', zh: '北門站可沿台北地下街，走到台北車站。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Xiaonanmen_metro_station
  xiaonanmen: { en: 'Xiaonanmen had a movie role: a scene in Au Revoir Taipei was filmed inside the station.', zh: '小南門站也演過電影：《一頁台北》曾在站內取景。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Guting_metro_station
  guting: { en: 'Guting\'s public art uses face masks to explore opposites such as day and night, noise and quiet.', zh: '古亭站用人臉面具做公共藝術，表現晝夜與喧靜等對比。', icon: 'st_sunset' },
  // https://en.wikipedia.org/wiki/Taipower_Building_metro_station
  taipower: { en: 'Some Green Line trains turn back at Taipower Building using a pocket track south of the station.', zh: '部分綠線列車會利用台電大樓站南側的袋狀軌折返。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Gongguan_metro_station
  gongguan: { en: 'Gongguan was once planned as two stations, then combined into one near National Taiwan University.', zh: '公館原本規劃成兩座車站，後來合成一座，設在臺大附近。', icon: 'st_books' },
  // https://en.wikipedia.org/wiki/Dapinglin_metro_station
  dapinglin: { en: 'At Dapinglin, changing between Green and Circular Lines means visiting the concourse first.', zh: '大坪林換搭綠線與環狀線，得先回到穿堂層再轉乘。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Xindian_metro_station
  xindian: { en: 'Xindian\'s entrance sculptures are titled Heaven, Earth, and Man: art greets you at the end of the Green Line.', zh: '新店站出入口的雕塑名為「天、地、人」，在綠線端點迎接旅客。', icon: 'st_mountain' },
  // https://en.wikipedia.org/wiki/Luzhou_metro_station
  luzhou: { en: 'Luzhou is near the Lee Family Historic Estate, a historic home tucked into the city.', zh: '蘆洲站附近有李氏古宅，都市裡也藏著老宅。', icon: 'st_lantern' },
  // https://en.wikipedia.org/wiki/Daqiaotou_metro_station
  daqiaotou: { en: 'Daqiaotou is the last shared station before the Orange Line splits toward Luzhou and Huilong.', zh: '橘線往蘆洲與迴龍分岔前，最後一座共用車站就是大橋頭。', icon: 'st_bridge' },
  // https://en.wikipedia.org/wiki/Xingtian_Temple_metro_station
  xingtian: { en: 'Xingtian Temple station has ceramic public art inspired by the Eight Generals\' masks.', zh: '行天宮站的陶瓷公共藝術，靈感來自八家將臉譜。', icon: 'st_temple' },
  // https://en.wikipedia.org/wiki/Dingxi_metro_station
  dingxi: { en: 'Dingxi is near Lehua Night Market, so the next queue might be for a snack rather than a train.', zh: '頂溪站附近有樂華夜市，下一次排隊可能是在等小吃，不是等車。', icon: 'st_cutlet' },
  // https://en.wikipedia.org/wiki/Jingan_metro_station
  jingan: { en: 'Jingan links deep underground Orange Line platforms to elevated Circular Line platforms.', zh: '景安把地下深處的橘線月台，接到高架上的環狀線月台。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Nanshijiao_metro_station
  nanshijiao: { en: 'Nanshijiao stands on the site of the old Zhonghe railway station.', zh: '南勢角站就蓋在舊台鐵中和站的原址上。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Taipei_Zoo_station
  zoo: { en: 'Taipei Zoo station connects a zoo visit with the nearby Maokong Gondola: rails first, cable next.', zh: '動物園站附近能接著搭貓空纜車，先走軌道，再上鋼纜。', icon: 'st_panda' },
  // https://en.wikipedia.org/wiki/Liuzhangli_metro_station
  liuzhangli: { en: 'Liuzhangli sits on the border of Daan and Xinyi districts, right where Heping and Keelung roads meet.', zh: '六張犁站位在大安與信義區交界，就在和平東路與基隆路口。', icon: 'st_tower' },
  // https://en.wikipedia.org/wiki/Technology_Building_metro_station
  techBldg: { en: 'The Brown Line makes a right-angle turn between Technology Building and Liuzhangli.', zh: '文湖線在科技大樓與六張犁之間，會轉一個直角彎。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Zhongshan_Junior_High_School_metro_station
  zsJHS: { en: 'Zhongshan Junior High School was the Brown Line\'s northern end before the Neihu section opened.', zh: '內湖段通車以前，中山國中曾是文湖線的北端終點。', icon: 'st_books' },
  // https://en.wikipedia.org/wiki/Songshan_Airport_metro_station
  songshanAirport: { en: 'Songshan Airport is one of the Brown Line\'s rare underground stops, with a passage into the airport.', zh: '松山機場是文湖線少見的地下站，還有通道直接連進機場。', icon: 'st_plane' },
  // https://en.wikipedia.org/wiki/Dazhi_metro_station
  dazhi: { en: 'Dazhi and Songshan Airport are the only underground stations on the Brown Line.', zh: '文湖線只有大直與松山機場兩站在地下。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Xihu_metro_station
  xihu: { en: 'At Xihu, the concourse sits above the platforms, reversing the usual elevated-station arrangement.', zh: '西湖站的穿堂層在月台上方，和一般高架站的配置相反。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Neihu_metro_station
  neihu: { en: 'Huguang Market is near Neihu station: an open-air market beside an elevated railway.', zh: '內湖站附近有湖光市場，高架捷運旁也能逛露天市場。', icon: 'st_market' },
  // https://en.wikipedia.org/wiki/Donghu_metro_station
  donghu: { en: 'Donghu station\'s music-themed design includes a dancing musical staff in the station square.', zh: '東湖站以音樂為主題，站前廣場也藏著舞動的五線譜。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Nangang_Software_Park_metro_station
  nangangSoft: { en: 'Nangang Software Park station chose Digital as its public-art theme, fitting its techy neighbors.', zh: '南港軟體園區站的公共藝術主題是「數位」，和科技鄰居很合拍。', icon: 'st_tower' },
  // https://en.wikipedia.org/wiki/Sanchong_station
  sanchong: { en: 'Sanchong connects the underground Orange Line with the elevated Airport MRT.', zh: '三重站把地下的橘線，接到高架上的機場捷運。', icon: 'st_plane' },
  // https://en.wikipedia.org/wiki/New_Taipei_Industrial_Park_station
  xinbeiPark: { en: 'New Taipei Industrial Park brings two elevated lines together: the Airport MRT and Circular Line.', zh: '新北產業園區讓兩條高架路線相遇：機場捷運與環狀線。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Taishan_metro_station
  taishan: { en: 'Taishan station stands on the boundary between Taishan and Xinzhuang districts.', zh: '泰山站就位在泰山區與新莊區的交界。', icon: 'st_tower' },
  // https://www.taoyuan-airport.com/airport_mrt?lang=en
  airportT1: { en: 'Both express and commuter Airport MRT trains stop at Airport Terminal 1.', zh: '機場第一航廈站，直達車與普通車都會停靠。', icon: 'st_plane' },
  // https://en.wikipedia.org/wiki/Tamkang_University_light_rail_station
  tamkang: { en: 'Tamkang University light rail station sits above Provincial Highway 2, near Shuiyuan Road.', zh: '淡江大學輕軌站架在台2線上方，靠近水源路口。', icon: 'st_books' },
  // https://en.wikipedia.org/wiki/Danhai_New_Town_light_rail_station
  danhai: { en: 'Danhai New Town is a street-level light rail stop on Shalun Road, not an underground station.', zh: '淡海新市鎮站就在沙崙路的地面上，不用鑽到地下等輕軌。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Taipei_University_of_Marine_Technology_light_rail_station
  oceanU: { en: 'Taipei University of Marine Technology is on the Blue Coast branch toward Tamsui Fisherman\'s Wharf.', zh: '台北海洋大學站在淡海輕軌藍海線上，列車開往淡水漁人碼頭。', icon: 'st_books' },
  // https://en.wikipedia.org/wiki/Tamsui_Fisherman%27s_Wharf
  wharf: { en: 'Tamsui Fisherman\'s Wharf is also officially called Tamsui Second Fishing Harbor.', zh: '淡水漁人碼頭的正式名稱，其實是淡水第二漁港。', icon: 'st_wharf' },
  // https://en.wikipedia.org/wiki/Shisizhang_station
  shisizhang: { en: 'Shisizhang is where the Ankeng light rail meets the Circular Line, beside the Circular Line depot.', zh: '十四張是安坑輕軌與環狀線的交會站，旁邊就是環狀線機廠。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Zhonghe_metro_station
  zhonghe: { en: 'Zhonghe station stands where Zhongshan Road meets Jingping Road, near Huazhong Bridge.', zh: '中和站位在中山路與景平路交會處，附近就是華中橋。', icon: 'st_bridge' },
  // https://en.wikipedia.org/wiki/Banxin_metro_station
  banxin: { en: 'Banxin has Minsheng Park nearby, a green pause along the Circular Line.', zh: '板新站附近有民生公園，是環狀線旁一處綠色休息站。', icon: 'st_tree' },
  // https://en.wikipedia.org/wiki/Touqianzhuang_metro_station
  touqianzhuang: { en: 'At Touqianzhuang, underground Orange Line trains meet the Circular Line\'s elevated platforms.', zh: '頭前庄讓地下的橘線列車，與高架上的環狀線月台相遇。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Sunshine_Sports_Park_light_rail_station
  sunPark: { en: 'Sunshine Sports Park station is elevated above Anhe Road, near the park that gives it its name.', zh: '陽光運動公園站架在安和路上方，附近就是同名的運動公園。', icon: 'st_bike' },
  // https://en.wikipedia.org/wiki/Shuangcheng_light_rail_station
  shuangcheng: { en: 'Shuangcheng sits at street level on Anyi Road, near the Ankeng light rail depot.', zh: '雙城站就在安一路的地面上，附近就是安坑輕軌機廠。', icon: 'st_train' },
};

/* Lines for proofreading — citation checks do not replace a fluent-speaker read.
   key | 台語 | Tâi-lô | English
   ama.ask | 龍山寺欲按怎去？ | Liông-san-sī beh án-tsuánn khì? | How do I get to Longshan Temple?
   ama.thanks | 多謝，好心有好報！ | To-siā, hó-sim ū hó-pò! | Thanks! May your kindness come back to you!
   abo.ask | 行天宮欲按怎去？ | Hîng-thian-kiong beh án-tsuánn khì? | How do I get to Xingtian Temple?
   abo.thanks | 多謝！來泡茶！ | To-siā! Lâi phàu-tê! | Thanks! Come over for tea!
   MOE: 按怎 https://sutian.moe.edu.tw/zh-hant/su/5022/
        多謝 https://sutian.moe.edu.tw/zh-hant/su/2415/
        好心 https://sutian.moe.edu.tw/zh-hant/su/2297/
        龍山寺 https://sutian.moe.edu.tw/zh-hant/su/21329/
        行天宮 https://sutian.moe.edu.tw/zh-hant/su/21402/
        泡茶 https://sutian.moe.edu.tw/zh-hant/su/4356/
   Tea is an invitation to visit, not a suggestion to drink on the MRT.
*/
</script>
