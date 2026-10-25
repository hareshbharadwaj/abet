/**
 * A2ZEE Semantic Search Engine
 * Powered by SBERT (all-MiniLM-L6-v2) 384-dimensional vector embeddings
 * with Ollama local inference & browser fallback.
 */

import embeddingsData from '../data/productEmbeddings.json';

export interface SemanticProduct {
  id: string;
  type: 'product' | 'curated_box';
  name: string;
  tamilName?: string;
  range?: string;
  subtitle?: string;
  description: string;
  keyNutrients: string[];
  prices: Record<string, number>;
  priceText: string;
  image: string;
  bestFor: string;
  score?: number;
  embedding: number[];
}

interface EmbeddingsDataset {
  model: string;
  dimension: number;
  count: number;
  items: SemanticProduct[];
}

const dataset = embeddingsData as unknown as EmbeddingsDataset;

/**
 * Calculates cosine similarity between two normalized or un-normalized float vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Attempts to get real-time query vector embedding from local Ollama all-minilm.
 */
async function getQueryEmbeddingFromOllama(query: string): Promise<number[] | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch('http://127.0.0.1:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'all-minilm',
        prompt: query
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.embedding) && data.embedding.length === dataset.dimension) {
        return data.embedding;
      }
    }
  } catch {
    // Ollama not reachable from browser context or offline
  }
  return null;
}

/**
 * Fallback semantic keyword & topic matcher for browser environments.
 */
function scoreBySemanticAttributes(query: string, item: SemanticProduct): number {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter(w => w.length > 2);
  let score = 0;

  const targetText = [
    item.name,
    item.tamilName || '',
    item.subtitle || '',
    item.description,
    item.bestFor,
    item.range || '',
    item.keyNutrients.join(' ')
  ].join(' ').toLowerCase();

  // Keyword match weight
  for (const word of words) {
    if (item.name.toLowerCase().includes(word)) score += 0.35;
    if (item.bestFor.toLowerCase().includes(word)) score += 0.25;
    if (item.description.toLowerCase().includes(word)) score += 0.20;
    if (item.keyNutrients.some(n => n.toLowerCase().includes(word))) score += 0.25;
  }

  // Domain health / culinary intents
  if ((q.includes('protein') || q.includes('gym') || q.includes('muscle')) && item.keyNutrients.includes('Protein')) {
    score += 0.45;
  }
  if ((q.includes('heart') || q.includes('cholesterol') || q.includes('omega')) && (item.keyNutrients.includes('Omega-3') || item.name.includes('Heart'))) {
    score += 0.45;
  }
  if ((q.includes('sugar') || q.includes('diabet') || q.includes('insulin')) && (item.name === 'Fenugreek' || item.name === 'Ragi')) {
    score += 0.50;
  }
  if ((q.includes('iron') || q.includes('anaemia') || q.includes('blood') || q.includes('mother')) && (item.name === 'Garden Cress' || item.name === 'Amaranthus' || item.name === 'Beetroot')) {
    score += 0.50;
  }
  if ((q.includes('detox') || q.includes('cleanse') || q.includes('shot')) && (item.name === 'Wheatgrass' || item.name === 'White Radish' || item.name.includes('Detox'))) {
    score += 0.45;
  }
  if ((q.includes('salad') || q.includes('crunch') || q.includes('taste')) && (item.name === 'Sunflower' || item.name === 'Peas' || item.name === 'Lettuce')) {
    score += 0.40;
  }
  if ((q.includes('family') || q.includes('beginner') || q.includes('child')) && (item.name.includes('Everyday Family Box') || item.name === 'Green Gram')) {
    score += 0.45;
  }
  if (q.includes('sprout') && item.name.includes('Sprout')) {
    score += 0.40;
  }

  return score;
}

/**
 * Searches the A2ZEE catalogue using SBERT vector similarity + domain relevance.
 */
export async function searchSemanticCatalogue(query: string, topK: number = 3): Promise<SemanticProduct[]> {
  const queryEmbedding = await getQueryEmbeddingFromOllama(query);

  const scoredItems: { item: SemanticProduct; score: number }[] = dataset.items.map(item => {
    let similarity = 0;
    if (queryEmbedding && item.embedding) {
      similarity = cosineSimilarity(queryEmbedding, item.embedding);
    } else {
      similarity = scoreBySemanticAttributes(query, item);
    }
    return {
      item,
      score: similarity
    };
  });

  scoredItems.sort((a, b) => b.score - a.score);

  return scoredItems.slice(0, topK).map(s => ({
    ...s.item,
    score: Math.round(s.score * 1000) / 1000
  }));
}

/**
 * Injects verified ground truth product details into the LLM system prompt.
 */
export function buildGroundTruthPromptSnippet(matches: SemanticProduct[]): string {
  if (!matches || matches.length === 0) return '';

  const bulletList = matches.map((m, idx) => {
    const tamil = m.tamilName ? ` (${m.tamilName})` : '';
    return `${idx + 1}. **${m.name}**${tamil}
   - Exact Price: ${m.priceText}
   - Category: ${m.range || 'Curated Kit'}
   - Key Nutrients: ${m.keyNutrients.join(', ')}
   - Why it matches: ${m.bestFor}`;
  }).join('\n\n');

  return `\n\n[VERIFIED GROUND TRUTH FROM A2ZEE CATALOGUE - SBERT VECTOR MATCH]:\nWhen recommending, you MUST use these exact prices and names:\n\n${bulletList}\n\nDo not make up any other prices or products!`;
}
