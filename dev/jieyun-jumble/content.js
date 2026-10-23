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
  // https://newtaipei.travel/en/shop/detail/208384
  tamsui: { en: 'Tamsui hides glass noodles inside fried tofu for a-gei, then seals the delicious parcel with fish paste.', zh: '淡水阿給把冬粉藏進油豆腐，再用魚漿封口，是能吃的小包裹。', icon: 'st_cutlet' },
  // https://en.wikipedia.org/wiki/Hongshulin_station
  hongshulin: { en: 'Hongshulin takes its name from the protected mangrove habitat beside the station.', zh: '紅樹林站的名字，就來自站旁受保護的紅樹林。', icon: 'st_tree' },
  // https://www.travel.taipei/en/attraction/details/538
  beitou: { en: 'Beitou\'s hot-spring district also has Taiwan\'s first green library, where the warm welcome comes from wood, not steam.', zh: '北投溫泉區還有臺灣首座綠建築圖書館，用木造空間暖暖地迎接讀者。', icon: 'st_books' },
  // https://parks.gov.taipei/parks/en/en_parks.php?pmsid=245
  shilin: { en: 'Shilin Residence Park is a garden escape reached from this station, not from Jiantan.', zh: '想逛士林官邸公園，要從士林站出發，不是劍潭站。', icon: 'st_tree' },
  // https://www.travel.taipei/en/attraction/details/1690
  minquanW: { en: 'Nearby Zhongshan North Road has a wedding-dress street, where even the window-shopping comes dressed for a big day.', zh: '附近中山北路有婚紗街，連櫥窗都盛裝打扮，準備迎接人生大事。', icon: 'st_market' },
  // https://en.wikipedia.org/wiki/Zhongshan_metro_station
  zhongshan: { en: 'Zhongshan sits in the middle of an underground shopping street: shopping need not wait for sunshine.', zh: '中山站就在中山地下街中段，逛街不用等天晴。', icon: 'st_market' },
  // https://en.wikipedia.org/wiki/Taipei_Main_Station
  tpe: { en: 'Taipei\'s first railway station opened in Dadaocheng, not on the site of today\'s Taipei Main Station.', zh: '臺北最早的火車站開在大稻埕，不在今天台北車站的位置。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Chiang_Kai-shek_Memorial_Hall
  cks: { en: 'The nearby memorial hall wears a blue octagonal roof above its white walls.', zh: '附近的中正紀念堂，以白牆配上藍色八角屋頂。', icon: 'st_hall' },
  // https://www.travel.taipei/en/news/details/7230
  dongmen: { en: 'Yongkang Street near Dongmen is famous for mango shaved ice: a mountain worth climbing with a spoon.', zh: '東門站旁的永康街以芒果冰聞名，這座山要拿湯匙來爬。', icon: 'st_cutlet' },
  // https://www.travel.taipei/en/attraction/details/2159
  daan: { en: 'On weekends, the parking lot under the nearby Jianguo overpass blooms into a flower market.', zh: '週末一到，附近建國高架橋下的停車場，就開成一整座花市。', icon: 'st_tree' },
  // https://www.travel.taipei/en/attraction/details/1688
  xinyiAnhe: { en: 'Nearby Linjiang Street Night Market feeds night owls with oyster omelettes and Taiwanese pork buns.', zh: '附近臨江街夜市有蚵仔煎、刈包，夜貓子的晚餐不怕沒著落。', icon: 'st_cutlet' },
  // https://en.wikipedia.org/wiki/Taipei_101/World_Trade_Center_metro_station
  tpe101: { en: 'An underground exit connects straight into Taipei 101: the skyscraper visit starts below street level.', zh: '車站出口直通台北101地下樓層，逛摩天樓先從地下開始。', icon: 'st_101' },
  // https://en.wikipedia.org/wiki/Xiangshan,_Taipei
  xiangshan: { en: 'Elephant Mountain is named for its shape, but the trail\'s celebrity photo subject is Taipei 101.', zh: '象山因山形像大象而得名，但步道上的明星拍照主角是台北101。', icon: 'st_mountain' },
  // https://en.wikipedia.org/wiki/Red_House_Theater
  ximen: { en: 'Ximen\'s octagonal Red House began as a market, before trading groceries for theater and design.', zh: '西門紅樓的八角樓原本是市場，後來才從買菜變成看戲、逛設計。', icon: 'st_lantern' },
  // https://en.wikipedia.org/wiki/Huashan_1914_Creative_Park
  zxXinsheng: { en: 'Nearby Huashan 1914 Creative Park used to be a winery: these days it bottles up creativity instead.', zh: '附近華山1914文創園區以前是酒廠，現在釀的是創意。', icon: 'st_tower' },
  // https://en.wikipedia.org/wiki/Zhongxiao_Fuxing_metro_station
  zxFuxing: { en: 'Long escalators at Zhongxiao Fuxing link the underground Blue Line to the elevated Brown Line.', zh: '忠孝復興的長電扶梯，把地下藍線與高架文湖線串起來。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Zhongxiao_Dunhua_metro_station
  zxDunhua: { en: 'The East Metro Mall connects Zhongxiao Dunhua to Zhongxiao Fuxing without going outdoors.', zh: '忠孝敦化可沿東區地下街走到忠孝復興，不用到戶外。', icon: 'st_market' },
  // https://en.wikipedia.org/wiki/Songshan_Cultural_and_Creative_Park
  cityHall: { en: 'Nearby Songshan Cultural and Creative Park was a tobacco factory before its workshops filled with design.', zh: '附近松山文創園區以前是菸廠，如今廠房裡裝的是設計，不是菸草。', icon: 'st_tower' },
  // https://www.travel.taipei/en/media/audio-guide/details/47
  longshan: { en: 'Nearby Longshan Temple was founded in 1738, long before anyone could tap an EasyCard.', zh: '附近的龍山寺創建於1738年，比悠遊卡早了好幾個世紀。', icon: 'st_temple' },
  // https://en.wikipedia.org/wiki/Banqiao_station
  banqiao: { en: 'Colorful rings on Banqiao\'s Blue Line platform rotate when a train arrives: even the art joins the rush.', zh: '板橋站藍線月台的彩色圓環，列車進站時會轉動，連藝術品都跟著忙。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Tucheng_metro_station
  tucheng: { en: 'Tucheng\'s public art looks like an archaeological display, but the artifacts are deliberately invented.', zh: '土城站的公共藝術像考古展示，不過展出的文物是刻意創作的。', icon: 'st_books' },
  // https://www.dorts.gov.taipei/cp.aspx?n=1E9E49BD7665CF2D&s=3D0A3BBDE3F705F9
  dingpu: { en: 'Dingpu\'s station art links old coal mining with carbon nanotubes: carbon has quite a local career.', zh: '頂埔站的公共藝術把煤礦意象接上奈米碳管，碳在這裡也轉行做科技。', icon: 'st_tower' },
  // https://en.wikipedia.org/wiki/Taipei_Nangang_Exhibition_Center_metro_station
  nangangEx: { en: 'Both the Blue and Brown Lines end at Nangang Exhibition Center, one below ground and one above.', zh: '南港展覽館是藍線與文湖線的端點，一條在地下、一條在高架上。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Songshan_station
  songshan: { en: 'Songshan puts Raohe Street Night Market just outside the station: save your appetite for the exit.', zh: '松山站旁就是饒河街觀光夜市，食慾留到出站再開動。', icon: 'st_cutlet' },
  // https://en.wikipedia.org/wiki/Taipei_Arena
  arena: { en: 'Taipei Arena stands on the site of the old municipal baseball stadium: the cheers stayed, the roof arrived.', zh: '台北小巨蛋蓋在舊臺北市立棒球場原址，歡呼聲留下了，屋頂也來了。', icon: 'st_dome' },
  // https://en.wikipedia.org/wiki/Nanjing_Fuxing_metro_station
  njFuxing: { en: 'Nanjing Fuxing used to be Nanjing East Road, before the Green Line brought a new name.', zh: '南京復興以前叫南京東路站，綠線通車時才換了名字。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Songjiang_Nanjing_metro_station
  sjNanjing: { en: 'Songjiang Nanjing is near the Miniatures Museum of Taiwan: a small world outside a big interchange.', zh: '松江南京站附近有袖珍博物館，大轉乘站旁藏著小小世界。', icon: 'st_tower' },
  // https://www.travel.taipei/zh-tw/attraction/details/88
  beimen: { en: 'Nearby North Gate is Taipei\'s only surviving city gate still wearing its original Qing-era architectural style.', zh: '旁邊的北門，是臺北城門裡唯一保留清代建築原貌的一座。', icon: 'st_lantern' },
  // https://en.wikipedia.org/wiki/Xiaonanmen_metro_station
  xiaonanmen: { en: 'Xiaonanmen had a movie role: a scene in Au Revoir Taipei was filmed inside the station.', zh: '小南門站也演過電影：《一頁台北》曾在站內取景。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Guting_metro_station
  guting: { en: 'Guting\'s public art uses face masks to explore opposites such as day and night, noise and quiet.', zh: '古亭站用人臉面具做公共藝術，表現晝夜與喧靜等對比。', icon: 'st_sunset' },
  // https://en.wikipedia.org/wiki/Shida_Night_Market
  taipower: { en: 'Nearby Shida Night Market pairs student-priced snacks with clothes shopping: dinner can turn into a wardrobe update.', zh: '附近師大夜市把學生價小吃和服飾放在一起，吃個晚餐也可能換一身行頭。', icon: 'st_market' },
  // https://en.wikipedia.org/wiki/Treasure_Hill ; https://en.wikipedia.org/wiki/Gongguan_metro_station
  gongguan: { en: 'Near Gongguan, Treasure Hill turned a veterans\' hillside settlement into an artist village, with residents still living there.', zh: '公館附近的寶藏巖，從退伍軍人聚落變成藝術村，老住戶也仍在這裡生活。', icon: 'st_lantern' },
  // https://danlantrail.necoast-nsa.gov.tw/Towns-Content.aspx?a=3434&l=3&cat=3408&listid=3256&fromCnt=0
  dapinglin: { en: 'Dapinglin\'s name remembers a broad, flat forest: trees claimed this busy neighborhood before commuters did.', zh: '大坪林的名字記著昔日平坦的大片樹林，通勤族來之前，這裡先有樹。', icon: 'st_tree' },
  // https://en.wikipedia.org/wiki/Bitan
  xindian: { en: 'Near Xindian station, Bitan offers pedal boats and a pedestrian suspension bridge: the next ride runs on leg power.', zh: '新店站旁的碧潭有腳踏船和吊橋，下一趟旅程換雙腳當動力。', icon: 'st_bridge' },
  // https://en.wikipedia.org/wiki/Luzhou_metro_station
  luzhou: { en: 'Luzhou is near the Lee Family Historic Estate, a historic home tucked into the city.', zh: '蘆洲站附近有李氏古宅，都市裡也藏著老宅。', icon: 'st_lantern' },
  // https://en.wikipedia.org/wiki/Dihua_Street ; https://en.wikipedia.org/wiki/Daqiaotou_metro_station
  daqiaotou: { en: 'Nearby Dihua Street has traded tea, herbs and fabric for generations; before Lunar New Year, snacks steal the show.', zh: '附近迪化街做了好幾代的茶葉、藥材與布料生意，過年前則換年貨搶戲。', icon: 'st_market' },
  // https://www.taiwan-panorama.com/en/Articles/Details?Guid=c9cb3e74-0023-4724-9006-dfe1efa603dd&CatId=10
  // https://www.ht.org.tw/religion29.htm
  xingtian: { en: 'At Xingtian Temple, blue-robed volunteers offer shoujing, a ritual for calming a startled spirit.', zh: '行天宮的藍衣効勞生替信眾收驚，忙碌城市裡，也有人照顧受驚的心。', icon: 'st_temple' },
  // https://en.wikipedia.org/wiki/Dingxi_metro_station
  dingxi: { en: 'Dingxi is near Lehua Night Market, so the next queue might be for a snack rather than a train.', zh: '頂溪站附近有樂華夜市，下一次排隊可能是在等小吃，不是等車。', icon: 'st_cutlet' },
  // https://en.wikipedia.org/wiki/Jingan_metro_station
  jingan: { en: 'Changing trains at Jingan takes you from deep underground to high above the street: a very vertical commute.', zh: '景安轉乘要從地下深處升到高架月台，別人橫向通勤，這裡還得縱向旅行。', icon: 'st_train' },
  // https://newtaipei.travel/en/attractions/detail/111782
  nanshijiao: { en: 'Near Nanshijiao, Huaxin Street is Little Burma, with Burmese signs and mohinga fish-noodle soup.', zh: '南勢角附近的華新街是「緬甸街」，看得到緬文招牌，也吃得到魚湯米線。', icon: 'st_cutlet' },
  // https://en.wikipedia.org/wiki/Taipei_Zoo_station
  zoo: { en: 'Taipei Zoo station connects a zoo visit with the nearby Maokong Gondola: rails first, cable next.', zh: '動物園站附近能接著搭貓空纜車，先走軌道，再上鋼纜。', icon: 'st_panda' },
  // https://www.ehanlin.com.tw/app/keyword/%E5%9C%8B%E4%B8%AD/%E5%9C%B0%E7%90%86/%E5%85%AD%E5%BC%B5%E7%8A%81.html
  liuzhangli: { en: 'Liuzhangli\'s six ploughs measured farmland, not a tool collection: the name remembers the area\'s farming past.', zh: '六張犁不是收藏六把犁，而是用耕地面積取名，把農田時代留在站名裡。', icon: 'st_tree' },
  // https://en.wikipedia.org/wiki/Technology_Building_metro_station
  techBldg: { en: 'The Brown Line makes a right-angle turn between Technology Building and Liuzhangli.', zh: '文湖線在科技大樓與六張犁之間，會轉一個直角彎。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Zhongshan_Junior_High_School_metro_station
  zsJHS: { en: 'Zhongshan Junior High School was the Brown Line\'s northern end before the Neihu section opened.', zh: '內湖段通車以前，中山國中曾是文湖線的北端終點。', icon: 'st_books' },
  // https://www.travel.taipei/en/attraction/details/2104
  songshanAirport: { en: 'Songshan Airport has an observation deck for watching planes: daydreaming about takeoff needs no boarding pass.', zh: '松山機場有觀景台能看飛機，不用登機證，也能做個起飛的白日夢。', icon: 'st_plane' },
  // https://nchdb.boch.gov.tw/assets/overview/historicalBuilding/20040719000001
  dazhi: { en: 'Dazhi\'s Jiantan Temple kept its old name after moving here, so looking for it at Jiantan can lead you astray.', zh: '大直的劍潭古寺搬家後保留舊名，照名字跑去劍潭找，可就找錯地方了。', icon: 'st_temple' },
  // https://www.tcma.gov.taipei/News_Content.aspx?n=4ED693CC533CE816&sms=8C519B9E702F08D3&s=7EE475E1BB366CAA
  xihu: { en: 'Xihu station connects straight to a market food court: the transfer here can be from train to lunch.', zh: '西湖站直通市場二樓美食街，這裡也能從捷運轉乘午餐。', icon: 'st_market' },
  // https://en.wikipedia.org/wiki/Neihu_metro_station
  neihu: { en: 'Huguang Market is near Neihu station: an open-air market beside an elevated railway.', zh: '內湖站附近有湖光市場，高架捷運旁也能逛露天市場。', icon: 'st_market' },
  // https://en.wikipedia.org/wiki/Donghu_metro_station
  donghu: { en: 'Donghu station\'s music-themed design includes a dancing musical staff in the station square.', zh: '東湖站以音樂為主題，站前廣場也藏著舞動的五線譜。', icon: 'st_train' },
  // https://en.wikipedia.org/wiki/Nangang_Software_Park_metro_station
  nangangSoft: { en: 'Nangang Software Park station chose Digital as its public-art theme, fitting its techy neighbors.', zh: '南港軟體園區站的公共藝術主題是「數位」，和科技鄰居很合拍。', icon: 'st_tower' },
  // https://newtaipei.travel/en/column/492
  sanchong: { en: 'Outside Sanchong station, slides lead into New Taipei Metropolitan Park: the commute gets a playground ending.', zh: '三重站外有溜滑梯通往新北大都會公園，通勤也能接上遊樂場結局。', icon: 'st_tree' },
  // https://www.tymetro.com.tw/tymetro-new/en/_pages/checkin/index.php
  xinbeiPark: { en: 'New Taipei Industrial Park offers check-in for participating airlines: your suitcase can start its airport trip early.', zh: '新北產業園區提供合作航空公司的預辦登機，行李可以先一步去機場。', icon: 'st_plane' },
  // https://newtaipei.travel/zh-tw/attractions/detail/110539
  taishan: { en: 'Taishan once made Barbie dolls from start to finish, from the materials to the export box.', zh: '泰山以前能把芭比娃娃從材料一路做到裝箱出口，娃娃也曾是本地製造。', icon: 'st_market' },
  // https://www.taoyuan-airport.com/airport_mrt?lang=en
  airportT1: { en: 'Both express and commuter Airport MRT trains stop at Airport Terminal 1.', zh: '機場第一航廈站，直達車與普通車都會停靠。', icon: 'st_plane' },
  // https://epaper.vac.gov.tw/zh-tw/C/3396%7C21/33831/1/Publish.htm
  tamkang: { en: 'At Tamkang University station, Jimmy Liao\'s giant cat sculpture cradles a napping girl: waiting looks cozy here.', zh: '淡江大學站有幾米的大貓雕塑，女孩窩在貓前臂上小睡，等車也想跟著打盹。', icon: 'st_cat' },
  // https://epaper.vac.gov.tw/zh-tw/C/3396%7C21/33831/1/Publish.htm
  danhai: { en: 'Danhai New Town displays miniature versions of the line\'s Jimmy Liao artworks: a whole art crawl, travel-sized.', zh: '淡海新市鎮站展示沿線幾米作品的迷你模型，一整趟藝術散步變成隨身版。', icon: 'st_cat' },
  // https://en.wikipedia.org/wiki/Taipei_University_of_Marine_Technology_light_rail_station
  oceanU: { en: 'Taipei University of Marine Technology is on the Blue Coast branch toward Tamsui Fisherman\'s Wharf.', zh: '台北海洋大學站在淡海輕軌藍海線上，列車開往淡水漁人碼頭。', icon: 'st_books' },
  // https://newtaipei.travel/en/attractions/detail/403199
  wharf: { en: 'Lover\'s Bridge at Tamsui Fisherman\'s Wharf opened on Valentine\'s Day: even its debut was a date.', zh: '淡水漁人碼頭的情人橋選在西洋情人節啟用，連出道日都在放閃。', icon: 'st_wharf' },
  // https://www.dorts.ntpc.gov.tw/documentary/articleInfo/R9NdyYl4d0zL?page=193
  shisizhang: { en: 'The zhang in Shisizhang was a farmland measure, not a sheet of paper: this station name remembers ploughs.', zh: '十四張的「張」不是紙張，而是從「張犁」簡化來的耕地面積單位。', icon: 'st_tree' },
  // https://en.wikipedia.org/wiki/Zhonghe_metro_station
  zhonghe: { en: 'Zhonghe station stands where Zhongshan Road meets Jingping Road, near Huazhong Bridge.', zh: '中和站位在中山路與景平路交會處，附近就是華中橋。', icon: 'st_bridge' },
  // https://en.wikipedia.org/wiki/Banxin_metro_station
  banxin: { en: 'Banxin has Minsheng Park nearby, a green pause along the Circular Line.', zh: '板新站附近有民生公園，是環狀線旁一處綠色休息站。', icon: 'st_tree' },
  // https://en.wikipedia.org/wiki/Touqianzhuang_metro_station
  touqianzhuang: { en: 'At Touqianzhuang, underground Orange Line trains meet the Circular Line\'s elevated platforms.', zh: '頭前庄讓地下的橘線列車，與高架上的環狀線月台相遇。', icon: 'st_train' },
  // https://newtaipei.travel/en/attractions/detail/403605
  sunPark: { en: 'Sunshine Sports Park has beach-volleyball courts beside the river: a beach day without a trip to the coast.', zh: '陽光運動公園在河邊就有沙灘排球場，不用跑海邊，也能來場沙灘對決。', icon: 'st_bike' },
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
