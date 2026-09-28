import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text as RNText, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { foodEmoji } from '@/lib/foodEmoji';
import { formatInt } from '@/lib/format';
import { mealTime } from '@/lib/meals';
import { sumMacros } from '@/lib/totals';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import { MEAL_LABELS, MEAL_TYPES, type FoodItem, type Meals, type MealType } from '@/types';

import { TimelineNode } from './TimelineNode';

/** Ícone da refeição que ainda não foi registrada. */
const MEAL_EMOJI: Record<MealType, string> = {
  cafe_da_manha: '☕',
  almoco: '🍽️',
  lanche: '🍌',
  jantar: '🌙',
};

type Props = {
  meals: Meals;
  targets: Record<MealType, number>;
  /** Sem estes, a linha do tempo fica só para leitura (dias passados). */
  onAdd?: (meal: MealType) => void;
  onPressItem?: (meal: MealType, item: FoodItem) => void;
};

/** O dia em linha do tempo: cada refeição no seu horário, com os alimentos embaixo. */
export function MealTimeline({ meals, targets, onAdd, onPressItem }: Props) {
  return (
    <View>
      {MEAL_TYPES.map((meal, i) => {
        const items = meals[meal];
        const totals = sumMacros(items);
        const empty = items.length === 0;
        return (
          <TimelineNode key={meal} time={mealTime(meal, items)} done={!empty} last={i === MEAL_TYPES.length - 1}>
            <View style={styles.head}>
              <Text style={styles.title}>{MEAL_LABELS[meal]}</Text>
              {empty ? (
                <Text style={[styles.kcal, styles.muted]}>
                  {formatInt(targets[meal])}
                  <Text style={styles.unit}> kcal sugeridas</Text>
                </Text>
              ) : (
                <Text style={styles.kcal}>
                  {formatInt(totals.kcal)}
                  <Text style={styles.unit}> kcal</Text>
                </Text>
              )}
            </View>

            {empty ? (
              onAdd ? (
                <View style={styles.pending}>
                  <View style={[styles.thumb, styles.thumbLg]}>
                    <RNText style={styles.emojiLg}>{MEAL_EMOJI[meal]}</RNText>
                  </View>
                  <View style={styles.pendingText}>
                    <Text style={styles.pendingTitle}>Ainda não registrado</Text>
                    <Text variant="caption" tone="secondary">
                      Foto ou busca
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Registrar ${MEAL_LABELS[meal].toLowerCase()}`}
                    onPress={() => onAdd(meal)}
                    style={({ pressed }) => [styles.go, pressed && styles.pressed]}>
                    <Text style={styles.goText}>Registrar</Text>
                  </Pressable>
                </View>
              ) : (
                <Text variant="caption" tone="muted" style={styles.sub}>
                  Nada registrado
                </Text>
              )
            ) : (
              <>
                <View style={styles.sub}>
                  <Text variant="caption" tone="muted" style={styles.subText}>
                    {items.length} {items.length === 1 ? 'item' : 'itens'}
                  </Text>
                  <Text style={[styles.mac, { color: colors.lime }]}>P{formatInt(totals.proteinG)}</Text>
                  <Text style={[styles.mac, { color: colors.mint }]}>C{formatInt(totals.carbsG)}</Text>
                  <Text style={[styles.mac, { color: colors.iris }]}>G{formatInt(totals.fatG)}</Text>
                </View>
                {items.map((it) => (
                  <Pressable
                    key={it.id}
                    disabled={!onPressItem}
                    onPress={() => onPressItem?.(meal, it)}
                    accessibilityRole={onPressItem ? 'button' : undefined}
                    accessibilityHint={onPressItem ? 'Toque para editar' : undefined}
                    style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
                    <View style={styles.thumb}>
                      <RNText style={styles.emoji}>{foodEmoji(it.name)}</RNText>
                    </View>
                    <View style={styles.itemText}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {it.name}
                      </Text>
                      <Text variant="caption" tone="muted" style={styles.itemPortion}>
                        {formatInt(it.grams)} g
                      </Text>
                    </View>
                    <Text style={styles.itemKcal}>{formatInt(it.kcal)}</Text>
                  </Pressable>
                ))}
                {onAdd && (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onAdd(meal)}
                    hitSlop={6}
                    style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
                    <Ionicons name="add" size={16} color={colors.ink2} />
                    <Text variant="caption" tone="secondary" style={styles.addText}>
                      Adicionar alimento
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </TimelineNode>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.display.semibold,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  kcal: {
    fontFamily: fonts.display.semibold,
    fontSize: 15,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
  muted: {
    color: colors.ink3,
  },
  unit: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    color: colors.ink3,
  },
  sub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  subText: {
    fontFamily: fonts.body.bold,
    fontSize: 12,
  },
  mac: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    lineHeight: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 12,
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  thumbLg: {
    width: 40,
    height: 40,
  },
  emoji: {
    fontSize: 19,
    lineHeight: 24,
  },
  emojiLg: {
    fontSize: 22,
    lineHeight: 28,
  },
  itemText: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    lineHeight: 18,
  },
  itemPortion: {
    fontFamily: fonts.body.bold,
    fontSize: 11.5,
    lineHeight: 15,
  },
  itemKcal: {
    fontFamily: fonts.display.semibold,
    fontSize: 14,
    color: colors.ink2,
    fontVariant: ['tabular-nums'],
  },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  addText: {
    fontFamily: fonts.body.bold,
  },
  pending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.limeEdge,
    backgroundColor: colors.limeWash,
  },
  pendingText: {
    flex: 1,
    minWidth: 0,
  },
  pendingTitle: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    lineHeight: 18,
  },
  go: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    justifyContent: 'center',
    backgroundColor: colors.lime,
  },
  goText: {
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.onLime,
  },
  pressed: {
    opacity: 0.7,
  },
});
