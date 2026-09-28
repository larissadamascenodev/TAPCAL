import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { exerciseFrames } from '@/lib/exercises';
import { colors } from '@/theme/theme';

/** A segunda foto aparece e some: início ↔ fim do movimento, em loop. */
const PULSE = {
  animationName: {
    '0%': { opacity: 0 },
    '40%': { opacity: 0 },
    '55%': { opacity: 1 },
    '95%': { opacity: 1 },
    '100%': { opacity: 0 },
  },
  animationDuration: 1800,
  animationIterationCount: 'infinite' as const,
  animationTimingFunction: 'ease-in-out' as const,
};

type Props = {
  /** Id do exercício na biblioteca. */
  id: string;
  style?: StyleProp<ViewStyle>;
  /** Sem animação (ex.: miniaturas numa lista longa). */
  still?: boolean;
};

/** Demonstração do exercício: as duas fotos (início e fim) alternando. */
export function ExerciseAnim({ id, style, still }: Props) {
  const reduce = useReducedMotion();
  const [a, b] = exerciseFrames(id);
  return (
    <View style={[styles.box, style]} accessible accessibilityRole="image" accessibilityLabel="Demonstração do exercício">
      <Image source={{ uri: a }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {!still && !reduce && (
        <Animated.Image source={{ uri: b }} style={[StyleSheet.absoluteFill, PULSE]} resizeMode="cover" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
});
