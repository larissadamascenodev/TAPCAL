import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  size?: number;
  /** Fundo mais escuro, para ficar sobre fotos. */
  dark?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Botão redondo de vidro com ícone (buscar, fechar, histórico…). */
export function IconButton({ icon, label, onPress, size = 42, dark, disabled, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={disabled ? { disabled } : undefined}
      hitSlop={6}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        dark && styles.dark,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <Ionicons name={icon} size={Math.round(size * 0.43)} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dark: {
    backgroundColor: colors.photoScrim,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.3,
  },
});
