import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DishTitle, FoodRow, ItemEditSheet, PlateSummary, SheetBadge } from '@/components/nutrition/PlateSheet';
import { ChipGroup, confirmDestructive, Glass, IconButton, NeonButton, toast } from '@/components/ui';
import { editFood, parseGrams } from '@/lib/foodEdit';
import { formatInt } from '@/lib/format';
import { MEAL_OPTIONS, parseMeal } from '@/lib/meals';
import { goalPlan } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing } from '@/theme/theme';
import { MEAL_LABELS, type MealType } from '@/types';

const useBlur = Platform.OS !== 'android';
/** Arredondamento da folha, igual ao do resultado do scanner. */
const SHEET_R = 32;

/**
 * Editar um alimento já registrado hoje, na mesma folha de vidro do resultado
 * do scanner: refeição, calorias e macros, e o alimento com o lápis para
 * corrigir nome e quantidade.
 */
export default function EditarAlimentoScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ refeicao?: string; id?: string }>();
  const from = parseMeal(params.refeicao);
  const found = useAppStore((s) => (from ? s.today.meals[from].find((f) => f.id === params.id) : undefined));
  // Fica com o alimento de quando a tela abriu: depois de salvar (e mudar de
  // refeição) ou apagar, ele some da lista, mas a tela ainda está fechando.
  const [item] = useState(found);
  const updateFood = useAppStore((s) => s.updateFood);
  const removeFood = useAppStore((s) => s.removeFood);
  const state = useAppStore();
  const dayGoal = useMemo(() => goalPlan(state, state.today.date)?.macros ?? null, [state]);

  const [name, setName] = useState(item?.name ?? '');
  const [grams, setGrams] = useState(item?.grams ?? 100);
  const [meal, setMeal] = useState<MealType>(from ?? 'almoco');
  const [editing, setEditing] = useState(false);

  // Alimento não encontrado ao abrir (ex.: o dia virou): volta.
  const missing = !from || !item;
  useEffect(() => {
    if (missing) router.back();
  }, [missing]);
  if (missing) return null;

  const preview = editFood(item, { name, grams });

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
    <View style={styles.root}>
      {useBlur && <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        onPress={() => router.back()}
        style={[StyleSheet.absoluteFill, useBlur ? styles.scrim : styles.scrimSolid]}
      />

      <Animated.View entering={SlideInDown.duration(280)}>
        <Glass
          rounded={SHEET_R}
          flush
          style={styles.sheet}
          contentStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
          <View style={styles.top}>
            <View style={styles.flex}>
              <SheetBadge icon="create-outline" label="EDITAR ALIMENTO" />
            </View>
            <IconButton icon="trash-outline" label="Apagar alimento" size={38} onPress={remove} />
            <IconButton icon="close" label="Fechar" size={38} onPress={() => router.back()} />
          </View>
          <DishTitle>{preview.name}</DishTitle>
          <ChipGroup label="Refeição" options={MEAL_OPTIONS} value={meal} onChange={setMeal} />

          <PlateSummary value={preview} goal={dayGoal} />

          <View style={styles.list}>
            <FoodRow name={preview.name} kcal={preview.kcal} grams={preview.grams} onPress={() => setEditing(true)} />
          </View>

          <NeonButton label="Salvar" onPress={save} style={styles.cta} />
        </Glass>
      </Animated.View>

      {editing && (
        <ItemEditSheet
          name={name}
          grams={grams}
          onCancel={() => setEditing(false)}
          onSave={(nextName, nextGrams) => {
            if (nextName.trim()) setName(nextName.trim());
            const g = parseGrams(nextGrams);
            if (g != null) setGrams(g);
            setEditing(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cta: {
    marginTop: spacing.xs,
  },
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
  flex: {
    flex: 1,
  },
  // Só os cantos de cima arredondados e sem borda embaixo, como a folha do scanner
  sheet: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    backgroundColor: colors.sheetGlass,
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: spacing.lg,
    gap: 14,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  list: {
    marginTop: spacing.xs,
  },
});
