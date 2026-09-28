import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DishTitle, PlateSummary, SheetBadge } from '@/components/nutrition/PlateSheet';
import { ChipGroup, GlassModal, NeonButton, Text, TextField, toast } from '@/components/ui';
import { previewFoodForm, validateFoodForm, type FoodFormField, type FoodFormInput } from '@/lib/foodForm';
import { formatInt } from '@/lib/format';
import { goalPlan } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/theme';
import { MEAL_OPTIONS, mealByHour, mealShort, parseMeal } from '@/lib/meals';
import type { MealType } from '@/types';

const EMPTY: FoodFormInput = { name: '', grams: '', kcal: '', proteinG: '', carbsG: '', fatG: '' };

/** Adicionar alimento à mão: nome, porção, calorias e macros, com prévia ao vivo. */
export default function AlimentoScreen() {
  const params = useLocalSearchParams<{ refeicao?: string }>();
  const initial = parseMeal(params.refeicao) ?? mealByHour();

  const addFood = useAppStore((s) => s.addFood);
  const state = useAppStore();
  const dayGoal = useMemo(() => goalPlan(state, state.today.date)?.macros ?? null, [state]);
  const [meal, setMeal] = useState<MealType>(initial);
  const [form, setForm] = useState<FoodFormInput>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FoodFormField, string>>>({});

  const set = (field: FoodFormField) => (text: string) => {
    setForm((f) => ({ ...f, [field]: text }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const save = () => {
    const result = validateFoodForm(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    addFood(meal, result.food);
    toast(`${formatInt(result.food.kcal)} kcal salvas no ${mealShort(meal).toLowerCase()}`);
    router.back();
  };

  return (
    <GlassModal
      badge={<SheetBadge icon="create-outline" label="DIGITAR À MÃO" />}
      onClose={() => router.back()}
      footer={<NeonButton label={`Salvar no ${mealShort(meal).toLowerCase()}`} onPress={save} />}>
      <DishTitle>{form.name.trim() || 'Novo alimento'}</DishTitle>
      <ChipGroup label="Refeição" options={MEAL_OPTIONS} value={meal} onChange={setMeal} />

      <TextField
        label="Alimento"
        placeholder="Ex.: Arroz branco"
        value={form.name}
        onChangeText={set('name')}
        error={errors.name}
        autoFocus
        autoCapitalize="sentences"
        returnKeyType="next"
      />
      <View style={styles.row}>
        <TextField
          containerStyle={styles.cell}
          label="Porção"
          unit="g"
          placeholder="100"
          keyboardType="decimal-pad"
          value={form.grams}
          onChangeText={set('grams')}
          error={errors.grams}
        />
        <TextField
          containerStyle={styles.cell}
          label="Calorias"
          unit="kcal"
          placeholder="130"
          keyboardType="decimal-pad"
          value={form.kcal}
          onChangeText={set('kcal')}
          error={errors.kcal}
        />
      </View>

      <Text variant="caption" tone="muted" style={styles.hint}>
        Macros da porção (opcional)
      </Text>
      <View style={styles.row}>
        <TextField containerStyle={styles.cell} label="Proteína" unit="g" placeholder="0" keyboardType="decimal-pad" value={form.proteinG} onChangeText={set('proteinG')} error={errors.proteinG} />
        <TextField containerStyle={styles.cell} label="Carbo" unit="g" placeholder="0" keyboardType="decimal-pad" value={form.carbsG} onChangeText={set('carbsG')} error={errors.carbsG} />
        <TextField containerStyle={styles.cell} label="Gordura" unit="g" placeholder="0" keyboardType="decimal-pad" value={form.fatG} onChangeText={set('fatG')} error={errors.fatG} />
      </View>

      <View style={styles.preview}>
        <PlateSummary value={previewFoodForm(form)} goal={dayGoal} />
      </View>
    </GlassModal>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  cell: {
    flex: 1,
  },
  hint: {
    marginTop: spacing.xs,
  },
  preview: {
    marginTop: spacing.sm,
  },
});
