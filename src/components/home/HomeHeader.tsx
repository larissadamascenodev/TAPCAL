import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, LinearGradient as SvgGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { colors, fonts, gradients, radius, spacing } from '@/theme/theme';

/** Altura do topo, sem contar a área segura. */
export const HOME_HEADER_H = 52 + spacing.lg;
/** Quanto o fundo do topo desce além dele, sumindo aos poucos (sem linha marcada). */
const FADE = 44;

const FADE_IN = {
  transitionProperty: ['opacity', 'transform'] as ('opacity' | 'transform')[],
  transitionDuration: 300,
  transitionTimingFunction: 'ease-out' as const,
};

type Props = {
  name: string;
  streakDays: number;
  /** Rolou a tela: mostra o nome e escurece o fundo do topo. */
  scrolled: boolean;
};

/**
 * Topo fixo da Início: avatar à esquerda, sequência de dias (chama) à direita.
 * Ao rolar, o nome aparece e o fundo ganha um desfoque que some para baixo.
 */
export function HomeHeader({ name, streakDays, scrolled }: Props) {
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

        <Animated.View
          style={[styles.nameWrap, { opacity: scrolled ? 1 : 0, transform: [{ translateY: scrolled ? 0 : 6 }] }, FADE_IN]}>
          <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {name}
          </Text>
        </Animated.View>

        <View
          style={styles.streak}
          accessible
          accessibilityLabel={`${streakDays} ${streakDays === 1 ? 'dia seguido' : 'dias seguidos'} registrando`}>
          {Platform.OS !== 'android' && <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />}
          <Flame />
          <Text style={styles.streakText}>{streakDays}</Text>
        </View>
      </View>
    </View>
  );
}

/** Chama da sequência: brilho quente, camada externa laranja, miolo amarelo e luz clara na base. */
function Flame() {
  const [o0, o1, o2] = gradients.flameOuter;
  const [i0, i1, i2] = gradients.flameInner;
  return (
    <View style={styles.flame}>
      <Svg width={30} height={34} viewBox="-4 -4 30 34">
        <Defs>
          <RadialGradient id="flGlow" cx="50%" cy="60%" r="50%">
            <Stop offset="0" stopColor={o1} stopOpacity={0.55} />
            <Stop offset="1" stopColor={o1} stopOpacity={0} />
          </RadialGradient>
          <SvgGradient id="flOut" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={o0} />
            <Stop offset="0.45" stopColor={o1} />
            <Stop offset="1" stopColor={o2} />
          </SvgGradient>
          <SvgGradient id="flIn" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={i0} />
            <Stop offset="0.6" stopColor={i1} />
            <Stop offset="1" stopColor={i2} />
          </SvgGradient>
          <RadialGradient id="flCore" cx="50%" cy="70%" r="50%">
            <Stop offset="0" stopColor={colors.white} />
            <Stop offset="1" stopColor={i2} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {/* brilho quente em volta da chama */}
        <Ellipse cx={11} cy={16} rx={15} ry={17} fill="url(#flGlow)" />
        <Path
          d="M11 1c1 4 5 6 7 10 2.4 4.6 1.6 9.4-1.6 12.2C14.6 25 12.8 25.6 11 25.6s-3.6-.6-5.4-2.4C2.4 20.4 1.6 16.2 3.4 12.4c.9 2.1 2.2 3.1 3.4 3.3-1-4.6 1.4-9.3 4.2-14.7z"
          fill="url(#flOut)"
        />
        <Path
          d="M11 9.5c.8 2.6 3.4 4 4.4 6.8.9 2.6.2 5-1.6 6.4-.9.7-1.8 1-2.8 1s-1.9-.3-2.8-1c-1.8-1.4-2.4-3.8-1.5-6 .6 1.2 1.4 1.8 2.2 1.9-.4-3 .7-6 2.1-9.1z"
          fill="url(#flIn)"
        />
        <Ellipse cx={11} cy={19.5} rx={3} ry={3.6} fill="url(#flCore)" />
      </Svg>
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
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.avatarFill,
  },
  avatarText: {
    fontFamily: fonts.display.bold,
    fontSize: 20,
    lineHeight: 24,
  },
  nameWrap: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: fonts.display.semibold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.7,
  },
  streak: {
    height: 46,
    minWidth: 46,
    paddingLeft: 12,
    paddingRight: 16,
    borderRadius: radius.pill,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line2,
    borderTopColor: colors.glassHighlight,
  },
  flame: {
    marginVertical: -4,
    marginHorizontal: -4,
  },
  streakText: {
    fontFamily: fonts.display.bold,
    fontSize: 16,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
});
