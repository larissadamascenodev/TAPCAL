/**
 * Números no padrão brasileiro (1.500 · 69,4 · 2,5 L) sem depender do Intl,
 * que varia entre motores de JavaScript.
 */

function groupThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Inteiro com separador de milhar: 2150 → "2.150". */
export function formatInt(n: number): string {
  const r = Math.round(n);
  const sign = r < 0 ? '-' : '';
  return sign + groupThousands(String(Math.abs(r)));
}

/**
 * Número com até `decimals` casas, sem zeros sobrando: 69.40 → "69,4"; 70 → "70".
 */
export function formatDecimal(n: number, decimals = 1): string {
  const fixed = Math.abs(n).toFixed(decimals);
  const [int, frac = ''] = fixed.split('.');
  const trimmed = frac.replace(/0+$/, '');
  const sign = n < 0 && Number(fixed) !== 0 ? '-' : '';
  return sign + groupThousands(int) + (trimmed ? `,${trimmed}` : '');
}

/** Mililitros em litros: 1250 → "1,25"; 2500 → "2,5". */
export function formatLiters(ml: number): string {
  return formatDecimal(ml / 1000, 2);
}

/** Toneladas para volume de treino: 18200 kg → "18,2". */
export function formatTons(kg: number): string {
  return formatDecimal(kg / 1000, 1);
}

/** Duração em m:ss ou h:mm:ss. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const WEEKDAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
/** Dia da semana abreviado, de domingo a sábado. */
export const WEEKDAY_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

/** 'AAAA-MM-DD' → "28 set". */
export function formatDayMonth(key: string): string {
  const [, m, d] = key.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/** Saudação pela hora do dia. */
export function greeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Boa noite';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}
