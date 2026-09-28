/**
 * Dicas curtas que aparecem no resumo do dia da Alimentação.
 */

/** Proteína do peito de frango grelhado (TACO): cerca de 32 g a cada 100 g. */
const CHICKEN_PROTEIN_PER_100G = 32;
/** Abaixo disto a dica não aparece: falta pouco demais para valer a sugestão. */
export const MIN_PROTEIN_GAP_G = 10;

export type ProteinTip = {
  /** Quanto de proteína ainda falta hoje, em gramas. */
  missingG: number;
  /** Porção de frango grelhado que cobre essa falta, de 10 em 10 g. */
  chickenG: number;
};

/** Sugere uma porção de frango grelhado para fechar a proteína do dia. */
export function proteinTip(goalG: number, eatenG: number): ProteinTip | null {
  const missingG = Math.round(goalG - eatenG);
  if (missingG < MIN_PROTEIN_GAP_G) return null;
  const chickenG = Math.ceil(((missingG / CHICKEN_PROTEIN_PER_100G) * 100) / 10) * 10;
  return { missingG, chickenG };
}
