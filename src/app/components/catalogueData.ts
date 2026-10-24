export interface Product {
  id: string;
  name: string;
  tamilName: string;
  subtitle: string;
  description: string;
  keyNutrients: string[];
  prices: {
    "50g"?: number;
    "100g"?: number;
    "500g"?: number;
    "1kg"?: number;
  };
  rangeId: string;
  image: string;
}

export interface WellnessRange {
  id: string;
  title: string;
  tamilTitle: string;
  description: string;
  keyNutrients: string[];
  color: string;
  accentColor: string;
  textColor: string;
  bestFor: string;
  servingIdea: string;
}

export interface CuratedBox {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  items: string[];
  price: number;
  color: string;
  includesLabel?: string;
}

export interface FlavourPaletteEntry {
  name: string;
  tamilName?: string;
  flavour: string;
  uses: string;
}

export const wellnessRanges: WellnessRange[] = [
  {
    id: 'range-01',
    title: 'Protein & Energy Builders',
    tamilTitle: 'புரதம் & ஆற்றல்',
    description: 'Muscle, stamina and everyday strength — the highest plant-protein greens we grow.',
    keyNutrients: ['Protein', 'Fibre', 'Iron', 'Folate', 'Vitamin C'],
    color: 'from-amber-700 to-amber-900',
    accentColor: 'bg-amber-100 border-amber-200 text-amber-900',
    textColor: 'text-amber-950',
    bestFor: 'Growing children • Gym & sports nutrition • Vegetarian households',
    servingIdea: 'Stir a fistful into hot pongal, upma, khichdi or dal right before serving — the residual heat wilts them without cooking the protein away.'
  },
  {
    id: 'range-02',
    title: 'Heart & Omega-3 Care',
    tamilTitle: 'இதய நலன் & ஒமேகா-3',
    description: 'Plant omega-3, vitamin E and good fats for cardiovascular and cholesterol care.',
    keyNutrients: ['Omega-3 (ALA)', 'Vitamin E', 'Calcium', 'Lignans'],
    color: 'from-red-700 to-red-950',
    accentColor: 'bg-red-100 border-red-200 text-red-950',
    textColor: 'text-red-950',
    bestFor: 'Adults over 35 • Cholesterol-conscious kitchens • Desk-bound routines',
    servingIdea: 'Blend flax and chia greens into the morning smoothie; pile sunflower shoots onto avocado toast or a grain bowl for crunch.'
  },
  {
    id: 'range-03',
    title: 'Blood Sugar & Weight Management',
    tamilTitle: 'சர்க்கரை அளவு & எடை நிர்வாகம்',
    description: 'High-fibre, slow-energy millets and seeds traditionally valued for balance.',
    keyNutrients: ['Fibre', 'Magnesium', 'Iron', 'B-Vitamins', 'Polyphenols'],
    color: 'from-teal-700 to-teal-950',
    accentColor: 'bg-teal-100 border-teal-200 text-teal-950',
    textColor: 'text-teal-950',
    bestFor: 'Sugar-conscious kitchens • Weight management • Everyday millet eaters',
    servingIdea: 'Fold fenugreek and ragi greens into dosa or adai batter, or stir into buttermilk with a pinch of salt and cumin.'
  },
  {
    id: 'range-04',
    title: 'Immunity, Eye & Skin Defence',
    tamilTitle: 'நோய் எதிர்ப்பு, கண் & சரும நலன்',
    description: 'Vitamin A and C powerhouses — bold flavours, brilliant colour, everyday protection.',
    keyNutrients: ['Vitamin A', 'Vitamin C', 'Vitamin K', 'Folate', 'Antioxidants'],
    color: 'from-orange-600 to-orange-900',
    accentColor: 'bg-orange-100 border-orange-200 text-orange-950',
    textColor: 'text-orange-950',
    bestFor: 'Monsoon & seasonal-change months • Families • Restaurant plating',
    servingIdea: 'Pile mustard and radish onto chaat, sandwiches and burgers; use carrot fronds and lettuce as the plating green.'
  },
  {
    id: 'range-05',
    title: 'Iron, Blood & Detox Greens',
    tamilTitle: 'இரும்புச்சத்து, ரத்தம் & சுத்திகரிப்பு',
    description: 'Chlorophyll and iron-dense greens for blood health, circulation and daily detox.',
    keyNutrients: ['Iron', 'Chlorophyll', 'Folate', 'Nitrates', 'Vitamin C'],
    color: 'from-pink-800 to-pink-950',
    accentColor: 'bg-pink-100 border-pink-200 text-pink-950',
    textColor: 'text-pink-950',
    bestFor: 'Iron-rich diets • New mothers • Athletes • Daily detox routines',
    servingIdea: 'Juice wheatgrass fresh first thing in the morning; toss garden cress, beetroot and amaranthus through a lime-and-onion salad.'
  },
  {
    id: 'range-06',
    title: 'Fresh Sprouts',
    tamilTitle: 'முளைக்கட்டிய பயறு',
    description: 'Live sprouts germinated in-house in RO water — crunch, volume and everyday nutrition at a family price.',
    keyNutrients: ['Vitamin C', 'Folate', 'Fibre', 'Plant protein', 'Iron'],
    color: 'from-green-700 to-green-950',
    accentColor: 'bg-green-100 border-green-200 text-green-900',
    textColor: 'text-green-950',
    bestFor: 'Family kitchens • Korean, Chinese & Thai cooking • Sundal & salad counters • Weight-conscious eating',
    servingIdea: 'Add to soups at the very end. Stir-fry for 60 seconds on high heat with garlic, chilli and soy. Or serve as namul/kosambari (blanched, squeezed dry and tossed with sesame oil or coconut).'
  }
];

