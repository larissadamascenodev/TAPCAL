import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { DishTitle, PlateSummary, SheetBadge } from '@/components/nutrition/PlateSheet';
import { PortionCard } from '@/components/nutrition/PortionCard';
import { ChipGroup, GlassModal, IconButton, NeonButton, Text, toast } from '@/components/ui';
import { formatInt } from '@/lib/format';
import { MEAL_OPTIONS, mealByHour, mealShort, parseMeal } from '@/lib/meals';
import { displayName, portion, searchTaco, type TacoFood } from '@/lib/taco';
import { goalPlan } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { MealType } from '@/types';

/** Busca de alimentos na tabela TACO e, escolhido o alimento, a porção em gramas. */
export default function BuscaScreen() {
  const params = useLocalSearchParams<{ refeicao?: string }>();
  const addFood = useAppStore((s) => s.addFood);
  const state = useAppStore();
  const dayGoal = useMemo(() => goalPlan(state, state.today.date)?.macros ?? null, [state]);

  const [query, setQuery] = useState('');
  const [meal, setMeal] = useState<MealType>(parseMeal(params.refeicao) ?? mealByHour());
  const [food, setFood] = useState<TacoFood | null>(null);
  const [grams, setGrams] = useState(100);

  const results = useMemo(() => searchTaco(query), [query]);
  const macros = food ? portion(food, grams) : null;

  const pick = (f: TacoFood) => {
    setFood(f);
    setGrams(100);
  };

  const save = () => {
    if (!food || !macros || grams <= 0) return;
    addFood(meal, { name: displayName(food.name), grams, source: 'taco', ...macros });
    toast(`${formatInt(macros.kcal)} kcal salvas no ${mealShort(meal).toLowerCase()}`);
    router.back();
  };

  const typeIt = () => router.replace({ pathname: '/alimento', params: { refeicao: meal } });

  // ── Porção do alimento escolhido ──────────────────────────────────────────
  if (food && macros) {
    return (
      <GlassModal
        badge={<SheetBadge icon="leaf-outline" label="TABELA TACO" />}
        leading={<IconButton icon="chevron-back" label="Voltar para a busca" size={38} onPress={() => setFood(null)} />}
        onClose={() => router.back()}
        footer={
          <NeonButton label={`Salvar no ${mealShort(meal).toLowerCase()}`} onPress={save} disabled={grams <= 0} />
        }>
        <View>
          <DishTitle>{displayName(food.name)}</DishTitle>
          <Text variant="caption" tone="muted" style={styles.sub}>
            {food.category} · {formatInt(food.kcal)} kcal por 100 g
          </Text>
        </View>
        <ChipGroup label="Refeição" options={MEAL_OPTIONS} value={meal} onChange={setMeal} />
        <PortionCard grams={grams} onChange={setGrams} />
        <PlateSummary value={macros} goal={dayGoal} />
      </GlassModal>
    );
  }

  // ── Busca ─────────────────────────────────────────────────────────────────
  const q = query.trim();
  return (
    <GlassModal
      badge={<SheetBadge icon="search" label="BUSCAR ALIMENTO" />}
      onClose={() => router.back()}
      footer={
        <Pressable accessibilityRole="button" onPress={typeIt} style={({ pressed }) => [styles.manual, pressed && styles.pressed]}>
          <Ionicons name="create-outline" size={17} color={colors.ink} />
          <Text style={styles.manualText}>Não achou? Digitar à mão</Text>
        </Pressable>
      }>
      <DishTitle>O que você comeu?</DishTitle>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.ink3} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Ex.: feijão, frango, banana"
          placeholderTextColor={colors.ink3}
          selectionColor={colors.lime2}
          keyboardAppearance="dark"
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Alimento"
          style={styles.searchInput}
        />
        {query ? <IconButton icon="close" label="Limpar busca" size={28} onPress={() => setQuery('')} /> : null}
      </View>

      {!q ? (
        <Text variant="caption" tone="muted" style={styles.hint}>
          Quase 600 alimentos da tabela TACO, com calorias e macros por 100 g.
        </Text>
      ) : !results.length ? (
        <Text tone="secondary" style={styles.hint}>
          Nada encontrado para “{q}”. Tente outra palavra ou digite à mão.
        </Text>
      ) : null}

      <View>
        {results.map((f) => (
          <Pressable
            key={f.id}
            accessibilityRole="button"
            accessibilityLabel={`${displayName(f.name)}, ${f.kcal} calorias por 100 gramas`}
            onPress={() => pick(f)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <View style={styles.flex}>
              <Text style={styles.rowName}>{displayName(f.name)}</Text>
              <Text variant="caption" tone="muted">
                {f.category}
              </Text>
            </View>
            <Text style={styles.rowKcal}>
              {formatInt(f.kcal)}
              <Text variant="caption" tone="muted">
                {' '}
                kcal
              </Text>
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
          </Pressable>
        ))}
      </View>
    </GlassModal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  sub: {
    marginTop: 4,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 54,
    paddingLeft: 16,
    paddingRight: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.frostCardEdge,
    borderTopColor: colors.frostCardEdgeTop,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    color: colors.ink,
    fontFamily: fonts.body.semibold,
    fontSize: 16,
  },
  hint: {
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowName: {
    fontFamily: fonts.body.semibold,
    fontSize: 15.5,
    lineHeight: 20,
  },
  rowKcal: {
    fontFamily: fonts.display.semibold,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  manual: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.frostCardEdge,
    borderTopColor: colors.frostCardEdgeTop,
  },
  manualText: {
    fontFamily: fonts.body.bold,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.7,
  },
});
