import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/theme';

/** Bolinha de marcar (plano e lista do mercado). */
export function CheckCircle({ checked, size = 26 }: { checked: boolean; size?: number }) {
  return (
    <View style={[styles.base, { width: size, height: size, borderRadius: size / 2 }, checked && styles.on]}>
      {checked && <Ionicons name="checkmark" size={size * 0.62} color={colors.onLime} />}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.6,
    borderColor: colors.line2,
  },
  on: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
});