export const products: Product[] = [
  // Range 01
  {
    id: 'mc-01',
    name: 'Green Gram',
    tamilName: 'பாசிப்பயறு',
    subtitle: 'Sweet, crisp, juicy',
    description: 'Our best-selling everyday green — the highest plant protein in the range, with fibre for digestion and folate for daily energy.',
    keyNutrients: ['Protein', 'Fibre', 'Vit C', 'Folate', 'Iron'],
    prices: { '50g': 50, '100g': 100 },
    rangeId: 'range-01',
    image: '/greengram.png'
  },
  {
    id: 'mc-02',
    name: 'Black Gram',
    tamilName: 'உளுந்து',
    subtitle: 'Mild, nutty, tender',
    description: 'The classic Tamil strength food in its most nutrient-dense form — protein, iron and calcium for stamina and bone support.',
    keyNutrients: ['Protein', 'Iron', 'Calcium', 'B-Vitamins'],
    prices: { '50g': 50, '100g': 100 },
    rangeId: 'range-01',
    image: '/blackgram.png'
  },
  {
    id: 'mc-03',
    name: 'Horse Gram',
    tamilName: 'கொள்ளு',
    subtitle: 'Earthy, gently bitter',
    description: 'Long valued in Siddha kitchens for warmth and weight management; rich in fibre, iron and protective polyphenols.',
    keyNutrients: ['Protein', 'Fibre', 'Iron', 'Polyphenols'],
    prices: { '50g': 60, '100g': 120 },
    rangeId: 'range-01',
    image: '/horse_gram.png'
  },
  {
    id: 'mc-04',
    name: 'Peas',
    tamilName: 'பட்டாணி',
    subtitle: 'Sweet, succulent, crunchy',
    description: 'The sweetest shoot we grow and the easiest way to get children eating greens — protein plus vitamins A, C and K.',
    keyNutrients: ['Protein', 'Vit A', 'Vit C', 'Vit K'],
    prices: { '50g': 150, '100g': 300 },
    rangeId: 'range-01',
    image: '/pea_shoots.png'
  },
  // Range 02
  {
    id: 'mc-05',
    name: 'Flax',
    tamilName: 'ஆளி விதை',
    subtitle: 'Mild, nutty, soft',
    description: 'A leading plant source of omega-3 ALA and lignans, with fibre and vitamin E — a simple daily addition for heart care.',
    keyNutrients: ['Omega-3', 'Fibre', 'Vit E', 'Lignans'],
    prices: { '50g': 100, '100g': 200 },
    rangeId: 'range-02',
    image: '/Flax.png'
  },
  {
    id: 'mc-06',
    name: 'Chia',
    tamilName: 'சியா விதை',
    subtitle: 'Mildly bitter, minty',
    description: 'Omega-3, calcium and antioxidants in one delicate green — associated with bone, brain and cardiovascular wellness.',
    keyNutrients: ['Omega-3', 'Calcium', 'Fibre', 'Antioxidants'],
    prices: { '50g': 100, '100g': 200 },
    rangeId: 'range-02',
    image: '/chia.png'
  },
  {
    id: 'mc-07',
    name: 'Sesame',
    tamilName: 'எள்',
    subtitle: 'Nutty with a bitter finish',
    description: 'One of the most calcium-rich greens available, with iron, vitamin E and good fats for heart and bone strength.',
    keyNutrients: ['Calcium', 'Iron', 'Vit E', 'Good fats'],
    prices: { '50g': 75, '100g': 150 },
    rangeId: 'range-02',
    image: '/Sesame.png'
  },
  {
    id: 'mc-08',
    name: 'Sunflower',
    tamilName: 'சூரியகாந்தி',
    subtitle: 'Big crunch, sweet and nutty',
    description: "The chef's favourite for texture — thick, juicy stems loaded with vitamin E, zinc and B-complex for skin and heart.",
    keyNutrients: ['Vit E', 'Zinc', 'Protein', 'B-Vitamins'],
    prices: { '50g': 150, '100g': 300 },
    rangeId: 'range-02',
    image: '/Sunflower.png'
  },
  // Range 03
  {
    id: 'mc-09',
    name: 'Fenugreek',
    tamilName: 'வெந்தயம்',
    subtitle: 'Pleasantly bitter, aromatic',
    description: 'Traditionally used to support blood-sugar balance and digestion; rich in vitamins A, C and K, iron and antioxidants.',
    keyNutrients: ['Vit A', 'Vit C', 'Vit K', 'Iron', 'Fibre'],
    prices: { '50g': 50, '100g': 100 },
    rangeId: 'range-03',
    image: '/Fenugreek.png'
  },
  {
    id: 'mc-10',
    name: 'Ragi',
    tamilName: 'கேழ்வரகு',
    subtitle: 'Fresh, grassy, lightly sweet',
    description: "Tamil Nadu's calcium staple as a living green — slow release energy with iron, fibre and amino acids.",
    keyNutrients: ['Calcium', 'Iron', 'Fibre', 'Amino acids'],
    prices: { '50g': 75, '100g': 150 },
    rangeId: 'range-03',
    image: '/Ragi.png'
  },
  {
    id: 'mc-11',
    name: 'Pearl Millet',
    tamilName: 'கம்பு',
    subtitle: 'Sweet, grassy, cooling',
    description: 'A cooling millet green with iron, magnesium and fibre — steady energy without the sugar spike of refined grains.',
    keyNutrients: ['Iron', 'Magnesium', 'Fibre', 'B-Vitamins'],
    prices: { '50g': 75, '100g': 150 },
    rangeId: 'range-03',
    image: '/Pearl Millet.png'
  },
  {
    id: 'mc-12',
    name: 'Alfalfa',
    tamilName: 'அல்ஃபால்ஃபா',
    subtitle: 'Delicate, fresh, very mild',
    description: 'The classic sandwich green — feather-light, low in calories and generous in vitamins C, K and folate.',
    keyNutrients: ['Vit C', 'Vit K', 'Folate', 'Saponins'],
    prices: { '50g': 150, '100g': 300 },
    rangeId: 'range-03',
    image: '/Alfalfa.png'
  },
  // Range 04
  {
    id: 'mc-13',
    name: 'Mustard',
    tamilName: 'கடுகு',
    subtitle: 'Sharp and peppery, wasabi-like',
    description: 'A true multivitamin leaf carrying vitamins A, B6, B9, C, E and K — linked with eye, brain and immune support.',
    keyNutrients: ['Vit A', 'Vit B6', 'Vit C', 'Vit E', 'Vit K'],
    prices: { '50g': 75, '100g': 150 },
    rangeId: 'range-04',
    image: '/Mustard.png'
  },
  {
    id: 'mc-14',
    name: 'White Radish',
    tamilName: 'முள்ளங்கி',
    subtitle: 'Zesty, hot, peppery',
    description: 'Bold flavour with vitamin C, folate and sulphur antioxidants — the star of chaats, salads and sandwiches.',
    keyNutrients: ['Vit C', 'Vit A', 'Folate', 'Antioxidants'],
    prices: { '50g': 150, '100g': 300 },
    rangeId: 'range-04',
    image: '/radish.png'
  },
  {
    id: 'mc-15',
    name: 'Carrot',
    tamilName: 'கேரட்',
    subtitle: 'Sweet, feathery, aromatic',
    description: 'Fine lace-like fronds packed with beta-carotene for eye and skin health — and the prettiest garnish on the plate.',
    keyNutrients: ['Beta-carotene', 'Vit A', 'Vit C', 'Vit K'],
    prices: { '50g': 150, '100g': 300 },
    rangeId: 'range-04',
    image: '/Carrot.png'
  },
  {
    id: 'mc-16',
    name: 'Lettuce',
    tamilName: 'லெட்டியூஸ்',
    subtitle: 'Soft, buttery, mild',
    description: 'Our most tender premium salad base — gentle on the gut, generous in vitamins A, K and folate.',
    keyNutrients: ['Vit A', 'Vit K', 'Folate', 'Fibre'],
    prices: { '50g': 200, '100g': 400 },
    rangeId: 'range-04',
    image: '/Lettuce.png'
  },
  {
    id: 'mc-17',
    name: 'Red Cowpea',
    tamilName: 'சிவப்பு காராமணி',
    subtitle: 'Crisp, mild, lightly beany',
    description: 'Striking crimson stems whose colour comes from anthocyanin antioxidants, with protein, iron and folate alongside.',
    keyNutrients: ['Protein', 'Iron', 'Folate', 'Anthocyanins'],
    prices: { '50g': 75, '100g': 150 },
    rangeId: 'range-04',
    image: '/red_cowpea.png'
  },
  // Range 05
  {
    id: 'mc-18',
    name: 'Garden Cress',
    tamilName: 'அலிவ் / ஹலீம்',
    subtitle: 'Peppery, tangy, punchy',
    description: 'Our iron champion, traditionally given to new mothers — also carrying vitamins A, C, E, K and folate in abundance.',
    keyNutrients: ['Iron', 'Folate', 'Vit A', 'Vit C', 'Vit K'],
    prices: { '50g': 200, '100g': 400 },
    rangeId: 'range-05',
    image: '/Garden Cress.png'
  },
  {
    id: 'mc-19',
    name: 'Wheatgrass',
    tamilName: 'கோதுமைப் புல்',
    subtitle: 'Sweet, intensely grassy',
    description: 'The original daily detox shot — juice it fresh for chlorophyll, iron and vitamins A, C and E.',
    keyNutrients: ['Chlorophyll', 'Iron', 'Vit A', 'Vit C', 'Vit E'],
    prices: { '50g': 100, '100g': 200 },
    rangeId: 'range-05',
    image: '/Wheatgrass.png'
  },
  {
    id: 'mc-20',
    name: 'Beetroot',
    tamilName: 'பீட்ரூட்',
    subtitle: 'Earthy and sweet',
    description: 'Ruby-red stems supplying dietary nitrates associated with healthy circulation and stamina, plus iron and folate.',
    keyNutrients: ['Nitrates', 'Iron', 'Folate', 'Vit C'],
    prices: { '50g': 150, '100g': 300 },
    rangeId: 'range-05',
    image: '/Beetroot.png'
  },
  {
    id: 'mc-21',
    name: 'Amaranthus',
    tamilName: 'முளைக்கீரை',
    subtitle: 'Mild, earthy, soft',
    description: 'Our native keerai reborn as a microgreen — deep magenta leaves rich in iron, calcium and vitamins A and C.',
    keyNutrients: ['Iron', 'Calcium', 'Vit A', 'Vit C', 'Protein'],
    prices: { '50g': 150, '100g': 250 },
    rangeId: 'range-05',
    image: '/Amaranthus.png'
  },
  {
    id: 'mc-22',
    name: 'Mung Bean Sprouts',
    tamilName: 'பாசிப்பயறு முளை',
    subtitle: 'Crisp, juicy, clean and mild • Korean sukjunamul',
    description: 'Plump, snappy sprouts grown in-house in RO water and harvested the same morning. Low in calories and fat but high in fibre, plant protein, vitamin C, folate and iron — the sprout Korean kitchens call sukjunamul.',
    keyNutrients: ['Vit C', 'Folate', 'Fibre', 'Protein', 'Iron'],
    prices: { '500g': 200, '1kg': 350 },
    rangeId: 'range-06',
    image: '/green_gram.png'
  }
];

