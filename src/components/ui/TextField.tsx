import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme/theme';

import { Text } from './Text';

type Props = TextInputProps & {
  label: string;
  /** Unidade mostrada à direita (g, kcal). */
  unit?: string;
  error?: string | null;
};

/** Campo de texto no visual de vidro, com rótulo em cima e unidade à direita. */
export function TextField({ label, unit, error, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text variant="label" tone="muted">
        {label}
      </Text>
      <View style={[styles.field, !!error && styles.fieldError]}>
        <TextInput
          placeholderTextColor={colors.ink3}
          selectionColor={colors.ember2}
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
  wrap: {
    flex: 1,
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
    borderColor: colors.emberEdge,
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.ink,
    fontFamily: fonts.body.semibold,
    fontSize: 15,
  },
  error: {
    color: colors.ember2,
  },
});
