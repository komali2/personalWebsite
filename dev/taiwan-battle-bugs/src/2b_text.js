<script>
'use strict';
/* Real-world log facts; leaf-eating predators belong to the game, not biology.
   Name checks: Taiwan MOA / TARI and Taiwan environmental education sources.
   https://www.moa.gov.tw/ws.php?id=2506027 (Helopeltis fasciaticollis)
   https://kmweb.moa.gov.tw/subject/subject.php?id=21144 (mantis)
   https://teia.tw/archives/natural_valley_star/ai2023-08-01 (beetle)
   https://www.nnp.gov.tw/ch/specialreport/animal-ecology-taichung/224 (spider)
   https://azai.tari.gov.tw/datasheetExport.html?id=709 (tea tussock moth)
   https://azai.tari.gov.tw/datasheet.aspx?id=706&type=0&term= (tea bagworm)
   https://aphid.aphidnet.org/Toxoptera_aurantii.php (tea aphid)
   Bagworm is a family and looper a genus: no unsupported species assignment.
   Sizes are approximate body lengths unless a case or horn is specified. */
const LOG = {
  beetle: {
    sci: 'Trypoxylus dichotomus', en: 'Rhinoceros beetle', zh: '獨角仙',
    size_en: '50–85 mm, including the male horn', size_zh: '約 50–85 公釐（雄蟲含角）',
    fact_en: 'A summer regular at Taiwan ash sap bars. Males use their horns to flip rivals away from a good feeding spot.',
    fact_zh: '夏天常在光蠟樹上吸食樹液。雄蟲會用角把對手掀開，搶占好喝的位子，根本樹上相撲場。',
  },
  hopper: {
    sci: 'Jacobiasca formosana', en: 'Tea green leafhopper', zh: '小綠葉蟬',
    size_en: 'About 2–3 mm', size_zh: '約 2–3 公釐',
    fact_en: 'Hsinchu and Miaoli\'s Oriental Beauty (Pong Fong tea) needs leafhopper-bitten shoots. Feeding helps trigger that prized honey aroma.',
    fact_zh: '新竹、苗栗的東方美人茶，也叫膨風茶，要用小綠葉蟬吸食過的茶芽製作。這一口，會誘發珍貴的蜜香。',
  },
  mantis: {
    sci: 'Hierodula patellifera', en: 'Giant Asian mantis', zh: '寬腹螳螂',
    size_en: '50–70 mm', size_zh: '約 50–70 公釐',
    fact_en: 'A native predator in Taiwan, with a pale spot on each forewing. Those folded, spiny forelegs are for catching insects, not picking tea.',
    fact_zh: '臺灣本土的捕食高手，兩片前翅各有一枚淡色斑。摺起來的帶刺前腳是抓蟲用的，不是採茶專用剪刀。',
  },
  stink: {
    sci: 'Tessaratoma papillosa', en: 'Lychee giant stink bug', zh: '荔枝椿象',
    size_en: 'About 24–28 mm', size_zh: '約 24–28 公釐',
    fact_en: 'An invasive sap-sucker on Taiwan\'s lychee and longan trees. Defensive spray can burn skin and injure eyes: admire from a distance.',
    fact_zh: '臺灣的外來入侵害蟲，愛吸荔枝、龍眼等植物的汁液。受驚噴出的臭液會灼傷皮膚、傷害眼睛，真的別靠近聞！',
  },
  spider: {
    sci: 'Nephila pilipes', en: 'Giant golden orb-weaver', zh: '人面蜘蛛',
    size_en: 'Female body: 30–50 mm; male: 5–10 mm', size_zh: '雌蛛體長約 30–50 公釐；雄蛛約 5–10 公釐',
    fact_en: 'Common in Taiwan\'s low-elevation woods. The huge female spins a golden web; the much smaller male looks like an unexpected plus-one.',
    fact_zh: '臺灣低海拔林間常見的織網高手。雌蛛織出金黃色的大網，雄蛛小得像不小心跟進來的陪客。蜘蛛有八隻腳，不是昆蟲喔！',
  },
  aphid: {
    sci: 'Toxoptera aurantii', en: 'Tea aphid', zh: '茶蚜（小桔蚜）',
    size_en: 'About 1.5–2 mm', size_zh: '約 1.5–2 公釐',
    fact_en: 'Tiny sap-suckers crowd tender tea shoots. Sticky honeydew can support black sooty mould: a very messy tea party.',
    fact_zh: '小小吸汁客，常擠在嫩梢上開趴。排出的黏黏蜜露會讓煤煙病菌生長，茶會開完，還留下一片黑。',
  },
  mirid: {
    sci: 'Helopeltis fasciaticollis', en: 'Tea mosquito bug', zh: '茶角盲椿象',
    size_en: '5–6 mm, excluding antennae', size_zh: '約 5–6 公釐（不含觸角）',
    fact_en: 'Taiwan\'s tea mosquito bug has a little pin on its back. It pierces tender shoots, leaving dark spots; it is no Oriental Beauty helper.',
    fact_zh: '臺灣茶園的「茶蚊子」，背上像插了一根小圖釘。刺吸嫩芽會留下黑褐色斑點，可不是每隻咬茶的蟲都能做出東方美人！',
  },
  tussock: {
    sci: 'Euproctis pseudoconspersa', en: 'Tea tussock moth caterpillar', zh: '茶毒蛾',
    size_en: 'Mature caterpillar: 25–30 mm', size_zh: '老熟幼蟲約 25–30 公釐',
    fact_en: 'Young caterpillars dine together under tea leaves. Irritating hairs can make tea workers itch badly: fluffy does not mean cuddly.',
    fact_zh: '小時候愛在茶葉背面集體開飯。毒毛會讓採茶、製茶的人癢到受不了；毛茸茸不代表可以摸摸！',
  },
  bagworm: {
    sci: 'Psychidae', en: 'Bagworm', zh: '避債蛾',
    size_en: 'Large tea bagworm cases: 50–70 mm', size_zh: '大型茶避債蛾的袋巢約 50–70 公釐',
    fact_en: 'The caterpillar carries a silk case dressed in leaf and twig scraps. It pokes out to feed: lunch with the house still on.',
    fact_zh: '幼蟲用絲做袋巢，再黏上葉片、枝條當外裝。吃飯只探出前半身，房子背著走，搬家也不耽誤午餐。',
  },
  looper: {
    sci: 'Ectropis spp.', en: 'Tea looper', zh: '茶尺蠖',
    size_en: 'Mature caterpillar: about 25–30 mm', size_zh: '老熟幼蟲約 25–30 公釐',
    fact_en: 'With fewer abdominal prolegs than most caterpillars, it loops along tea twigs. Standing still, it can pass for a twig itself.',
    fact_zh: '腹足比多數毛毛蟲少，走路一拱一伸，像在幫茶枝量尺寸。停住不動時，又能假裝自己就是一截小樹枝。',
  },
  hornet: {
    sci: 'Vespa mandarinia', en: 'Giant hornet', zh: '大虎頭蜂',
    size_en: 'About 39–50 mm', size_zh: '約 39–50 公釐',
    fact_en: 'Taiwan\'s biggest hornet often nests underground and hunts other insects. Give nests plenty of space; this boss is not for real-life duels.',
    fact_zh: '臺灣體型最大的虎頭蜂，常在地下築巢，會獵捕其他昆蟲。看到蜂巢要保持距離，現實中可別找這位頭目單挑。',
  },
  aunt: {
    sci: '', en: 'Auntie A-Zhu', zh: '阿珠姨',
    size_en: 'About 1,600 mm, plus hat', size_zh: '約 1,600 公釐，斗笠另計',
    fact_en: 'Taiwan\'s tea pickers use conical hats and sleeve covers for sun protection. A-Zhu adds a slipper, electric racket and sprayer.',
    fact_zh: '臺灣茶農常戴斗笠、穿袖套遮陽。阿珠姨另外準備藍白拖、電蚊拍和背負式噴霧器；裝備齊全，耐心限量。',
  },
};

