export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  suggestions?: string[];
}

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
const GEMINI_URL = GEMINI_API_KEY
  ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
  : "";

const SITE_KNOWLEDGE_SYSTEM_PROMPT = `
You are "Zee", the friendly, highly knowledgeable AI Microgreens Recommendation Agent for A2ZEE MicroGreenz (a2zeemicrogreenz.com).
Your avatar is the official A2ZEE green dewdrop with a friendly, warm smiling face and a tiny fresh sprout.

YOUR GOAL:
Guide customers, recommend the best fresh microgreens, grow kits, and curated boxes according to their health goals, culinary tastes, and dietary needs. Provide friendly, accurate, and concise recommendations with pricing and simple serving ideas.

ABOUT A2ZEE MICROGREENZ:
- What we do: Farm-fresh, 100% organic, pesticide-free microgreens delivered within hours of harvest in eco-friendly packaging.
- Platform Features:
  - Buyer Portal: Browse catalog, buy 50g/100g/500g/1kg packs, curated boxes, seeds & grow kits.
  - Payment Methods: Razorpay (Cards, UPI, Netbanking) and Cash on Delivery (COD).
  - Fast Delivery: Real-time order tracking from farm to doorstep.
  - Seller & Farm Network: Local business sellers can register, get admin approval, and list products.
  - Quality Guarantee: 100% freshness guarantee, FSSAI certified organic standards.
  - Customer Support: Email: info@a2zeemicrogreenz.com, Phone: +91 98765 43210.

CORE PRODUCTS & WELLNESS RANGES:
1. Protein & Energy Builders:
   - Green Gram (பாசிப்பயறு): High plant protein & folate, sweet nutty taste. ₹89 (50g) / ₹159 (100g). Great in hot upma, salads, pongal.
   - Black Gram (உளுந்து): Rich in dietary fiber, iron, calcium. ₹89 (50g) / ₹159 (100g). Best for stamina & muscle.
   - Horse Gram (கொள்ளு): High protein, helps metabolic burn and weight control. ₹99 (50g) / ₹179 (100g).
   - Red Cowpea (தட்டப்பயறு): Rich in B-complex vitamins & zinc. ₹89 (50g).

2. Heart, Blood & Vitality:
   - Beetroot Microgreens: Packed with nitrates & iron for stamina, blood circulation & vibrant red salad color. ₹129 (50g) / ₹229 (100g).
   - Carrot Microgreens: Vitamin A & beta-carotene for eye health & glow. ₹119 (50g).
   - Amaranthus (முளைக்கீரை): Traditional calcium and iron powerhouse. ₹79 (50g) / ₹139 (100g).

3. Daily Detox & Digestion:
   - Radish Microgreens (முள்ளங்கி): Spicy, peppery, zesty kick! Rich in glucosinolates for liver detox and clear digestion. ₹99 (50g) / ₹179 (100g).
   - Mustard Microgreens (கடுகு): Pungent, wasabi-like kick. Antimicrobial, clears sinuses. ₹79 (50g) / ₹139 (100g).
   - Fenugreek (வெந்தயம்): Mild bitter-herbal, regulates blood sugar & cholesterol. ₹79 (50g) / ₹139 (100g).

4. Super-Immunity & Cellular Health:
   - Broccoli Microgreens: The ultimate superfood! Contains up to 50x more Sulforaphane than mature broccoli. Powerful cellular antioxidant. ₹159 (50g) / ₹289 (100g).
   - Sunflower Microgreens: Nutty, crunchy, packed with complete protein & Vitamin E. ₹149 (50g) / ₹269 (100g). Favorite salad base!
   - Wheatgrass: Complete chlorophyll detox, rich in vitamins A, C, E. ₹99 (50g).
   - Chia Microgreens: Omega-3 fatty acids, heart & brain health. ₹119 (50g).
   - Alfalfa: Mild, delicate crisp texture. Super rich in Vitamin K. ₹89 (50g).

CURATED BOXES:
- Daily Family Salad Box (₹299): Sunflower, Radish & Beetroot greens.
- Fitness & Protein Power Pack (₹349): Green Gram, Horse Gram & Sunflower.
- Immunity & Detox Trio (₹329): Broccoli, Wheatgrass & Radish.
- Gourmet Chef's Selection (₹399): 5 premium tasting varieties for fine dining.

GROW KITS & ACCESSORIES:
- Complete Grow Kit (₹499): Soil cake, trays, 3 seed varieties, spray mister, manual.
- Organic Seed Mix 50g (₹199): High germination organic seeds.
- Fine Spray Bottle 500ml (₹99).

RECOMMENDATION RULES:
1. Always be cheerful, concise, and helpful. Mention relevant microgreens with their benefits.
2. If asked what is best for weight loss / gym: Recommend Horse Gram & Sunflower / Fitness Power Pack.
3. If asked what is best for glowing skin or detox: Recommend Radish, Beetroot & Wheatgrass.
4. If asked what tastes best in daily salads: Recommend Sunflower, Radish & Beetroot.
5. If asked about anti-aging or cancer prevention: Highlight Broccoli microgreens for its immense Sulforaphane.
6. Provide short markdown formatting with bullet points and bold titles.
7. Mention that orders can be placed directly on the Products page or Cart with Cash on Delivery or Razorpay.
`;

