/**
 * Biblioteca de exercícios: nomes dos músculos e equipamentos, busca com filtro
 * e o endereço das duas fotos (início e fim) que formam a animação.
 */

import { EXERCISES, type CatalogExercise, type EquipmentKey, type MuscleKey } from '@/data/exercises';
import { normalize } from '@/lib/taco';

export const MUSCLE_LABELS: Record<MuscleKey, string> = {
  peito: 'Peito',
  costas: 'Costas',
  ombros: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebraco: 'Antebraço',
  abdomen: 'Abdômen',
  lombar: 'Lombar',
  trapezio: 'Trapézio',
  quadriceps: 'Quadríceps',
  posterior: 'Posterior',
  gluteos: 'Glúteos',
  panturrilha: 'Panturrilha',
  adutores: 'Adutores',
};

/** Ordem dos filtros por músculo. */
export const MUSCLE_ORDER: readonly MuscleKey[] = [
  'peito',
  'costas',
  'ombros',
  'biceps',
  'triceps',
  'quadriceps',
  'posterior',
  'gluteos',
  'panturrilha',
  'abdomen',
  'lombar',
  'trapezio',
  'antebraco',
  'adutores',
];

export const EQUIPMENT_LABELS: Record<EquipmentKey, string> = {
  barra: 'Barra',
  halteres: 'Halteres',
  polia: 'Polia',
  maquina: 'Máquina',
  peso_corporal: 'Peso do corpo',
  barra_w: 'Barra W',
  smith: 'Smith',
};

const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

/** As duas fotos do exercício: posição inicial e final. */
export function exerciseFrames(id: string): [string, string] {
  return [`${IMAGE_BASE}/${id}/0.jpg`, `${IMAGE_BASE}/${id}/1.jpg`];
}

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function exerciseById(id: string): CatalogExercise | undefined {
  return BY_ID.get(id);
}

/**
 * Busca por nome (sem acento, qualquer ordem de palavras) e/ou músculo. Os
 * básicos da academia vêm primeiro.
 */
export function searchExercises(
  { query = '', muscle = null }: { query?: string; muscle?: MuscleKey | null },
  list: readonly CatalogExercise[] = EXERCISES,
): CatalogExercise[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return list
    .filter((e) => !muscle || e.muscle === muscle)
    .filter((e) => {
      if (!words.length) return true;
      const hay = normalize(`${e.name} ${MUSCLE_LABELS[e.muscle]} ${EQUIPMENT_LABELS[e.equipment]}`);
      return words.every((w) => hay.includes(w));
    })
    .sort((a, b) => Number(!!b.staple) - Number(!!a.staple));
}
