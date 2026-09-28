import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { MacroChips } from '@/components/nutrition/MacroChips';
import { PortionCard, PORTION_STEP } from '@/components/nutrition/PortionCard';
import { Button, ChipGroup, confirmDestructive, IconButton, Sheet, Text, TextField, toast } from '@/components/ui';
import { editFood } from '@/lib/foodEdit';
import { formatInt } from '@/lib/format';
import { MEAL_OPTIONS, mealShort, parseMeal, timeOf } from '@/lib/meals';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/theme';
import { MEAL_LABELS, type MealType } from '@/types';

/**
 * Editar um alimento já registrado hoje: nome, porção (os valores acompanham) e
 * refeição. Mesmo formato da tela de adicionar alimento.
 */
export default function EditarAlimentoScreen() {
  const params = useLocalSearchParams<{ refeicao?: string; id?: string }>();
  const from = parseMeal(params.refeicao);
  const found = useAppStore((s) => (from ? s.today.meals[from].find((f) => f.id === params.id) : undefined));
  // Fica com o alimento de quando a tela abriu: depois de salvar (e mudar de
  // refeição) ou apagar, ele some da lista, mas a tela ainda está descendo.
  const [item] = useState(found);
  const updateFood = useAppStore((s) => s.updateFood);
  const removeFood = useAppStore((s) => s.removeFood);

  const [name, setName] = useState(item?.name ?? '');
  const [grams, setGrams] = useState(item?.grams ?? 100);
  const [meal, setMeal] = useState<MealType>(from ?? 'almoco');

  // Alimento não encontrado ao abrir (ex.: o dia virou): volta.
  const missing = !from || !item;
  useEffect(() => {
    if (missing) router.back();
  }, [missing]);
  if (missing) return null;

  const preview = editFood(item, { grams });

  const save = () => {
    updateFood(from, item.id, { name, grams }, meal);
    toast(meal === from ? 'Alimento atualizado' : `Movido para ${MEAL_LABELS[meal].toLowerCase()}`);
    router.back();
  };

  const remove = () =>
    confirmDestructive('Apagar alimento?', `${item.name} · ${formatInt(item.kcal)} kcal`, 'Apagar', () => {
      removeFood(from, item.id);
      toast('Alimento apagado');
      router.back();
    });

  return (
    <Sheet
      title="Editar alimento"
      subtitle={`${MEAL_LABELS[from]} · registrado às ${timeOf(item.createdAt)}`}
      headerRight={<IconButton icon="trash-outline" label="Apagar alimento" onPress={remove} />}
      footer={
        <>
          <Button label="Cancelar" variant="secondary" onPress={() => router.back()} />
          <Button
            label={`Salvar no ${mealShort(meal).toLowerCase()}`}
            onPress={save}
            disabled={grams <= 0}
            style={styles.flex}
          />
        </>
      }>
      <TextField label="Nome" value={name} onChangeText={setName} autoCapitalize="sentences" returnKeyType="done" />

      <PortionCard grams={grams} onChange={setGrams} min={PORTION_STEP} />

      <MacroChips value={preview} />

      <Text variant="label" tone="muted" style={styles.gapTop}>
        Refeição
      </Text>
      <ChipGroup label="Refeição" options={MEAL_OPTIONS} value={meal} onChange={setMeal} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  gapTop: {
    marginTop: spacing.xs,
  },
});
