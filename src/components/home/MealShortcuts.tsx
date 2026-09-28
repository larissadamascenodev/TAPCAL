import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { FoodVisual } from '@/components/ui/FoodVisual';
import { Glass } from '@/components/ui/Glass';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';
import { formatInt } from '@/lib/format';
import { mealTime } from '@/lib/meals';
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

/** A partir desta fração das calorias indicadas, a refeição conta como feita. */
const DONE_AT = 0.9;

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
        const done = target > 0 && kcal >= target * DONE_AT;
        return (
          <Glass key={meal} flush rounded={24} style={styles.card}>
            <FoodVisual emoji={PLATE[meal]} tone={meal} height={104} scrim>
              <View style={styles.time}>
                <Text style={styles.timeText}>{mealTime(meal, items)}</Text>
              </View>
              {done && (
                <View style={styles.ok}>
                  <Ionicons name="checkmark" size={14} color={colors.onLime} />
                </View>
              )}
              <Text style={styles.name}>{MEAL_LABELS[meal]}</Text>
            </FoodVisual>
            <View style={styles.body}>
              <Text style={styles.kcal}>
                <Text style={styles.kcalBig}>{formatInt(kcal || target)}</Text>
                {kcal ? ` de ${formatInt(target)} kcal` : ' kcal indicadas'}
              </Text>
              <ProgressBar value={target ? kcal / target : 0} color={colors.lime} height={4} />
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
  kcal: {
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
