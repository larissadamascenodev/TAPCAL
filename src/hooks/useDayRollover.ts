import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAppStore } from '@/store/useAppStore';

/**
 * Zera refeições e água quando o app volta do segundo plano num dia novo
 * (ex.: aberto ontem à noite e retomado hoje de manhã sem ser fechado).
 */
export function useDayRollover() {
  const ensureToday = useAppStore((s) => s.ensureToday);

  useEffect(() => {
    ensureToday();
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') ensureToday();
    });
    return () => sub.remove();
  }, [ensureToday]);
}
