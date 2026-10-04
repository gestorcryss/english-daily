// Passo 2 — Junta as listas CEFR com as fichas do Wiktionary em cache e escreve
// scripts/data/catalog/catalog.jsonl (uma palavra por linha).
//
// Uso: node scripts/catalog/2-build-catalog.mjs

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import {
  CACHE_DIR,
  CATALOG_FILE,
  LEVELS,
  RAW_DIR,
  SCRIPTS_DIR,
  WIKTIONARY_POS,
  cacheFileName,
  readWordLists,
} from './lib.mjs';
import { loadTatoeba } from './tatoeba.mjs';

const MAX_SENSES = 3;
const MAX_EXAMPLES_PER_SENSE = 2;
const MAX_TRANSLATIONS = 3;
const MAX_TATOEBA_EXAMPLES = 2;

// Significados que não interessam a quem aprende, ou que não devem aparecer numa app para todos.
const EXCLUDED_SENSE_TAGS = new Set([
  'archaic', 'obsolete', 'dated', 'rare', 'historical', 'form-of', 'alt-of', 'misspelling',
  'nonstandard', 'dialectal', 'vulgar', 'offensive', 'derogatory', 'slur', 'pejorative', 'no-gloss',
]);

// Línguas de tradução guardadas (código do Wiktionary → código guardado).
const LANGUAGES = {
  pt: 'pt', es: 'es', fr: 'fr', de: 'de', it: 'it', nl: 'nl', ru: 'ru', uk: 'uk', pl: 'pl',
  ro: 'ro', tr: 'tr', ar: 'ar', fa: 'fa', he: 'he', hi: 'hi', bn: 'bn', ur: 'ur', id: 'id',
  ms: 'ms', vi: 'vi', th: 'th', cmn: 'zh', ja: 'ja', ko: 'ko', sw: 'sw', am: 'am', ha: 'ha',
  yo: 'yo', ig: 'ig', zu: 'zu', xh: 'xh', af: 'af', so: 'so', el: 'el', cs: 'cs', hu: 'hu',
  sv: 'sv', da: 'da', nb: 'no', fi: 'fi', tl: 'tl', ta: 'ta', te: 'te',
};

// Categorias das listas CEFR-J → temas da app.
const LIST_TOPIC = [
  [/work and jobs/i, 'business'],
  [/education|language/i, 'study'],
  [/food and drink/i, 'food'],
  [/travel|travelling|traveling|holidays|places|nationalities/i, 'travel'],
  [/health and body/i, 'health'],
  [/books|media|arts?$|film|news|hobbies|leisure|free time/i, 'culture'],
  [/technical|scientific/i, 'technology'],
  [/objects and rooms|house and home|family|clothes|shopping|things in the town|personal|daily life|weather|colours|services|relations/i, 'daily'],
];

// Temas marcados nos significados do Wiktionary → temas da app.
const WIKTIONARY_TOPIC = {
  business: ['business', 'finance', 'economics', 'commerce', 'marketing', 'accounting', 'banking', 'management', 'trading', 'insurance'],
  technology: ['computing', 'technology', 'internet', 'engineering', 'electronics', 'software', 'programming', 'telecommunications', 'computer', 'information-technology'],
  health: ['medicine', 'health', 'anatomy', 'pathology', 'pharmacology', 'healthcare', 'physiology'],
  food: ['food', 'cooking', 'beverages', 'culinary', 'vegetable', 'fruits'],
  sport: ['sports', 'football', 'soccer', 'tennis', 'golf', 'athletics', 'baseball', 'basketball', 'cricket', 'hobbies', 'games'],
  culture: ['arts', 'music', 'film', 'literature', 'entertainment', 'theater', 'television', 'media', 'broadcasting', 'dance', 'painting', 'publishing'],
  study: ['education', 'linguistics', 'grammar'],
  travel: ['travel', 'transport', 'aviation', 'tourism', 'nautical', 'automotive', 'rail-transport', 'aeronautics'],
  emotions: ['psychology', 'emotion'],
};
const TOPIC_BY_WIKTIONARY = new Map(
  Object.entries(WIKTIONARY_TOPIC).flatMap(([slug, topics]) => topics.map((topic) => [topic, slug])),
);

const curated = JSON.parse(readFileSync(join(SCRIPTS_DIR, 'data', 'topics', 'curated.json'), 'utf8'));
const curatedByLemma = new Map();
for (const [slug, lemmas] of Object.entries(curated)) {
  for (const lemma of lemmas) curatedByLemma.set(lemma, [...(curatedByLemma.get(lemma) ?? []), slug]);
}

const frequencyRank = new Map(
  readFileSync(join(RAW_DIR, 'en_50k.txt'), 'utf8')
    .split('\n')
    .map((line, index) => [line.split(' ')[0], index + 1]),
);

// Só flexões úteis a quem aprende (plural, passado, comparativo…), sem grafias alternativas.
const INFLECTION_TAGS = new Set([
  'plural', 'past', 'participle', 'present', 'third-person', 'comparative', 'superlative', 'singular',
]);
const UNWANTED_FORM_TAGS = new Set(['alternative', 'obsolete', 'archaic', 'dialectal', 'nonstandard', 'rare', 'dated']);

function pickForms(entries) {
  return (entries[0]?.forms ?? [])
    .filter(
      (form) =>
        form.tags.some((tag) => INFLECTION_TAGS.has(tag)) &&
        !form.tags.some((tag) => UNWANTED_FORM_TAGS.has(tag)),
    )
    .slice(0, 6);
}

function pickIpa(entries) {
  const all = entries.flatMap((entry) => entry.ipa);
  return (all.find((sound) => sound.ipa.startsWith('/')) ?? all[0])?.ipa ?? null;
}