export const curatedBoxes: CuratedBox[] = [
  {
    id: 'box-01',
    name: 'Everyday Family Box',
    subtitle: 'The daily basics, mild enough for children.',
    description: 'A balanced selection of nutrient-rich staples that are mild and easy to incorporate into daily meals.',
    items: ['Green Gram', 'Black Gram', 'Ragi', 'Pearl Millet'],
    price: 250,
    color: 'amber'
  },
  {
    id: 'box-02',
    name: 'Heart & Vitality Box',
    subtitle: 'Omega-3, vitamin E and calcium in a single kit.',
    description: 'Specially chosen varieties that promote cardiovascular wellness, containing seeds known for heart support.',
    items: ['Flax', 'Chia', 'Sesame', 'Sunflower'],
    price: 425,
    color: 'red'
  },
  {
    id: 'box-03',
    name: 'Immunity & Detox Box',
    subtitle: 'Bold, high-antioxidant greens plus a juicing grass.',
    description: 'Boost your defenses with highly purifying varieties and antioxidants to support natural detoxification.',
    items: ['Mustard', 'White Radish', 'Wheatgrass', 'Beetroot'],
    price: 475,
    color: 'teal'
  },
  {
    id: 'box-04',
    name: 'Chef\'s Premium Salad Box',
    subtitle: 'Our finest textures and colours for the table.',
    description: 'A vibrant mix of premium leaves and shoots that provide gorgeous presentation, crunch, and complex flavors.',
    items: ['Lettuce', 'Garden Cress', 'Carrot', 'Peas', 'Amaranthus'],
    price: 850,
    color: 'pink'
  },
  {
    id: 'box-05',
    name: 'Sprout & Green Kitchen Box',
    subtitle: 'Bulk sprouts plus three everyday greens.',
    description: 'Get a bulk pack of mung bean sprouts along with three highly versatile everyday greens for cooking and salads.',
    items: ['Mung Bean Sprouts (500g)', 'Green Gram', 'Fenugreek', 'Sunflower'],
    price: 425,
    color: 'green',
    includesLabel: 'Includes 3 x 50g + 500g sprouts:'
  }
];

