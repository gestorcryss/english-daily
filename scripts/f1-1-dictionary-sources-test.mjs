// F1.1 — Compara duas fontes de dados de dicionário numa amostra do catálogo CEFR:
//   A) Free Dictionary API (api.dictionaryapi.dev)
//   B) Wiktionary extraído pelo projecto wiktextract (kaikki.org), ficheiro por palavra
//
// Uso: node scripts/f1-1-dictionary-sources-test.mjs [palavras-por-nível]
// Precisa de scripts/data/raw/cefrj.csv e octanove.csv (ver docs/PESQUISA.md).

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAW = join(dirname(fileURLToPath(import.meta.url)), 'data', 'raw');
const PER_LEVEL = Number(process.argv[2] ?? 34);
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const CONCURRENCY = 8;
const TIMEOUT_MS = 25_000;
// A Free Dictionary API é testada numa parte da amostra, com espera curta e sem repetição.
const FREE_DICT_PER_LEVEL = Number(process.argv[3] ?? 10);
const FREE_DICT_TIMEOUT_MS = 8_000;

// Gerador pseudo-aleatório com semente fixa: a amostra é sempre a mesma.
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function readCatalogue() {
  const rows = [];
  for (const file of ['cefrj.csv', 'octanove.csv']) {
    const lines = readFileSync(join(RAW, file), 'utf8').split(/\r?\n/).slice(1);
    for (const line of lines) {
      const [headword, pos, level] = line.split(',');
      if (headword && LEVELS.includes(level)) rows.push({ headword, pos, level });
    }
  }
  return rows;
}

function sample(rows) {
  const random = mulberry32(20261004);
  const picked = [];
  for (const level of LEVELS) {
    // Só palavras simples: sem variantes ("a.m./AM") nem expressões com espaço.
    const words = [...new Set(rows.filter((r) => r.level === level && /^[a-z-]+$/i.test(r.headword)).map((r) => r.headword))];
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
    picked.push(...words.slice(0, PER_LEVEL).map((word) => ({ word, level })));
  }
  return picked;
}

async function timedFetch(url, timeoutMs = TIMEOUT_MS) {
  const started = Date.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    const text = await response.text();
    return { status: response.status, ms: Date.now() - started, text };
  } catch (error) {
    return { status: 0, ms: Date.now() - started, text: '', error: String(error.name ?? error) };
  }
}

async function checkFreeDictionary(word) {
  const attempt = await timedFetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    FREE_DICT_TIMEOUT_MS,
  );
  const result = { status: attempt.status, ms: attempt.ms, found: false };
  if (attempt.status !== 200) return result;

  const entries = JSON.parse(attempt.text);
  const meanings = entries.flatMap((e) => e.meanings ?? []);
  const definitions = meanings.flatMap((m) => m.definitions ?? []);
  const phonetics = entries.flatMap((e) => e.phonetics ?? []);
  return {
    ...result,
    found: true,
    ipa: entries.some((e) => e.phonetic) || phonetics.some((p) => p.text),
    audio: phonetics.some((p) => p.audio),
    definitions: definitions.length,
    examples: definitions.filter((d) => d.example).length,
    synonyms: meanings.some((m) => m.synonyms?.length) || definitions.some((d) => d.synonyms?.length),
  };
}

async function checkWiktextract(word) {
  const lower = word.toLowerCase();
  const url = `https://kaikki.org/dictionary/English/meaning/${lower[0]}/${lower.slice(0, 2)}/${encodeURIComponent(word)}.jsonl`;
  const attempt = await timedFetch(url);
  const result = { status: attempt.status, ms: attempt.ms, found: false };
  if (attempt.status !== 200) return result;

  const entries = attempt.text.split('\n').filter(Boolean).map((line) => JSON.parse(line));
  const senses = entries.flatMap((e) => e.senses ?? []);
  const sounds = entries.flatMap((e) => e.sounds ?? []);
  return {
    ...result,
    found: entries.length > 0,
    ipa: sounds.some((s) => s.ipa),
    audio: sounds.some((s) => s.mp3_url || s.ogg_url),
    definitions: senses.filter((s) => s.glosses?.length).length,
    examples: senses.reduce((n, s) => n + (s.examples?.length ?? 0), 0),
    synonyms: entries.some((e) => e.synonyms?.length) || senses.some((s) => s.synonyms?.length),
    // Exemplos escritos para o dicionário (curtos), por oposição a citações de livros e jornais.
    plainExamples: senses.reduce(
      (n, s) => n + (s.examples ?? []).filter((x) => x.type === 'example' && x.text.length <= 140).length,
      0,
    ),
    translations: Object.fromEntries(
      ['pt', 'es', 'fr', 'sw', 'ar', 'zh'].map((code) => [
        code,
        entries.some((e) => (e.translations ?? []).some((t) => (t.lang_code ?? t.code) === code && t.word)),
      ]),
    ),
  };
}

