// Passo 3 — Carrega scripts/data/catalog/catalog.jsonl na base de dados Supabase ligada
// (supabase link), em lotes, através da função private.import_catalog_words.
//
// Pode ser repetido: cada palavra é substituída pela versão nova.
// Uso: node scripts/catalog/3-load-supabase.mjs [primeiro-lote] [minutos-máximos]

import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { CATALOG_FILE, SCRIPTS_DIR } from './lib.mjs';

const BATCH_SIZE = 150;
const FIRST_BATCH = Number(process.argv[2] ?? 0);
const MAX_MINUTES = Number(process.argv[3] ?? 8);

const words = readFileSync(CATALOG_FILE, 'utf8').split('\n').filter(Boolean);
const batches = [];
for (let i = 0; i < words.length; i += BATCH_SIZE) batches.push(words.slice(i, i + BATCH_SIZE));

const workDir = mkdtempSync(join(tmpdir(), 'english-daily-catalog-'));
const deadline = Date.now() + MAX_MINUTES * 60_000;
let loaded = 0;
let index = FIRST_BATCH;

try {
  for (; index < batches.length && Date.now() < deadline; index++) {
    const file = join(workDir, `batch-${index}.sql`);
    // $catalog$ … $catalog$ evita ter de escapar aspas dentro do JSON.
    writeFileSync(
      file,
      `select private.import_catalog_words($catalog$[${batches[index].join(',')}]$catalog$::jsonb);\n`,
    );
    execSync(`npx supabase db query --linked -f "${file}"`, {
      cwd: join(SCRIPTS_DIR, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    loaded += batches[index].length;
    if ((index + 1) % 10 === 0) console.log(`  lote ${index + 1}/${batches.length}`);
  }
} finally {
  rmSync(workDir, { recursive: true, force: true });
}

console.log(`palavras carregadas nesta corrida: ${loaded}`);
console.log(index < batches.length ? `por fazer: retomar no lote ${index}` : 'catálogo completo');
