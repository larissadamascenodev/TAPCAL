/**
 * Emoji que representa um alimento pelo nome, para as miniaturas das listas.
 * A busca é por trechos do nome, sem acento; a primeira regra que bater vence.
 */

const RULES: [string[], string][] = [
  [['cafe com leite', 'cafe', 'cha '], '☕'],
  [['pao', 'torrada', 'bisnaguinha'], '🥖'],
  [['tapioca', 'crepioca', 'cuscuz'], '🫓'],
  [['ovo', 'omelete'], '🥚'],
  [['arroz'], '🍚'],
  [['macarrao', 'massa', 'espaguete', 'lasanha'], '🍝'],
  [['feijao', 'lentilha', 'grao-de-bico', 'grao de bico'], '🫘'],
  [['frango', 'peito de frango', 'sobrecoxa'], '🍗'],
  [['carne', 'bife', 'patinho', 'alcatra', 'file mignon', 'hamburguer'], '🥩'],
  [['peixe', 'salmao', 'tilapia', 'atum', 'sardinha'], '🐟'],
  [['camarao'], '🍤'],
  [['salada', 'alface', 'rucula', 'folhas', 'agriao'], '🥗'],
  [['brocolis', 'couve'], '🥦'],
  [['tomate'], '🍅'],
  [['cenoura'], '🥕'],
  [['batata doce', 'batata-doce', 'batata', 'mandioca', 'aipim'], '🥔'],
  [['abobora', 'abobrinha'], '🎃'],
  [['milho'], '🌽'],
  [['iogurte', 'leite', 'kefir'], '🥛'],
  [['queijo', 'requeijao', 'cottage'], '🧀'],
  [['banana'], '🍌'],
  [['maca'], '🍎'],
  [['morango'], '🍓'],
  [['uva'], '🍇'],
  [['laranja', 'tangerina', 'mexerica'], '🍊'],
  [['mamao', 'manga', 'abacaxi', 'melao', 'melancia'], '🍈'],
  [['abacate'], '🥑'],
  [['acai'], '🫐'],
  [['aveia', 'granola', 'cereal'], '🥣'],
  [['castanha', 'amendoim', 'nozes', 'amendoa'], '🥜'],
  [['pizza'], '🍕'],
  [['sopa', 'caldo'], '🍲'],
  [['suco', 'vitamina', 'shake', 'whey'], '🥤'],
  [['chocolate', 'bolo', 'doce', 'brigadeiro'], '🍫'],
];

const DEFAULT = '🍽️';

/** Tira acentos e deixa em minúsculas ("Feijão" → "feijao"). */
function plain(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function foodEmoji(name: string): string {
  const n = ` ${plain(name)} `;
  for (const [keys, emoji] of RULES) {
    if (keys.some((k) => n.includes(k))) return emoji;
  }
  return DEFAULT;
}