/* Original dialogue; MOE dictionary characters and citation-tone Tâi-lô.
   -- marks a neutral-tone attachment, not a missing tone mark.
   蠓 (báng) is the Taiwanese word for mosquito; Mandarin subtitle uses 蚊.
   https://sutian.moe.edu.tw/zh-hant/su/4808/ (哎喲喂)
   https://sutian.moe.edu.tw/zh-hant/su/7696/ (笠仔)
   https://sutian.moe.edu.tw/zh-hant/su/9664/ (歇睏)
   https://sutian.moe.edu.tw/zh-hant/su/5139/ (洗身軀)
   Caleb's proofreading copy is at the end of PROGRESS.md. */
const AUNT = {
  intro1: {
    tw: '藍白拖來矣！', tl: 'Nâ-pe̍h-thua lâi--ah!',
    en: 'Here comes the blue-and-white slipper!', zh: '藍白拖來了啦！',
  },
  intro2: {
    tw: '電蠓拍咧等你！', tl: 'Tiān-báng-phah teh tán lí!',
    en: 'The electric racket is waiting for you!', zh: '電蚊拍在等你喔！',
  },
  intro3: {
    tw: '噴霧器準備好矣！', tl: 'Phùn-bū-khì tsún-pī hó--ah!',
    en: 'Sprayer ready. Auntie means business!', zh: '噴霧器準備好了，阿姨可沒在客氣！',
  },
  half1: {
    tw: '閣食？毋免錢喔！', tl: 'Koh tsia̍h? M̄ bián tsînn--ooh!',
    en: 'Still eating? This is not a free buffet!', zh: '還吃？以為這不用錢喔！',
  },
  half2: {
    tw: '袂驚電？有夠勇！', tl: 'Bē kiann tiān? Ū-kàu ióng!',
    en: 'Not scared of a zap? Brave little thing!', zh: '不怕電？有夠勇喔！',
  },
  half3: {
    tw: '藍白拖閣出場！', tl: 'Nâ-pe̍h-thua koh tshut-tiûnn!',
    en: 'The slipper is back for an encore!', zh: '藍白拖再次登場！',
  },
  super1: {
    tw: '看我的藍白拖！', tl: 'Khuànn guá ê nâ-pe̍h-thua!',
    en: 'Behold! The mighty blue-and-white slipper!', zh: '看我的藍白拖！',
  },
  super2: {
    tw: '電予你跳舞！', tl: 'Tiān hōo lí thiàu-bú!',
    en: 'One zap and you will be dancing!', zh: '電到你跳舞啦！',
  },
  super3: {
    tw: '予你洗身軀！', tl: 'Hōo lí sé-sin-khu!',
    en: 'Bath time, little leaf thief!', zh: '幫你洗個澡，小偷吃鬼！',
  },
  hit1: {
    tw: '哎喲喂，誠有力！', tl: 'Ai--iō-uê, tsiânn ū-la̍t!',
    en: 'Aiyo! That little thing packs a punch!', zh: '哎唷喂，力氣還真大！',
  },
  hit2: {
    tw: '我的花衫啦！', tl: 'Guá ê hue-sann--lah!',
    en: 'Not the floral shirt!', zh: '我的花上衣啦！',
  },
  hit3: {
    tw: '夭壽，真會閃！', tl: 'Iáu-siū, tsin ē siám!',
    en: 'Good grief! What a little dodger!', zh: '夭壽，還真會閃！',
  },
  win: {
    tw: '食飽就轉去！', tl: 'Tsia̍h-pá tō tńg--khì!',
    en: 'Full belly? Home you go!', zh: '吃飽就回家啦！',
  },
  // The spec names 16 keys but requests 18 entries. Keep win as the fallback;
  // these two optional device-specific victories bring the total to 18.
  win2: {
    tw: '電蠓拍收工！', tl: 'Tiān-báng-phah siu-kang!',
    en: 'Electric racket: off duty!', zh: '電蚊拍收工啦！',
  },
  win3: {
    tw: '茶樹會當歇睏矣！', tl: 'Tê-tshiū ē-tàng hioh-khùn--ah!',
    en: 'The tea bushes can finally rest!', zh: '茶樹終於可以休息了！',
  },
  lose1: {
    tw: '好啦，予你食！', tl: 'Hó--lah, hōo lí tsia̍h!',
    en: 'Fine, fine. Have your snack!', zh: '好啦好啦，給你吃啦！',
  },
  lose2: {
    tw: '歇睏，啉茶較贏！', tl: 'Hioh-khùn, lim tê khah iânn!',
    en: 'Break time. A cup of tea beats this!', zh: '休息啦，喝茶還比較划算！',
  },
  lose3: {
    tw: '笠仔予你，免閣來！', tl: 'Le̍h-á hōo lí, bián koh lâi!',
    en: 'Take the hat. No rematch!', zh: '斗笠給你，不用再來了！',
  },
};

