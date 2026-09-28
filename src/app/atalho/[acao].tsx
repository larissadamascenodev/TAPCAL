import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { toast } from '@/components/ui';
import { formatLiters } from '@/lib/format';
import { parseShortcut, SHORTCUT_WATER_ML } from '@/lib/shortcuts';
import { planForDate } from '@/lib/workout';
import { useAppStore } from '@/store/useAppStore';
import { colors } from '@/theme/theme';

/** Espera o store terminar de carregar do aparelho antes de mexer nos dados. */
function useHydrated() {
  const [ready, setReady] = useState(() => useAppStore.persist.hasHydrated());
  useEffect(() => {
    if (ready) return;
    return useAppStore.persist.onFinishHydration(() => setReady(true));
  }, [ready]);
  return ready;
}

/**
 * Porta de entrada dos atalhos (tapcal://atalho/foto | agua | treino).
 * Não tem tela: faz a ação e leva para o lugar certo.
 */
export default function AtalhoScreen() {
  const { acao } = useLocalSearchParams<{ acao?: string }>();
  const ready = useHydrated();

  useEffect(() => {
    if (!ready) return;
    const action = parseShortcut(acao);
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
    if (action === 'treino') {
      const plan = planForDate(s.workoutPlans, s.today.date);
      if (s.activeSession || plan) {
        if (!s.activeSession && plan) s.startSession(plan.id);
        router.replace('/treino-sessao');
      } else {
        router.replace('/treino');
        toast('Hoje é dia de descanso');
      }
      return;
    }
    router.replace('/');
  }, [ready, acao]);

  return <View style={{ flex: 1, backgroundColor: colors.ground }} />;
}
