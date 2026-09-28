import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { FoodVisual } from '@/components/ui/FoodVisual';
import { Glass } from '@/components/ui/Glass';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';
import { formatInt } from '@/lib/format';
import { mealProgress, mealTime } from '@/lib/meals';
import { sumMacros } from '@/lib/totals';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import { MEAL_LABELS, MEAL_TYPES, type Meals, type MealType } from '@/types';

/** Prato que ilustra cada refeição. */
const PLATE: Record<MealType, string> = {
  cafe_da_manha: '🥐',
  almoco: '🍛',
  lanche: '🥪',
  jantar: '🥗',
};

type Props = {
  meals: Meals;
  targets: Record<MealType, number>;
  onAdd: (meal: MealType) => void;
  onNew: () => void;
};

/**
 * Atalhos das refeições de hoje na Início: um cartão por refeição com o prato,
 * as calorias comidas contra as indicadas e o botão para registrar.
 */
export function MealShortcuts({ meals, targets, onAdd, onNew }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip} contentContainerStyle={styles.row}>
      {MEAL_TYPES.map((meal) => {
        const items = meals[meal];
        const kcal = sumMacros(items).kcal;
        const target = targets[meal];
        const p = mealProgress(kcal, target);
        return (
          <Glass key={meal} flush rounded={24} style={styles.card}>
            <FoodVisual emoji={PLATE[meal]} tone={meal} height={104} scrim>
              <View style={styles.time}>
                <Text style={styles.timeText}>{mealTime(meal, items)}</Text>
              </View>
              {p.logged && (
                <View style={styles.ok} accessibilityLabel="Refeição registrada">
                  <Ionicons name="checkmark" size={14} color={colors.onLime} />
                </View>
              )}
              <Text style={styles.name}>{MEAL_LABELS[meal]}</Text>
            </FoodVisual>
            <View style={styles.body}>
              <View style={styles.kcalRow}>
                <Text style={styles.kcal}>
                  <Text style={[styles.kcalBig, p.over && styles.kcalOver]}>{formatInt(kcal || target)}</Text>
                  {kcal ? ` de ${formatInt(target)} kcal` : ' kcal indicadas'}
                </Text>
                {p.wayOver && (
                  <Ionicons
                    name="alert-circle"
                    size={16}
                    color={colors.warn}
                    accessibilityLabel={`${formatInt(p.overKcal)} kcal acima do indicado`}
                  />
                )}
              </View>
              <ProgressBar value={p.ratio} color={p.over ? colors.warn : colors.lime} height={4} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${kcal ? 'Adicionar ao' : 'Registrar'} ${MEAL_LABELS[meal].toLowerCase()}`}
                onPress={() => onAdd(meal)}
                style={({ pressed }) => [styles.btn, kcal ? styles.btnSoft : styles.btnLime, pressed && styles.pressed]}>
                <Ionicons name="add" size={16} color={kcal ? colors.ink : colors.lime} />
                <Text style={[styles.btnText, { color: kcal ? colors.ink : colors.lime }]}>{kcal ? 'Adicionar' : 'Registrar'}</Text>
              </Pressable>
            </View>
          </Glass>
        );
      })}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nova refeição"
        onPress={onNew}
        style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
        <View style={styles.addIcon}>
          <Ionicons name="add" size={22} color={colors.ink} />
        </View>
        <Text variant="caption" tone="secondary" style={styles.addText}>
          Nova refeição
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: {
    marginHorizontal: -spacing.lg,
  },
  row: {
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingBottom: 4,
  },
  card: {
    width: 158,
  },
  time: {
    position: 'absolute',
    top: 10,
    left: 10,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    justifyContent: 'center',
    backgroundColor: colors.tagGlass,
    borderWidth: 1,
    borderColor: colors.line,
  },
  timeText: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    lineHeight: 14,
    fontVariant: ['tabular-nums'],
  },
  ok: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lime,
  },
  name: {
    position: 'absolute',
    left: 14,
    bottom: 10,
    fontFamily: fonts.display.semibold,
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  body: {
    padding: 12,
    gap: 9,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  kcal: {
    flexShrink: 1,
    fontFamily: fonts.body.semibold,
    fontSize: 12,
    lineHeight: 22,
    color: colors.ink3,
  },
  kcalBig: {
    fontFamily: fonts.display.bold,
    fontSize: 19,
    letterSpacing: -0.4,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  kcalOver: {
    color: colors.warnText,
  },
  btn: {
    height: 36,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
  },
  btnLime: {
    backgroundColor: colors.limeWash,
    borderColor: colors.limeEdge,
  },
  btnSoft: {
    backgroundColor: colors.glassFill,
    borderColor: colors.line,
  },
  btnText: {
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
    lineHeight: 16,
  },
  add: {
    width: 110,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.dashed,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  addText: {
    fontFamily: fonts.body.bold,
  },
  pressed: {
    opacity: 0.75,
  },
});
