/**
 * Gera src/data/taco.json a partir dos CSVs da Tabela Brasileira de Composição
 * de Alimentos (TACO, 4ª edição, NEPA/UNICAMP), em scripts/taco/.
 *
 * CSVs extraídos da planilha oficial pelo projeto taco-api
 * (github.com/raulfdm/taco-api, licença MIT).
 *
 * Uso: node scripts/build-taco.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'scripts', 'taco');

/** CSV simples com campos entre aspas. */
function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = !quoted;
      } else if (ch === ',' && !quoted) {
        cells.push(cur);
        cur = '';
      } else cur += ch;
    }
    cells.push(cur);
    rows.push(cells);
  }
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

const read = (f) => parseCsv(readFileSync(join(dir, f), 'utf8'));
const num = (v) => {
  const n = Number(v);
  return v === '' || Number.isNaN(n) ? 0 : Math.round(n * 10) / 10;
};

const categories = new Map(read('categories.csv').map((c) => [c.id, c.name]));
const nutrients = new Map(read('nutrients.csv').map((n) => [n.foodId, n]));

const foods = read('food.csv').map((f) => {
  const n = nutrients.get(f.id) ?? {};
  return {
    id: Number(f.id),
    name: f.name,
    category: categories.get(f.categoryId) ?? '',
    // por 100 g
    kcal: Math.round(num(n.kcal)),
    proteinG: num(n.protein),
    carbsG: num(n.carbohydrates),
    fatG: num(n.lipids),
  };
});

const out = join(root, 'src', 'data', 'taco.json');
writeFileSync(out, JSON.stringify(foods) + '\n');
console.log(`${foods.length} alimentos → ${out}`);
