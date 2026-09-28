import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts } from '@/theme/theme';

import { Text } from './Text';

type Props = {
  onMinus: () => void;
  onPlus: () => void;
  /** O que está sendo ajustado, para leitores de tela ("carga", "repetições"). */
  label: string;
  size?: number;
};

function tick() {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
}

/** Par de botões − e + redondos (carga, repetições, gramas). */
export function Stepper({ onMinus, onPlus, label, size = 40 }: Props) {
  const btn = [styles.btn, { width: size, height: size, borderRadius: size / 2 }];
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Diminuir ${label}`}
        hitSlop={4}
        onPress={() => {
          tick();
          onMinus();
        }}
        style={({ pressed }) => [btn, pressed && styles.pressed]}>
        <Text style={[styles.sign, { fontSize: size * 0.5 }]}>−</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Aumentar ${label}`}
        hitSlop={4}
        onPress={() => {
          tick();
          onPlus();
        }}
        style={({ pressed }) => [btn, pressed && styles.pressed]}>
        <Text style={[styles.sign, { fontSize: size * 0.5 }]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFillStrong,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sign: {
    fontFamily: fonts.body.bold,
    lineHeight: undefined,
    marginTop: -2,
  },
  pressed: {
    opacity: 0.6,
  },
});
