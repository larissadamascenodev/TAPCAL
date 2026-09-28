import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme/theme';

import { Text } from './Text';

type Props = TextInputProps & {
  label: string;
  /** Unidade mostrada à direita (g, kcal). */
  unit?: string;
  error?: string | null;
  /** Estilo do bloco todo (rótulo + campo), ex.: flex: 1 para dividir uma linha. */
  containerStyle?: StyleProp<ViewStyle>;
};

/** Campo de texto no visual de vidro, com rótulo em cima e unidade à direita. */
export function TextField({ label, unit, error, style, containerStyle, ...rest }: Props) {
  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text variant="label" tone="muted">
        {label}
      </Text>
      <View style={[styles.field, !!error && styles.fieldError]}>
        <TextInput
          placeholderTextColor={colors.ink3}
          selectionColor={colors.lime2}
          keyboardAppearance="dark"
          style={[styles.input, style]}
          accessibilityLabel={label}
          {...rest}
        />
        {unit ? (
          <Text variant="caption" tone="muted">
            {unit}
          </Text>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Sem flex aqui: dentro de uma coluna rolável, flex: 1 esmagava o campo.
  // Para dividir uma linha, quem usa passa containerStyle={{ flex: 1 }}.
  wrap: {
    gap: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  fieldError: {
    borderColor: colors.limeEdge,
  },
  input: {
    flex: 1,
    // na web o campo tem largura mínima própria e empurrava a unidade para fora
    minWidth: 0,
    height: '100%',
    color: colors.ink,
    fontFamily: fonts.body.semibold,
    fontSize: 15,
  },
  error: {
    color: colors.lime2,
  },
});
