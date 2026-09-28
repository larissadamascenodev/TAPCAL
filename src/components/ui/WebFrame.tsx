import type { ReactNode } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import { colors, radius } from '@/theme/theme';

/** Largura do "celular" quando o app abre num navegador de computador. */
const PHONE_WIDTH = 440;

/**
 * Na versão web (prévia no Vercel), mostra o app numa coluna com largura de
 * celular. No iPhone e no Android não faz nada.
 */
export function WebFrame({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web') return <>{children}</>;
  const framed = width > PHONE_WIDTH + 80;
  return (
    <View style={styles.page}>
      <View style={[styles.phone, framed && styles.framed]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.ground,
  },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: PHONE_WIDTH,
    overflow: 'hidden',
    backgroundColor: colors.ground,
  },
  framed: {
    marginVertical: 24,
    maxHeight: 900,
    borderRadius: radius.xl + 12,
    borderWidth: 10,
    borderColor: colors.panel2,
  },
});
