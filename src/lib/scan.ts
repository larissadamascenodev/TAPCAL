/**
 * Resultado do scanner de pratos: validação da resposta da IA, porções
 * ajustáveis e conversão em alimentos do dia.
 *
 * A Edge Function `analyze-meal` devolve cada alimento com a porção estimada
 * em gramas e os valores por 100 g; o app recalcula tudo quando a pessoa
 * ajusta a porção.
 */

import { newId } from '@/lib/id';
import { portion } from '@/lib/taco';
import { ZERO_MACROS } from '@/lib/totals';
import type { FoodItem, Macros } from '@/types';

export type ScanItem = {
  id: string;
  name: string;
  grams: number;
  per100: Macros;
};

export type ScanResult = {
  dish: string;
  /** Confiança geral da IA, de 0 a 1. */
  confidence: number;
  items: ScanItem[];
};

/** Formato cru devolvido pela Edge Function (e pedido ao Gemini). */
export type RawScanItem = {
  name?: unknown;
  grams?: unknown;
  kcal_per_100g?: unknown;
  protein_per_100g?: unknown;
  carbs_per_100g?: unknown;
  fat_per_100g?: unknown;
};

export const MAX_GRAMS = 1500;

function clampNum(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(',', '.')) : NaN;
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Valida e limpa a resposta da IA. Descarta alimentos sem nome ou sem
 * calorias, corta valores impossíveis e devolve null se não sobrar nada.
 */
export function normalizeScan(raw: unknown): ScanResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as { dish?: unknown; confidence?: unknown; items?: unknown };
  if (!Array.isArray(obj.items)) return null;

  const items: ScanItem[] = [];
  for (const it of obj.items as RawScanItem[]) {
    if (!it || typeof it !== 'object') continue;
    const name = typeof it.name === 'string' ? it.name.trim() : '';
    const grams = clampNum(it.grams, 0, MAX_GRAMS);
    const kcal = clampNum(it.kcal_per_100g, 0, 900);
    if (!name || grams == null || kcal == null) continue;
    items.push({
      id: newId(),
      name: name.charAt(0).toUpperCase() + name.slice(1),
      grams: Math.round(grams / 5) * 5,
      per100: {
        kcal: Math.round(kcal),
        proteinG: r1(clampNum(it.protein_per_100g, 0, 100) ?? 0),
        carbsG: r1(clampNum(it.carbs_per_100g, 0, 100) ?? 0),
        fatG: r1(clampNum(it.fat_per_100g, 0, 100) ?? 0),
      },
    });
  }
  if (!items.length) return null;

  const dish = typeof obj.dish === 'string' && obj.dish.trim() ? obj.dish.trim() : items.map((i) => i.name).join(', ');
  return {
    dish,
    confidence: clampNum(obj.confidence, 0, 1) ?? 0.5,
    items,
  };
}

/** Valores de um alimento na porção atual. */
export function itemMacros(item: ScanItem): Macros {
  return portion(item.per100, item.grams);
}

/** Soma do prato inteiro (alimentos com 0 g ficam de fora). */
export function scanTotals(items: readonly ScanItem[]): Macros {
  return items.map(itemMacros).reduce<Macros>(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      proteinG: r1(acc.proteinG + m.proteinG),
      carbsG: r1(acc.carbsG + m.carbsG),
      fatG: r1(acc.fatG + m.fatG),
    }),
    ZERO_MACROS,
  );
}

/** Muda a porção de um alimento, em passos, sem sair de 0 a MAX_GRAMS. */
export function adjustGrams(items: readonly ScanItem[], id: string, delta: number): ScanItem[] {
  return items.map((i) => (i.id === id ? { ...i, grams: Math.min(MAX_GRAMS, Math.max(0, i.grams + delta)) } : i));
}

/** Corrige um alimento que a IA reconheceu: nome e porção (0 a MAX_GRAMS, de 5 em 5 g). */
export function editScanItem(
  items: readonly ScanItem[],
  id: string,
  changes: { name?: string; grams?: number },
): ScanItem[] {
  return items.map((i) => {
    if (i.id !== id) return i;
    const name = changes.name?.trim();
    const grams = changes.grams;
    return {
      ...i,
      name: name ? name.charAt(0).toUpperCase() + name.slice(1) : i.name,
      grams:
        grams == null || !Number.isFinite(grams) ? i.grams : Math.min(MAX_GRAMS, Math.max(0, Math.round(grams / 5) * 5)),
    };
  });
}

/** Tira um alimento que a IA viu por engano. */
export function removeScanItem(items: readonly ScanItem[], id: string): ScanItem[] {
  return items.filter((i) => i.id !== id);
}

/** Converte o prato em alimentos para salvar na refeição. */
export function toFoodItems(items: readonly ScanItem[]): Omit<FoodItem, 'id' | 'createdAt'>[] {
  return items
    .filter((i) => i.grams > 0)
    .map((i) => ({ name: i.name, grams: i.grams, source: 'scanner' as const, ...itemMacros(i) }));
}

/**
 * Resultado de exemplo, usado quando o Supabase ou a chave do Gemini ainda
 * não estão configurados. Valores por 100 g da tabela TACO.
 */
export function sampleScan(): ScanResult {
  return {
    dish: 'Arroz, feijão e alcatra com salada',
    confidence: 0.9,
    items: [
      { id: newId(), name: 'Arroz branco', grams: 120, per100: { kcal: 128, proteinG: 2.5, carbsG: 28.1, fatG: 0.2 } },
      { id: newId(), name: 'Feijão carioca', grams: 100, per100: { kcal: 76, proteinG: 4.8, carbsG: 13.6, fatG: 0.5 } },
      { id: newId(), name: 'Alcatra grelhada', grams: 130, per100: { kcal: 241, proteinG: 31.9, carbsG: 0, fatG: 11.6 } },
      { id: newId(), name: 'Salada de alface e tomate', grams: 60, per100: { kcal: 12, proteinG: 0.9, carbsG: 2.3, fatG: 0.2 } },
    ],
  };
}
