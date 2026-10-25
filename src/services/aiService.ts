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
const GEMINI_URL = GEMINI_API_KEY
  ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
  : "";

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
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('http://127.0.0.1:11434/api/generate', {
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
    // Ollama not reachable from browser
  }
  return null;
}

export interface AIResponseDetailed {
  text: string;
  recommendedProducts: SemanticProduct[];
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
  const dynamicSystemPrompt = SITE_KNOWLEDGE_SYSTEM_PROMPT + groundTruthSnippet;

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

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        console.warn("Primary cloud AI error, switching to local NLP model:", errText);
      }
    } catch (error) {
      console.warn("Error calling primary cloud AI, switching to local NLP model:", error);
    }
  }

  // Step 3: Try local Ollama model if available and cloud didn't answer
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

  return {
    text: replyText,
    recommendedProducts: Array.from(combinedMap.values()).slice(0, 4)
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
 * Intelligent SBERT-grounded recommendation generator
 * Generates instant, 100% accurate recommendations matching catalogueData.ts
 */
export function getDynamicSbertRecommendation(input: string, matches?: SemanticProduct[]): string {
  if (matches && matches.length > 0) {
    const list = matches.map(m => {
      const tamil = m.tamilName ? ` (${m.tamilName})` : '';
      return `• **${m.name}**${tamil} — **${m.priceText}**\n  *Nutrients*: ${m.keyNutrients.slice(0, 4).join(', ')}\n  *Best For*: ${m.bestFor}`;
    }).join('\n\n');

    return `🌿 **A2ZEE Smart Recommendations based on your goal:**\n\n${list}\n\n🛒 You can add these fresh greens to your cart or order directly on WhatsApp!`;
  }

  const query = input.toLowerCase();

  if (query.includes('salad') || query.includes('crunch') || query.includes('taste')) {
    return `🥗 **Top Salad Recommendations:**\n\n• **Sunflower Microgreens (₹150 / 50g)**: Thick crunchy stems with sweet, nutty flavor. Our #1 salad base!\n• **Peas Shoots (₹150 / 50g)**: Sweet, crunchy, succulent shoots children love.\n• **White Radish (₹150 / 50g)**: Adds a zesty peppery kick to any bowl.\n\n💡 *Tip: Try our **Everyday Family Box (₹250)** or **Chef's Premium Salad Box (₹850)**!*`;
  }

  if (query.includes('protein') || query.includes('gym') || query.includes('workout') || query.includes('muscle')) {
    return `💪 **High Protein & Workout Recommendations:**\n\n• **Green Gram (பாசிப்பயறு) — ₹50 / 50g**: Highest plant protein (24%), fibre for digestion & sustained energy.\n• **Black Gram (உளுந்து) — ₹50 / 50g**: Classic Tamil stamina green packed with protein, iron & calcium.\n• **Horse Gram (கொள்ளு) — ₹60 / 50g**: Siddha kitchen superfood for metabolic burn and lean strength.\n\n⚡ *Add a handful to your warm dal, post-workout bowl or smoothie!*`;
  }

  if (query.includes('heart') || query.includes('cholesterol') || query.includes('omega')) {
    return `❤️ **Cardiovascular & Omega-3 Recommendations:**\n\n• **Flax Microgreens (₹100 / 50g)**: Highest plant source of Omega-3 (ALA) and lignans.\n• **Chia Microgreens (₹100 / 50g)**: Calcium, antioxidants, and essential healthy fats.\n• **Sunflower (₹150 / 50g)**: Vitamin E and zinc for vascular wellness.\n\n💡 *Or grab our **Heart & Vitality Box (₹425)** containing Flax, Chia, Sesame & Sunflower!*`;
  }

  if (query.includes('sugar') || query.includes('diabet') || query.includes('insulin')) {
    return `🩸 **Blood Sugar & Balance Recommendations:**\n\n• **Fenugreek (வெந்தயம்) — ₹50 / 50g**: Traditionally celebrated for insulin sensitivity and glucose balance.\n• **Ragi (கேழ்வரகு) — ₹75 / 50g**: Slow-release complex carbohydrates with high calcium and iron.\n• **Pearl Millet (கம்பு) — ₹75 / 50g**: Cooling millet green with magnesium to avoid glycemic spikes.`;
  }

  if (query.includes('detox') || query.includes('immunity') || query.includes('cleanse')) {
    return `🛡️ **Immunity & Deep Detox Recommendations:**\n\n• **White Radish (₹150 / 50g)**: Rich in sulphur antioxidants and vitamin C for liver cleansing.\n• **Wheatgrass (₹100 / 50g)**: Pure chlorophyll detox juice shot.\n• **Mustard (₹75 / 50g)**: Peppery wasabi-like kick loaded with Vitamins A, C, and E.\n\n🌱 *Check out our **Immunity & Detox Box (₹475)**!*`;
  }

  return `🌿 **Welcome to A2ZEE MicroGreenz!**\n\nI can recommend the perfect living microgreens for your health and taste goals:\n\n1. **Green Gram (₹50 / 50g)** — Plant-protein champion for muscle & stamina.\n2. **Sunflower (₹150 / 50g)** — Nutty, crunchy salad superstar.\n3. **Garden Cress (₹200 / 50g)** — Iron powerhouse for blood building.\n4. **Everyday Family Box (₹250)** — 4 mild staples perfect for family meals.\n\nTell me: What health goal or flavour are you looking for today?`;
}

export function getFallbackRecommendation(input: string): string {
  return getDynamicSbertRecommendation(input);
}

