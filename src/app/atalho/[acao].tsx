import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { runShortcut, useHydrated } from '@/hooks/useShortcut';
import { parseShortcut } from '@/lib/shortcuts';
import { colors } from '@/theme/theme';

/**
 * Atalho direto (tapcal://atalho/foto | agua | treino): sem tela, faz a ação
 * e leva para o lugar certo.
 */
export default function AtalhoDiretoScreen() {
  const { acao } = useLocalSearchParams<{ acao?: string }>();
  const ready = useHydrated();

  useEffect(() => {
    if (!ready) return;
    const action = parseShortcut(acao);
    if (action) runShortcut(action);
    else router.replace('/');
  }, [ready, acao]);

  return <View style={{ flex: 1, backgroundColor: colors.ground }} />;
}
