/**
 * Peças da folha de vidro do resultado do scanner, usadas também na edição de
 * um alimento já registrado, para as duas telas ficarem iguais.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Glass } from '@/components/ui/Glass';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { formatInt } from '@/lib/format';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { Macros } from '@/types';

import { MacroBars } from './MacroBars';

/** Selo no topo da folha (ex.: "IDENTIFICADO ITEM POR ITEM"). */
export function SheetBadge({
  icon,
  label,
  color = colors.lime,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
}) {
  return (
    <View style={styles.badgeRow}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

/** Nome do prato em letras grandes, maiúsculas. */
export function DishTitle({ children }: { children: string }) {
  return <Text style={styles.dish}>{children.toUpperCase()}</Text>;
}

/** Calorias em número grande e, embaixo, as barrinhas dos macros. */
export function PlateSummary({ value, goal }: { value: Macros; goal?: Macros | null }) {
  return (
    <View>
      <Text style={styles.sumLabel}>CALORIAS</Text>
      <View style={styles.kcalLine}>
        <Text style={styles.sumValue}>{formatInt(value.kcal)}</Text>
        <Text style={styles.sumUnit}>KCAL</Text>
      </View>
      <MacroBars value={value} goal={goal} style={styles.barRow} />
    </View>
  );
}

/** Linha de um alimento: nome, kcal, gramas e o lápis; tocar abre a edição. */
export function FoodRow({
  name,
  kcal,
  grams,
  off,
  onPress,
}: {
  name: string;
  kcal: number;
  grams: number;
  /** Porção zerada: fica apagada. */
  off?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Toque para editar o nome e a quantidade"
      onPress={onPress}
      style={({ pressed }) => [styles.row, off && styles.rowOff, pressed && styles.pressed]}>
      <View style={styles.flex}>
        <Text style={styles.rowName}>{name}</Text>
        <Text variant="caption" tone="muted">
          {formatInt(kcal)} kcal
        </Text>
      </View>
      <Text style={styles.rowGrams}>{formatInt(grams)} g</Text>
      <Ionicons name="pencil" size={14} color={colors.ink3} />
    </Pressable>
  );
}

/** Botão verde grande do rodapé da folha (CONTINUAR, SALVAR). */
export function LimeCta({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
      <Text style={styles.ctaText}>{label.toUpperCase()}</Text>
    </Pressable>
  );
}

type ItemEditProps = {
  name: string;
  grams: number;
  onCancel: () => void;
  onSave: (name: string, grams: number) => void;
  /** Sem ele, o botão Remover não aparece. */
  onRemove?: () => void;
};

/** Folha por cima da folha, para corrigir o nome e a quantidade de um alimento. */
export function ItemEditSheet({ name, grams, onCancel, onSave, onRemove }: ItemEditProps) {
  const insets = useSafeAreaInsets();
  const [nameText, setNameText] = useState(name);
  const [gramsText, setGramsText] = useState(String(grams));
  const parsed = Number(gramsText.replace(',', '.'));

  return (
    <View style={styles.editRoot}>
      <Pressable accessibilityLabel="Fechar edição" style={StyleSheet.absoluteFill} onPress={onCancel} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.editWrap}>
        <Glass
          rounded={EDIT_R}
          flush
          style={styles.editCard}
          contentStyle={[styles.editContent, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.grab} />
          <Text variant="heading">Editar alimento</Text>
          <TextField label="Nome" value={nameText} onChangeText={setNameText} autoCapitalize="sentences" returnKeyType="next" />
          <TextField
            label="Quantidade"
            unit="g"
            value={gramsText}
            onChangeText={setGramsText}
            keyboardType="number-pad"
            error={gramsText && !Number.isFinite(parsed) ? 'Use só números' : null}
          />
          <View style={styles.acts}>
            {onRemove && <Button label="Remover" variant="secondary" onPress={onRemove} />}
            <Button
              label="Salvar"
              onPress={() => onSave(nameText, Number.isFinite(parsed) ? parsed : grams)}
              style={styles.flex}
            />
          </View>
        </Glass>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Arredondamento da folha de edição (um pouco menor que o da folha de baixo). */
const EDIT_R = 28;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeText: {
    fontFamily: fonts.body.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
  },
  dish: {
    fontFamily: fonts.display.bold,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.8,
  },
  sumLabel: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 2,
    color: colors.ink3,
  },
  kcalLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  sumValue: {
    marginTop: 2,
    fontFamily: fonts.display.bold,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -2.4,
    fontVariant: ['tabular-nums'],
  },
  sumUnit: {
    fontFamily: fonts.body.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.5,
    color: colors.ink3,
  },
  barRow: {
    marginTop: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowOff: {
    opacity: 0.4,
  },
  rowName: {
    fontFamily: fonts.body.semibold,
    fontSize: 16,
    lineHeight: 21,
    color: colors.ink2,
  },
  rowGrams: {
    fontFamily: fonts.display.semibold,
    fontSize: 16,
    lineHeight: 21,
    fontVariant: ['tabular-nums'],
  },
  cta: {
    height: 58,
    marginTop: spacing.xs,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lime,
  },
  ctaText: {
    fontFamily: fonts.display.bold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 3,
    color: colors.onLime,
  },
  editRoot: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    backgroundColor: colors.photoScrim,
  },
  editWrap: {
    width: '100%',
  },
  // Por cima dos itens: o mesmo vidro, mas com fundo firme para o texto de baixo não aparecer
  editCard: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    backgroundColor: colors.panel,
  },
  editContent: {
    gap: 14,
    paddingTop: 12,
    paddingHorizontal: spacing.lg,
  },
  grab: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.handle,
  },
  acts: {
    flexDirection: 'row',
    gap: 10,
  },
});
