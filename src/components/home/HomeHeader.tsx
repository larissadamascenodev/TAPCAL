import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { greeting } from '@/lib/format';
import { colors, fonts, gradients, spacing } from '@/theme/theme';


/** Altura do topo, sem contar a área segura. */
export const HOME_HEADER_H = 50 + spacing.lg;
/** Quanto o fundo do topo desce além dele, sumindo aos poucos (sem linha marcada). */
const FADE = 44;

const FADE_IN = {
  transitionProperty: ['opacity', 'transform'] as ('opacity' | 'transform')[],
  transitionDuration: 300,
  transitionTimingFunction: 'ease-out' as const,
};

type Props = {
  name: string;
  /** Rolou a tela: escurece o fundo do topo. */
  scrolled: boolean;
};

/**
 * Topo fixo da Início: avatar e saudação. Ao rolar, o fundo ganha um desfoque que some para baixo.
 */
export function HomeHeader({ name, scrolled }: Props) {
  const insets = useSafeAreaInsets();
  const top = insets.top + spacing.sm;
  const height = top + HOME_HEADER_H;

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

        <View style={styles.nameWrap}>
          <Text variant="caption" tone="secondary" style={styles.hello}>
            {greeting()},
          </Text>
          <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {name}
          </Text>
        </View>

      </View>
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
  nameWrap: {
    flex: 1,
    minWidth: 0,
  },
  hello: {
    fontFamily: fonts.body.semibold,
  },
  name: {
    fontFamily: fonts.display.semibold,
    fontSize: 21,
    lineHeight: 25,
    letterSpacing: -0.6,
  },
});
