/**
 * ARAS demo seed — safe to re-run (create-if-missing by natural keys).
 * Run: npm run db:seed
 *
 * Accounts created:
 *   admin@aras.ma   / ArasAdmin1!   (ADMIN)
 *   client@aras.ma  / ArasClient1!  (CUSTOMER)
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";

const img = (id: string, w = 900): string =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${w}&q=80`;
const wide = (id: string): string =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1800&h=760&q=80`;

// Verified Unsplash photo ids (HTTP 200), grouped by search topic.
const P = {
  headphones: ["1618366712010-f4ae9c647dcb", "1545127398-14699f92334b", "1613040809024-b4ef7ba99bc3"],
  watch: ["1777460978727-32621a3ecff6", "1508685096489-7aacd43bd3b1"],
  speaker: ["1608043152269-423dbba4e7e1"],
  powerbank: ["1585995603413-eb35b5f4a50b"],
  laptop: ["1525547719571-a2d4ac8945e2", "1758874383583-59c39da93e40"],
  mouse: ["1615663245857-ac93bb7c39e7", "1760376789492-de70fab19d94"],
  sneakers: ["1595341888016-a392ef81b7de", "1587563871167-1ee9c731aefb"],
  jacket: ["1611312449408-fcece27cdbb7", "1620228922597-cca58f177310"],
  dress: ["1567401893414-76b7b1e5a7a5", "1787841426394-3b243ad1b737", "1614786269829-d24616faf56d"],
  handbag: ["1598532163257-ae3c6b2524b6", "1778953501964-49a05d7cd31b"],
  perfume: ["1523293182086-7651a899d37f", "1762000801139-bf689096622f"],
  cosmetics: ["1512496015851-a90fb38ba796", "1580870069867-74c57ee1bb07", "1573461160327-b450ce3d8e7f"],
  lamp: ["1517991104123-1d56a6e81ed9", "1773847408152-4e06dec54cf4", "1580130281320-0ef0754f2bf7"],
  blender: ["1654064754916-e3edeb09c042", "1595644258096-69155da290fd"],
  yoga: ["1599901860904-17e6ed7083a0", "1765873129061-55a786e7f9db"],
  weights: ["1638536532686-d610adfc8e5c", "1761071176091-7da66403d24a", "1672344048213-76b6e77304bd"],
  baby: ["1618842676088-c4d48a6a7c9d", "1763203010676-c795be911fc3", "1501686637-b7aa9c48a882", "1515488042361-ee00e0ddd4e4", "1777351395942-96046820ddc6"],
  car: ["1760552973861-d8816064c802", "1772903789023-370243b27258", "1776224264887-ab4bbb2e1c05", "1765211002575-18d5302845ac", "1761264889465-67be9fc1b77e"],
  hero: "1664455340023-214c33a9d0bd",
  sale: "1580828343064-fde4fc206bc6",
  store: "1483985988355-763728e1935b",
};

type Tr = [fr: string, ar: string, en: string];

interface ProductSpec {
  slug: string;
  sku: string;
  cat: string;
  sub: string;
  n: Tr;
  d: Tr;
  price: number; // centimes
  compareAt?: number;
  stock: number;
  f?: boolean;
  nw?: boolean;
  bs?: boolean;
  img: string[];
  sizes?: string[];
  colors?: { name: string; swatch: string }[];
  sales: number;
}

interface CategorySpec {
  slug: string;
  name: Tr;
  desc: Tr;
  image: string;
  icon: string;
  subs: { slug: string; name: Tr; desc: Tr; image: string }[];
}

const CATEGORIES: CategorySpec[] = [
  {
    slug: "electronique",
    name: ["Électronique", "إلكترونيات", "Electronics"],
    desc: ["Audio, wearables et recharge portable", "الصوتيات والأجهزة القابلة للارتداء", "Audio, wearables and portable power"],
    image: img(P.headphones[1]),
    icon: "cpu",
    subs: [
      { slug: "audio", name: ["Audio", "صوتيات", "Audio"], desc: ["Casques, écouteurs, enceintes", "سماعات ومكبرات صوت", "Headphones, earbuds, speakers"], image: img(P.headphones[0]) },
      { slug: "montres-connectees", name: ["Montres connectées", "ساعات ذكية", "Smartwatches"], desc: ["Montres et bracelets connectés", "ساعات وأساور ذكية", "Smartwatches and bands"], image: img(P.watch[0]) },
      { slug: "energie-portable", name: ["Énergie portable", "طاقة محمولة", "Portable power"], desc: ["Batteries externes et chargeurs", "بطاريات وشواحن متنقلة", "Power banks and chargers"], image: img(P.powerbank[0]) },
    ],
  },
  {
    slug: "informatique",
    name: ["Informatique", "حاسوب ومعلوماتية", "Computing"],
    desc: ["Ordinateurs portables et périphériques", "حواسيب محمولة وملحقات", "Laptops and peripherals"],
    image: img(P.laptop[0]),
    icon: "laptop",
    subs: [
      { slug: "portables", name: ["Ordinateurs portables", "حواسيب محمولة", "Laptops"], desc: ["Ultrabooks et machines bureautique", "أجهزة فائقة الخفة", "Ultrabooks and everyday laptops"], image: img(P.laptop[0]) },
      { slug: "accessoires-informatique", name: ["Accessoires", "ملحقات", "Accessories"], desc: ["Souris, claviers et hub", "فأرات ولوحات مفاتيح", "Mice, keyboards and hubs"], image: img(P.mouse[0]) },
    ],
  },
  {
    slug: "mode-homme",
    name: ["Mode Homme", "أزياء رجالية", "Men's Fashion"],
    desc: ["Chaussures, vestes et montres", "أحذية وسترات وساعات", "Shoes, jackets and watches"],
    image: img(P.sneakers[1]),
    icon: "shirt",
    subs: [
      { slug: "sneakers-homme", name: ["Sneakers", "حذاء رياضي", "Sneakers"], desc: ["Baskets et chaussures urbaines", "حذاء رياضي وعقاري", "Sneakers and urban shoes"], image: img(P.sneakers[0]) },
      { slug: "vestes-homme", name: ["Vestes & manteaux", "سترات ومعاطف", "Jackets & Coats"], desc: ["Denim, cuir et bomber", "جينز وجلد وبومبر", "Denim, leather and bomber"], image: img(P.jacket[0]) },
    ],
  },
  {
    slug: "mode-femme",
    name: ["Mode Femme", "أزياء نسائية", "Women's Fashion"],
    desc: ["Robes, sacs et accessoires", "فساتين وحقائب وإكسسوارات", "Dresses, bags and accessories"],
    image: img(P.dress[1]),
    icon: "sparkles",
    subs: [
      { slug: "robes", name: ["Robes", "فساتين", "Dresses"], desc: ["Robes d'été, soirée et longues", "فساتين صيفية وسهرة", "Summer, evening and long dresses"], image: img(P.dress[0]) },
      { slug: "sacs-dames", name: ["Sacs", "حقائب", "Bags"], desc: ["Sacs à main et cabas", "حقائب يد وتسوق", "Handbags and totes"], image: img(P.handbag[0]) },
    ],
  },
  {
    slug: "maison-cuisine",
    name: ["Maison & Cuisine", "المنزل والمطبخ", "Home & Kitchen"],
    desc: ["Luminaires et petit électroménager", "إضاءة وأجهزة صغيرة", "Lighting and small appliances"],
    image: img(P.lamp[1]),
    icon: "home",
    subs: [
      { slug: "luminaires", name: ["Luminaires", "إضاءة", "Lighting"], desc: ["Lampes de table et lecture", "مصابيح طاولة وقراءة", "Table and reading lamps"], image: img(P.lamp[0]) },
      { slug: "petit-electromenager", name: ["Petit électroménager", "أجهزة صغيرة", "Small appliances"], desc: ["Blenders et mixeurs", "خلاطات", "Blenders and mixers"], image: img(P.blender[0]) },
    ],
  },
  {
    slug: "beaute-parfums",
    name: ["Beauté & Parfums", "الجمال والعطور", "Beauty & Perfume"],
    desc: ["Parfums et soins du visage", "عطور وعناية بالوجه", "Perfumes and skincare"],
    image: img(P.perfume[1]),
    icon: "droplet",
    subs: [
      { slug: "parfums", name: ["Parfums", "عطور", "Perfumes"], desc: ["Eaux de parfum homme et femme", "عطر رجالي ونساي", "Men's and women's fragrances"], image: img(P.perfume[0]) },
      { slug: "soins-maquillage", name: ["Soins & maquillage", "عناية ومكياج", "Skincare & makeup"], desc: ["Sérums, crèmes et palettes", "سيرومات وكريمات وباليت", "Serums, creams and palettes"], image: img(P.cosmetics[0]) },
    ],
  },
  {
    slug: "sport-fitness",
    name: ["Sport & Fitness", "الرياضة واللياقة", "Sport & Fitness"],
    desc: ["Yoga, musculation et accessoires", "يوغا ورفع أثقال وإكسسوارات", "Yoga, strength and accessories"],
    image: img(P.yoga[1]),
    icon: "dumbbell",
    subs: [
      { slug: "yoga", name: ["Yoga & cardio", "يوغا وكارديو", "Yoga & cardio"], desc: ["Tapis et accessoires souples", "سجاد وإكسسوارات", "Mats and soft accessories"], image: img(P.yoga[0]) },
      { slug: "musculation", name: ["Musculation", "رفع الأثقال", "Strength"], desc: ["Haltères, kettlebells et élastiques", "دمبل وكيتل بيل وأحزمة", "Dumbbells, kettlebells and bands"], image: img(P.weights[0]) },
    ],
  },
  {
    slug: "bebe-enfants",
    name: ["Bébé & Enfants", "الأطفال والرضّع", "Baby & Kids"],
    desc: ["Jouets éveils et essentiels", "ألعاب تنشيطية واحتياجات", "Toys and essentials"],
    image: img(P.baby[2]),
    icon: "baby",
    subs: [
      { slug: "jouets-bebe", name: ["Jouets", "ألعاب", "Toys"], desc: ["Jouets en bois et tapis d'éveil", "ألعاب خشبية وسجاد تنشيط", "Wooden toys and play mats"], image: img(P.baby[0]) },
    ],
  },
  {
    slug: "auto-moto",
    name: ["Auto & Moto", "سيارات ودراجات", "Auto & Moto"],
    desc: ["Accessoires et confort voiture", "ملحقات وراحة السيارة", "Car accessories and comfort"],
    image: img(P.car[1]),
    icon: "car",
    subs: [
      { slug: "accessoires-voiture", name: ["Accessoires voiture", "ملحقات السيارة", "Car accessories"], desc: ["Supports, organiseurs et caméras", "حوامل ومنظمات وكاميرات", "Mounts, organizers and cameras"], image: img(P.car[0]) },
    ],
  },
];

const SHOE_SIZES = ["40", "41", "42", "43", "44"];
const CLOTH_SIZES = ["S", "M", "L", "XL"];

const BLACK = { name: "Noir", swatch: "#1a1a1a" };
const WHITE = { name: "Blanc", swatch: "#f5f5f5" };
const GREY = { name: "Gris", swatch: "#8a8f98" };

const PRODUCTS: ProductSpec[] = [
  // ── Électronique ──────────────────────────────────────────
  { slug: "casque-sans-fil-pro", sku: "ARAS-HP-001", cat: "electronique", sub: "audio",
    n: ["Casque sans fil Pro", "سماعة لاسلكية احترافية", "Wireless Pro Headphones"],
    d: ["Casque sans fil avec réduction de bruit active et 40 h d'autonomie.", "سماعة لاسلكية بحذف ضجيج نشط وبطارية تدوم 40 ساعة.", "Wireless headphones with active noise cancelling and 40 h battery."],
    price: 79900, compareAt: 99900, stock: 45, f: true, bs: true, sales: 142,
    img: [P.headphones[0], P.headphones[2]] },
  { slug: "ecouteurs-bluetooth-air", sku: "ARAS-EB-002", cat: "electronique", sub: "audio",
    n: ["Écouteurs Bluetooth Air", "سماعات بلوتوث Air", "Air Bluetooth Earbuds"],
    d: ["Écouteurs légers, boîtier compact, résistance à l'eau IPX5.", "سماعات خفيفة بعلبة صغيرة ومقاومة للماء IPX5.", "Lightweight earbuds with compact case, IPX5 water resistant."],
    price: 49900, stock: 60, nw: true, sales: 88,
    img: [P.headphones[1]] },
  { slug: "montre-connectee-sport", sku: "ARAS-SW-003", cat: "electronique", sub: "montres-connectees",
    n: ["Montre connectée Sport", "ساعة ذكية رياضية", "Sport Smartwatch"],
    d: ["GPS, oxymètre et plus de 100 modes sport, étanche 5 ATM.", "GPS ومقياس أكسجين وأكثر من 100 وضع رياضي.", "GPS, SpO2 sensor, 100+ sport modes, 5 ATM water resistant."],
    price: 129900, compareAt: 149900, stock: 30, f: true, sales: 76,
    img: [P.watch[0], P.watch[1]] },
  { slug: "enceinte-bluetooth-pulse", sku: "ARAS-SP-004", cat: "electronique", sub: "audio",
    n: ["Enceinte Bluetooth Pulse", "مكبر صوت Pulse", "Pulse Bluetooth Speaker"],
    d: ["30 W, basses profondes, autonomie 20 h et micro intégré.", "30 واط، باص عميق، بطارية 20 ساعة وميكروفون مدمج.", "30 W, deep bass, 20 h battery and built-in mic."],
    price: 59900, stock: 38, sales: 64,
    img: [P.speaker[0]] },
  { slug: "power-bank-20000", sku: "ARAS-PB-005", cat: "electronique", sub: "energie-portable",
    n: ["Power Bank 20 000 mAh", "بطارية متنقلة 20000", "20,000 mAh Power Bank"],
    d: ["Charge rapide 22,5 W, deux sorties USB et écran LED.", "شحن سريع 22.5 واط بمخرجين USB وشاشة LED.", "22,5 W fast charge, dual USB and LED display."],
    price: 29900, stock: 80, sales: 103,
    img: [P.powerbank[0]] },

  // ── Informatique ──────────────────────────────────────────
  { slug: "ordinateur-portable-ultra14", sku: "ARAS-LP-101", cat: "informatique", sub: "portables",
    n: ["Ultrabook Ultra 14 OLED", "حاسوب Ultra 14 OLED", "Ultra 14 OLED Ultrabook"],
    d: ["Écran 14\" OLED, 8 cœurs, 16 Go RAM et SSD 512 Go.", "شاشة 14 بوصة OLED، 8 أنوية، 16 غيغا و SSD 512.", "14\" OLED, 8-core CPU, 16 GB RAM, 512 GB SSD."],
    price: 1299900, compareAt: 1399900, stock: 12, f: true, sales: 24,
    img: [P.laptop[0], P.laptop[1]] },
  { slug: "laptop-air-15", sku: "ARAS-LP-102", cat: "informatique", sub: "portables",
    n: ["Laptop Air 15,6\"", "حاسوب Air 15.6", "Laptop Air 15,6\""],
    d: ["Finition aluminium, 8 Go RAM, idéal bureau et études.", "تشطيب ألمنيوم، 8 غيغا، مثالي للعمل والدراسة.", "Aluminium finish, 8 GB RAM, perfect for work and study."],
    price: 1099900, stock: 15, nw: true, sales: 19,
    img: [P.laptop[1]] },
  { slug: "souris-gaming-precision", sku: "ARAS-MS-103", cat: "informatique", sub: "accessoires-informatique",
    n: ["Souris gaming Precision", "فأرة ألعاب Precision", "Precision Gaming Mouse"],
    d: ["12 000 DPI, capteur optique et boutons programables.", "12000 DPI بحساس بصري وأزرار قابلة للبرمجة.", "12,000 DPI, optical sensor and programmable buttons."],
    price: 39900, compareAt: 49900, stock: 55, sales: 71,
    img: [P.mouse[0]] },
  { slug: "souris-ergo-silencieuse", sku: "ARAS-MS-104", cat: "informatique", sub: "accessoires-informatique",
    n: ["Souris ergo silencieuse", "فأرة مريحة صامتة", "Silent Ergo Mouse"],
    d: ["Sans fil 2,4 GHz, clics silencieux, forme ergonomique.", "لاسلكية 2.4 غيغاهرتز بنقر صامت وشكل مريح.", "2,4 GHz wireless, silent clicks, ergonomic shape."],
    price: 24900, stock: 70, sales: 58,
    img: [P.mouse[1]] },

  // ── Mode Homme ────────────────────────────────────────────
  { slug: "baskets-street-classic", sku: "ARAS-SN-201", cat: "mode-homme", sub: "sneakers-homme",
    n: ["Baskets Street Classic", "حذاء Street Classic", "Street Classic Sneakers"],
    d: ["Tige respirante et semelle amortissante, du 40 au 44.", "تهوية ممتازة ونعل مريح، من 40 إلى 44.", "Breathable upper, cushioned sole, sizes 40-44."],
    price: 64900, compareAt: 79900, stock: 60, f: true, sales: 96,
    img: [P.sneakers[0], P.sneakers[1]],
    sizes: SHOE_SIZES, colors: [BLACK, WHITE, GREY] },
  { slug: "baskets-run-cloud", sku: "ARAS-SN-202", cat: "mode-homme", sub: "sneakers-homme",
    n: ["Baskets Run Cloud", "حذاء Run Cloud", "Run Cloud Sneakers"],
    d: ["Chaussures de running légères pour route et treadmill.", "حذاء جري خفيف للطريق وجهاز المشي.", "Light running shoes for road and treadmill."],
    price: 54900, stock: 48, nw: true, sales: 52,
    img: [P.sneakers[1]],
    sizes: SHOE_SIZES, colors: [GREY, BLACK] },
  { slug: "veste-denim-classique", sku: "ARAS-JK-203", cat: "mode-homme", sub: "vestes-homme",
    n: ["Veste denim classique", "سترة جينز كلاسيكية", "Classic Denim Jacket"],
    d: ["Denim lavé, coupe droite et boutons métalliques.", "جينز مغسول بقصة مستقيمة وأزرار معدنية.", "Washed denim, regular fit, metal buttons."],
    price: 59900, stock: 40, sales: 47,
    img: [P.jacket[0]],
    sizes: CLOTH_SIZES, colors: [{ name: "Indigo", swatch: "#3b4a6b" }, BLACK] },
  { slug: "blouson-cuir-aviateur", sku: "ARAS-JK-204", cat: "mode-homme", sub: "vestes-homme",
    n: ["Blouson cuir aviateur", "جاكيت جلد طيار", "Aviator Leather Jacket"],
    d: ["Look aviateur, doublure chaude et zip asymétrique.", "تصميم طيار ببطانة دافئة وسحاب مائل.", "Aviator style, warm lining, asymmetric zip."],
    price: 149900, compareAt: 179900, stock: 18, sales: 31,
    img: [P.jacket[1]],
    sizes: CLOTH_SIZES, colors: [BLACK, { name: "Marron", swatch: "#6b4423" }] },
  { slug: "montre-homme-classique", sku: "ARAS-MW-205", cat: "mode-homme", sub: "vestes-homme",
    n: ["Montre homme classique", "ساعة رجالية كلاسيكية", "Classic Men's Watch"],
    d: ["Bracelet acier, mouvement quartz, étanche 3 ATM.", "سوار ستل، حركة كوارتز، مقاومة 3 ATM.", "Steel band, quartz movement, 3 ATM."],
    price: 89900, f: true, stock: 26, sales: 44,
    img: [P.watch[1]] },

  // ── Mode Femme ────────────────────────────────────────────
  { slug: "robe-ete-fleurie", sku: "ARAS-DR-301", cat: "mode-femme", sub: "robes",
    n: ["Robe d'été fleurie", "فستان صيفي مزهّر", "Floral Summer Dress"],
    d: ["Robe fluide à motif fleuri, tissu léger et respirant.", "فستان انسيابي بنقوش زهرية من قماش خفيف.", "Flowy floral dress in breathable fabric."],
    price: 49900, stock: 52, f: true, sales: 84,
    img: [P.dress[0], P.dress[2]],
    sizes: CLOTH_SIZES, colors: [{ name: "Fleurs", swatch: "#e8a0bf" }, { name: "Blanc", swatch: "#f7f3ee" }] },
  { slug: "robe-soiree-satin", sku: "ARAS-DR-302", cat: "mode-femme", sub: "robes",
    n: ["Robe de soirée satin", "فستان سهرة ساتان", "Satin Evening Dress"],
    d: ["Satin élégant, longueur midi et dos ouvert.", "ساتان أنيق بطول متوسط وظهر مفتوح.", "Elegant satin, midi length, open back."],
    price: 89900, compareAt: 109900, stock: 30, sales: 38,
    img: [P.dress[1]],
    sizes: CLOTH_SIZES, colors: [{ name: "Noir", swatch: "#111111" }, { name: "Bordeaux", swatch: "#7b2d3b" }] },
  { slug: "sac-main-cuir-milano", sku: "ARAS-BG-303", cat: "mode-femme", sub: "sacs-dames",
    n: ["Sac à main cuir Milano", "حقيبة يد Milano", "Milano Leather Handbag"],
    d: ["Cuir synthétique, format structuré, bandoulière amovible.", "جلد صناعي بتصميم أنيق وحزام قابل للفصل.", "Vegan leather, structured format, detachable strap."],
    price: 119900, f: true, stock: 25, sales: 61,
    img: [P.handbag[0]],
    colors: [{ name: "Cognac", swatch: "#9a5b2d" }, BLACK] },
  { slug: "sac-cabas-tendance", sku: "ARAS-BG-304", cat: "mode-femme", sub: "sacs-dames",
    n: ["Sac cabas tendance", "حقيبة تسع رائجة", "Trendy Tote Bag"],
    d: ["Grand format, poche zippée intérieure, anses renforcées.", "حجم كبير بجيب سحاب ومقبضات متينة.", "Large format, inner zip pocket, reinforced handles."],
    price: 69900, stock: 35, nw: true, sales: 42,
    img: [P.handbag[1]],
    colors: [{ name: "Beige", swatch: "#d9c7b2" }, BLACK] },
  { slug: "robe-longue-boheme", sku: "ARAS-DR-305", cat: "mode-femme", sub: "robes",
    n: ["Robe longue bohème", "فستان بوهيمي طويل", "Long Boho Dress"],
    d: ["Encolure V, taille élastique et imprimé léger.", "ياقة V وخصر مرن وطبعة خفيفة.", "V-neck, elastic waist, light print."],
    price: 59900, stock: 44, sales: 49,
    img: [P.dress[2]],
    sizes: CLOTH_SIZES, colors: [{ name: "Terracotta", swatch: "#c46a4a" }, { name: "Crème", swatch: "#efe6d6" }] },

  // ── Maison & Cuisine ──────────────────────────────────────
  { slug: "lampe-table-minimaliste", sku: "ARAS-LM-401", cat: "maison-cuisine", sub: "luminaires",
    n: ["Lampe de table minimaliste", "مصباح طاولة بسيط", "Minimalist Table Lamp"],
    d: ["Lumière chaude réglable, base métal et design épuré.", "إضاءة دافئة قابلة للتعديل بقاعدة معدنية.", "Dimmable warm light, metal base, clean design."],
    price: 34900, compareAt: 39900, stock: 50, f: true, sales: 73,
    img: [P.lamp[0], P.lamp[2]] },
  { slug: "lampe-led-champignon", sku: "ARAS-LM-402", cat: "maison-cuisine", sub: "luminaires",
    n: ["Lampe LED champignon", "مصباح LED فطر", "Mushroom LED Lamp"],
    d: ["Forme champignon, variation tactile, batterie 4000 mAh.", "شكل فطر، تحكم باللمس، بطارية 4000 مللي.", "Mushroom shape, touch dimmer, 4000 mAh battery."],
    price: 24900, nw: true, stock: 65, sales: 57,
    img: [P.lamp[1]] },
  { slug: "lampe-lecture-flex", sku: "ARAS-LM-403", cat: "maison-cuisine", sub: "luminaires",
    n: ["Lampe de lecture flexible", "مصباح قراءة مرن", "Flexible Reading Lamp"],
    d: ["Pince solide, bras flexible et recharge USB.", "مشبك ثابت وذراع مرن وشحن USB.", "Sturdy clip, flexible arm, USB rechargeable."],
    price: 19900, stock: 72, sales: 35,
    img: [P.lamp[2]] },
  { slug: "blender-pro-1200w", sku: "ARAS-BL-404", cat: "maison-cuisine", sub: "petit-electromenager",
    n: ["Blender Pro 1200 W", "خلاط Pro 1200 واط", "Pro 1200 W Blender"],
    d: ["Six lames inox, bol en verre 1,8 L et 5 vitesses.", "ست شفرات ستل ووعاء زجاجي 1.8 لتر و5 سرعات.", "Six steel blades, 1,8 L glass jug, 5 speeds."],
    price: 54900, bs: true, stock: 40, sales: 121,
    img: [P.blender[0]] },
  { slug: "mixeur-plongeant-3en1", sku: "ARAS-BL-405", cat: "maison-cuisine", sub: "petit-electromenager",
    n: ["Mixeur plongeant 3-en-1", "خلاط غاطس 3 في 1", "3-in-1 Hand Blender"],
    d: ["800 W, hachoir et bol de préparation inclus.", "800 واط مع مطحنة ووعاء تحضير.", "800 W with chopper and mixing bowl."],
    price: 34900, stock: 46, sales: 54,
    img: [P.blender[1]] },

  // ── Beauté & Parfums ──────────────────────────────────────
  { slug: "parfum-oud-royal-50ml", sku: "ARAS-PF-501", cat: "beaute-parfums", sub: "parfums",
    n: ["Parfum Oud Royal 50 ml", "عطر عود ملكي 50 مل", "Oud Royal 50 ml"],
    d: ["Cœur boisé et safran, tenue plus de 12 heures.", "قلب خشقي وزعفران بثبات أكثر من 12 ساعة.", "Woody saffron heart, 12+ hour hold."],
    price: 89900, compareAt: 109900, f: true, bs: true, stock: 34, sales: 112,
    img: [P.perfume[0], P.perfume[1]] },
  { slug: "parfum-fleurs-oranger-50ml", sku: "ARAS-PF-502", cat: "beaute-parfums", sub: "parfums",
    n: ["Parfum Fleurs d'oranger", "عطر زهر البرتقال", "Fleurs d'oranger Perfume"],
    d: ["Note blanche lumineuse, tenue 8 heures.", "نفحات بيضاء مضيئة بثبات 8 ساعات.", "Bright white floral notes, 8 h hold."],
    price: 69900, stock: 42, sales: 77,
    img: [P.perfume[1]] },
  { slug: "coffret-soins-visage", sku: "ARAS-SK-503", cat: "beaute-parfums", sub: "soins-maquillage",
    n: ["Coffret soins visage", "طقم العناية بالوجه", "Skincare Gift Set"],
    d: ["Nettoyant, sérum et crème hydratante en un coffret.", "منظف وسيروم ومرطب في طقم واحد.", "Cleanser, serum and moisturizer in one set."],
    price: 44900, stock: 38, sales: 66,
    img: [P.cosmetics[0]] },
  { slug: "palette-maquillage-nude", sku: "ARAS-MQ-504", cat: "beaute-parfums", sub: "soins-maquillage",
    n: ["Palette maquillage nude", "باليت مكياج طبيعية", "Nude Makeup Palette"],
    d: ["12 teintes nude, textures mates et satinées.", "12 درجة طبيعية بقوام مطفي وساتان.", "12 nude shades, matte and satin textures."],
    price: 34900, nw: true, stock: 55, sales: 59,
    img: [P.cosmetics[1]] },
  { slug: "serum-hydratant-vitamine-c", sku: "ARAS-SK-505", cat: "beaute-parfums", sub: "soins-maquillage",
    n: ["Sérum vitamine C 30 ml", "سيروم فيتامين سي 30 مل", "Vitamin C Serum 30 ml"],
    d: ["Éclat et uniformité du teint, texture non grasse.", "توحيد لون البشرة وتوهج بقوام غير دهني.", "Glow and even tone, non-greasy texture."],
    price: 29900, stock: 60, sales: 68,
    img: [P.cosmetics[2]] },

  // ── Sport & Fitness ───────────────────────────────────────
  { slug: "tapis-yoga-antiderapant", sku: "ARAS-YG-601", cat: "sport-fitness", sub: "yoga",
    n: ["Tapis de yoga antidérapant", "سجادة يوغا مانعة للانزلاق", "Non-Slip Yoga Mat"],
    d: ["6 mm en mousse TPE écologique, housse de transport.", "6 مم من فوم صديق للبيئة مع حافظة.", "6 mm eco TPE foam, carry strap."],
    price: 24900, stock: 64, f: true, sales: 91,
    img: [P.yoga[0]],
    colors: [{ name: "Vert", swatch: "#5f7a61" }, BLACK, { name: "Rose", swatch: "#e6a4b4" }] },
  { slug: "tapis-yoga-pro-8mm", sku: "ARAS-YG-602", cat: "sport-fitness", sub: "yoga",
    n: ["Tapis yoga pro 8 mm", "سجادة يوغا 8 مم", "Pro Yoga Mat 8 mm"],
    d: ["Épaisseur renforcée pour les articulations.", "سماكة معززة للمفاصل.", "Reinforced thickness for joints."],
    price: 34900, stock: 40, sales: 45,
    img: [P.yoga[1]],
    colors: [{ name: "Bleu", swatch: "#3e5c76" }, { name: "Gris", swatch: "#9aa0a6" }] },
  { slug: "haltieres-reglables-20kg", sku: "ARAS-WG-603", cat: "sport-fitness", sub: "musculation",
    n: ["Haltères réglables 20 kg", "دمبل قابل للتعديل 20 كغ", "Adjustable Dumbbells 20 kg"],
    d: ["Paire, disques fonte et verrouillage rapide.", "للزوج مع أقراص حديد وقفل سريع.", "Pair, cast iron plates, quick lock."],
    price: 59900, compareAt: 69900, bs: true, stock: 28, sales: 87,
    img: [P.weights[0]] },
  { slug: "kettlebell-16kg", sku: "ARAS-WG-604", cat: "sport-fitness", sub: "musculation",
    n: ["Kettlebell 16 kg", "كيتل بيل 16 كغ", "Kettlebell 16 kg"],
    d: ["Fonte gainée et poignée large antidérapante.", "حديد مطلي بمقبض واسع مانع للانزلاق.", "Coated cast iron, wide non-slip grip."],
    price: 44900, stock: 32, sales: 39,
    img: [P.weights[1]] },
  { slug: "elastics-resistance-set", sku: "ARAS-WG-605", cat: "sport-fitness", sub: "musculation",
    n: ["Set de 5 élastiques", "طقم 5 أحزمة مقاومة", "5-Band Resistance Set"],
    d: ["Résistances de 5 à 35 kg avec pochette.", "مقاومة من 5 إلى 35 كغ مع حقيبة.", "5-35 kg resistance levels with pouch."],
    price: 19900, nw: true, stock: 75, sales: 63,
    img: [P.weights[2]] },

  // ── Bébé & Enfants ────────────────────────────────────────
  { slug: "cubes-empilables-bois", sku: "ARAS-BB-701", cat: "bebe-enfants", sub: "jouets-bebe",
    n: ["Cubes empilables en bois", "مكعبات خشبية قابلة للتكديس", "Wooden Stacking Cubes"],
    d: ["Couleurs vives et peinture non toxique.", "ألوان زاهية وطلاء غير سام.", "Bright colours, non-toxic paint."],
    price: 14900, f: true, stock: 58, sales: 74,
    img: [P.baby[0]] },
  { slug: "ours-en-bois-tout-doux", sku: "ARAS-BB-702", cat: "bebe-enfants", sub: "jouets-bebe",
    n: ["Ours en bois tout doux", "دمية دب خشبية ناعمة", "Gentle Wooden Bear"],
    d: ["Articulé, finition soyeuse, dès 18 mois.", "مفتوح الحركة بملمس حرير من 18 شهراً.", "Articulated, silky finish, from 18 months."],
    price: 12900, stock: 47, sales: 41,
    img: [P.baby[1]] },
  { slug: "tapis-eveil-couleurs", sku: "ARAS-BB-703", cat: "bebe-enfants", sub: "jouets-bebe",
    n: ["Tapis d'éveil couleurs", "سجادة تنشيط ملونة", "Colourful Activity Mat"],
    d: ["Mélodies, textures et miroir sécurisé.", "ألحان وملمس ومرآة آمنة.", "Melodies, textures and safe mirror."],
    price: 29900, bs: true, stock: 36, sales: 95,
    img: [P.baby[2]] },
  { slug: "puzzle-bois-formes", sku: "ARAS-BB-704", cat: "bebe-enfants", sub: "jouets-bebe",
    n: ["Puzzle formes en bois", "أحجية أشكال خشبية", "Wooden Shapes Puzzle"],
    d: ["12 pièces avec poignées faciles à saisir.", "12 قطعة بمقابض سهلة الإمساك.", "12 easy-grip pieces."],
    price: 9900, stock: 66, sales: 52,
    img: [P.baby[3]] },
  { slug: "doudou-lapin-douceur", sku: "ARAS-BB-705", cat: "bebe-enfants", sub: "jouets-bebe",
    n: ["Doudou lapin douceur", "دمية أرنب ناعمة", "Soft Bunny Comforter"],
    d: ["Tissu ultra doux, lavable en machine.", "قماش فائق النعومة قابل للغسل.", "Ultra-soft fabric, machine washable."],
    price: 11900, nw: true, stock: 70, sales: 56,
    img: [P.baby[4]] },

  // ── Auto & Moto ───────────────────────────────────────────
  { slug: "support-telephone-voiture", sku: "ARAS-AC-801", cat: "auto-moto", sub: "accessoires-voiture",
    n: ["Support téléphone voiture", "حامل هاتف للسيارة", "Car Phone Mount"],
    d: ["Prise ventilation, rotation 360° et tenue forte.", "تثبيت على المكيف ودوران 360 درجة.", "Vent clip, 360° rotation, strong grip."],
    price: 14900, stock: 85, sales: 89,
    img: [P.car[0]] },
  { slug: "organisateur-siege-arriere", sku: "ARAS-AC-802", cat: "auto-moto", sub: "accessoires-voiture",
    n: ["Organisateur siège arrière", "منظم المقعد الخلفي", "Back-Seat Organizer"],
    d: ["Rangement tablettes, gobelets et jouets.", "تخزين للأجهزة والأكواب والألعاب.", "Storage for tablets, cups and toys."],
    price: 19900, stock: 44, sales: 48,
    img: [P.car[1]] },
  { slug: "camera-tableau-de-bord", sku: "ARAS-AC-803", cat: "auto-moto", sub: "accessoires-voiture",
    n: ["Caméra tableau de bord", "كاميرا لوحة القيادة", "Dashboard Camera"],
    d: ["Full HD, vision nocturne et enregistrement en boucle.", "دقة Full HD ورؤية ليلية وتسجيل متواصل.", "Full HD, night vision, loop recording."],
    price: 79900, compareAt: 99900, f: true, stock: 22, sales: 57,
    img: [P.car[2]] },
  { slug: "diffuseur-air-voiture", sku: "ARAS-AC-804", cat: "auto-moto", sub: "accessoires-voiture",
    n: ["Diffuseur d'arôme USB", "معطر سيارة USB", "USB Car Diffuser"],
    d: ["Branchement USB et coupure automatique.", "تشغيل USB وإيقاف تلقائي.", "USB powered with auto shut-off."],
    price: 9900, stock: 90, sales: 67,
    img: [P.car[3]] },
  { slug: "tapis-sol-universels", sku: "ARAS-AC-805", cat: "auto-moto", sub: "accessoires-voiture",
    n: ["Tapis de sol universels", "طقم دوكاتز عام", "Universal Floor Mats"],
    d: ["Caoutchouc antidérapant, paire avant/arrière.", "مطاط مانع للانزلاق، زوج أمامي وخلفي.", "Anti-slip rubber, front/rear pair."],
    price: 24900, stock: 40, sales: 36,
    img: [P.car[4]] },
];

function variantPlan(spec: ProductSpec): {
  options: { attribute: string; value: string; swatch: string | null }[];
  variants: { sku: string; stock: number; combo: { attribute: string; value: string }[] }[];
} | null {
  if (!spec.sizes && !spec.colors) return null;

  const sizes = spec.sizes ?? [null];
  const colors = spec.colors ?? [null];

  const options: { attribute: string; value: string; swatch: string | null }[] = [];
  const seen = new Set<string>();
  const push = (attribute: string, value: string, swatch: string | null) => {
    const key = `${attribute}::${value}`;
    if (seen.has(key)) return;
    seen.add(key);
    options.push({ attribute, value, swatch });
  };

  for (const c of colors) if (c) push("Color", c.name, c.swatch);
  for (const s of sizes) if (s) push("Size", s, null);

  const combos: { sku: string; stock: number; combo: { attribute: string; value: string }[] }[] = [];
  const total = sizes.length * colors.length;
  const base = Math.floor(spec.stock / total);
  let remaining = spec.stock - base * total;

  const clean = (value: string) => value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8);

  for (const c of colors) {
    for (const s of sizes) {
      const combo: { attribute: string; value: string }[] = [];
      if (c) combo.push({ attribute: "Color", value: c.name });
      if (s) combo.push({ attribute: "Size", value: s });
      const suffix = [s && clean(s), c && clean(c.name)].filter(Boolean).join("-");
      combos.push({
        sku: `${spec.sku}-${suffix || "STD"}`,
        stock: base + (remaining-- > 0 ? 1 : 0),
        combo,
      });
    }
  }

  return { options, variants: combos };
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (copy .env.example → .env)");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  try {
    console.log("🌱 ARAS seed starting…");

    // ── Users ────────────────────────────────────────────────
    const adminEmail = "admin@aras.ma";
    const clientEmail = "client@aras.ma";
    const adminHash = await hashPassword("ArasAdmin1!");
    const clientHash = await hashPassword("ArasClient1!");

    const admin = await db.user.upsert({
      where: { email: adminEmail },
      update: { role: "ADMIN", active: true },
      create: { name: "Admin ARAS", email: adminEmail, emailVerified: true, role: "ADMIN" },
    });
    const client = await db.user.upsert({
      where: { email: clientEmail },
      update: { active: true },
      create: { name: "Client Démo", email: clientEmail, emailVerified: true, role: "CUSTOMER" },
    });

    for (const [user, hash] of [
      [admin, adminHash],
      [client, clientHash],
    ] as const) {
      const hasCredential = await db.account.findFirst({
        where: { userId: user.id, providerId: "credential" },
      });
      if (!hasCredential) {
        await db.account.create({
          data: { userId: user.id, accountId: user.id, providerId: "credential", password: hash },
        });
      }
    }

    // ── Store settings ───────────────────────────────────────
    const existingSettings = await db.storeSetting.findFirst();
    if (!existingSettings) {
      await db.storeSetting.create({
        data: {
          storeName: "ARAS",
          logoUrl: "/images/logo.png",
          contactEmail: "contact@aras.ma",
          phone: "+212 522 47 88 99",
          whatsapp: "+212 661 23 45 67",
          address: "120 Bd Zerktouni, Casablanca",
          freeShippingThreshold: 50000,
          codEnabled: true,
          cardEnabled: false,
          paymentInstructionsFr:
            "Paiement à la livraison partout au Maroc. Vos colis sont vérifiés avant paiement.",
          paymentInstructionsAr:
            "الدفع عند التوصيل في كل أنحاء المغرب. يمكنكم فحص الطرد قبل الدفع.",
          paymentInstructionsEn:
            "Cash on delivery across Morocco. You may inspect the parcel before paying.",
          metaTitle: "ARAS — Tout ce dont vous avez besoin, en un seul endroit",
          metaDescription:
            "E-commerce marocain : électronique, mode, maison, beauté et sport. Livraison rapide et paiement à la livraison.",
          announcementFr: "Livraison gratuite dès 500 DH • Paiement à la livraison",
          announcementAr: "توصيل مجاني ابتداءً من 500 درهم • الدفع عند التوصيل",
          announcementEn: "Free shipping from 500 DH • Cash on delivery",
          facebookUrl: "https://facebook.com/aras.maroc",
          instagramUrl: "https://instagram.com/aras.maroc",
        },
      });
    }

    // ── Delivery zones ───────────────────────────────────────
    const zones: [string, number, boolean][] = [
      ["Casablanca", 2000, false],
      ["Rabat", 2500, false],
      ["Marrakech", 3000, false],
      ["Fès", 3000, false],
      ["Tanger", 3500, false],
      ["Agadir", 4000, false],
      ["Autre ville", 4500, true],
    ];
    for (const [city, fee, isDefault] of zones) {
      await db.deliveryZone.upsert({
        where: { city },
        update: { fee, isDefault },
        create: { city, fee, isDefault, active: true },
      });
    }

    // ── Categories + subcategories ───────────────────────────
    const subIdBySlug = new Map<string, string>();
    const catIdBySlug = new Map<string, string>();

    for (const [catIndex, category] of CATEGORIES.entries()) {
      const cat = await db.category.upsert({
        where: { slug: category.slug },
        update: {},
        create: {
          slug: category.slug,
          nameFr: category.name[0],
          nameAr: category.name[1],
          nameEn: category.name[2],
          descriptionFr: category.desc[0],
          descriptionAr: category.desc[1],
          descriptionEn: category.desc[2],
          image: category.image,
          icon: category.icon,
          active: true,
          sortOrder: catIndex,
        },
      });
      catIdBySlug.set(category.slug, cat.id);

      for (const [subIndex, sub] of category.subs.entries()) {
        const created = await db.subcategory.upsert({
          where: { slug: sub.slug },
          update: {},
          create: {
            categoryId: cat.id,
            slug: sub.slug,
            nameFr: sub.name[0],
            nameAr: sub.name[1],
            nameEn: sub.name[2],
            descriptionFr: sub.desc[0],
            descriptionAr: sub.desc[1],
            descriptionEn: sub.desc[2],
            image: sub.image,
            active: true,
            sortOrder: subIndex,
          },
        });
        subIdBySlug.set(sub.slug, created.id);
      }
    }

    // ── Products ─────────────────────────────────────────────
    const productIdBySlug = new Map<string, string>();
    let createdProducts = 0;

    for (const spec of PRODUCTS) {
      const categoryId = catIdBySlug.get(spec.cat);
      const subcategoryId = subIdBySlug.get(spec.sub);
      if (!categoryId || !subcategoryId) throw new Error(`Unknown category for ${spec.slug}`);

      const plan = variantPlan(spec);
      const stock = plan
        ? plan.variants.reduce((sum, variant) => sum + variant.stock, 0)
        : spec.stock;

      const existing = await db.product.findUnique({ where: { slug: spec.slug } });
      if (existing) {
        productIdBySlug.set(spec.slug, existing.id);
        continue;
      }

      const product = await db.product.create({
        data: {
          sku: spec.sku,
          slug: spec.slug,
          nameFr: spec.n[0],
          nameAr: spec.n[1],
          nameEn: spec.n[2],
          descriptionFr: spec.d[0],
          descriptionAr: spec.d[1],
          descriptionEn: spec.d[2],
          price: spec.price,
          compareAtPrice: spec.compareAt ?? null,
          stock,
          status: "ACTIVE",
          featured: spec.f ?? false,
          isNew: spec.nw ?? false,
          bestSeller: spec.bs ?? false,
          rating: 0,
          reviewCount: 0,
          salesCount: spec.sales,
          categoryId,
          subcategoryId,
          images: {
            create: spec.img.map((photoId, index) => ({
              url: img(photoId),
              alt: spec.n[2],
              sortOrder: index,
            })),
          },
        },
      });
      productIdBySlug.set(spec.slug, product.id);
      createdProducts += 1;

      if (plan) {
        const optionIdByKey = new Map<string, string>();
        for (const [index, option] of plan.options.entries()) {
          const created = await db.variantOption.create({
            data: {
              productId: product.id,
              attribute: option.attribute,
              value: option.value,
              swatch: option.swatch,
              sortOrder: index,
            },
          });
          optionIdByKey.set(`${option.attribute}::${option.value}`, created.id);
        }
        for (const [index, variant] of plan.variants.entries()) {
          await db.productVariant.create({
            data: {
              productId: product.id,
              sku: variant.sku,
              stock: variant.stock,
              sortOrder: index,
              options: {
                connect: variant.combo.map((option) => ({
                  id: optionIdByKey.get(`${option.attribute}::${option.value}`)!,
                })),
              },
            },
          });
        }
      }
    }

    // ── Promotions ───────────────────────────────────────────
    const promoCount = await db.promotion.count();
    if (promoCount === 0) {
      const femme = catIdBySlug.get("mode-femme");
      const enceinte = productIdBySlug.get("enceinte-bluetooth-pulse");
      if (femme) {
        await db.promotion.create({
          data: { name: "Mode Femme −15%", type: "CATEGORY", targetId: femme, percent: 15, active: true },
        });
      }
      if (enceinte) {
        await db.promotion.create({
          data: { name: "Enceinte Pulse −10%", type: "PRODUCT", targetId: enceinte, percent: 10, active: true },
        });
      }
    }

    // ── Coupons ──────────────────────────────────────────────
    const coupons: Parameters<typeof db.coupon.upsert>[0]["create"][] = [
      {
        code: "BIENVENUE10",
        type: "PERCENT",
        value: 10,
        minOrderAmount: 30000,
        maxUses: 500,
        active: true,
      },
      {
        code: "LIVRAISON50",
        type: "FIXED",
        value: 5000,
        minOrderAmount: 40000,
        maxUses: 300,
        active: true,
      },
      {
        code: "RAMADAN25",
        type: "PERCENT",
        value: 25,
        minOrderAmount: 50000,
        maxUses: 1000,
        expiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000),
        active: true,
      },
    ];
    for (const coupon of coupons) {
      await db.coupon.upsert({ where: { code: coupon.code }, update: {}, create: coupon });
    }

    // ── Banners ──────────────────────────────────────────────
    const bannerCount = await db.banner.count();
    if (bannerCount === 0) {
      await db.banner.createMany({
        data: [
          {
            placement: "HERO",
            image: wide(P.hero),
            titleFr: "Tout ce dont vous avez besoin",
            titleAr: "كل ما تحتاجه في مكان واحد",
            titleEn: "Everything you need, one place",
            descriptionFr: "Électronique, mode, maison, beauté et sport — livrés partout au Maroc.",
            descriptionAr: "إلكترونيات، أزياء، منزل، جمال ورياضة — توصيل لكل المغرب.",
            descriptionEn: "Electronics, fashion, home, beauty and sport — delivered across Morocco.",
            ctaLabelFr: "Découvrir la boutique",
            ctaLabelAr: "اكتشف المتجر",
            ctaLabelEn: "Shop now",
            ctaUrl: "/catalog",
            active: true,
            sortOrder: 0,
          },
          {
            placement: "MIDDLE",
            image: wide(P.sale),
            titleFr: "Promos de la semaine",
            titleAr: "عروض الأسبوع",
            titleEn: "Weekly deals",
            descriptionFr: "Jusqu'à −25 % sur une sélection de produits.",
            descriptionAr: "خصومات تصل إلى 25٪ على منتجات مختارة.",
            descriptionEn: "Up to 25% off on selected products.",
            ctaLabelFr: "Voir les promos",
            ctaLabelAr: "شاهد العروض",
            ctaLabelEn: "View deals",
            ctaUrl: "/promotions",
            active: true,
            sortOrder: 0,
          },
          {
            placement: "FOOTER",
            image: wide(P.store),
            titleFr: "Nouvelle collection",
            titleAr: "مجموعة جديدة",
            titleEn: "New collection",
            descriptionFr: "Les dernières arrivées mode et accessoires.",
            descriptionAr: "آخر وصولات الأزياء والإكسسوارات.",
            descriptionEn: "The latest fashion and accessories.",
            ctaLabelFr: "Explorer",
            ctaLabelAr: "استكشف",
            ctaLabelEn: "Explore",
            ctaUrl: "/catalog",
            active: true,
            sortOrder: 0,
          },
        ],
      });
    }

    // ── Reviews from the demo customer ───────────────────────
    const reviews: [slug: string, rating: number, title: string, comment: string][] = [
      ["casque-sans-fil-pro", 5, "Excellent son", "Réduction de bruit au top, je l'utilise tous les jours au bureau."],
      ["tapis-yoga-antiderapant", 5, "Parfait", "Épaisseur idéale et vraiment antidérapant sur parquet."],
      ["parfum-oud-royal-50ml", 4, "Très tenue", "Olfaction agréable et tenue remarquable toute la journée."],
      ["robe-ete-fleurie", 5, "Taille parfaite", "Tissu léger, parfait pour l'été à Casablanca."],
      ["ordinateur-portable-ultra14", 4, "Superbe écran", "L'OLED est magnifique, livraison en 2 jours."],
      ["blender-pro-1200w", 5, "Indispensable", "Puissant et silencieux, le bol en verre est un vrai plus."],
    ];
    for (const [slug, rating, title, comment] of reviews) {
      const productId = productIdBySlug.get(slug);
      if (!productId) continue;
      const exists = await db.review.findUnique({
        where: { productId_userId: { productId, userId: client.id } },
      });
      if (!exists) {
        await db.review.create({
          data: { productId, userId: client.id, rating, title, comment },
        });
      }
      await db.product.update({
        where: { id: productId },
        data: { rating, reviewCount: 1 },
      });
    }

    // ── Sample orders (make the dashboard meaningful) ────────
    const mkOrder = async (data: {
      orderNumber: string;
      placedAt: Date;
      status: "NEW" | "DELIVERED";
      fullName: string;
      phone: string;
      city: string;
      address: string;
      items: { slug: string; qty: number }[];
      paymentPaid?: boolean;
      history: { to: "NEW" | "CONFIRMED" | "PREPARING" | "SHIPPED" | "DELIVERED"; at: Date }[];
    }) => {
      const found = await db.order.findUnique({ where: { orderNumber: data.orderNumber } });
      if (found) return;

      const pricedItems = data.items.map((item) => {
        const productId = productIdBySlug.get(item.slug);
        const spec = PRODUCTS.find((p) => p.slug === item.slug);
        if (!productId || !spec) throw new Error(`Unknown product ${item.slug}`);
        return {
          productId,
          productName: spec.n[0],
          productSlug: spec.slug,
          sku: spec.sku,
          imageUrl: img(spec.img[0]),
          unitPrice: spec.price,
          quantity: item.qty,
          total: spec.price * item.qty,
        };
      });

      const subtotal = pricedItems.reduce((sum, item) => sum + item.total, 0);
      const zone = await db.deliveryZone.findFirst({ where: { city: data.city } });
      const deliveryFee = subtotal >= 50000 ? 0 : (zone?.fee ?? 4500);
      const total = subtotal + deliveryFee;

      const order = await db.order.create({
        data: {
          orderNumber: data.orderNumber,
          userId: client.id,
          status: data.status,
          paymentMethod: "COD",
          paymentStatus: data.paymentPaid ? "PAID" : "PENDING",
          subtotal,
          deliveryFee,
          discountAmount: 0,
          total,
          fullName: data.fullName,
          phone: data.phone,
          city: data.city,
          addressLine: data.address,
          email: client.email,
          placedAt: data.placedAt,
          items: { create: pricedItems },
        },
      });

      await db.payment.create({
        data: {
          orderId: order.id,
          provider: "COD",
          method: "COD",
          amount: total,
          status: data.paymentPaid ? "PAID" : "PENDING",
        },
      });

      for (const step of data.history) {
        await db.orderStatusHistory.create({
          data: { orderId: order.id, toStatus: step.to, createdAt: step.at, actorName: "Admin ARAS" },
        });
      }
    };

    const day = 24 * 3600 * 1000;
    await mkOrder({
      orderNumber: "ARAS-261001-A7K2QF",
      placedAt: new Date(Date.now() - 6 * day),
      status: "DELIVERED",
      paymentPaid: true,
      fullName: "Youssef El Amrani",
      phone: "+212 661 11 22 33",
      city: "Casablanca",
      address: "45 Rue Ibn Batotta, Apt 3, Maârif",
      items: [
        { slug: "casque-sans-fil-pro", qty: 1 },
        { slug: "tapis-yoga-antiderapant", qty: 1 },
      ],
      history: [
        { to: "NEW", at: new Date(Date.now() - 6 * day) },
        { to: "CONFIRMED", at: new Date(Date.now() - 6 * day + 3600e3) },
        { to: "PREPARING", at: new Date(Date.now() - 5 * day) },
        { to: "SHIPPED", at: new Date(Date.now() - 4 * day) },
        { to: "DELIVERED", at: new Date(Date.now() - 2 * day) },
      ],
    });
    await mkOrder({
      orderNumber: "ARAS-261007-M2X9PD",
      placedAt: new Date(Date.now() - 10 * 3600e3),
      status: "NEW",
      fullName: "Salma Benjelloun",
      phone: "+212 670 44 55 66",
      city: "Rabat",
      address: "12 Avenue Fal Ould Oumeir, Agdal",
      items: [{ slug: "parfum-oud-royal-50ml", qty: 2 }],
      history: [{ to: "NEW", at: new Date(Date.now() - 10 * 3600e3) }],
    });

    // ── Newsletter ───────────────────────────────────────────
    for (const email of ["fatima@example.ma", "omar@example.ma", "sara@example.ma"]) {
      await db.newsletterSubscriber.upsert({
        where: { email },
        update: {},
        create: { email, source: "seed" },
      });
    }

    const totals = {
      categories: await db.category.count(),
      subcategories: await db.subcategory.count(),
      products: await db.product.count(),
      users: await db.user.count(),
      orders: await db.order.count(),
      reviews: await db.review.count(),
    };

    console.log("✔ ARAS seed complete:", totals);
    console.log("  Admin login :  admin@aras.ma  /  ArasAdmin1!");
    console.log("  Client login:  client@aras.ma /  ArasClient1!");
    if (createdProducts > 0) console.log(`  (${createdProducts} products created)`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
