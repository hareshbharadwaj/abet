import { 
  searchSemanticCatalogue, 
  buildGroundTruthPromptSnippet, 
  detectProductsInText,
  getRangeIdByName,
  type SemanticProduct 
} from './semanticSearch';

export { getRangeIdByName, type SemanticProduct };

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  suggestions?: string[];
  recommendedProducts?: SemanticProduct[];
}

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
/**
 * The key is sent with the `x-goog-api-key` header (never in the query string)
 * so it cannot leak through proxies, logs or `Referer` headers.
 */
const GEMINI_URL = GEMINI_API_KEY
  ? "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
  : "";

/** Bounded retry helper: max 2 additional attempts with linear backoff. */
async function fetchWithRetry(input: string, init: RequestInit, attempts = 2): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(input, init);
      if (response.status < 500) return response;
      lastError = new Error(`Upstream responded ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Request failed');
}

const SITE_KNOWLEDGE_SYSTEM_PROMPT = `
You are "Zee", the friendly, highly knowledgeable AI Microgreens Recommendation Agent for A2ZEE MicroGreenz (a2zeemicrogreenz.com).
Your avatar is the official A2ZEE green dewdrop with a friendly, warm smiling face and a tiny fresh sprout.

YOUR GOAL:
Guide customers, recommend the best fresh microgreens, grow kits, and curated boxes according to their health goals, culinary tastes, and dietary needs. Provide friendly, accurate, and concise recommendations with EXACT prices from our catalog and simple serving ideas.

IMPORTANT PRICING & PRODUCT TRUTH (ALWAYS USE THESE EXACT PRICES):
1. Protein & Energy Builders (Range 01):
   - Green Gram (பாசிப்பயறு): Sweet, crisp, juicy. High plant protein (24%), folate, iron. Prices: ₹50 for 50g | ₹100 for 100g.
   - Black Gram (உளுந்து): Mild, nutty, tender. Classic Tamil strength food, high protein, iron, calcium. Prices: ₹50 for 50g | ₹100 for 100g.
   - Horse Gram (கொள்ளு): Earthy, gently bitter. Siddha superfood for stamina, metabolic burn & weight control. Prices: ₹60 for 50g | ₹120 for 100g.
   - Peas (பட்டாணி): Sweet, succulent, crunchy shoot. Protein, Vit A, C, K. Kid favorite! Prices: ₹150 for 50g | ₹300 for 100g.

2. Heart, Blood & Vitality (Range 02):
   - Flax (ஆளி விதை): Mild, nutty, soft. Highest plant Omega-3 (ALA), lignans, Vit E. Prices: ₹100 for 50g | ₹200 for 100g.
   - Chia (சியா விதை): Mildly bitter, minty. Omega-3, calcium, brain & heart health. Prices: ₹100 for 50g | ₹200 for 100g.
   - Sesame (எள்): Nutty with bitter finish. Calcium powerhouse & good fats. Prices: ₹75 for 50g | ₹150 for 100g.
   - Sunflower (சூரியகாந்தி): Big crunch, sweet & nutty. Vitamin E, zinc, protein. Best salad base! Prices: ₹150 for 50g | ₹300 for 100g.

3. Blood Sugar & Weight Management (Range 03):
   - Fenugreek (வெந்தயம்): Pleasantly bitter, aromatic. Supports blood-sugar balance, Vit A, C, K, iron. Prices: ₹50 for 50g | ₹100 for 100g.
   - Ragi (கேழ்வரகு): Fresh, grassy, lightly sweet. Calcium staple, slow energy, iron, fibre. Prices: ₹75 for 50g | ₹150 for 100g.
   - Pearl Millet (கம்பு): Sweet, grassy, cooling. Iron, magnesium, fibre, prevents sugar spikes. Prices: ₹75 for 50g | ₹150 for 100g.
   - Alfalfa (அல்ஃபால்ஃபா): Feather-light sandwich green, low calorie, Vit C, K, folate. Prices: ₹150 for 50g | ₹300 for 100g.

4. Immunity, Eye & Skin Defence (Range 04):
   - Mustard (கடுகு): Sharp & peppery, wasabi-like kick. Vitamins A, B6, C, E, K. Prices: ₹75 for 50g | ₹150 for 100g.
   - White Radish (முள்ளங்கி): Zesty, hot, peppery. Folate, sulphur antioxidants, liver detox. Prices: ₹150 for 50g | ₹300 for 100g.
   - Carrot (கேரட்): Sweet, feathery fronds. Rich in beta-carotene for skin & eye health. Prices: ₹150 for 50g | ₹300 for 100g.
   - Lettuce (லெட்டியூஸ்): Soft, buttery, tender salad base. Vit A, K, folate. Prices: ₹200 for 50g | ₹400 for 100g.
   - Red Cowpea (சிவப்பு காராமணி): Crisp crimson stems with anthocyanin antioxidants & iron. Prices: ₹75 for 50g | ₹150 for 100g.

5. Iron, Blood & Detox Greens (Range 05):
   - Garden Cress (அலிவ்): Peppery, punchy iron champion for blood building. Prices: ₹200 for 50g | ₹400 for 100g.
   - Wheatgrass (கோதுமைப் புல்): Pure chlorophyll detox, vitamins A, C, E, iron. Prices: ₹100 for 50g | ₹200 for 100g.
   - Beetroot (பீட்ரூட்): Earthy sweet ruby stems, dietary nitrates for stamina & blood flow. Prices: ₹150 for 50g | ₹300 for 100g.
   - Amaranthus (முளைக்கீரை): Native keerai, iron, calcium, Vit A & C. Prices: ₹150 for 50g | ₹250 for 100g.

6. Fresh Sprouts (Range 06):
   - Mung Bean Sprouts (பாசிப்பயறு முளை): Crisp, juicy, harvested morning of delivery. Prices: ₹200 for 500g | ₹350 for 1kg.

CURATED BOXES:
- Everyday Family Box (₹250): Green Gram, Black Gram, Ragi, Pearl Millet.
- Heart & Vitality Box (₹425): Flax, Chia, Sesame, Sunflower.
- Immunity & Detox Box (₹475): Mustard, White Radish, Wheatgrass, Beetroot.
- Chef's Premium Salad Box (₹850): Lettuce, Garden Cress, Carrot, Peas, Amaranthus.
- Sprout & Green Kitchen Box (₹425): Mung Bean Sprouts 500g + Green Gram, Fenugreek, Sunflower.

RECOMMENDATION RULES:
1. When recommending a microgreen, ALWAYS provide its exact price from above (e.g., Green Gram is ₹50 for 50g, NOT ₹89).
2. If asked what is best for weight loss / gym: Recommend Green Gram (₹50), Black Gram (₹50), Horse Gram (₹60), or Sunflower (₹150).
3. If asked what tastes best in daily salads: Recommend Sunflower (₹150), Peas (₹150), Lettuce (₹200), or Everyday Family Box (₹250).
4. If asked about liver detox, blood cleansing, or immunity: Recommend White Radish (₹150), Wheatgrass (₹100), or Beetroot (₹150).
5. If asked about blood sugar balance: Recommend Fenugreek (₹50) or Ragi (₹75).
6. Mention that orders can be placed directly on the site or via WhatsApp.
`;

/**
 * Queries local Ollama instance (e.g. llama3.2:1b) if available.
 */
async function askLocalOllama(prompt: string, systemPrompt: string): Promise<string | null> {
  const endpoints = ['/ollama/api/generate', 'http://127.0.0.1:11434/api/generate'];
  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2:1b',
          system: systemPrompt,
          prompt: prompt,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data?.response && data.response.trim().length > 0) {
          return data.response.trim();
        }
      }
    } catch {
      // Continue to next endpoint or fallback
    }
  }
  return null;
}

export interface AIResponseDetailed {
  text: string;
  recommendedProducts: SemanticProduct[];
  suggestions?: string[];
}

export function generateContextualSuggestions(query: string, replyText: string): string[] {
  const q = query.toLowerCase();

  if (q.includes('protein') || q.includes('gym') || q.includes('workout') || q.includes('muscle')) {
    return [
      '🥗 Crunchy salad microgreens?',
      '📦 Show Everyday Family Box',
      '🍽️ Best time to eat Green Gram?'
    ];
  }

  if (q.includes('salad') || q.includes('crunch') || q.includes('taste')) {
    return [
      '💪 Which greens have highest protein?',
      '👶 Kid-friendly sweet peas shoot?',
      '📦 Show Chef\'s Premium Salad Box'
    ];
  }

  if (q.includes('sugar') || q.includes('diabet') || q.includes('insulin')) {
    return [
      '🌱 How to consume Fenugreek daily?',
      '📦 Best starter box for blood sugar',
      '🥗 Can I add microgreens to warm food?'
    ];
  }

  if (q.includes('heart') || q.includes('cholesterol') || q.includes('omega') || q.includes('bp')) {
    return [
      '❤️ Show Heart & Vitality Box',
      '🌱 Benefits of Flax & Chia microgreens',
      '🚚 How fast is fresh delivery in Chennai?'
    ];
  }

  if (q.includes('detox') || q.includes('immunity') || q.includes('cleanse') || q.includes('radish') || q.includes('wheatgrass')) {
    return [
      '🥤 How to juice Wheatgrass daily?',
      '📦 Show Immunity & Detox Box',
      '❄️ How to store microgreens in fridge?'
    ];
  }

  if (q.includes('what is') || q.includes('what are') || q.includes('explan') || q.includes('used for')) {
    return [
      '💪 High protein varieties for gym',
      '🥗 Best crunchy greens for daily salad',
      '📦 Which combo box is best for beginners?'
    ];
  }

  if (q.includes('store') || q.includes('shelf') || q.includes('fridge')) {
    return [
      '🍽️ How to add microgreens to hot food?',
      '🥗 Best salad dressing for microgreens',
      '📦 Show Curated Value Boxes'
    ];
  }

  if (q.includes('box') || q.includes('combo') || q.includes('kit') || q.includes('curated')) {
    return [
      '📦 Everyday Family Box (₹250)',
      '❤️ Heart & Vitality Box (₹425)',
      '🛡️ Immunity & Detox Box (₹475)'
    ];
  }

  if (q.includes('skin') || q.includes('hair') || q.includes('glow')) {
    return [
      '🥕 Carrot & Beetroot microgreens',
      '🛡️ Show Immunity & Detox Box',
      '🥤 Morning green smoothie recipe'
    ];
  }

  return [
    '🥗 Best for fresh daily salads',
    '💪 Muscle recovery & high protein',
    '📦 Recommended beginner combo box'
  ];
}

export async function askAIAgentDetailed(
  userMessage: string,
  conversationHistory: { role: 'user' | 'model'; text: string }[] = []
): Promise<AIResponseDetailed> {
  // Step 1: Compute SBERT semantic vector matches from the catalog
  let topMatches: SemanticProduct[] = [];
  try {
    topMatches = await searchSemanticCatalogue(userMessage, 3);
  } catch (err) {
    console.warn("Semantic catalogue search error:", err);
  }

  const groundTruthSnippet = buildGroundTruthPromptSnippet(topMatches);
  const dynamicSystemPrompt = SITE_KNOWLEDGE_SYSTEM_PROMPT + `
CONVERSATIONAL GUIDELINES:
- When asked an informational question (e.g., explaining what microgreens are, how to eat them, how to store them), ALWAYS ANSWER THE QUESTION DIRECTLY AND CONCISELY FIRST. Do not just dump product recommendations.
- Keep responses short, direct, friendly, and structured.
` + groundTruthSnippet;

  let replyText = '';

  // Step 2: Try Gemini API if key is present
  if (GEMINI_URL && GEMINI_API_KEY) {
    try {
      const formattedHistory = conversationHistory.slice(-4).map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }));

      const contents = [
        ...formattedHistory,
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ];

      const payload = {
        systemInstruction: {
          parts: [{ text: dynamicSystemPrompt }]
        },
        contents,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 600,
        }
      };

      const response = await fetchWithRetry(GEMINI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText && candidateText.trim().length > 0) {
          replyText = candidateText.trim();
        }
      } else {
        const errText = await response.text();
        console.warn("Primary cloud AI response note:", errText);
      }
    } catch (error) {
      console.warn("Error calling primary cloud AI:", error);
    }
  }

  // Step 3: Try local Ollama model (llama3.2:1b)
  if (!replyText) {
    const localReply = await askLocalOllama(userMessage, dynamicSystemPrompt);
    if (localReply) {
      replyText = localReply;
    }
  }

  // Step 4: Fallback to high-precision SBERT semantic recommendation
  if (!replyText) {
    replyText = getDynamicSbertRecommendation(userMessage, topMatches);
  }

  // Step 5: Gather all relevant products (both vector matches and any mentioned in replyText)
  const detected = detectProductsInText(replyText);
  const combinedMap = new Map<string, SemanticProduct>();

  for (const item of topMatches) {
    combinedMap.set(item.id, item);
  }
  for (const item of detected) {
    combinedMap.set(item.id, item);
  }

  const suggestions = generateContextualSuggestions(userMessage, replyText);

  return {
    text: replyText,
    recommendedProducts: Array.from(combinedMap.values()).slice(0, 4),
    suggestions
  };
}

export async function askAIAgent(
  userMessage: string,
  conversationHistory: { role: 'user' | 'model'; text: string }[] = []
): Promise<string> {
  const detailed = await askAIAgentDetailed(userMessage, conversationHistory);
  return detailed.text;
}

/**
 * Intelligent SBERT-grounded conversational recommendation engine.
 * Converses naturally, answers questions directly, and pairs with accurate catalogue products.
 */
export function getDynamicSbertRecommendation(input: string, matches?: SemanticProduct[]): string {
  const query = input.toLowerCase().trim();

  // 1. Informational: What are microgreens & What are they used for?
  if (
    query.includes('what is') || 
    query.includes('what are') || 
    query.includes('explan') || 
    query.includes('meaning') || 
    query.includes('used for') ||
    query.includes('use of microgreen')
  ) {
    return `🌱 **What are Microgreens?**
Microgreens are young vegetable greens harvested just **7 to 14 days** after germination, right after the first true leaves appear. Though tiny, scientific studies show they contain **4 to 40 times higher nutrient density** (vitamins C, E, K, lutein, and iron) than their mature vegetable counterparts!

🍽️ **What are they used for?**
• **Daily Cooking**: Toss a handful into warm dal, rasam, upma, or khichdi right before serving.
• **Crunchy Salads & Bowls**: Use sunflower shoots or pea shoots as a flavorful, crisp base.
• **Smoothies & Juices**: Blend wheatgrass or flax greens for a live chlorophyll energy shot.
• **Sandwiches & Toasts**: Layer radish or mustard greens for a spicy wasabi-like kick.

Popular picks to get started: **Green Gram (₹50)** for protein, **Sunflower (₹150)** for crunch, or our **Everyday Family Box (₹250)**!`;
  }

  // 2. How to eat / cooking tips
  if (query.includes('how to eat') || query.includes('how to cook') || query.includes('cooking') || query.includes('recipe') || query.includes('raw')) {
    return `🥗 **How to Enjoy Microgreens:**
• **Eat Fresh & Raw**: Microgreens are best consumed raw or lightly tossed so their heat-sensitive enzymes and vitamins stay intact.
• **The Residual Heat Method**: If adding to cooked food (like sambar, pongal, or fried rice), stir them in *after turning off the flame*. The residual steam gently wilts them without degrading the nutrients.
• **Daily Serving Size**: 20g–30g (a generous fistful) daily provides all the micronutrients your body needs!`;
  }

  // 3. How to store & shelf life
  if (query.includes('store') || query.includes('shelf') || query.includes('fridge') || query.includes('preserve') || query.includes('spoil')) {
    return `❄️ **Storage & Freshness Tips:**
• Keep your microgreens refrigerated between **4°C and 8°C** in their ventilated pack.
• Keep them dry; only rinse what you are about to eat immediately.
• Harvested fresh the morning of delivery, they stay crisp and nutrient-packed for **5 to 7 days** in your fridge!`;
  }

  // 4. Greetings & Who are you
  if (query === 'hi' || query === 'hello' || query === 'hey' || query.includes('who are you') || query.includes('who r u')) {
    return `👋 **Hello! I'm Zee**, your AI advisor for A2ZEE MicroGreenz!
I can answer your questions, explain recipes and health benefits, or recommend the best fresh microgreens for your routine (e.g. workout recovery, diabetes balance, or everyday salads).

What would you like to know or explore today?`;
  }

  // 5. Protein & Workout Goals
  if (query.includes('protein') || query.includes('gym') || query.includes('workout') || query.includes('muscle') || query.includes('fitness')) {
    return `💪 For workout recovery and lean muscle building, microgreens provide clean, easily absorbed plant protein, folate, and iron without digestive heaviness.

Top varieties for stamina and fitness:
• **Green Gram (பாசிப்பயறு) — ₹50 / 50g**: Highest plant protein (24%), iron, and sustained stamina.
• **Black Gram (உளுந்து) — ₹50 / 50g**: Classic Tamil strength green for bone and muscle endurance.
• **Horse Gram (கொள்ளு) — ₹60 / 50g**: Siddha kitchen superfood for metabolic burn and lean strength.`;
  }

  // 6. Salad & Culinary Crunch
  if (query.includes('salad') || query.includes('crunch') || query.includes('taste') || query.includes('flavour')) {
    return `🥗 For daily salads, microgreens offer superior crunch and intense gourmet flavor compared to regular lettuce.

Best picks for texture and taste:
• **Sunflower Microgreens (₹150 / 50g)**: Thick, succulent crunchy stems with sweet, nutty flavor. Our #1 salad star!
• **Peas Shoots (₹150 / 50g)**: Sweet, crunchy shoots that children absolutely love.
• **White Radish (₹150 / 50g)**: Adds a zesty peppery kick to any bowl.
• **Everyday Family Box (₹250)**: 4 mild staples in one convenient kit!`;
  }

  // 7. Diabetes & Blood Sugar
  if (query.includes('sugar') || query.includes('diabet') || query.includes('insulin') || query.includes('glycemic')) {
    return `🩸 For blood sugar management, high-fibre greens with slow-release carbs help maintain steady glucose without insulin spikes.

Top varieties for sugar balance:
• **Fenugreek (வெந்தயம்) — ₹50 / 50g**: Celebrated in traditional wellness for insulin sensitivity and glucose moderation.
• **Ragi (கேழ்வரகு) — ₹75 / 50g**: Slow-release complex energy with high calcium and iron.
• **Pearl Millet (கம்பு) — ₹75 / 50g**: Cooling millet green rich in magnesium to avoid glycemic spikes.`;
  }

  // 8. Immunity & Detox
  if (query.includes('detox') || query.includes('immunity') || query.includes('cleanse') || query.includes('cancer') || query.includes('liver')) {
    return `🛡️ For cellular detoxification and immune defence, living microgreens provide intense antioxidants and pure chlorophyll.

Top choices for deep cleansing:
• **Wheatgrass (₹100 / 50g)**: Pure chlorophyll daily detox juice shot for blood purification.
• **White Radish (₹150 / 50g)**: Rich in sulphur antioxidants and vitamin C for liver enzyme stimulation.
• **Mustard (₹75 / 50g)**: Peppery wasabi-like kick packed with Vitamins A, C, and E.
• **Immunity & Detox Box (₹475)**: Complete 4-variety cleansing pack!`;
  }

  // 9. Heart & Cholesterol
  if (query.includes('heart') || query.includes('cholesterol') || query.includes('omega') || query.includes('bp') || query.includes('blood pressure')) {
    return `❤️ For cardiovascular wellness and cholesterol balance, microgreens rich in plant Omega-3 (ALA), vitamin E, and good fats are ideal.

Top heart health selections:
• **Flax Microgreens (₹100 / 50g)**: Richest plant source of Omega-3 ALA and lignans.
• **Chia Microgreens (₹100 / 50g)**: Delicate green with calcium, antioxidants, and healthy fats.
• **Heart & Vitality Box (₹425)**: Contains Flax, Chia, Sesame, and Sunflower in a single kit!`;
  }

  // 10. Curated Boxes & Value Combos
  if (query.includes('box') || query.includes('combo') || query.includes('kit') || query.includes('curated') || query.includes('package')) {
    return `📦 **A2ZEE Curated Value Boxes:**
Enjoy our chef-curated combos designed for specific health goals at great savings:
• **Everyday Family Box (₹250)**: Green Gram, Black Gram, Ragi, Pearl Millet — mild daily nutrition for the whole family!
• **Heart & Vitality Box (₹425)**: Flax, Chia, Sesame, Sunflower — rich in Omega-3 and Vitamin E.
• **Immunity & Detox Box (₹475)**: Mustard, White Radish, Wheatgrass, Beetroot — deep cellular detox.
• **Sprout & Green Kitchen Box (₹425)**: 500g Fresh Mung Sprouts + Green Gram, Fenugreek, Sunflower microgreens.
• **Chef's Premium Salad Box (₹850)**: Lettuce, Garden Cress, Carrot, Peas, Amaranthus — gourmet dining at home!`;
  }

  // 11. Weight Management & Fat Burn
  if (query.includes('weight') || query.includes('fat') || query.includes('burn') || query.includes('slim') || query.includes('diet')) {
    return `🔥 For weight management and healthy metabolism, microgreens offer nutrient density with near-zero glycemic load:
• **Horse Gram (கொள்ளu) — ₹60 / 50g**: Ancient Siddha superfood renowned for fat metabolism and long-lasting energy.
• **Green Gram (பாசிப்பயறு) — ₹50 / 50g**: 24% clean protein keeps you satiated without extra calories.
• **Fenugreek (வெந்தயம்) — ₹50 / 50g**: Helps stabilize insulin levels and suppresses sugar cravings.`;
  }

  // 12. Default SBERT recommendation if matches exist
  if (matches && matches.length > 0) {
    const list = matches.slice(0, 3).map(m => {
      const tamil = m.tamilName ? ` (${m.tamilName})` : '';
      return `• **${m.name}**${tamil} — **${m.priceText}**\n  *Nutrients*: ${m.keyNutrients.slice(0, 4).join(', ')}\n  *Best For*: ${m.bestFor}`;
    }).join('\n\n');

    return `🌿 Based on your request, here are our recommended fresh greens from the catalogue:\n\n${list}\n\nClick **View** to inspect the card or **⚡ Order** to purchase directly!`;
  }

  return `🌿 **Welcome to A2ZEE MicroGreenz!**
I can answer your questions, share serving ideas, or recommend the best fresh greens:
1. **Green Gram (₹50 / 50g)** — Plant protein champion for muscle & stamina.
2. **Sunflower (₹150 / 50g)** — Nutty, crunchy salad superstar.
3. **Everyday Family Box (₹250)** — 4 mild staples for family meals.

Tell me: What health goal, flavour, or question do you have today?`;
}

export function getFallbackRecommendation(input: string): string {
  return getDynamicSbertRecommendation(input);
}


