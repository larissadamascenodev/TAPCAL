import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MacroChips } from '@/components/nutrition/MacroChips';
import { PortionCard } from '@/components/nutrition/PortionCard';
import { Button, ChipGroup, Sheet, Text, TextField, toast } from '@/components/ui';
import { formatInt } from '@/lib/format';
import { MEAL_OPTIONS, mealByHour, mealShort, parseMeal } from '@/lib/meals';
import { displayName, portion, searchTaco, type TacoFood } from '@/lib/taco';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme/theme';
import type { MealType } from '@/types';

/** Busca de alimentos na tabela TACO, com porção em gramas. */
export default function BuscaScreen() {
  const params = useLocalSearchParams<{ refeicao?: string }>();
  const addFood = useAppStore((s) => s.addFood);

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

  if (food && macros) {
    return (
      <Sheet
        title={displayName(food.name)}
        subtitle={`${food.category} · ${formatInt(food.kcal)} kcal por 100 g (TACO)`}
        footer={
          <>
            <Button label="Voltar" variant="secondary" onPress={() => setFood(null)} />
            <Button label={`Salvar no ${mealShort(meal).toLowerCase()}`} onPress={save} disabled={grams <= 0} style={styles.flex} />
          </>
        }>
        <PortionCard grams={grams} onChange={setGrams} />

        <MacroChips value={macros} />

        <Text variant="label" tone="muted" style={styles.gapTop}>
          Refeição
        </Text>
        <ChipGroup label="Refeição" options={MEAL_OPTIONS} value={meal} onChange={setMeal} />
      </Sheet>
    );
  }

  return (
    <Sheet
      title="Buscar alimento"
      subtitle="Tabela TACO: quase 600 alimentos brasileiros."
      footer={
        <Button
          label="Não achou? Digitar à mão"
          variant="secondary"
          fullWidth
          onPress={() => router.replace({ pathname: '/alimento', params: { refeicao: meal } })}
        />
      }>
      <TextField
        label="Alimento"
        placeholder="Ex.: feijão, frango, banana"
        value={query}
        onChangeText={setQuery}
        autoFocus
        autoCorrect={false}
        returnKeyType="search"
      />

      {query.trim() && !results.length ? (
        <Text tone="secondary" style={styles.empty}>
          Nada encontrado para “{query.trim()}”. Tente outra palavra ou digite à mão.
        </Text>
      ) : null}

      <View style={styles.list}>
        {results.map((f) => (
          <Pressable
            key={f.id}
            accessibilityRole="button"
            accessibilityLabel={`${displayName(f.name)}, ${f.kcal} calorias por 100 gramas`}
            onPress={() => pick(f)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <View style={styles.flex}>
              <Text variant="bodyStrong" style={styles.rowName}>
                {displayName(f.name)}
              </Text>
              <Text variant="caption" tone="muted">
                {f.category}
              </Text>
            </View>
            <Text variant="caption" tone="secondary">
              {formatInt(f.kcal)} kcal
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg - 2,
    backgroundColor: colors.glassSubtle,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  rowName: {
    fontSize: 14,
    lineHeight: 19,
  },
  empty: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  gapTop: {
    marginTop: spacing.xs,
  },
});
