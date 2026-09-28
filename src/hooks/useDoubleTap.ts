import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { Platform } from 'react-native';

/** Intervalo máximo entre os dois toques. */
export const DOUBLE_TAP_MS = 350;

/**
 * Detecta toque duplo num Pressable: devolve o `onPress`.
 * O primeiro toque chama `onSingle` (ex.: dica "toque mais uma vez").
 */
export function useDoubleTap(onDouble: () => void, onSingle?: () => void) {
  const last = useRef(0);
  return () => {
    const now = Date.now();
    if (now - last.current < DOUBLE_TAP_MS) {
      last.current = 0;
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onDouble();
    } else {
      last.current = now;
      onSingle?.();
    }
  };
}