export const nutrientsList = [
  'Protein',
  'Fibre',
  'Iron',
  'Calcium',
  'Omega-3',
  'Vit A',
  'Vit C',
  'Vit K',
  'Folate / B',
  'Antioxidants'
];

export const matrixRatings: Record<string, Record<string, 'excellent' | 'good' | 'none'>> = {
  'Green Gram': {
    'Protein': 'excellent', 'Fibre': 'excellent', 'Iron': 'excellent', 'Calcium': 'good', 'Omega-3': 'none',
    'Vit A': 'good', 'Vit C': 'good', 'Vit K': 'good', 'Folate / B': 'excellent', 'Antioxidants': 'good'
  },
  'Black Gram': {
    'Protein': 'excellent', 'Fibre': 'good', 'Iron': 'excellent', 'Calcium': 'excellent', 'Omega-3': 'none',
    'Vit A': 'none', 'Vit C': 'good', 'Vit K': 'none', 'Folate / B': 'good', 'Antioxidants': 'excellent'
  },
  'Horse Gram': {
    'Protein': 'excellent', 'Fibre': 'excellent', 'Iron': 'excellent', 'Calcium': 'good', 'Omega-3': 'none',
    'Vit A': 'none', 'Vit C': 'good', 'Vit K': 'none', 'Folate / B': 'good', 'Antioxidants': 'excellent'
  },
  'Peas': {
    'Protein': 'excellent', 'Fibre': 'good', 'Iron': 'excellent', 'Calcium': 'good', 'Omega-3': 'none',
    'Vit A': 'excellent', 'Vit C': 'excellent', 'Vit K': 'excellent', 'Folate / B': 'excellent', 'Antioxidants': 'good'
  },
  'Flax': {
    'Protein': 'good', 'Fibre': 'excellent', 'Iron': 'good', 'Calcium': 'good', 'Omega-3': 'excellent',
    'Vit A': 'none', 'Vit C': 'good', 'Vit K': 'good', 'Folate / B': 'good', 'Antioxidants': 'excellent'
  },
  'Chia': {
    'Protein': 'good', 'Fibre': 'excellent', 'Iron': 'good', 'Calcium': 'excellent', 'Omega-3': 'excellent',
    'Vit A': 'none', 'Vit C': 'good', 'Vit K': 'good', 'Folate / B': 'good', 'Antioxidants': 'excellent'
  },
  'Sesame': {
    'Protein': 'none', 'Fibre': 'good', 'Iron': 'excellent', 'Calcium': 'excellent', 'Omega-3': 'none',
    'Vit A': 'none', 'Vit C': 'good', 'Vit K': 'good', 'Folate / B': 'good', 'Antioxidants': 'excellent'
  },
  'Sunflower': {
    'Protein': 'excellent', 'Fibre': 'good', 'Iron': 'good', 'Calcium': 'none', 'Omega-3': 'good',
    'Vit A': 'good', 'Vit C': 'good', 'Vit K': 'good', 'Folate / B': 'excellent', 'Antioxidants': 'excellent'
  },
  'Fenugreek': {
    'Protein': 'good', 'Fibre': 'excellent', 'Iron': 'excellent', 'Calcium': 'good', 'Omega-3': 'none',
    'Vit A': 'excellent', 'Vit C': 'excellent', 'Vit K': 'excellent', 'Folate / B': 'good', 'Antioxidants': 'excellent'
  },
  'Ragi': {
    'Protein': 'good', 'Fibre': 'excellent', 'Iron': 'excellent', 'Calcium': 'excellent', 'Omega-3': 'none',
    'Vit A': 'none', 'Vit C': 'good', 'Vit K': 'good', 'Folate / B': 'good', 'Antioxidants': 'good'
  },
  'Pearl Millet': {
    'Protein': 'good', 'Fibre': 'excellent', 'Iron': 'excellent', 'Calcium': 'good', 'Omega-3': 'none',
    'Vit A': 'none', 'Vit C': 'good', 'Vit K': 'good', 'Folate / B': 'excellent', 'Antioxidants': 'good'
  },
  'Alfalfa': {
    'Protein': 'good', 'Fibre': 'good', 'Iron': 'good', 'Calcium': 'good', 'Omega-3': 'none',
    'Vit A': 'good', 'Vit C': 'excellent', 'Vit K': 'excellent', 'Folate / B': 'excellent', 'Antioxidants': 'good'
  },
  'Mustard': {
    'Protein': 'good', 'Fibre': 'good', 'Iron': 'good', 'Calcium': 'good', 'Omega-3': 'none',
    'Vit A': 'excellent', 'Vit C': 'excellent', 'Vit K': 'excellent', 'Folate / B': 'excellent', 'Antioxidants': 'excellent'
  },
  'White Radish': {
    'Protein': 'none', 'Fibre': 'good', 'Iron': 'good', 'Calcium': 'good', 'Omega-3': 'none',
    'Vit A': 'good', 'Vit C': 'excellent', 'Vit K': 'good', 'Folate / B': 'excellent', 'Antioxidants': 'excellent'
  },
  'Carrot': {
    'Protein': 'none', 'Fibre': 'good', 'Iron': 'good', 'Calcium': 'none', 'Omega-3': 'none',
    'Vit A': 'excellent', 'Vit C': 'excellent', 'Vit K': 'excellent', 'Folate / B': 'good', 'Antioxidants': 'excellent'
  },
  'Lettuce': {
    'Protein': 'none', 'Fibre': 'good', 'Iron': 'good', 'Calcium': 'none', 'Omega-3': 'none',
    'Vit A': 'excellent', 'Vit C': 'good', 'Vit K': 'excellent', 'Folate / B': 'excellent', 'Antioxidants': 'good'
  },
  'Red Cowpea': {
    'Protein': 'excellent', 'Fibre': 'excellent', 'Iron': 'excellent', 'Calcium': 'good', 'Omega-3': 'none',
    'Vit A': 'good', 'Vit C': 'good', 'Vit K': 'good', 'Folate / B': 'excellent', 'Antioxidants': 'excellent'
  },
  'Garden Cress': {
    'Protein': 'good', 'Fibre': 'good', 'Iron': 'excellent', 'Calcium': 'good', 'Omega-3': 'good',
    'Vit A': 'excellent', 'Vit C': 'excellent', 'Vit K': 'excellent', 'Folate / B': 'excellent', 'Antioxidants': 'excellent'
  },
  'Wheatgrass': {
    'Protein': 'good', 'Fibre': 'excellent', 'Iron': 'excellent', 'Calcium': 'good', 'Omega-3': 'none',
    'Vit A': 'excellent', 'Vit C': 'excellent', 'Vit K': 'excellent', 'Folate / B': 'good', 'Antioxidants': 'excellent'
  },
  'Beetroot': {
    'Protein': 'good', 'Fibre': 'excellent', 'Iron': 'excellent', 'Calcium': 'none', 'Omega-3': 'none',
    'Vit A': 'good', 'Vit C': 'excellent', 'Vit K': 'good', 'Folate / B': 'excellent', 'Antioxidants': 'excellent'
  },
  'Amaranthus': {
    'Protein': 'excellent', 'Fibre': 'good', 'Iron': 'excellent', 'Calcium': 'excellent', 'Omega-3': 'none',
    'Vit A': 'excellent', 'Vit C': 'excellent', 'Vit K': 'good', 'Folate / B': 'good', 'Antioxidants': 'excellent'
  },
  'Mung Bean Sprouts': {
    'Protein': 'excellent', 'Fibre': 'excellent', 'Iron': 'excellent', 'Calcium': 'none', 'Omega-3': 'none',
    'Vit A': 'none', 'Vit C': 'excellent', 'Vit K': 'none', 'Folate / B': 'excellent', 'Antioxidants': 'none'
  }
};

