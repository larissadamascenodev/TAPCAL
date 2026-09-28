import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { FoodVisual } from '@/components/ui/FoodVisual';
import { Glass } from '@/components/ui/Glass';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';
import { formatInt } from '@/lib/format';
import { mealProgress, mealShort, mealTime } from '@/lib/meals';
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
            <FoodVisual emoji={PLATE[meal]} tone={meal} height={88} plate={64}>
              <View style={styles.time}>
                <Text style={styles.timeText}>{mealTime(meal, items)}</Text>
              </View>
              {p.logged && (
                <View style={[styles.badge, p.wayOver ? styles.badgeWarn : styles.badgeOk]} accessibilityLabel={p.wayOver ? `${formatInt(p.overKcal)} kcal acima do indicado` : 'Refeição registrada'}>
                  <Ionicons name={p.wayOver ? 'alert' : 'checkmark'} size={13} color={p.wayOver ? colors.onInk : colors.onLime} />
                </View>
              )}
            </FoodVisual>
            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {mealShort(meal)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${p.logged ? 'Adicionar ao' : 'Registrar'} ${MEAL_LABELS[meal].toLowerCase()}`}
                  hitSlop={8}
                  onPress={() => onAdd(meal)}
                  style={({ pressed }) => [styles.plus, p.logged ? styles.plusSoft : styles.plusLime, pressed && styles.pressed]}>
                  <Ionicons name="add" size={18} color={p.logged ? colors.ink : colors.onLime} />
                </Pressable>
              </View>
              <Text style={styles.kcal}>
                <Text style={[styles.kcalBig, p.over && styles.kcalOver]}>{formatInt(kcal || target)}</Text>
                {kcal ? ` / ${formatInt(target)} kcal` : ' kcal indicadas'}
              </Text>
              <ProgressBar value={p.ratio} color={p.over ? colors.warn : colors.lime} height={4} />
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
    width: 150,
  },
  time: {
    position: 'absolute',
    top: 8,
    left: 8,
    height: 20,
    paddingHorizontal: 7,
    borderRadius: 10,
    justifyContent: 'center',
    backgroundColor: colors.tagGlass,
  },
  timeText: {
    fontFamily: fonts.body.bold,
    fontSize: 10.5,
    lineHeight: 13,
    fontVariant: ['tabular-nums'],
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOk: {
    backgroundColor: colors.lime,
  },
  badgeWarn: {
    backgroundColor: colors.warn,
  },
  body: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 13,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  name: {
    flex: 1,
    fontFamily: fonts.display.semibold,
    fontSize: 14.5,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  plus: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusLime: {
    backgroundColor: colors.lime,
  },
  plusSoft: {
    backgroundColor: colors.glassFillStrong,
    borderWidth: 1,
    borderColor: colors.line,
  },
  kcal: {
    fontFamily: fonts.body.semibold,
    fontSize: 11.5,
    lineHeight: 20,
    color: colors.ink3,
  },
  kcalBig: {
    fontFamily: fonts.display.bold,
    fontSize: 17,
    letterSpacing: -0.4,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  kcalOver: {
    color: colors.warnText,
  },
  add: {
    width: 104,
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