function pickAudio(entries) {
  const all = entries.flatMap((entry) => entry.audio);
  const withTag = (tag) => all.find((sound) => sound.tags.some((t) => t.includes(tag)));
  return (withTag('US') ?? withTag('UK') ?? all[0])?.url ?? null;
}

function pickSenses(entries) {
  const senses = [];
  const seen = new Set();
  for (const sense of entries.flatMap((entry) => entry.senses)) {
    if (!sense.gloss || seen.has(sense.gloss)) continue;
    if (sense.tags.some((tag) => EXCLUDED_SENSE_TAGS.has(tag))) continue;
    seen.add(sense.gloss);
    senses.push(sense);
    if (senses.length === MAX_SENSES) break;
  }
  return senses;
}

function cleanSynonyms(words, lemma) {
  return [...new Set(words)]
    .filter((word) => word !== lemma && word.length <= 30 && !/[:(]/.test(word))
    .slice(0, 6);
}

const pickTatoeba = loadTatoeba();

function buildWord(row) {
  const file = join(CACHE_DIR, cacheFileName(row.lemma));
  const cached = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
  const all = cached?.entries ?? [];
  const samePos = all.filter((entry) => WIKTIONARY_POS[row.pos].includes(entry.pos));
  const entries = samePos.length ? samePos : all;
  const senses = pickSenses(entries);

  const translations = {};
  for (const entry of entries) {
    for (const [code, words] of Object.entries(entry.translations)) {
      const lang = LANGUAGES[code];
      if (!lang) continue;
      const list = (translations[lang] ??= []);
      for (const word of words) {
        if (list.length < MAX_TRANSLATIONS && !list.includes(word)) list.push(word);
      }
    }
  }

  const topics = new Map();
  const addTopic = (slug, source) => {
    if (!topics.has(slug)) topics.set(slug, source);
  };
  for (const slug of curatedByLemma.get(row.lemma.toLowerCase()) ?? []) addTopic(slug, 'curated');
  for (const listTopic of row.listTopics) {
    const match = LIST_TOPIC.find(([pattern]) => pattern.test(listTopic));
    if (match) addTopic(match[1], 'cefrj');
  }
  for (const topic of senses.flatMap((sense) => sense.topics)) {
    const slug = TOPIC_BY_WIKTIONARY.get(topic);
    if (slug) addTopic(slug, 'wiktionary');
  }

  const forms = pickForms(entries);

  return {
    lemma: row.lemma,
    pos: row.pos,
    level: row.level,
    source: row.source,
    cached: cached !== null,
    posMatched: samePos.length > 0,
    frequencyRank: frequencyRank.get(row.lemma.toLowerCase()) ?? null,
    ipa: pickIpa(entries),
    audioUrl: pickAudio(entries),
    forms,
    synonyms: cleanSynonyms(
      [...senses.flatMap((sense) => sense.synonyms), ...entries.flatMap((entry) => entry.synonyms)],
      row.lemma,
    ),
    senses: senses.map((sense) => ({
      gloss: sense.gloss,
      tags: sense.tags,
      examples: sense.examples.slice(0, MAX_EXAMPLES_PER_SENSE),
    })),
    // Frases do Tatoeba com tradução; só para palavras com ficha.
    tatoebaExamples: senses.length
      ? pickTatoeba(row.lemma, forms.map((form) => form.form), MAX_TATOEBA_EXAMPLES)
      : [],
    topics: [...topics].map(([slug, source]) => ({ slug, source })),
    translations,
  };
}

const words = readWordLists().map(buildWord);
mkdirSync(dirname(CATALOG_FILE), { recursive: true });
writeFileSync(
  CATALOG_FILE,
  words.map(({ cached, posMatched, ...word }) => JSON.stringify(word)).join('\n') + '\n',
);

const percent = (count, total) => (total ? `${Math.round((count / total) * 100)}%` : '—');
const withContent = words.filter((word) => word.senses.length);
console.log(`palavras: ${words.length}; com ficha em cache: ${words.filter((w) => w.cached).length}`);
console.log(`com significado: ${withContent.length} (${percent(withContent.length, words.length)})`);
console.log(`classe gramatical encontrada: ${percent(words.filter((w) => w.posMatched).length, words.length)}`);
console.log(`das que têm significado — IPA: ${percent(withContent.filter((w) => w.ipa).length, withContent.length)}, áudio: ${percent(withContent.filter((w) => w.audioUrl).length, withContent.length)}, exemplo: ${percent(withContent.filter((w) => w.senses.some((s) => s.examples.length) || w.tatoebaExamples.length).length, withContent.length)}, exemplo com tradução pt: ${percent(withContent.filter((w) => w.tatoebaExamples.length).length, withContent.length)}, tradução pt: ${percent(withContent.filter((w) => w.translations.pt).length, withContent.length)}, com tema: ${percent(withContent.filter((w) => w.topics.length).length, withContent.length)}`);
for (const level of LEVELS) {
  const inLevel = withContent.filter((word) => word.level === level);
  console.log(`  ${level}: ${inLevel.length} palavras, exemplo ${percent(inLevel.filter((w) => w.senses.some((s) => s.examples.length) || w.tatoebaExamples.length).length, inLevel.length)}, com tradução ${percent(inLevel.filter((w) => w.tatoebaExamples.length).length, inLevel.length)}, pt ${percent(inLevel.filter((w) => w.translations.pt).length, inLevel.length)}`);
}
const topicCount = {};
for (const word of withContent) for (const topic of word.topics) topicCount[topic.slug] = (topicCount[topic.slug] ?? 0) + 1;
console.log(`palavras por tema: ${JSON.stringify(topicCount)}`);
