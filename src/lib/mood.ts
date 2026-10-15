const NEGATIVE_WORDS = [
  'bad', 'terrible', 'awful', 'horrible', 'worst', 'cold', 'late', 'slow',
  'disgusting', 'stale', 'soggy', 'bland', 'tasteless', 'overcooked',
  'undercooked', 'burnt', 'smelly', 'rude', 'wrong', 'missing', 'spilled',
  'disappointed', 'disappointing', 'unhappy', 'angry', 'frustrated',
  'never again', 'waste', 'pathetic', 'poor', 'disgust', 'smell',
];

const POSITIVE_WORDS = [
  'good', 'great', 'excellent', 'amazing', 'delicious', 'tasty', 'fresh',
  'hot', 'fast', 'quick', 'love', 'loved', 'perfect', 'awesome', 'fantastic',
  'wonderful', 'satisfied', 'happy', 'best', 'yum', 'yummy', 'superb',
];

export type Mood = 'positive' | 'neutral' | 'negative';

export function detectMood(text: string, rating: number): Mood {
  if (rating <= 2) return 'negative';
  if (rating >= 4) {
    const lower = text.toLowerCase();
    const negHits = NEGATIVE_WORDS.filter((w) => lower.includes(w)).length;
    if (negHits >= 2) return 'negative';
    return 'positive';
  }
  const lower = text.toLowerCase();
  const negHits = NEGATIVE_WORDS.filter((w) => lower.includes(w)).length;
  const posHits = POSITIVE_WORDS.filter((w) => lower.includes(w)).length;
  if (negHits > posHits) return 'negative';
  if (posHits > negHits) return 'positive';
  return 'neutral';
}
