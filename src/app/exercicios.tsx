import { router } from 'expo-router';

import { DishTitle, SheetBadge } from '@/components/nutrition/PlateSheet';
import { GlassModal } from '@/components/ui';
import { ExerciseLibrary } from '@/components/workout/ExerciseLibrary';

/** Biblioteca de exercícios para consultar: busca, mapa do corpo e animação de cada um. */
export default function ExerciciosScreen() {
  return (
    <GlassModal badge={<SheetBadge icon="library-outline" label="BIBLIOTECA" />} onClose={() => router.back()}>
      <DishTitle>Exercícios</DishTitle>
      <ExerciseLibrary />
    </GlassModal>
  );
}
