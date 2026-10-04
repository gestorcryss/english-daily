// Passo 1 — Descarrega do kaikki.org (wiktextract) a ficha de cada palavra das listas CEFR
// e guarda uma versão reduzida em scripts/data/cache/wiktionary/.
//
// Pode ser interrompido e retomado: as palavras já em cache são saltadas.
// Uso: node scripts/catalog/1-fetch-wiktionary.mjs [minutos-máximos]

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { CACHE_DIR, cacheFileName, readWordLists } from './lib.mjs';

const MAX_MINUTES = Number(process.argv[2] ?? 8);
const CONCURRENCY = 6;
const TIMEOUT_MS = 45_000;

function wiktionaryUrl(word) {
  const first = encodeURIComponent(word.slice(0, 1));
  const firstTwo = encodeURIComponent(word.slice(0, 2));
  return `https://kaikki.org/dictionary/English/meaning/${first}/${firstTwo}/${encodeURIComponent(word)}.jsonl`;
}

async function fetchEntries(word) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(wiktionaryUrl(word), { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (response.status === 404) return [];
      if (response.ok) {
        const text = await response.text();
        return text.split('\n').filter(Boolean).map((line) => JSON.parse(line));
      }
    } catch {
      // tenta outra vez
    }
    await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
  }
  return null;
}

/** Fica só com o que o catálogo usa; a ficha completa chega a ter centenas de KB. */
function reduceEntry(entry) {
  const sounds = entry.sounds ?? [];
  const translations = {};
  for (const translation of entry.translations ?? []) {
    const code = translation.lang_code ?? translation.code;
    const word = translation.word?.trim();
    if (!code || !word || word.length > 60) continue;
    const list = (translations[code] ??= []);
    if (list.length < 4 && !list.includes(word)) list.push(word);
  }
  return {
    pos: entry.pos,
    ipa: sounds.filter((s) => s.ipa).map((s) => ({ ipa: s.ipa, tags: s.tags ?? [] })).slice(0, 6),
    audio: sounds
      .filter((s) => s.mp3_url)
      .map((s) => ({ url: s.mp3_url, tags: s.tags ?? [] }))
      .slice(0, 6),
    forms: (entry.forms ?? [])
      .filter((f) => f.form && !(f.tags ?? []).some((t) => ['table-tags', 'inflection-template', 'class'].includes(t)))
      .map((f) => ({ form: f.form, tags: f.tags ?? [] }))
      .slice(0, 10),
    senses: (entry.senses ?? []).slice(0, 14).map((sense) => ({
      gloss: sense.glosses?.at(-1) ?? null,
      tags: sense.tags ?? [],
      topics: sense.topics ?? [],
      examples: (sense.examples ?? [])
        .filter((example) => example.type === 'example' && example.text && example.text.length <= 140)
        .map((example) => example.text.trim())
        .slice(0, 3),
      synonyms: (sense.synonyms ?? []).map((s) => s.word).filter(Boolean).slice(0, 6),
    })),
    synonyms: (entry.synonyms ?? []).map((s) => s.word).filter(Boolean).slice(0, 8),
    translations,
  };
}

mkdirSync(CACHE_DIR, { recursive: true });

const lemmas = new Map();
for (const row of readWordLists()) {
  if (!lemmas.has(row.lemma)) lemmas.set(row.lemma, row.variants);
}
const pending = [...lemmas.entries()].filter(([lemma]) => !existsSync(join(CACHE_DIR, cacheFileName(lemma))));
console.log(`lemas: ${lemmas.size}; em falta: ${pending.length}`);

const deadline = Date.now() + MAX_MINUTES * 60_000;
let next = 0;
let done = 0;
let failed = 0;
let notFound = 0;

await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (next < pending.length && Date.now() < deadline) {
      const [lemma, variants] = pending[next++];
      // Se o lema não existir no Wiktionary, tenta as variantes da lista ("am" em vez de "a.m.").
      let entries = null;
      let foundAs = lemma;
      for (const candidate of [lemma, ...variants]) {
        entries = await fetchEntries(candidate);
        if (entries === null) break;
        if (entries.length) {
          foundAs = candidate;
          break;
        }
      }
      if (entries === null) {
        failed++;
        continue;
      }
      if (!entries.length) notFound++;
      writeFileSync(
        join(CACHE_DIR, cacheFileName(lemma)),
        JSON.stringify({ lemma, foundAs, entries: entries.map(reduceEntry) }),
      );
      if (++done % 250 === 0) console.log(`  ${done}/${pending.length}`);
    }
  }),
);

console.log(`descarregadas: ${done}; sem ficha: ${notFound}; falhas de rede: ${failed}; por fazer: ${pending.length - done}`);
