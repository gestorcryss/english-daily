// Frases de exemplo do Tatoeba (CC BY 2.0 FR) com tradução.
// Precisa, em scripts/data/raw/tatoeba/, de: eng_sentences.tsv, <lang>_sentences.tsv e eng-<lang>_links.tsv
// (https://downloads.tatoeba.org/exports/per_language/).

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { RAW_DIR } from './lib.mjs';

const DIR = join(RAW_DIR, 'tatoeba');
const MIN_LENGTH = 20;
const MAX_LENGTH = 80;
const MAX_CANDIDATES_PER_TOKEN = 40;

// Código ISO 639-3 usado pelo Tatoeba → código guardado no catálogo.
export const TATOEBA_LANGUAGES = { por: 'pt' };

function readTsv(file) {
  return readFileSync(join(DIR, file), 'utf8').split('\n').filter(Boolean).map((line) => line.split('\t'));
}

function tokens(text) {
  return text.toLowerCase().match(/[a-z]+(?:[-'][a-z]+)*/g) ?? [];
}

/** Frases perto de 45 caracteres são as mais úteis: nem triviais nem compridas. */
function score(text) {
  return Math.abs(text.length - 45);
}

/**
 * Devolve uma função pick(lemma, forms, max) → [{ text, ref, translations: { pt: '…' } }].
 * Se os ficheiros do Tatoeba não existirem, a função devolve sempre [].
 */
export function loadTatoeba() {
  if (!existsSync(join(DIR, 'eng_sentences.tsv'))) return () => [];

  // id da frase inglesa → { pt: 'tradução' }
  const translationsByEnglishId = new Map();
  for (const [tatoebaCode, lang] of Object.entries(TATOEBA_LANGUAGES)) {
    if (!existsSync(join(DIR, `eng-${tatoebaCode}_links.tsv`))) continue;
    const foreign = new Map(readTsv(`${tatoebaCode}_sentences.tsv`).map(([id, , text]) => [id, text]));
    for (const [englishId, foreignId] of readTsv(`eng-${tatoebaCode}_links.tsv`)) {
      const text = foreign.get(foreignId);
      if (!text) continue;
      const entry = translationsByEnglishId.get(englishId) ?? {};
      // Fica com a tradução mais curta: costuma ser a mais directa.
      if (!entry[lang] || text.length < entry[lang].length) entry[lang] = text;
      translationsByEnglishId.set(englishId, entry);
    }
  }

  // palavra → frases candidatas (as melhores primeiro)
  const byToken = new Map();
  const phrases = [];
  for (const [id, , text] of readTsv('eng_sentences.tsv')) {
    const translations = translationsByEnglishId.get(id);
    if (!translations || !text || text.length < MIN_LENGTH || text.length > MAX_LENGTH) continue;
    const sentence = { text, ref: id, translations, score: score(text) };
    phrases.push(sentence);
    for (const token of new Set(tokens(text))) {
      const list = byToken.get(token) ?? [];
      list.push(sentence);
      byToken.set(token, list);
    }
  }
  for (const [token, list] of byToken) {
    list.sort((a, b) => a.score - b.score);
    byToken.set(token, list.slice(0, MAX_CANDIDATES_PER_TOKEN));
  }

  const usage = new Map();
  return function pick(lemma, forms, max) {
    const lower = lemma.toLowerCase();
    let candidates;
    if (/\s/.test(lower)) {
      // Expressões ("ice cream"): procura a sequência dentro da frase.
      const pattern = new RegExp(`\\b${lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      candidates = phrases.filter((sentence) => pattern.test(sentence.text)).sort((a, b) => a.score - b.score);
    } else {
      const seen = new Set();
      candidates = [lower, ...forms.map((form) => form.toLowerCase())]
        .flatMap((token) => byToken.get(token) ?? [])
        .filter((sentence) => !seen.has(sentence.ref) && seen.add(sentence.ref))
        .sort((a, b) => a.score - b.score);
    }
    // Evita repetir a mesma frase em muitas palavras.
    candidates.sort((a, b) => (usage.get(a.ref) ?? 0) - (usage.get(b.ref) ?? 0) || a.score - b.score);
    const picked = candidates.slice(0, max);
    for (const sentence of picked) usage.set(sentence.ref, (usage.get(sentence.ref) ?? 0) + 1);
    return picked.map(({ text, ref, translations }) => ({ text, ref, translations }));
  };
}
