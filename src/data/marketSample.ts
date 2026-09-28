/**
 * Lista de compras de exemplo da aba Mercado, como se viesse do plano da
 * semana. A lista de verdade será gerada a partir do plano.
 */
import type { MarketSection } from '@/types';

export const SAMPLE_MARKET: MarketSection[] = [
  { name: 'Hortifrúti', emoji: '🥬', items: [
    { id: 'm1', name: 'Banana prata', quantity: '7 unidades' },
    { id: 'm2', name: 'Mamão papaia', quantity: '2 unidades' },
    { id: 'm3', name: 'Brócolis', quantity: '400 g' },
    { id: 'm4', name: 'Abóbora cabotiá', quantity: '600 g' },
    { id: 'm5', name: 'Alface e rúcula', quantity: '2 maços' },
    { id: 'm6', name: 'Tomate', quantity: '500 g' },
  ] },
  { name: 'Proteínas', emoji: '🍗', items: [
    { id: 'm7', name: 'Peito de frango', quantity: '1,2 kg' },
    { id: 'm8', name: 'Ovos', quantity: '20 unidades' },
    { id: 'm9', name: 'Salmão', quantity: '480 g' },
    { id: 'm10', name: 'Atum em água', quantity: '2 latas' },
  ] },
  { name: 'Laticínios', emoji: '🥛', items: [
    { id: 'm11', name: 'Iogurte natural', quantity: '7 potes' },
    { id: 'm12', name: 'Queijo cottage', quantity: '200 g' },
  ] },
  { name: 'Grãos e cereais', emoji: '🌾', items: [
    { id: 'm13', name: 'Arroz integral', quantity: '1 kg' },
    { id: 'm14', name: 'Feijão carioca', quantity: '1 kg' },
    { id: 'm15', name: 'Aveia em flocos', quantity: '500 g' },
    { id: 'm16', name: 'Pão integral', quantity: '1 pacote' },
  ] },
  { name: 'Despensa', emoji: '🫒', items: [
    { id: 'm17', name: 'Azeite de oliva', quantity: '1 garrafa' },
    { id: 'm18', name: 'Castanha-do-pará', quantity: '100 g' },
  ] },
];

/** Itens que já vêm marcados no exemplo, para a lista não abrir vazia. */
export const SAMPLE_MARKET_CHECKED = ['m1', 'm2', 'm5', 'm7', 'm8', 'm11', 'm15'];
