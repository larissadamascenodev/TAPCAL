import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { colors, fonts, radius, spacing } from '@/theme/theme';

/** Porções prontas embaixo do seletor. */
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

/**
 * Seletor de porção compacto: uma pílula de vidro com − e + em volta das
 * gramas (dá para tocar e digitar) e as porções prontas embaixo.
 */
export function PortionCard({ grams, onChange, min = 0 }: Props) {
  // Enquanto digita, mostra o texto cru (pode ficar vazio); fora disso, as gramas.
  const [typing, setTyping] = useState<string | null>(null);

  const type = (t: string) => {
    const digits = t.replace(/\D/g, '').slice(0, 4);
    setTyping(digits);
    onChange(Math.min(MAX_PORTION, Number(digits) || 0));
  };

  return (
    <View style={styles.wrap}>
      <Text variant="label" tone="muted">
        Porção
      </Text>
      <View style={styles.pill}>
        <IconButton icon="remove" label="Diminuir porção" size={44} onPress={() => onChange(Math.max(min, grams - PORTION_STEP))} />
        <View style={styles.value}>
          <TextInput
            value={typing ?? String(grams)}
            onChangeText={type}
            onFocus={() => setTyping(String(grams))}
            onBlur={() => setTyping(null)}
            keyboardType="number-pad"
            selectTextOnFocus
            selectionColor={colors.lime2}
            keyboardAppearance="dark"
            accessibilityLabel="Porção em gramas"
            style={styles.input}
          />
          <Text style={styles.unit}>g</Text>
        </View>
        <IconButton icon="add" label="Aumentar porção" size={44} onPress={() => onChange(Math.min(MAX_PORTION, grams + PORTION_STEP))} />
      </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  pill: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.frostCardEdge,
    borderTopColor: colors.frostCardEdgeTop,
  },
  value: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
  },
  input: {
    minWidth: 44,
    maxWidth: 110,
    padding: 0,
    textAlign: 'right',
    color: colors.ink,
    fontFamily: fonts.display.bold,
    fontSize: 28,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    color: colors.ink3,
  },
  quick: {
    flexDirection: 'row',
    gap: 6,
  },
  quickChip: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
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
