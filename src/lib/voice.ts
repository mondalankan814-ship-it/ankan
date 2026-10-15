let lastSpoken = '';
let lastSpokenTime = 0;
const COOLDOWN_MS = 3000;

export type VoiceLang = 'en' | 'bn' | 'hi';

let globalVoiceLang: VoiceLang = 'en';

export function setVoiceLang(lang: VoiceLang) {
  globalVoiceLang = lang;
}

export function getVoiceLang(): VoiceLang {
  return globalVoiceLang;
}

const LANG_CODES: Record<VoiceLang, string> = {
  en: 'en-IN',
  bn: 'bn-IN',
  hi: 'hi-IN',
};

// BCP-47 lang tags tried in order when selecting a voice for each language.
// For Bengali we try both bn-IN and bn-BD to maximize the chance of finding
// a native Bengali voice across different OS/browser TTS engines.
const LANG_TAG_FALLBACKS: Record<VoiceLang, string[]> = {
  en: ['en-IN', 'en'],
  bn: ['bn-IN', 'bn-BD', 'bn'],
  hi: ['hi-IN', 'hi'],
};

// Female voice name preferences per language — Indian English/Hindi/Bengali female voices
const FEMALE_VOICE_PREFERENCES: Record<VoiceLang, string[]> = {
  en: [
    'Google IN English',
    'Microsoft Heera',
    'Microsoft Neerja',
    'en-IN',
    'Google UK English Female',
    'Google US English',
  ],
  hi: [
    'Google हिन्दी',
    'Microsoft Swara',
    'Microsoft Kalpana',
    'hi-IN',
    'Google Hindi',
  ],
  bn: [
    'Google বাংলা',
    'Microsoft Bengali',
    'bn-IN',
    'bn-BD',
    'Google Bengali',
  ],
};

// Names that are typically male — used to exclude when seeking female voice
const MALE_VOICE_NAME_HINTS = [
  'ravi', 'hemant', 'male', 'david', 'mark', 'daniel', 'george',
  'alex', 'james', 'fred', 'arthur', 'thomas',
];

let cachedVoices: SpeechSynthesisVoice[] | null = null;
let voicesLoadPromise: Promise<void> | null = null;

function loadVoices(): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return Promise.resolve();
  }
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    cachedVoices = voices;
    return Promise.resolve();
  }
  if (voicesLoadPromise) return voicesLoadPromise;
  voicesLoadPromise = new Promise<void>((resolve) => {
    let resolved = false;
    const finish = () => {
      if (resolved) return;
      resolved = true;
      cachedVoices = window.speechSynthesis.getVoices();
      resolve();
    };
    window.speechSynthesis.addEventListener('voiceschanged', finish, { once: true });
    // Fallback timeout in case voiceschanged never fires
    setTimeout(finish, 2000);
  });
  return voicesLoadPromise;
}

// Initialize voice loading on module import
if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
}

function isFemaleVoice(voice: SpeechSynthesisVoice, lang: VoiceLang): boolean {
  const name = voice.name.toLowerCase();
  // Exclude known male voices
  if (MALE_VOICE_NAME_HINTS.some((hint) => name.includes(hint))) return false;
  // Check for female voice name hints
  const femaleHints = ['female', 'heera', 'neerja', 'swara', 'kalpana', 'veena', 'tara', 'sara', 'zira', 'samantha', 'google', 'aria', 'jenny', 'sonia'];
  if (femaleHints.some((hint) => name.includes(hint))) return true;
  // For Indian language voices, prefer ones that match the lang code
  const langCode = LANG_CODES[lang].toLowerCase();
  const langPrefix = lang;
  if (voice.lang.toLowerCase().startsWith(langPrefix) || voice.lang.toLowerCase() === langCode) {
    // Indian language voices are often female by default in Google/Microsoft TTS
    return true;
  }
  return false;
}