export const flavourPalette: FlavourPaletteEntry[] = [
  { name: 'Radish', tamilName: 'முள்ளங்கி', flavour: 'Spicy, crisp', uses: 'Garnish, tacos, stir-fries, salads' },
  { name: 'Mustard', tamilName: 'கடுகு', flavour: 'Spicy, tangy', uses: 'Asian dishes, meats, pickles, sandwiches' },
  { name: 'Beet', tamilName: 'பீட்ரூட்', flavour: 'Earthy, sweet', uses: 'Garnishes, salads, upscale plating' },
  { name: 'Amaranthus', tamilName: 'முளைக்கீரை', flavour: 'Beet-like, colourful', uses: 'Garnish, plating for fine dining' },
  { name: 'Pea', tamilName: 'பட்டாணி', flavour: 'Sweet, fresh', uses: 'Stir-fries, salads, sandwiches' },
  { name: 'Wheatgrass', tamilName: 'கோதுமைப் புல்', flavour: 'Sweet, grassy', uses: 'Juicing, smoothies, wellness shots' },
  { name: 'Pearl Millet', tamilName: 'கம்பு', flavour: 'Grassy', uses: 'Buttermilk, batters, grain bowls' },
  { name: 'Broccoli', flavour: 'Mild, earthy', uses: 'Smoothies, salads, sandwiches' },
  { name: 'Fenugreek', tamilName: 'வெந்தயம்', flavour: 'Bitter, maple-like', uses: 'Indian cuisine, detox drinks' },
  { name: 'Chia', tamilName: 'சியா விதை', flavour: 'Aromatic', uses: 'Smoothies, curd bowls, light garnish' },
  { name: 'Cress', tamilName: 'அலிவ் / ஹலீம்', flavour: 'Aromatic, bitter', uses: 'Chaats, soups, egg and cheese plates' },
  { name: 'Carrot', tamilName: 'கேரட்', flavour: 'Sweet', uses: 'Fine-dining garnish, salads, plating' },
  { name: 'Green Gram', tamilName: 'பாசிப்பயறு', flavour: 'Crunchy, sweet', uses: 'Salads, sundal, pongal, upma, dal' },
  { name: 'Horse Gram', tamilName: 'கொள்ளு', flavour: 'Sweet, crunchy', uses: 'Rasam, sundal, warm salads' },
  { name: 'Black Gram', tamilName: 'உளுந்து', flavour: 'Bitter, crunchy', uses: 'Dosa and idli plates, dal, salads' },
  { name: 'Sunflower', tamilName: 'சூரியகாந்தி', flavour: 'Nutty, crunchy', uses: 'Salads, wraps, snacks' },
  { name: 'Cowpea', tamilName: 'சிவப்பு காராமணி', flavour: 'Mild, crunchy', uses: 'Salads, chaats, grain bowls' }
];