async function runPool(items, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await worker(items[index]);
        if ((index + 1) % 20 === 0) console.error(`  ${index + 1}/${items.length}`);
      }
    }),
  );
  return results;
}

function percent(count, total) {
  return total ? `${Math.round((count / total) * 100)}%` : '—';
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
}

function summarise(name, rows, key) {
  const total = rows.length;
  const found = rows.filter((r) => r[key].found);
  const n = found.length;
  console.log(`\n## ${name}`);
  console.log(`palavras encontradas: ${n}/${total} (${percent(n, total)})`);
  console.log(`com IPA: ${percent(found.filter((r) => r[key].ipa).length, n)} das encontradas`);
  console.log(`com áudio: ${percent(found.filter((r) => r[key].audio).length, n)}`);
  console.log(`com pelo menos 1 exemplo: ${percent(found.filter((r) => r[key].examples > 0).length, n)}`);
  console.log(`com pelo menos 2 exemplos: ${percent(found.filter((r) => r[key].examples > 1).length, n)}`);
  console.log(`com sinónimos: ${percent(found.filter((r) => r[key].synonyms).length, n)}`);
  console.log(`tempo de resposta (mediana): ${median(rows.map((r) => r[key].ms))} ms`);
  const statuses = {};
  for (const r of rows) statuses[r[key].status] = (statuses[r[key].status] ?? 0) + 1;
  console.log(`códigos HTTP finais: ${JSON.stringify(statuses)}`);
  for (const level of LEVELS) {
    const inLevel = rows.filter((r) => r.level === level);
    console.log(`  ${level}: ${inLevel.filter((r) => r[key].found).length}/${inLevel.length} encontradas`);
  }
}

const catalogue = readCatalogue();
const words = sample(catalogue);
console.error(`catálogo: ${catalogue.length} linhas; amostra: ${words.length} palavras`);

const perLevelSeen = {};
const rows = await runPool(words, async ({ word, level }) => {
  perLevelSeen[level] = (perLevelSeen[level] ?? 0) + 1;
  const testFreeDictionary = perLevelSeen[level] <= FREE_DICT_PER_LEVEL;
  return {
    word,
    level,
    freeDictionary: testFreeDictionary ? await checkFreeDictionary(word) : null,
    wiktextract: await checkWiktextract(word),
  };
});

writeFileSync(join(RAW, 'f1-1-results.json'), JSON.stringify(rows, null, 2));

const withVariant = catalogue.filter((r) => r.headword.includes('/')).length;
const withSpace = catalogue.filter((r) => r.headword.includes(' ')).length;
console.log(`# F1.1 — amostra de ${rows.length} palavras (${PER_LEVEL} por nível)`);
console.log(`catálogo: ${catalogue.length} linhas, ${withVariant} com variantes ("/"), ${withSpace} com espaços`);
summarise(
  'A) Free Dictionary API',
  rows.filter((r) => r.freeDictionary),
  'freeDictionary',
);
summarise('B) Wiktionary via wiktextract (kaikki.org)', rows, 'wiktextract');

const foundB = rows.filter((r) => r.wiktextract.found);
console.log(`com pelo menos 1 exemplo curto de dicionário: ${percent(foundB.filter((r) => r.wiktextract.plainExamples > 0).length, foundB.length)}`);
for (const code of ['pt', 'es', 'fr', 'sw', 'ar', 'zh']) {
  console.log(`com tradução para ${code}: ${percent(foundB.filter((r) => r.wiktextract.translations[code]).length, foundB.length)}`);
}
for (const level of LEVELS) {
  const inLevel = foundB.filter((r) => r.level === level);
  console.log(`  ${level}: tradução pt em ${percent(inLevel.filter((r) => r.wiktextract.translations.pt).length, inLevel.length)}, exemplo curto em ${percent(inLevel.filter((r) => r.wiktextract.plainExamples > 0).length, inLevel.length)}`);
}
