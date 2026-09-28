/**
 * Cardápio de exemplo da aba Plano. Dois dias que se alternam na semana,
 * montados para ~1.640 kcal. Quando o plano feito pela IA existir, ele
 * substitui este arquivo.
 */
import type { PlanDay } from '@/types';

const DAY_A: PlanDay = [
  { meal: 'cafe_da_manha', foods: [
    { name: 'Ovos mexidos', portion: '2 ovos', kcal: 180 },
    { name: 'Pão integral', portion: '2 fatias', kcal: 140 },
    { name: 'Mamão papaia', portion: '½ unidade', kcal: 90 },
  ] },
  { meal: 'almoco', foods: [
    { name: 'Frango grelhado', portion: '150 g', kcal: 240 },
    { name: 'Arroz integral', portion: '150 g', kcal: 180 },
    { name: 'Feijão carioca', portion: '100 g', kcal: 76 },
    { name: 'Brócolis no vapor', portion: '80 g', kcal: 30 },
    { name: 'Azeite de oliva', portion: '1 colher de chá', kcal: 44 },
  ] },
  { meal: 'lanche', foods: [
    { name: 'Iogurte natural', portion: '170 g', kcal: 104 },
    { name: 'Banana prata', portion: '1 unidade', kcal: 90 },
    { name: 'Aveia em flocos', portion: '20 g', kcal: 56 },
  ] },
  { meal: 'jantar', foods: [
    { name: 'Salmão ao forno', portion: '120 g', kcal: 250 },
    { name: 'Purê de abóbora', portion: '150 g', kcal: 90 },
    { name: 'Salada verde', portion: 'à vontade', kcal: 25 },
    { name: 'Azeite de oliva', portion: '1 colher de chá', kcal: 45 },
  ] },
];

const DAY_B: PlanDay = [
  { meal: 'cafe_da_manha', foods: [
    { name: 'Tapioca com queijo branco', portion: '1 unidade', kcal: 230 },
    { name: 'Café com leite', portion: '200 ml', kcal: 100 },
    { name: 'Morango', portion: '10 unidades', kcal: 40 },
  ] },
  { meal: 'almoco', foods: [
    { name: 'Carne moída magra', portion: '120 g', kcal: 210 },
    { name: 'Arroz branco', portion: '120 g', kcal: 155 },
    { name: 'Feijão preto', portion: '100 g', kcal: 77 },
    { name: 'Abobrinha refogada', portion: '100 g', kcal: 40 },
    { name: 'Salada de tomate', portion: '100 g', kcal: 15 },
  ] },
  { meal: 'lanche', foods: [
    { name: 'Queijo cottage', portion: '100 g', kcal: 100 },
    { name: 'Maçã', portion: '1 unidade', kcal: 70 },
    { name: 'Castanha-do-pará', portion: '2 unidades', kcal: 66 },
  ] },
  { meal: 'jantar', foods: [
    { name: 'Omelete de espinafre', portion: '2 ovos', kcal: 220 },
    { name: 'Pão integral', portion: '1 fatia', kcal: 70 },
    { name: 'Salada verde', portion: 'à vontade', kcal: 25 },
    { name: 'Azeite de oliva', portion: '1 colher de chá', kcal: 45 },
  ] },
];

/** Cardápio de segunda (0) a domingo (6). */
export const SAMPLE_WEEK_PLAN: PlanDay[] = [DAY_A, DAY_B, DAY_A, DAY_B, DAY_A, DAY_B, DAY_A];