function pickFemaleVoice(lang: VoiceLang): SpeechSynthesisVoice | null {
  // Always re-read voices from the browser in case more loaded since cache
  const voices = (typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.getVoices() : null) ?? cachedVoices;
  if (!voices || voices.length === 0) return null;

  // First pass: try preferred female voice names for this language
  const preferences = FEMALE_VOICE_PREFERENCES[lang];
  for (const pref of preferences) {
    const match = voices.find((v) =>
      v.name.toLowerCase().includes(pref.toLowerCase()) ||
      v.lang.toLowerCase() === pref.toLowerCase()
    );
    if (match) return match;
  }

  // Second pass: any female-sounding voice matching the language tags
  const langTags = LANG_TAG_FALLBACKS[lang];
  const langPrefix = lang;
  const langMatch = voices.find((v) =>
    langTags.some((tag) => v.lang.toLowerCase() === tag.toLowerCase()) &&
    isFemaleVoice(v, lang)
  );
  if (langMatch) return langMatch;

  // Third pass: any voice matching the language at all
  const anyLangMatch = voices.find((v) =>
    langTags.some((tag) => v.lang.toLowerCase() === tag.toLowerCase()) ||
    v.lang.toLowerCase().startsWith(langPrefix)
  );
  if (anyLangMatch) return anyLangMatch;

  // For non-English languages, do NOT fall back to an English voice —
  // an English voice reading Bengali text would mispronounce every word.
  // Instead, return null and let the utterance's lang attribute drive the
  // browser's default voice selection for that language.
  if (lang !== 'en') return null;

  // Fallback: any English female voice
  const enFemale = voices.find((v) =>
    v.lang.toLowerCase().startsWith('en') && isFemaleVoice(v, 'en')
  );
  if (enFemale) return enFemale;

  // Last resort: first available voice
  return voices[0] ?? null;
}

function createUtterance(text: string, lang: VoiceLang, opts?: { rate?: number; pitch?: number; volume?: number }) {
  const utterance = new SpeechSynthesisUtterance(text);
  // Bengali: slower rate (0.9x) for a softer, warmer, more natural feel.
  // Slightly elevated pitch for a sweet, polite female tone.
  if (lang === 'bn') {
    utterance.rate = opts?.rate ?? 0.9;
    utterance.pitch = opts?.pitch ?? 1.15;
  } else {
    utterance.rate = opts?.rate ?? 1.0;
    utterance.pitch = opts?.pitch ?? 1.1;
  }
  utterance.volume = opts?.volume ?? 1;
  utterance.lang = LANG_CODES[lang];

  const voice = pickFemaleVoice(lang);
  if (voice) utterance.voice = voice;

  return utterance;
}

// Ensure voices are loaded before speaking — handles browser auto-play policies
async function ensureVoicesReady(): Promise<void> {
  if (cachedVoices && cachedVoices.length > 0) return;
  await loadVoices();
}

// Names shorter than this may get spelled out by some TTS engines; repeat them
// to encourage whole-word pronunciation.
const MIN_NAME_LEN = 3;

export function prepareNameForSpeech(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= 0) return trimmed;
  // If the name is very short or all caps, the engine may spell it out.
  // Adding a soft "uh" between repetitions helps the engine treat it as a word.
  if (trimmed.length < MIN_NAME_LEN || trimmed === trimmed.toUpperCase()) {
    return `${trimmed} ${trimmed}`;
  }
  return trimmed;
}

export async function speak(text: string, lang?: VoiceLang, opts?: { rate?: number; pitch?: number; volume?: number }) {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
  const useLang = lang ?? globalVoiceLang;
  const now = Date.now();
  if (text === lastSpoken && now - lastSpokenTime < COOLDOWN_MS) return;
  lastSpoken = text;
  lastSpokenTime = now;

  await ensureVoicesReady();

  // Cancel any ongoing speech before starting new
  window.speechSynthesis.cancel();

  // Small delay after cancel to ensure clean state
  await new Promise((r) => setTimeout(r, 50));

  // Split long text into sentence chunks for more reliable delivery
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    const utterance = createUtterance(trimmed, useLang, opts);
    window.speechSynthesis.speak(utterance);
  }
}

export function speakSoft(text: string, lang?: VoiceLang) {
  const l = lang ?? globalVoiceLang;
  speak(text, l, { rate: l === 'bn' ? 0.85 : 1.0, pitch: l === 'bn' ? 1.2 : 1.15, volume: 1 });
}

export function speakWarm(text: string, lang?: VoiceLang) {
  const l = lang ?? globalVoiceLang;
  speak(text, l, { rate: l === 'bn' ? 0.9 : 1.0, pitch: l === 'bn' ? 1.15 : 1.1, volume: 1 });
}

export function speakMelodic(text: string, lang?: VoiceLang) {
  const l = lang ?? globalVoiceLang;
  speak(text, l, { rate: l === 'bn' ? 0.88 : 1.0, pitch: l === 'bn' ? 1.22 : 1.18, volume: 1 });
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// Preload voices — call on first user interaction to comply with autoplay policies
export async function preloadVoices(): Promise<void> {
  await ensureVoicesReady();
  // Some browsers need a "warmup" utterance to unlock speech synthesis
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    const warmup = new SpeechSynthesisUtterance('');
    warmup.volume = 0;
    window.speechSynthesis.speak(warmup);
  }
}
