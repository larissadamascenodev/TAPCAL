import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { fromDateKey } from '@/lib/dates';
import { WEEKDAY_LETTERS } from '@/lib/format';
import { lastSevenDays } from '@/lib/progress';
import { colors, fonts } from '@/theme/theme';
import type { DateKey } from '@/types';

type Props = {
  today: DateKey;
  logged: ReadonlySet<DateKey>;
};

/** Últimos 7 dias: anel verde nos dias com registro, hoje em destaque. */
export function WeekStrip({ today, logged }: Props) {
  return (
    <View style={styles.row} accessibilityLabel="Últimos 7 dias">
      {lastSevenDays(today).map((date) => {
        const isToday = date === today;
        const done = logged.has(date);
        const d = fromDateKey(date);
        return (
          <View
            key={date}
            style={styles.day}
            accessible
            accessibilityLabel={`${d.getDate()}${done ? ', registrado' : ', sem registro'}${isToday ? ', hoje' : ''}`}>
            <Text variant="caption" tone="muted" style={styles.letter}>
              {WEEKDAY_LETTERS[d.getDay()]}
            </Text>
            <View style={[styles.circle, done && styles.done, isToday && styles.today]}>
              <Text style={[styles.num, { color: isToday ? colors.onInk : done ? colors.ink : colors.ink2 }]}>
                {d.getDate()}
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
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  letter: {
    fontFamily: fonts.body.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.dashed,
  },
  done: {
    borderStyle: 'solid',
    borderWidth: 1.5,
    borderColor: colors.lime,
  },
  today: {
    backgroundColor: colors.ink,
    borderWidth: 0,
  },
  num: {
    fontFamily: fonts.display.semibold,
    fontSize: 13,
  },
});
