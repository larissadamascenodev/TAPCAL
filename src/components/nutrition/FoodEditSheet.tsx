import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text as RNText, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { confirmDestructive } from '@/components/ui/confirm';
import { Glass } from '@/components/ui/Glass';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { editFood, MAX_EDIT_GRAMS, parseGrams, type FoodPatch } from '@/lib/foodEdit';
import { foodEmoji } from '@/lib/foodEmoji';
import { formatInt } from '@/lib/format';
import { MEAL_OPTIONS, timeOf } from '@/lib/meals';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { FoodItem, Macros, MealType } from '@/types';

import { MacroBars } from './MacroBars';

export type FoodEditTarget = { meal: MealType; item: FoodItem };

type Props = {
  target: FoodEditTarget | null;
  /** Meta do dia, para as barrinhas dos macros. */
  goal?: Macros | null;
  onClose: () => void;
  onSave: (patch: FoodPatch, toMeal: MealType) => void;
  onRemove: () => void;
};

/** Passo dos botões − e + da porção. */
const STEP = 10;
const useBlur = Platform.OS !== 'android';

/**
 * Mini modal de vidro para corrigir um alimento já registrado: em qual refeição
 * ele fica, nome e porção (as calorias e os macros acompanham).
 */
export function FoodEditSheet({ target, ...rest }: Props) {
  return (
    <Modal transparent visible={!!target} animationType="fade" onRequestClose={rest.onClose} statusBarTranslucent>
      {target && <EditCard key={target.item.id} target={target} {...rest} />}
    </Modal>
  );
}

function EditCard({ target, goal, onClose, onSave, onRemove }: Props & { target: FoodEditTarget }) {
  const insets = useSafeAreaInsets();
  const { item } = target;
  const [name, setName] = useState(item.name);
  const [gramsText, setGramsText] = useState(String(item.grams));
  const [meal, setMeal] = useState<MealType>(target.meal);

  const grams = parseGrams(gramsText);
  const preview = editFood(item, { grams: grams ?? item.grams });
  const step = (delta: number) => {
    const base = grams ?? item.grams;
    setGramsText(String(Math.min(MAX_EDIT_GRAMS, Math.max(STEP, Math.round((base + delta) / STEP) * STEP))));
  };
  const askRemove = () =>
    confirmDestructive('Apagar alimento?', `${item.name} · ${formatInt(item.kcal)} kcal`, 'Apagar', onRemove);

  return (
    <View style={styles.root}>
      {useBlur && <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar edição"
        onPress={onClose}
        style={[StyleSheet.absoluteFill, useBlur ? styles.scrim : styles.scrimSolid]}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
        <Glass
          rounded={radius.xxl}
          style={[styles.card, { marginBottom: insets.bottom + spacing.md }]}
          contentStyle={styles.content}>
          <View style={styles.head}>
            <View style={styles.thumb}>
              <RNText style={styles.emoji}>{foodEmoji(name || item.name)}</RNText>
            </View>
            <View style={styles.headText}>
              <Text style={styles.title}>Editar alimento</Text>
              <Text variant="caption" tone="muted">
                Registrado às {timeOf(item.createdAt)}
              </Text>
            </View>
            <IconButton icon="trash-outline" label="Apagar alimento" size={38} onPress={askRemove} />
            <IconButton icon="close" label="Fechar" size={38} onPress={onClose} />
          </View>

          <View style={styles.block}>
            <Text variant="label" tone="muted">
              Refeição
            </Text>
            <ChipGroup label="Refeição" options={MEAL_OPTIONS} value={meal} onChange={setMeal} />
          </View>

          <View style={styles.nameRow}>
            <TextField label="Nome" value={name} onChangeText={setName} autoCapitalize="sentences" returnKeyType="done" />
          </View>

          <View style={styles.block}>
            <View style={styles.qtyRow}>
              <Text variant="label" tone="muted" style={styles.flex}>
                Quantidade
              </Text>
              <IconButton icon="remove" label="Diminuir porção" size={38} onPress={() => step(-STEP)} />
              <View style={[styles.qtyField, grams == null && styles.qtyFieldError]}>
                <TextInput
                  value={gramsText}
                  onChangeText={setGramsText}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  selectionColor={colors.lime2}
                  keyboardAppearance="dark"
                  accessibilityLabel="Quantidade em gramas"
                  style={styles.qtyInput}
                />
                <Text variant="caption" tone="muted">
                  g
                </Text>
              </View>
              <IconButton icon="add" label="Aumentar porção" size={38} onPress={() => step(STEP)} />
            </View>
            {grams == null && (
              <Text variant="caption" style={styles.error}>
                Use de 1 a {formatInt(MAX_EDIT_GRAMS)} g
              </Text>
            )}
          </View>

          <View style={styles.kcalBlock} accessible accessibilityLabel={`${formatInt(preview.kcal)} calorias nessa porção`}>
            <Text style={styles.kcal}>{formatInt(preview.kcal)}</Text>
            <Text style={styles.kcalUnit}>kcal</Text>
          </View>

          <MacroBars value={preview} goal={goal} />

          <Button
            label="Salvar"
            fullWidth
            disabled={grams == null}
            onPress={() => grams != null && onSave({ name, grams }, meal)}
            style={styles.save}
          />
        </Glass>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    backgroundColor: colors.modalScrim,
  },
  scrimSolid: {
    backgroundColor: colors.modalScrimSolid,
  },
  wrap: {
    width: '100%',
  },
  card: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.modalGlass,
  },
  content: {
    gap: 16,
  },
  flex: {
    flex: 1,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  emoji: {
    fontSize: 23,
    lineHeight: 28,
  },
  headText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.display.semibold,
    fontSize: 19,
    lineHeight: 24,
  },
  block: {
    gap: 8,
  },
  // TextField ocupa o espaço que sobra na linha; aqui a linha é só ele
  nameRow: {
    flexDirection: 'row',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyField: {
    width: 92,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  qtyFieldError: {
    borderColor: colors.limeEdge,
  },
  qtyInput: {
    flex: 1,
    // sem isto, na web o campo não encolhe e o número some para fora da caixa
    minWidth: 0,
    height: '100%',
    textAlign: 'right',
    color: colors.ink,
    fontFamily: fonts.display.semibold,
    fontSize: 17,
    fontVariant: ['tabular-nums'],
  },
  error: {
    alignSelf: 'flex-end',
    color: colors.lime2,
  },
  kcalBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  kcalUnit: {
    fontFamily: fonts.body.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink3,
  },
  kcal: {
    fontFamily: fonts.display.bold,
    fontSize: 52,
    lineHeight: 58,
    letterSpacing: -2.2,
    fontVariant: ['tabular-nums'],
  },
  save: {
    marginTop: 4,
  },
});
