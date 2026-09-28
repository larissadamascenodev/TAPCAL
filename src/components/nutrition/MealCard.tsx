import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { Glass } from '@/components/ui/Glass';
import { Text } from '@/components/ui/Text';
import { formatInt } from '@/lib/format';
import { sumMacros } from '@/lib/totals';
import { colors, fonts, gradients, radius, spacing } from '@/theme/theme';
import { MEAL_LABELS, type FoodItem, type MealType } from '@/types';

const MEAL_ICON: Record<MealType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  cafe_da_manha: { icon: 'cafe-outline', color: colors.gold },
  almoco: { icon: 'restaurant-outline', color: colors.lime2 },
  lanche: { icon: 'nutrition-outline', color: colors.iris },
  jantar: { icon: 'moon-outline', color: colors.tide },
};

const EMPTY_HINT: Record<MealType, string> = {
  cafe_da_manha: 'Toque no + para buscar o que comeu',
  almoco: 'Toque duas vezes na Início para fotografar o prato',
  lanche: 'Toque no + para buscar o que comeu',
  jantar: 'Toque duas vezes na Início para fotografar o prato',
};

function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

type Props = {
  meal: MealType;
  items: FoodItem[];
  /** Sem estes, o cartão fica só para leitura (dias passados). */
  onAdd?: () => void;
  onPressItem?: (item: FoodItem) => void;
};

export function MealCard({ meal, items, onAdd, onPressItem }: Props) {
  const { icon, color } = MEAL_ICON[meal];
  const kcal = sumMacros(items).kcal;
  const subtitle = items.length
    ? `${hhmm(items[0].createdAt)} · ${items.length} ${items.length === 1 ? 'item' : 'itens'}`
    : 'Ainda sem registro';

  return (
    <Glass flush contentStyle={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={styles.titles}>
          <Text style={styles.title}>{MEAL_LABELS[meal]}</Text>
          <Text variant="caption" tone="secondary">
            {subtitle}
          </Text>
        </View>
        <View style={styles.kcal}>
          <Text style={styles.kcalValue}>{formatInt(kcal)}</Text>
          <Text variant="caption" tone="muted" style={styles.kcalUnit}>
            kcal
          </Text>
        </View>
        {onAdd && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Adicionar ao ${MEAL_LABELS[meal].toLowerCase()}`}
            hitSlop={8}
            onPress={onAdd}
            style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
            <LinearGradient colors={gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <Ionicons name="add" size={20} color={colors.onLime} />
          </Pressable>
        )}
      </View>

      {items.length ? (
        <View style={styles.items}>
          {items.map((it) => (
            <Pressable
              key={it.id}
              disabled={!onPressItem}
              onPress={() => onPressItem?.(it)}
              accessibilityRole={onPressItem ? 'button' : undefined}
              accessibilityHint={onPressItem ? 'Toque para apagar' : undefined}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              <Text tone="secondary" style={styles.itemName} numberOfLines={1}>
                {it.name} · {formatInt(it.grams)} g
              </Text>
              <Text style={styles.itemKcal}>{formatInt(it.kcal)}</Text>
            </Pressable>
          ))}
        </View>
      ) : onAdd ? (
        <Text variant="caption" tone="muted" style={styles.empty}>
          {EMPTY_HINT[meal]}
        </Text>
      ) : null}
    </Glass>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFillStrong,
    borderWidth: 1,
    borderColor: colors.line,
  },
  titles: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.display.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  kcal: {
    alignItems: 'flex-end',
  },
  kcalValue: {
    fontFamily: fonts.display.semibold,
    fontSize: 15,
    lineHeight: 19,
  },
  kcalUnit: {
    fontFamily: fonts.body.semibold,
    fontSize: 11,
    lineHeight: 13,
  },
  add: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  items: {
    marginTop: 10,
    paddingTop: 8,
    paddingLeft: 52,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: colors.track,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  itemKcal: {
    fontFamily: fonts.body.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  empty: {
    paddingTop: 10,
    paddingLeft: 52,
  },
  pressed: {
    opacity: 0.6,
  },
});
