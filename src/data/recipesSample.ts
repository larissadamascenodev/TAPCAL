/**
 * Receitas de exemplo da aba Receitas, só para o visual. As receitas de
 * verdade virão de fontes confiáveis, com calorias pela tabela TACO.
 */
import type { Recipe, RecipeCategory } from '@/types';

export const RECIPE_FILTERS: ('Todas' | RecipeCategory | 'Favoritas')[] = [
  'Todas',
  'Café da manhã',
  'Almoço',
  'Jantar',
  'Lanches',
  'Low carb',
  'Alta proteína',
  'Favoritas',
];

export const FEATURED_RECIPE: Recipe = {
  id: 'r-destaque',
  name: 'Frango grelhado com legumes assados',
  emoji: '🍗',
  tag: 'Alta proteína',
  categories: ['Almoço', 'Jantar', 'Alta proteína'],
  minutes: 25,
  kcal: 380,
  proteinG: 42,
};

export const SAMPLE_RECIPES: Recipe[] = [
  { id: 'r1', name: 'Bowl de açaí proteico', emoji: '🫐', tag: 'Alta proteína', categories: ['Café da manhã', 'Lanches', 'Alta proteína'], minutes: 10, kcal: 320, proteinG: 24 },
  { id: 'r2', name: 'Omelete de espinafre', emoji: '🍳', tag: 'Low carb', categories: ['Café da manhã', 'Jantar', 'Low carb'], minutes: 8, kcal: 220, proteinG: 15 },
  { id: 'r3', name: 'Wrap integral de atum', emoji: '🌯', tag: 'Alta proteína', categories: ['Almoço', 'Lanches', 'Alta proteína'], minutes: 12, kcal: 290, proteinG: 26 },
  { id: 'r4', name: 'Panqueca de banana e aveia', emoji: '🥞', tag: 'Café da manhã', categories: ['Café da manhã', 'Lanches'], minutes: 15, kcal: 250, proteinG: 11 },
  { id: 'r5', name: 'Salada de grão-de-bico', emoji: '🥙', tag: 'Alta proteína', categories: ['Almoço', 'Jantar', 'Alta proteína'], minutes: 10, kcal: 310, proteinG: 16 },
  { id: 'r6', name: 'Sopa de legumes', emoji: '🍲', tag: 'Low carb', categories: ['Jantar', 'Low carb'], minutes: 35, kcal: 150, proteinG: 6 },
  { id: 'r7', name: 'Tapioca com frango', emoji: '🫓', tag: 'Alta proteína', categories: ['Café da manhã', 'Lanches', 'Alta proteína'], minutes: 10, kcal: 280, proteinG: 22 },
  { id: 'r8', name: 'Mix de castanhas e frutas', emoji: '🥜', tag: 'Lanches', categories: ['Lanches'], minutes: 5, kcal: 200, proteinG: 5 },
];
