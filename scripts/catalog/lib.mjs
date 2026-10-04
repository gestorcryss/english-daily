// Funções partilhadas pelos scripts que constroem o catálogo de palavras.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SCRIPTS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
export const RAW_DIR = join(SCRIPTS_DIR, 'data', 'raw');
export const CACHE_DIR = join(SCRIPTS_DIR, 'data', 'cache', 'wiktionary');
export const CATALOG_FILE = join(SCRIPTS_DIR, 'data', 'catalog', 'catalog.jsonl');

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/** Lê um CSV simples com campos entre aspas (as listas CEFR têm vírgulas dentro de aspas). */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Classe gramatical das listas CEFR → classe guardada no catálogo.
const POS_FROM_LIST = {
  noun: 'noun',
  verb: 'verb',
  vern: 'verb', // gralha na lista Octanove
  adjective: 'adjective',
  adverb: 'adverb',
  pronoun: 'pronoun',
  preposition: 'preposition',
  determiner: 'determiner',
  conjunction: 'conjunction',
  number: 'number',
  interjection: 'interjection',
  'modal auxiliary': 'verb',
  'be-verb': 'verb',
  'do-verb': 'verb',
  'have-verb': 'verb',
  'infinitive-to': 'other',
};

// Classe guardada no catálogo → classes equivalentes nos dados do Wiktionary.
export const WIKTIONARY_POS = {
  noun: ['noun', 'name'],
  verb: ['verb'],
  adjective: ['adj'],
  adverb: ['adv'],
  pronoun: ['pron'],
  preposition: ['prep', 'prep_phrase'],
  determiner: ['det', 'article'],
  conjunction: ['conj'],
  number: ['num'],
  interjection: ['intj'],
  other: ['particle', 'phrase'],
};

/**
 * Junta as listas CEFR-J (A1–B2) e Octanove (C1–C2) numa lista sem repetições.
 * Cada linha: { lemma, variants, pos, level, source, listTopics }.
 */
export function readWordLists() {
  const byKey = new Map();
  const add = (headword, listPos, level, source, listTopics) => {
    const pos = POS_FROM_LIST[listPos.trim().toLowerCase()];
    if (!headword || !pos || !LEVELS.includes(level)) return;
    // "a.m./A.M./am/AM" → primeira forma é o lema, as outras são variantes.
    const [lemma, ...variants] = headword.split('/').map((part) => part.trim()).filter(Boolean);
    const key = `${lemma}\t${pos}`;
    const existing = byKey.get(key);
    if (existing) {
      // A mesma palavra em dois níveis fica no mais baixo.
      if (LEVELS.indexOf(level) < LEVELS.indexOf(existing.level)) existing.level = level;
      existing.listTopics = [...new Set([...existing.listTopics, ...listTopics])];
      return;
    }
    byKey.set(key, { lemma, variants, pos, level, source, listTopics });
  };

  for (const row of parseCsv(readFileSync(join(RAW_DIR, 'cefrj.csv'), 'utf8')).slice(1)) {
    const [headword, pos, level, core1, core2, threshold] = row;
    const listTopics = [core1, core2, threshold].map((value) => (value ?? '').trim()).filter(Boolean);
    add(headword, pos ?? '', level, 'cefrj', listTopics);
  }
  for (const row of parseCsv(readFileSync(join(RAW_DIR, 'octanove.csv'), 'utf8')).slice(1)) {
    const [headword, pos, level] = row;
    add(headword, pos ?? '', level, 'octanove', []);
  }
  return [...byKey.values()];
}

/** Nome do ficheiro de cache para um lema (seguro em Windows). */
export function cacheFileName(lemma) {
  return `${encodeURIComponent(lemma).replace(/\*/g, '%2A')}.json`;
}
