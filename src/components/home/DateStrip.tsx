import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { addDays, fromDateKey } from '@/lib/dates';
import { WEEKDAY_SHORT } from '@/lib/format';
import { colors, fonts, spacing } from '@/theme/theme';
import type { DateKey } from '@/types';

import { TodayRing } from './TodayRing';

const ITEM_W = 50;
const GAP = 2;
const RING = 40;

type Props = {
  today: DateKey;
  /** Dias antes de hoje (padrão 3) e depois (padrão 10). */
  past?: number;
  future?: number;
  /** Dia escolhido (Alimentação); sem ele, a faixa é só para ver. */
  selected?: DateKey;
  onSelect?: (date: DateKey) => void;
};

/**
 * Faixa de datas: dia da semana em cima, número embaixo. O dia de hoje tem um
 * anel branco que vai fechando conforme as horas passam.
 */
export function DateStrip({ today, past = 3, future = 10, selected, onSelect }: Props) {
  const scroll = useRef<ScrollView>(null);
  const days = Array.from({ length: past + future + 1 }, (_, i) => addDays(today, i - past));
  // Deixa hoje como o quarto dia visível, com três dias antes dele.
  const startX = Math.max(0, past - 3) * (ITEM_W + GAP);

  return (
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.strip}
      contentContainerStyle={styles.row}
      onLayout={() => scroll.current?.scrollTo({ x: startX, animated: false })}>
      {days.map((date) => {
        const isToday = date === today;
        const isFuture = date > today;
        const isSelected = selected === date && !isToday;
        const d = fromDateKey(date);
        return (
          <Pressable
            key={date}
            disabled={!onSelect || isFuture}
            onPress={() => onSelect?.(date)}
            accessibilityRole={onSelect ? 'button' : undefined}
            accessibilityState={onSelect ? { selected: selected === date, disabled: isFuture } : undefined}
            accessibilityLabel={`${WEEKDAY_SHORT[d.getDay()].toLowerCase()} ${d.getDate()}${isToday ? ', hoje' : ''}`}
            style={[styles.day, isFuture && styles.future]}>
            <Text style={[styles.week, isToday && styles.strong]}>{WEEKDAY_SHORT[d.getDay()]}</Text>
            <View style={[styles.num, isSelected && styles.selected]}>
              {isToday && <TodayRing />}
              <Text style={[styles.numText, isToday && styles.strong, isToday && styles.bold]}>
                {String(d.getDate()).padStart(2, '0')}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: {
    marginHorizontal: -spacing.lg,
  },
  row: {
    gap: GAP,
    paddingHorizontal: 12,
  },
  day: {
    width: ITEM_W,
    alignItems: 'center',
    gap: 7,
    paddingVertical: 4,
  },
  future: {
    opacity: 0.5,
  },
  week: {
    fontFamily: fonts.body.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1,
    color: colors.ink3,
  },
  num: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: colors.glassFillStrong,
  },
  numText: {
    fontFamily: fonts.display.semibold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.ink2,
  },
  strong: {
    color: colors.ink,
  },
  bold: {
    fontFamily: fonts.display.bold,
  },
});