const EAT = {
  beetle: [
    { en: 'Usually a sap drinker. Today: salad with a horn.', zh: '平常喝樹液，今天改吃沙拉，還自備叉角。' },
    { en: 'It ordered tree sap. The kitchen sent a leaf.', zh: '點的是樹液，廚房怎麼送來一片葉子？' },
    { en: 'Tea-leaf sumo fuel. The biology teacher needs a minute.', zh: '相撲選手補充茶葉能量。生物老師需要冷靜一下。' },
  ],
  mantis: [
    { en: 'A predator trying salad. No one tell the flies.', zh: '捕食高手改吃沙拉，先別讓蒼蠅知道。' },
    { en: 'Those claws normally catch insects. Today: leaf scissors.', zh: '這雙前腳平常抓蟲，今天兼差當採茶剪刀。' },
    { en: 'The leaf did not run. Suspiciously easy hunting.', zh: '葉子居然沒跑。這場狩獵順利得有點可疑。' },
  ],
  stink: [
    { en: 'Usually lychee and longan sap. The tea detour is getting weird.', zh: '平常吸荔枝、龍眼汁液，這趟茶園之旅越吃越歪。' },
    { en: 'Built-in straw, solid leaf. It refuses to explain.', zh: '自備吸管卻啃整片葉子，還拒絕說明。' },
    { en: 'Honey notes, floral finish, faint threat of stink.', zh: '蜜香、花香，尾韻帶一點臭味警告。' },
  ],
  hopper: [
    { en: 'Finally, a bug actually qualified to taste tea.', zh: '終於，有一隻真的有資格試吃茶葉。' },
    { en: 'A tiny sip for a bug. A big day for Oriental Beauty.', zh: '小蟲吸一口，東方美人香一波。' },
    { en: 'It calls this quality control. Auntie calls it missing stock.', zh: '這叫品質控管。阿姨說這叫庫存短少。' },
  ],
  spider: [
    { en: 'Eight legs, zero salad credentials.', zh: '八隻腳，吃沙拉的資歷是零。' },
    { en: 'It usually catches insects. This leaf must be undercover.', zh: '平常只抓蟲，這片葉子一定是臥底。' },
    { en: 'Web booking confirmed: one leaf, no flies. Strange restaurant.', zh: '網路訂位成功：一片葉子，不附蒼蠅。怪餐廳。' },
  ],
};
</script>
