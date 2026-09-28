import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, tabBar } from '@/theme/theme';

import { TopGlow } from './TopGlow';

type Props = {
  children: ReactNode;
  /** Mostra o brilho laranja do topo (padrão: sim). */
  glow?: boolean;
  /** Reserva espaço para a barra flutuante (padrão: sim, nas abas). */
  withTabBar?: boolean;
  /** Cor da mancha da direita na aura. */
  glowAccent?: 'ember' | 'iris';
  /** Espaço entre os blocos (padrão: 12). */
  gap?: number;
};

/** Moldura de toda tela: fundo escuro, brilho do topo, área segura e rolagem. */
export function Screen({ children, glow = true, withTabBar = true, glowAccent, gap = spacing.md }: Props) {
  const insets = useSafeAreaInsets();
  const bottomSpace = withTabBar
    ? insets.bottom + tabBar.bottomGap + tabBar.height + spacing.xl
    : insets.bottom + spacing.xl;

  return (
    <View style={styles.root}>
      {glow && <TopGlow accent={glowAccent} />}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: bottomSpace, gap },
        ]}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
});
