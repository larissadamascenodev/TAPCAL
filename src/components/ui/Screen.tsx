import type { ReactNode, RefObject } from 'react';
import { ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, tabBar } from '@/theme/theme';

import { BackdropGlow } from './BackdropGlow';

type Props = {
  children: ReactNode;
  /** Reserva espaço para a barra flutuante (padrão: sim, nas abas). */
  withTabBar?: boolean;
  /** Espaço entre os blocos (padrão: 12). */
  gap?: number;
  /** Força do verde de fundo (1 = normal). */
  brilho?: number;
  /** Camada fixa por cima da rolagem (ex.: o topo da Início). */
  overlay?: ReactNode;
  /** Espaço extra no topo, para o conteúdo começar abaixo da camada fixa. */
  topOffset?: number;
  /** Posição da rolagem, em pontos a partir do topo. */
  onScrollY?: (y: number) => void;
  /** Para a tela poder voltar a rolagem ao topo (ex.: ao trocar de aba). */
  scrollRef?: RefObject<ScrollView | null>;
};

/** Moldura de toda tela: fundo escuro com o verde suave, área segura e rolagem. */
export function Screen({ children, withTabBar = true, gap = spacing.md, brilho, overlay, topOffset = 0, onScrollY, scrollRef }: Props) {
  const insets = useSafeAreaInsets();
  const bottomSpace = withTabBar
    ? insets.bottom + tabBar.bottomGap + tabBar.height + spacing.xl
    : insets.bottom + spacing.xl;

  const onScroll = onScrollY
    ? (e: NativeSyntheticEvent<NativeScrollEvent>) => onScrollY(e.nativeEvent.contentOffset.y)
    : undefined;

  return (
    <View style={styles.root}>
      <BackdropGlow forca={brilho} />
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={onScroll ? 32 : undefined}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm + topOffset, paddingBottom: bottomSpace, gap },
        ]}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {overlay}
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
