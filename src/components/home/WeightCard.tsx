import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { Glass } from '@/components/ui/Glass';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { addDays, daysBetween } from '@/lib/dates';
import { formatDayMonth, formatDecimal } from '@/lib/format';
import type { WeightTrend } from '@/lib/progress';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { DateKey } from '@/types';

const WINDOW = 30;
const CHART_H = 84;

type Props = {
  trend: WeightTrend;
  today: DateKey;
  targetKg: number;
  weeksToGoal: number | null;
  /** O objetivo é perder peso? Define se a variação é boa (verde) ou não. */
  losing: boolean;
  onAdd: () => void;
};

/** Curva suave passando pelos pontos (Catmull-Rom convertida em Bézier). */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 1) return `M 0 ${pts[0].y} L ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/** Cartão do peso: atual, variação em 30 dias, meta e a curva do mês. */
export function WeightCard({ trend, today, targetKg, weeksToGoal, losing, onAdd }: Props) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const from = addDays(today, -WINDOW);
  const values = trend.points.map((p) => p.weightKg);
  const min = Math.min(...values) - 0.3;
  const max = Math.max(...values) + 0.3;
  const pad = 8;
  const pts = trend.points.map((p) => ({
    x: pad + (Math.max(0, daysBetween(from, p.date)) / WINDOW) * (w - pad * 2),
    y: 10 + (1 - (p.weightKg - min) / (max - min)) * (CHART_H - 20),
  }));
  const line = w ? smoothPath(pts) : '';
  const last = pts[pts.length - 1];
  const area = w && pts.length > 1 ? `${line} L ${last.x} ${CHART_H} L ${pts[0].x} ${CHART_H} Z` : '';

  const delta = trend.deltaKg;
  const good = delta === 0 ? null : losing ? delta < 0 : delta > 0;
  const arrow = delta < 0 ? '↓' : delta > 0 ? '↑' : '=';
  const axis = [addDays(today, -WINDOW), addDays(today, -20), addDays(today, -10)].map((d) =>
    formatDayMonth(d).toUpperCase(),
  );

  return (
    <Glass flush contentStyle={styles.content}>
      <View style={styles.top}>
        <View>
          <Text variant="label" tone="muted">
            Peso
          </Text>
          <Text style={styles.big}>
            {formatDecimal(trend.current)}
            <Text variant="caption" tone="muted">
              {' '}kg
            </Text>
          </Text>
          {trend.points.length > 1 && (
            <View style={[styles.delta, good === false && styles.deltaNeutral]}>
              <Text style={[styles.deltaText, good === false && { color: colors.ink2 }]}>
                {arrow} {formatDecimal(Math.abs(delta))} kg em {Math.max(1, trend.spanDays)} dias
              </Text>
            </View>
          )}
        </View>
        <View style={styles.right}>
          <IconButton icon="add" label="Registrar peso" size={34} onPress={onAdd} />
          <View style={styles.goal}>
            <Text variant="caption" tone="secondary" style={styles.alignRight}>
              Meta
            </Text>
            <Text style={styles.goalValue}>{formatDecimal(targetKg)} kg</Text>
            {weeksToGoal != null && (
              <Text variant="caption" tone="secondary" style={styles.alignRight}>
                em ~{Math.max(1, Math.round(weeksToGoal))} semanas
              </Text>
            )}
          </View>
        </View>
      </View>

      <View onLayout={onLayout} style={styles.chart}>
        {w > 0 && (
          <Svg width={w} height={CHART_H}>
            <Defs>
              <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.ember} stopOpacity={0.35} />
                <Stop offset="1" stopColor={colors.ember} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Line x1={0} y1={28} x2={w} y2={28} stroke={colors.gridLine} />
            <Line x1={0} y1={56} x2={w} y2={56} stroke={colors.gridLine} />
            {area ? <Path d={area} fill="url(#area)" /> : null}
            <Path d={line} stroke={colors.emberLine} strokeWidth={2.5} strokeLinecap="round" fill="none" />
            <Circle cx={last.x} cy={last.y} r={9} fill={colors.ember} opacity={0.25} />
            <Circle cx={last.x} cy={last.y} r={4.5} fill={colors.emberHighlight} />
          </Svg>
        )}
      </View>
      <View style={styles.axis}>
        {axis.map((a) => (
          <Text key={a} style={styles.axisText}>
            {a}
          </Text>
        ))}
        <Text style={styles.axisText}>HOJE</Text>
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  big: {
    fontFamily: fonts.display.semibold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -1,
  },
  delta: {
    alignSelf: 'flex-start',
    height: 26,
    paddingHorizontal: 10,
    marginTop: 6,
    borderRadius: 13,
    justifyContent: 'center',
    backgroundColor: colors.okTint,
  },
  deltaNeutral: {
    backgroundColor: colors.glassFillStrong,
  },
  deltaText: {
    fontFamily: fonts.body.bold,
    fontSize: 12,
    color: colors.ok,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  goal: {
    alignItems: 'flex-end',
    marginTop: spacing.sm,
  },
  alignRight: {
    textAlign: 'right',
  },
  goalValue: {
    fontFamily: fonts.display.semibold,
    fontSize: 16,
    lineHeight: 20,
  },
  chart: {
    height: CHART_H,
    marginTop: 10,
    borderRadius: radius.sm,
  },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingTop: 2,
  },
  axisText: {
    fontFamily: fonts.body.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.ink3,
  },
});
