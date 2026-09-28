import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Glass } from '@/components/ui/Glass';
import { Text } from '@/components/ui/Text';
import { formatLiters } from '@/lib/format';
import { colors, fonts, gradients } from '@/theme/theme';

/** Um copo = 250 ml; a barrinha de copos mostra até 10. */
const CUP_ML = 250;
const CUPS = 10;

const RISE = {
  transitionProperty: 'height' as const,
  transitionDuration: 700,
  transitionTimingFunction: 'ease-out' as const,
};

type Props = {
  ml: number;
  goalMl: number;
  onAdd: () => void;
};

/** Quadradinho da água: enche como um copo e cada toque no + soma 250 ml. */
export function WaterTile({ ml, goalMl, onAdd }: Props) {
  const pct = goalMl > 0 ? Math.min(1, ml / goalMl) : 0;
  const cups = Math.floor(ml / CUP_ML);
  return (
    <Glass
      flush
      style={styles.tile}
      contentStyle={styles.content}
      underlay={
        <Animated.View pointerEvents="none" style={[styles.liquid, { height: `${Math.max(8, Math.round(pct * 100))}%` }, RISE]}>
          <Svg width="100%" height={10} viewBox="0 0 200 10" preserveAspectRatio="none" style={styles.wave}>
            <Path d="M0 5 Q12.5 0 25 5 T50 5 T75 5 T100 5 T125 5 T150 5 T175 5 T200 5 V10 H0Z" fill={colors.tideTint} />
          </Svg>
          <LinearGradient colors={gradients.water} style={StyleSheet.absoluteFill} />
        </Animated.View>
      }>
      <View style={styles.head}>
        <View style={styles.chip}>
          <Ionicons name="water-outline" size={16} color={colors.tide} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar 250 ml de água"
          hitSlop={6}
          onPress={onAdd}
          style={({ pressed }) => [styles.plus, pressed && styles.pressed]}>
          <Ionicons name="add" size={20} color={colors.ink} />
        </Pressable>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.big}>
          {formatLiters(ml)}
          <Text variant="caption" tone="secondary">
            {' '}L
          </Text>
        </Text>
        <Text variant="caption" tone="secondary" style={styles.sub}>
          de {formatLiters(goalMl)} L · {cups} {cups === 1 ? 'copo' : 'copos'}
        </Text>
        <View style={styles.cups}>
          {Array.from({ length: CUPS }, (_, i) => (
            <View key={i} style={[styles.cup, i < cups && styles.cupOn]} />
          ))}
        </View>
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  liquid: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  wave: {
    position: 'absolute',
    top: -9,
    left: 0,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chip: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFillStrong,
    borderWidth: 1,
    borderColor: colors.line,
  },
  plus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.frostFill,
    borderWidth: 1,
    borderColor: colors.line2,
    borderTopColor: colors.frostEdge,
  },
  bottom: {
    gap: 2,
  },
  big: {
    fontFamily: fonts.display.bold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -1,
  },
  sub: {
    fontSize: 12,
  },
  cups: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 8,
  },
  cup: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
  },
  cupOn: {
    backgroundColor: colors.tide,
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
});
