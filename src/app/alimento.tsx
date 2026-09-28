import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { PortionCard } from '@/components/nutrition/PortionCard';
import { DishTitle, PlateSummary, SheetBadge } from '@/components/nutrition/PlateSheet';
import { ChipGroup, GlassModal, NeonButton, Text, TextField, toast } from '@/components/ui';
import { formatInt } from '@/lib/format';
import { MEAL_OPTIONS, mealByHour, mealShort, parseMeal } from '@/lib/meals';
import { combineScan } from '@/lib/scan';
import { estimateFood } from '@/lib/scanClient';
import { displayName, portion, searchTaco, type TacoFood } from '@/lib/taco';
import { goalPlan } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { Macros, MealType } from '@/types';

/** De onde vieram os valores: tabela TACO ou estimativa da IA. */
type Source = { from: 'taco' | 'ia'; per100: Macros };

/** Quantas sugestões da tabela aparecem enquanto digita. */
const SUGGESTIONS = 5;

/**
 * Adicionar alimento à mão: a pessoa só digita o nome e a porção. Calorias e
 * macros vêm prontos da tabela TACO ou, se não estiver nela, da IA.
 */
export default function AlimentoScreen() {
  const params = useLocalSearchParams<{ refeicao?: string }>();
  const addFood = useAppStore((s) => s.addFood);
  const state = useAppStore();
  const dayGoal = useMemo(() => goalPlan(state, state.today.date)?.macros ?? null, [state]);

  const [meal, setMeal] = useState<MealType>(parseMeal(params.refeicao) ?? mealByHour());
  const [name, setName] = useState('');
  const [grams, setGrams] = useState(100);
  const [source, setSource] = useState<Source | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estError, setEstError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);

  const q = name.trim();
  const suggestions = useMemo(() => (q.length >= 2 ? searchTaco(q, SUGGESTIONS) : []), [q]);

  const typeName = (text: string) => {
    setName(text);
    // Mudou o nome: os valores antigos não valem mais.
    if (source) setSource(null);
    setEstError(null);
    request.current?.abort();
    setEstimating(false);
  };

  const pick = (f: TacoFood) => {
    setName(displayName(f.name));
    setSource({ from: 'taco', per100: f });
    setGrams(100);
  };

  const estimate = async () => {
    request.current?.abort();
    const ctrl = new AbortController();
    request.current = ctrl;
    setEstimating(true);
    setEstError(null);
    const outcome = await estimateFood(q, undefined, ctrl.signal);
    if (ctrl.signal.aborted || outcome.kind === 'cancelled') return;
    setEstimating(false);
    const food = outcome.kind === 'ok' ? combineScan(outcome.result) : null;
    if (!food) {
      setEstError(outcome.kind === 'error' ? outcome.message : 'Não consegui calcular. Tente escrever de outro jeito.');
      return;
    }
    setName(food.name);
    setSource({ from: 'ia', per100: food.per100 });
    setGrams(food.grams);
  };

  const macros = source ? portion(source.per100, grams) : null;

  const save = () => {
    if (!source || !macros || grams <= 0 || !q) return;
    addFood(meal, { name: q, grams, source: source.from === 'taco' ? 'taco' : 'manual', ...macros });
    toast(`${formatInt(macros.kcal)} kcal salvas no ${mealShort(meal).toLowerCase()}`);
    router.back();
  };

  return (
    <GlassModal
      badge={<SheetBadge icon="create-outline" label="DIGITAR À MÃO" />}
      onClose={() => router.back()}
      footer={
        <NeonButton label={`Salvar no ${mealShort(meal).toLowerCase()}`} onPress={save} disabled={!macros || grams <= 0} />
      }>
      <DishTitle>{q || 'Novo alimento'}</DishTitle>
      <ChipGroup label="Refeição" options={MEAL_OPTIONS} value={meal} onChange={setMeal} />

      <TextField
        label="Alimento"
        placeholder="Ex.: coxinha, pão de queijo"
        value={name}
        onChangeText={typeName}
        autoFocus
        autoCapitalize="sentences"
        returnKeyType="done"
      />

      {source && macros ? (
        <>
          <View style={styles.sourceRow}>
            <Ionicons name={source.from === 'taco' ? 'leaf-outline' : 'sparkles'} size={15} color={colors.lime} />
            <Text variant="caption" tone="secondary" style={styles.flex}>
              {source.from === 'taco' ? 'Tabela TACO' : 'Estimado pela IA'} · {formatInt(source.per100.kcal)} kcal por 100 g
            </Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setSource(null)}>
              <Text variant="caption" style={styles.change}>
                Trocar
              </Text>
            </Pressable>
          </View>
          <PortionCard grams={grams} onChange={setGrams} />
          <PlateSummary value={macros} goal={dayGoal} />
        </>
      ) : q.length < 2 ? (
        <Text variant="caption" tone="muted">
          Digite o nome do alimento. As calorias e os macros vêm prontos da tabela TACO ou são calculados pela IA.
        </Text>
      ) : (
        <View>
          {suggestions.map((f) => (
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

          <Pressable
            accessibilityRole="button"
            disabled={estimating}
            onPress={estimate}
            style={({ pressed }) => [styles.ai, pressed && styles.pressed]}>
            {estimating ? (
              <ActivityIndicator color={colors.lime} />
            ) : (
              <Ionicons name="sparkles" size={18} color={colors.lime} />
            )}
            <View style={styles.flex}>
              <Text style={styles.aiTitle}>{estimating ? 'Calculando…' : `Calcular “${q}” com IA`}</Text>
              <Text variant="caption" tone="muted">
                {suggestions.length ? 'Não é nenhum desses? A IA estima porção, calorias e macros.' : 'Não está na tabela: a IA estima porção, calorias e macros.'}
              </Text>
            </View>
          </Pressable>
          {estError && (
            <Text variant="caption" style={styles.error}>
              {estError}
            </Text>
          )}
        </View>
      )}
    </GlassModal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  change: {
    fontFamily: fonts.body.bold,
    color: colors.lime,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 13,
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
  ai: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: spacing.md,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.limeWash,
    borderWidth: 1,
    borderColor: colors.limeEdge,
  },
  aiTitle: {
    fontFamily: fonts.body.bold,
    fontSize: 14.5,
    lineHeight: 19,
  },
  error: {
    marginTop: spacing.sm,
    color: colors.warnText,
  },
  pressed: {
    opacity: 0.7,
  },
});
