import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { fromDateKey } from '@/lib/dates';
import { WEEKDAY_LETTERS } from '@/lib/format';
import { planForDate, shortFocus, weekOf } from '@/lib/workout';
import { colors, fonts, radius } from '@/theme/theme';
import type { DateKey, WorkoutPlan, WorkoutSession } from '@/types';

type Props = {
  today: DateKey;
  plans: WorkoutPlan[];
  sessions: WorkoutSession[];
};

/** Divisão da semana (segunda a domingo): o treino de cada dia, feitos e descanso. */
export function WeekSplit({ today, plans, sessions }: Props) {
  const doneDates = new Set(sessions.map((s) => s.date));
  return (
    <View style={styles.row} accessibilityLabel="Divisão da semana">
      {weekOf(today).map((date) => {
        const plan = planForDate(plans, date);
        const isToday = date === today;
        const done = doneDates.has(date);
        const letter = WEEKDAY_LETTERS[fromDateKey(date).getDay()];
        const label = plan ? shortFocus(plan) : 'Off';
        return (
          <View
            key={date}
            style={styles.day}
            accessible
            accessibilityLabel={`${letter}: ${plan ? plan.focus : 'descanso'}${done ? ', feito' : ''}${isToday ? ', hoje' : ''}`}>
            <Text variant="caption" tone="muted" style={styles.letter}>
              {letter}
            </Text>
            <View
              style={[
                styles.chip,
                !plan && styles.rest,
                done && styles.done,
                isToday && styles.today,
              ]}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[styles.chipText, { color: isToday ? colors.onInk : done ? colors.ink : colors.ink2 }]}>
                {label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  letter: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  chip: {
    width: '100%',
    maxWidth: 44,
    height: 48,
    borderRadius: radius.lg - 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rest: {
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  done: {
    borderColor: colors.limeEdge,
  },
  today: {
    backgroundColor: colors.ink,
    borderColor: 'transparent',
  },
  chipText: {
    fontFamily: fonts.display.semibold,
    fontSize: 10,
  },
});