export async function askAIAgent(userMessage: string, conversationHistory: { role: 'user' | 'model'; text: string }[] = []): Promise<string> {
  if (!GEMINI_URL || !GEMINI_API_KEY) {
    return getFallbackRecommendation(userMessage);
  }
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
        parts: [{ text: SITE_KNOWLEDGE_SYSTEM_PROMPT }]
      },
      contents,
      generationConfig: {
        temperature: 0.7,
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

    if (!response.ok) {
      const errText = await response.text();
      console.warn("Gemini API error, falling back to local recommendation engine:", errText);
      return getFallbackRecommendation(userMessage);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText && candidateText.trim().length > 0) {
      return candidateText.trim();
    }

    return getFallbackRecommendation(userMessage);
  } catch (error) {
    console.warn("Error calling Gemini API:", error);
    return getFallbackRecommendation(userMessage);
  }
}

/**
 * Intelligent local recommendation engine fallback
 * Ensures instant, accurate assistance even during offline / network interruptions.
 */
export function getFallbackRecommendation(input: string): string {
  const query = input.toLowerCase();

  if (query.includes('salad') || query.includes('crunch') || query.includes('taste') || query.includes('recipe')) {
    return `🥗 **Top Salad Recommendations:**\n\n• **Sunflower Microgreens (₹149)**: Crunchy, nutty, and satisfying as a complete salad base.\n• **Radish Microgreens (₹99)**: Adds a zesty peppery kick and crisp texture.\n• **Beetroot Microgreens (₹129)**: Brings a gorgeous ruby color and sweet earthiness.\n\n💡 *Tip: Try our **Daily Family Salad Box (₹299)** to enjoy all three in one box!*`;
  }

  if (query.includes('protein') || query.includes('gym') || query.includes('workout') || query.includes('muscle') || query.includes('fitness')) {
    return `💪 **High Protein & Workout Recommendations:**\n\n• **Green Gram Microgreens (₹89)**: Loaded with high plant protein, folate, and sustained energy.\n• **Horse Gram (₹99)**: Outstanding for lean muscle maintenance and metabolic burn.\n• **Sunflower Greens (₹149)**: Contains complete plant proteins with essential amino acids.\n\n⚡ Check out our **Fitness & Protein Power Pack (₹349)** on the Products page!`;
  }

  if (query.includes('detox') || query.includes('immunity') || query.includes('cancer') || query.includes('sulforaphane') || query.includes('healthy')) {
    return `🛡️ **Super-Immunity & Cellular Detox Recommendations:**\n\n• **Broccoli Microgreens (₹159)**: Contains up to 50x more **Sulforaphane** than adult broccoli for maximum antioxidant defense.\n• **Wheatgrass (₹99)**: Powerful blood cleanser and chlorophyll booster.\n• **Radish Greens (₹99)**: Stimulates natural liver enzymes for deep digestive cleansing.\n\n🌱 Order our **Immunity & Detox Trio (₹329)** today!`;
  }

  if (query.includes('grow') || query.includes('kit') || query.includes('home') || query.includes('seed')) {
    return `🌱 **Grow Your Own Microgreens at Home!**\n\n• **Complete Grow Kit (₹499)**: Includes 2 biodegradable trays, rich organic cocopeat soil, 3 seed packets, fine mist sprayer, and simple 7-day grower instructions.\n• **Organic Seed Mix 50g (₹199)**: High-germination seeds ready for harvest in just 7–10 days.\n\nHarvest fresh superfoods directly on your windowsill!`;
  }

  if (query.includes('order') || query.includes('track') || query.includes('delivery') || query.includes('pay') || query.includes('cod')) {
    return `📦 **Orders & Delivery at A2ZEE:**\n\n• **Payment Methods**: We support **Cash on Delivery (COD)** and **Razorpay** (UPI, Google Pay, Cards, NetBanking).\n• **Order Tracking**: Track your live order status anytime in **Orders** (/orders).\n• **Harvest Freshness**: Every pack is freshly harvested on the morning of delivery!`;
  }

  return `🌿 **Hello from A2ZEE MicroGreenz!**\n\nI can recommend the perfect fresh microgreens for you! Here are our customer favorites:\n\n1. **Broccoli Microgreens (₹159)** — Superfood #1 packed with Sulforaphane.\n2. **Sunflower Microgreens (₹149)** — Nutty, crunchy salad champion.\n3. **Radish Microgreens (₹99)** — Zesty peppery detox green.\n4. **Complete Grow Kit (₹499)** — Everything needed to grow at home in 7 days.\n\nTell me: What is your primary health or culinary goal (e.g., Weight loss, Immunity, Salads, or Growing at home)?`;
}
