import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text as RNText, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { Glass } from '@/components/ui/Glass';
import { IconButton } from '@/components/ui/IconButton';
import { Stepper } from '@/components/ui/Stepper';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { editFood, MAX_EDIT_GRAMS, parseGrams, type FoodPatch } from '@/lib/foodEdit';
import { foodEmoji } from '@/lib/foodEmoji';
import { formatInt } from '@/lib/format';
import { MEAL_OPTIONS, timeOf } from '@/lib/meals';
import { colors, fonts, macroColors, radius, spacing } from '@/theme/theme';
import type { FoodItem, MealType } from '@/types';

export type FoodEditTarget = { meal: MealType; item: FoodItem };

type Props = {
  target: FoodEditTarget | null;
  onClose: () => void;
  onSave: (patch: FoodPatch, toMeal: MealType) => void;
  onRemove: () => void;
};

/** Passo dos botões − e + da porção. */
const STEP = 10;
const useBlur = Platform.OS !== 'android';

/**
 * Mini modal de vidro para corrigir um alimento já registrado: nome, porção
 * (os valores acompanham) e em qual refeição ele fica.
 */
export function FoodEditSheet({ target, onClose, onSave, onRemove }: Props) {
  return (
    <Modal transparent visible={!!target} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {target && <EditCard key={target.item.id} target={target} onClose={onClose} onSave={onSave} onRemove={onRemove} />}
    </Modal>
  );
}

function EditCard({ target, onClose, onSave, onRemove }: Props & { target: FoodEditTarget }) {
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
            <IconButton icon="close" label="Fechar" size={38} onPress={onClose} />
          </View>

          <TextField label="Nome" value={name} onChangeText={setName} autoCapitalize="sentences" returnKeyType="done" />

          <View style={styles.portion}>
            <View style={styles.flex}>
              <TextField
                label="Quantidade"
                unit="g"
                value={gramsText}
                onChangeText={setGramsText}
                keyboardType="number-pad"
                error={grams == null ? `De 1 a ${formatInt(MAX_EDIT_GRAMS)} g` : null}
              />
            </View>
            <View style={styles.stepper}>
              <Stepper label="porção" size={42} onMinus={() => step(-STEP)} onPlus={() => step(STEP)} />
            </View>
          </View>

          <View style={styles.preview} accessible accessibilityLabel={`${formatInt(preview.kcal)} calorias nessa porção`}>
            <Text style={styles.previewKcal}>
              {formatInt(preview.kcal)}
              <Text style={styles.previewUnit}> kcal</Text>
            </Text>
            <View style={styles.previewMacros}>
              <Text style={[styles.previewMac, { color: macroColors.proteinG }]}>P {formatInt(preview.proteinG)} g</Text>
              <Text style={[styles.previewMac, { color: macroColors.carbsG }]}>C {formatInt(preview.carbsG)} g</Text>
              <Text style={[styles.previewMac, { color: macroColors.fatG }]}>G {formatInt(preview.fatG)} g</Text>
            </View>
          </View>

          <View style={styles.mealBlock}>
            <Text variant="label" tone="muted">
              Refeição
            </Text>
            <ChipGroup label="Refeição" options={MEAL_OPTIONS} value={meal} onChange={setMeal} />
          </View>

          <View style={styles.acts}>
            <Button label="Remover" variant="secondary" onPress={onRemove} />
            <Button
              label="Salvar"
              disabled={grams == null}
              onPress={() => grams != null && onSave({ name, grams }, meal)}
              style={styles.flex}
            />
          </View>
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
    gap: 14,
  },
  flex: {
    flex: 1,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  portion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepper: {
    // alinha os botões com a caixa do campo (abaixo do rótulo)
    marginTop: 22,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  previewKcal: {
    fontFamily: fonts.display.bold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  previewUnit: {
    fontFamily: fonts.body.bold,
    fontSize: 13,
    letterSpacing: 0,
    color: colors.ink3,
  },
  previewMacros: {
    flexDirection: 'row',
    gap: 10,
  },
  previewMac: {
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
  mealBlock: {
    gap: 8,
  },
  acts: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
});
