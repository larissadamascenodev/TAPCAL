import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { colors, fonts, gradients, spacing } from '@/theme/theme';

import { StreakBadge } from './StreakBadge';

/** Altura do topo, sem contar a área segura. */
export const APP_HEADER_H = 50 + spacing.lg;
/** Quanto o fundo do topo desce além dele, sumindo aos poucos (sem linha marcada). */
const FADE = 44;

const FADE_IN = {
  transitionProperty: ['opacity', 'transform'] as ('opacity' | 'transform')[],
  transitionDuration: 420,
  transitionTimingFunction: 'ease-out' as const,
};

type Props = {
  name: string;
  streakDays: number;
  /** Rolou a tela: mostra o nome do perfil e escurece o fundo do topo. */
  scrolled: boolean;
  /** Algo fixo logo abaixo do topo (ex.: as abas da Alimentação). */
  below?: ReactNode;
  /** Altura de `below`, para o fundo do topo cobrir ele também. */
  belowHeight?: number;
  /** No meio do topo (ex.: a pílula do treino em andamento); com ela, o nome não aparece. */
  centro?: ReactNode;
};

/**
 * Topo fixo das abas (Início, Alimentação, Treino, Resultados): avatar à esquerda; chama da sequência e notificações à
 * direita. Assim que a tela começa a rolar, o nome do perfil aparece e o
 * fundo ganha um desfoque que some para baixo.
 */
export function AppHeader({ name, streakDays, scrolled, below, belowHeight = 0, centro }: Props) {
  const insets = useSafeAreaInsets();
  const top = insets.top + spacing.sm;
  const height = top + APP_HEADER_H + belowHeight;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingTop: top }]}>
      <Animated.View pointerEvents="none" style={[styles.backdrop, { height: height + FADE, opacity: scrolled ? 1 : 0 }, FADE_IN]}>
        {Platform.OS !== 'android' && (
          <>
            {/* desfoque em degraus: mais forte em cima, quase nada na borda de baixo */}
            <BlurView intensity={14} tint="dark" style={[styles.layer, { height }]} />
            <BlurView intensity={8} tint="dark" style={[styles.layer, { height: height + FADE * 0.5 }]} />
            <BlurView intensity={4} tint="dark" style={[styles.layer, { height: height + FADE }]} />
          </>
        )}
        <LinearGradient colors={gradients.header} locations={[0, 0.45, 0.75, 1]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <View style={styles.row}>
        <LinearGradient colors={gradients.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        </LinearGradient>

        {centro ? (
          // Treino aberto: a pílula do tempo no lugar do nome, no meio exato do topo (fica por cima, centrada na linha).
          <View style={styles.nameWrap} />
        ) : (
          <Animated.View
            accessibilityElementsHidden={!scrolled}
            style={[styles.nameWrap, { opacity: scrolled ? 1 : 0, transform: [{ translateY: scrolled ? 0 : 6 }] }, FADE_IN]}>
            <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {name}
            </Text>
          </Animated.View>
        )}

        <View style={styles.actions}>
          <StreakBadge days={streakDays} compacto={!!centro} />
          <IconButton
            icon="notifications-outline"
            label="Notificações"
            size={centro ? 36 : 40}
            onPress={() => toast('Em breve as notificações aparecem aqui')}
          />
        </View>

        {centro ? (
          <View pointerEvents="box-none" style={styles.centro}>
            {centro}
          </View>
        ) : null}
      </View>
      {below}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.avatarFill,
  },
  avatarText: {
    fontFamily: fonts.display.bold,
    fontSize: 18,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  centro: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameWrap: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: fonts.display.semibold,
    fontSize: 21,
    lineHeight: 25,
    letterSpacing: -0.6,
  },
});
