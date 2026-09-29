import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { toast } from '@/components/ui';
import { formatLiters } from '@/lib/format';
import { SHORTCUT_WATER_ML, type ShortcutAction } from '@/lib/shortcuts';
import { workoutToday } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';

/** Espera o store terminar de carregar do aparelho antes de mexer nos dados. */
export function useHydrated() {
  const [ready, setReady] = useState(() => useAppStore.persist.hasHydrated());
  useEffect(() => {
    if (ready) return;
    return useAppStore.persist.onFinishHydration(() => setReady(true));
  }, [ready]);
  return ready;
}

/**
 * Faz a ação de um atalho e leva para o lugar certo. Usa `replace` porque o
 * atalho pode ter aberto o app direto nesta tela, sem nada atrás.
 */
export function runShortcut(action: ShortcutAction) {
  const s = useAppStore.getState();
  if (action === 'foto') {
    router.replace('/scanner');
    return;
  }
  if (action === 'agua') {
    s.addWater(SHORTCUT_WATER_ML);
    router.replace('/');
    toast(`+250 ml · ${formatLiters(useAppStore.getState().today.waterMl)} L hoje`);
    return;
  }
  const treino = workoutToday(s, s.today.date);
  if (s.sessaoAtiva || treino) {
    if (!s.sessaoAtiva && treino) s.comecarTreino(treino.id);
    router.replace('/treino-sessao');
  } else {
    router.replace('/treino');
    toast('Hoje é dia de descanso');
  }
}
