import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, RadialGradient, Stop } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { formatInt } from '@/lib/format';
import { colors, fonts } from '@/theme/theme';

// Geometria do mockup: caixa 340 × 262, centro (170, 170), 44 cápsulas num arco de 240°.
const VB_W = 340;
const VB_H = 262;
const CX = 170;
const CY = 170;
const COUNT = 44;
const R_IN = 120;
const R_OUT = 142;
const HEAD_IN = 113;
const HEAD_OUT = 149;
/** Altura (no desenho) em que a meta fica centralizada. */
const CENTER_Y = 165;

function point(r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) };
}

type Props = {
  eaten: number;
  goal: number;
  width: number;
};

/**
 * Velocímetro da Início: 44 cápsulas que acendem em verde conforme você come,
 * com a meta do dia no centro. Passou da meta: as cápsulas do fim ficam laranja.
 */
export function CalorieGauge({ eaten, goal, width }: Props) {
  const k = width / VB_W;
  const height = VB_H * k;
  const frac = goal > 0 ? Math.min(1, Math.max(0, eaten / goal)) : 0;
  const on = Math.round(frac * COUNT);
  // Quando passa da meta, a partir de qual cápsula começa o excesso.
  const overFrom = eaten > goal && eaten > 0 ? Math.round((goal / eaten) * COUNT) : COUNT;
  const goalSize = Math.round(58 * k);

  const caps = Array.from({ length: COUNT }, (_, i) => {
    const deg = 210 - (i / (COUNT - 1)) * 240;
    const lit = i < on;
    const head = lit && i === on - 1;
    const a = point(head ? HEAD_IN : R_IN, deg);
    const b = point(head ? HEAD_OUT : R_OUT, deg);
    const warm = i >= overFrom;
    const color = !lit ? colors.white : head ? colors.gaugeDot : warm ? colors.warn : colors.lime;
    const opacity = !lit ? 0.09 : head ? 1 : 0.38 + (0.62 * i) / Math.max(1, on - 1);
    return { i, a, b, lit, color, opacity };
  });

  return (
    <View
      style={{ width, height }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Meta do dia ${formatInt(goal)} calorias; ${formatInt(eaten)} consumidas`}>
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <RadialGradient id="gaugeDisc" cx="50%" cy="40%" r="55%">
            <Stop offset="0" stopColor={colors.white} stopOpacity={0.07} />
            <Stop offset="1" stopColor={colors.white} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={CX} cy={CY} r={104} fill="url(#gaugeDisc)" />
        <Circle cx={CX} cy={CY} r={104} fill="none" stroke={colors.white} strokeOpacity={0.06} />
        {/* brilho por baixo das cápsulas acesas */}
        {caps
          .filter((c) => c.lit)
          .map((c) => (
            <Line key={`g${c.i}`} x1={c.a.x} y1={c.a.y} x2={c.b.x} y2={c.b.y} stroke={c.color} strokeOpacity={0.16} strokeWidth={13} strokeLinecap="round" />
          ))}
        {caps.map((c) => (
          <Line key={c.i} x1={c.a.x} y1={c.a.y} x2={c.b.x} y2={c.b.y} stroke={c.color} strokeOpacity={c.opacity} strokeWidth={6.5} strokeLinecap="round" />
        ))}
      </Svg>

      <View pointerEvents="none" style={[styles.center, { height: CENTER_Y * 2 * k }]}>
        <Text style={styles.label}>META DO DIA</Text>
        <Text style={[styles.goal, { fontSize: goalSize, lineHeight: Math.round(goalSize * 1.08) }]}>{formatInt(goal)}</Text>
        <Text style={styles.unit}>kcal</Text>
      </View>

      <View pointerEvents="none" style={[styles.ends, { left: 30 * k, right: 30 * k }]}>
        <Text style={styles.end}>0</Text>
        <Text style={styles.end}>{formatInt(goal)}</Text>
      </View>
    </View>
  );
}

type StatsProps = {
  eaten: number;
  goal: number;
  /** Ajuste do plano: negativo = déficit, positivo = superávit. */
  adjustment: number;
  /** Kcal gastas em treinos hoje (já somadas em `goal`); aparecem numa linha embaixo. */
  burned?: number;
};

/** Os três números embaixo do velocímetro: consumidas, faltam (ou acima) e o déficit do plano. */
export function GaugeStats({ eaten, goal, adjustment, burned = 0 }: StatsProps) {
  const left = goal - eaten;
  const over = left < 0;
  // "do plano": é o ajuste embutido na meta, não o resultado do dia.
  const adjLabel = adjustment < 0 ? 'Déficit do plano' : adjustment > 0 ? 'Superávit do plano' : 'Ajuste do plano';
  const adjValue = adjustment === 0 ? '0' : `${adjustment > 0 ? '+' : '−'}${formatInt(Math.abs(adjustment))}`;
  return (
    <View>
      <View style={styles.stats}>
        <Stat label="Consumidas" value={formatInt(eaten)} />
        <Stat label={over ? 'Acima' : 'Faltam'} value={formatInt(Math.abs(left))} color={over ? colors.warnText : colors.lime} divider />
        <Stat label={adjLabel} value={adjValue} divider />
      </View>
      {burned > 0 && (
        <View style={styles.burned} accessible accessibilityLabel={`Treino de hoje: mais ${formatInt(burned)} calorias no orçamento`}>
          <Ionicons name="flame" size={14} color={colors.lime} />
          <Text variant="caption" tone="secondary" style={styles.burnedText}>
            Treino <Text style={styles.burnedValue}>+{formatInt(burned)} kcal</Text> no orçamento de hoje
          </Text>
        </View>
      )}
    </View>
  );
}

function Stat({ label, value, color, divider }: { label: string; value: string; color?: string; divider?: boolean }) {
  return (
    <View style={[styles.stat, divider && styles.divider]}>
      <Text variant="caption" tone="secondary" style={styles.statLabel}>
        {label}
      </Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.body.bold,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 1.7,
    color: colors.ink2,
  },
  goal: {
    fontFamily: fonts.display.bold,
    letterSpacing: -3,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.ink3,
  },
  ends: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  end: {
    fontFamily: fonts.body.bold,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 0.8,
    color: colors.ink3,
  },
  stats: {
    flexDirection: 'row',
  },
  burned: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  burnedText: {
    fontFamily: fonts.body.semibold,
  },
  burnedValue: {
    fontFamily: fonts.body.bold,
    color: colors.lime,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.divider,
  },
  statLabel: {
    fontFamily: fonts.body.semibold,
  },
  statValue: {
    marginTop: 2,
    fontFamily: fonts.display.semibold,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
});
