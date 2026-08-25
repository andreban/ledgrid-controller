import emojiData from 'emoji-picker-react/dist/data/emojis-en.js';

export interface EmojiItem {
  emoji: string;
  name: string;
  category: string;
  keywords: string[];
}

export interface EmojiSearchResponse {
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: EmojiItem[];
  available_categories?: string[];
  suggested_queries?: string[];
}

export interface EmojiSearchParams {
  query: string;
  category?: string;
  page?: number;
  page_size?: number;
}

interface InternalEmojiEntry {
  emoji: string;
  unified: string;
  name: string;
  category: string;
  keywords: string[];
  allTerms: string[];
}

// Convert unified hex codes (e.g. "1f680" or "1f468-200d-1f680") to actual Unicode emoji string
function unifiedToEmoji(unified: string): string {
  const codePoints = unified.split('-').map((hex) => parseInt(hex, 16));
  return String.fromCodePoint(...codePoints);
}

// Map common high-level search themes to specific keyword expansions
const THEME_EXPANSIONS: Record<string, string[]> = {
  space: [
    'rocket',
    'ufo',
    'flying saucer',
    'full moon',
    'moon',
    'ringed planet',
    'planet',
    'saturn',
    'milky way',
    'galaxy',
    'satellite',
    'alien',
    'extraterrestrial',
    'star',
    'stars',
    'comet',
    'telescope',
    'astronaut',
  ],
  science: [
    'microscope',
    'telescope',
    'test tube',
    'petri dish',
    'dna',
    'atom',
    'satellite',
    'rocket',
    'scientist',
  ],
  party: ['celebration', 'tada', 'party popper', 'balloon', 'confetti', 'cake', 'dancer', 'disco'],
  animal: ['dog', 'cat', 'bear', 'lion', 'tiger', 'monkey', 'panda', 'fox', 'wolf'],
  food: ['pizza', 'burger', 'taco', 'sushi', 'ramen', 'donut', 'cookie', 'cake', 'fruit', 'apple'],
  love: ['heart', 'kiss', 'sparkling heart', 'cupid', 'love letter'],
  weather: ['sun', 'sunny', 'rain', 'cloud', 'lightning', 'snow', 'rainbow', 'storm'],
};

const DEFAULT_SUGGESTED_QUERIES = ['stars', 'planet', 'science', 'happy', 'fire', 'heart'];

// Initialize and index catalog
const emojiCatalog: InternalEmojiEntry[] = [];
const emojiCharSet = new Set<string>();

const rawEmojis =
  (emojiData as unknown as { emojis: Record<string, Array<{ u?: string; n?: string[] }>> })
    .emojis || {};

for (const [category, list] of Object.entries(rawEmojis)) {
  if (!Array.isArray(list)) continue;
  for (const item of list) {
    if (!item.u || !item.n || item.n.length === 0) continue;
    const char = unifiedToEmoji(item.u);
    if (emojiCharSet.has(char)) continue;
    emojiCharSet.add(char);

    const names = item.n;
    // In emoji-picker-react, the last item is usually the descriptive full name
    const name = names[names.length - 1] || names[0];
    const keywords = names.filter((k) => k.toLowerCase() !== name.toLowerCase());

    emojiCatalog.push({
      emoji: char,
      unified: item.u,
      name,
      category,
      keywords,
      allTerms: names.map((n) => n.toLowerCase()),
    });
  }
}

/**
 * Validates whether a given string is a valid single emoji character.
 */
export function isValidEmoji(emoji: unknown): boolean {
  if (!emoji || typeof emoji !== 'string') {
    return false;
  }
  const trimmed = emoji.trim();
  if (!trimmed) {
    return false;
  }

  // Check if it exists in the catalog or matches grapheme + emoji unicode regex
  if (emojiCharSet.has(trimmed)) {
    return true;
  }

  // Grapheme segmentation check
  try {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    const segments = Array.from(segmenter.segment(trimmed));
    if (segments.length === 1) {
      // Must contain emoji/extended pictographic characters
      return /\p{Extended_Pictographic}/u.test(trimmed);
    }
  } catch {
    return /\p{Extended_Pictographic}/u.test(trimmed);
  }

  return false;
}

/**
 * Searches the emoji catalog with pagination, category filtering, and keyword matching.
 */
export function searchEmojiCatalog({
  query,
  category,
  page = 1,
  page_size = 6,
}: EmojiSearchParams): EmojiSearchResponse {
  const normalizedQuery = (query || '').toLowerCase().trim();
  const safePageSize = Math.min(Math.max(1, page_size), 12);
  const safePage = Math.max(1, page);

  if (!normalizedQuery && !category) {
    return {
      total_count: 0,
      page: safePage,
      page_size: safePageSize,
      total_pages: 0,
      results: [],
      suggested_queries: DEFAULT_SUGGESTED_QUERIES,
    };
  }

  const queryTerms = normalizedQuery ? [normalizedQuery] : [];
  if (normalizedQuery && THEME_EXPANSIONS[normalizedQuery]) {
    queryTerms.push(...THEME_EXPANSIONS[normalizedQuery]);
  }

  // Filter candidates
  const filtered = emojiCatalog.filter((entry) => {
    if (category && entry.category.toLowerCase() !== category.toLowerCase().trim()) {
      return false;
    }
    if (!normalizedQuery) return true;

    return queryTerms.some(
      (term) =>
        entry.name.toLowerCase().includes(term) ||
        entry.allTerms.some((t) => t.includes(term)) ||
        entry.category.toLowerCase().includes(term) ||
        entry.emoji === term,
    );
  });

  // Rank matches: exact matches and direct query hits score higher than theme expansions
  filtered.sort((a, b) => {
    const aDirect =
      a.name.toLowerCase().includes(normalizedQuery) ||
      a.allTerms.some((t) => t.includes(normalizedQuery));
    const bDirect =
      b.name.toLowerCase().includes(normalizedQuery) ||
      b.allTerms.some((t) => t.includes(normalizedQuery));

    if (aDirect && !bDirect) return -1;
    if (!aDirect && bDirect) return 1;

    const aExactName = a.name.toLowerCase() === normalizedQuery;
    const bExactName = b.name.toLowerCase() === normalizedQuery;
    if (aExactName && !bExactName) return -1;
    if (!aExactName && bExactName) return 1;

    return 0;
  });

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / safePageSize);

  if (totalCount === 0) {
    return {
      total_count: 0,
      page: safePage,
      page_size: safePageSize,
      total_pages: 0,
      results: [],
      suggested_queries: DEFAULT_SUGGESTED_QUERIES,
    };
  }

  const startIndex = (safePage - 1) * safePageSize;
  const results: EmojiItem[] = filtered.slice(startIndex, startIndex + safePageSize).map((e) => ({
    emoji: e.emoji,
    name: e.name,
    category: e.category,
    keywords: e.keywords.slice(0, 5),
  }));

  const availableCategories = Array.from(new Set(filtered.map((e) => e.category)));

  return {
    total_count: totalCount,
    page: safePage,
    page_size: safePageSize,
    total_pages: totalPages,
    results,
    available_categories: availableCategories,
  };
}
