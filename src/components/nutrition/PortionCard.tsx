import { Pressable, StyleSheet, View } from 'react-native';

import { Glass } from '@/components/ui/Glass';
import { Stepper } from '@/components/ui/Stepper';
import { Text } from '@/components/ui/Text';
import { formatInt } from '@/lib/format';
import { colors, fonts, spacing } from '@/theme/theme';

/** Porções prontas embaixo dos botões − e +. */
export const QUICK_GRAMS = [50, 100, 150, 200];
/** Passo dos botões − e +. */
export const PORTION_STEP = 10;
/** Maior porção aceita. */
export const MAX_PORTION = 2000;

type Props = {
  grams: number;
  onChange: (grams: number) => void;
  /** Menor porção que os botões deixam chegar (padrão 0). */
  min?: number;
};

/** Cartão da porção: gramas em número grande, − e +, e as porções prontas. */
export function PortionCard({ grams, onChange, min = 0 }: Props) {
  return (
    <Glass contentStyle={styles.card}>
      <Text variant="label" tone="muted">
        Porção
      </Text>
      <Text style={styles.grams} accessibilityLiveRegion="polite">
        {formatInt(grams)}
        <Text variant="caption" tone="muted">
          {' '}g
        </Text>
      </Text>
      <Stepper
        label="porção"
        size={44}
        onMinus={() => onChange(Math.max(min, grams - PORTION_STEP))}
        onPlus={() => onChange(Math.min(MAX_PORTION, grams + PORTION_STEP))}
      />
      <View style={styles.quick}>
        {QUICK_GRAMS.map((g) => (
          <Pressable
            key={g}
            accessibilityRole="button"
            onPress={() => onChange(g)}
            style={[styles.quickChip, grams === g && styles.quickOn]}>
            <Text style={[styles.quickText, { color: grams === g ? colors.onInk : colors.ink2 }]}>{g} g</Text>
          </Pressable>
        ))}
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  grams: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    fontFamily: fonts.display.bold,
    fontSize: 52,
    lineHeight: 58,
    letterSpacing: -2.2,
    fontVariant: ['tabular-nums'],
  },
  quick: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.lg,
  },
  quickChip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  quickOn: {
    backgroundColor: colors.ink,
    borderColor: 'transparent',
  },
  quickText: {
    fontFamily: fonts.body.semibold,
    fontSize: 12,
  },
});
