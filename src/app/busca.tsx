import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, ChipGroup, Glass, Sheet, Stepper, Text, TextField, toast } from '@/components/ui';
import { formatDecimal, formatInt } from '@/lib/format';
import { MEAL_OPTIONS, mealByHour, mealShort, parseMeal } from '@/lib/meals';
import { displayName, portion, searchTaco, type TacoFood } from '@/lib/taco';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, macroColors, radius, spacing } from '@/theme/theme';
import type { MealType } from '@/types';

const QUICK_GRAMS = [50, 100, 150, 200];
const STEP = 10;

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
        <Glass contentStyle={styles.portionCard}>
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
            onMinus={() => setGrams((g) => Math.max(0, g - STEP))}
            onPlus={() => setGrams((g) => Math.min(2000, g + STEP))}
          />
          <View style={styles.quick}>
            {QUICK_GRAMS.map((g) => (
              <Pressable
                key={g}
                accessibilityRole="button"
                onPress={() => setGrams(g)}
                style={[styles.quickChip, grams === g && styles.quickOn]}>
                <Text style={[styles.quickText, { color: grams === g ? colors.onInk : colors.ink2 }]}>{g} g</Text>
              </Pressable>
            ))}
          </View>
        </Glass>

        <View style={styles.macros}>
          <MacroChip label="Calorias" value={`${formatInt(macros.kcal)}`} unit="kcal" />
          <MacroChip label="Proteína" value={formatDecimal(macros.proteinG)} unit="g" color={macroColors.proteinG} />
          <MacroChip label="Carbo" value={formatDecimal(macros.carbsG)} unit="g" color={macroColors.carbsG} />
          <MacroChip label="Gordura" value={formatDecimal(macros.fatG)} unit="g" color={macroColors.fatG} />
        </View>

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

function MacroChip({ label, value, unit, color }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <View style={styles.chip}>
      <View style={styles.chipLabel}>
        {color && <View style={[styles.dot, { backgroundColor: color }]} />}
        <Text variant="caption" tone="secondary" style={styles.chipLabelText}>
          {label}
        </Text>
      </View>
      <Text style={styles.chipValue}>
        {value}
        <Text variant="caption" tone="muted">
          {' '}
          {unit}
        </Text>
      </Text>
    </View>
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
  portionCard: {
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
  macros: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: radius.lg - 2,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chipLabelText: {
    fontFamily: fonts.body.semibold,
    fontSize: 11,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chipValue: {
    marginTop: 4,
    fontFamily: fonts.display.semibold,
    fontSize: 16,
  },
  gapTop: {
    marginTop: spacing.xs,
  },
});
