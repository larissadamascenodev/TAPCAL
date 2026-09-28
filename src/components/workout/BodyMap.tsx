import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import type { MuscleKey } from '@/data/exercises';
import { MUSCLE_LABELS } from '@/lib/exercises';
import { colors, fonts, radius } from '@/theme/theme';

type Side = 'frente' | 'costas';

/** Cada região do boneco: forma em SVG (caixa 120 × 240) e o músculo que ela filtra. */
type Region = { muscle: MuscleKey; d?: string; rect?: [number, number, number, number, number]; circle?: [number, number, number] };

const FRONT: Region[] = [
  { muscle: 'ombros', circle: [36, 58, 9] },
  { muscle: 'ombros', circle: [84, 58, 9] },
  { muscle: 'peito', d: 'M44 54 Q60 50 59 56 L59 76 Q50 80 42 74 Q40 62 44 54 Z' },
  { muscle: 'peito', d: 'M76 54 Q60 50 61 56 L61 76 Q70 80 78 74 Q80 62 76 54 Z' },
  { muscle: 'biceps', rect: [24, 68, 11, 26, 5.5] },
  { muscle: 'biceps', rect: [85, 68, 11, 26, 5.5] },
  { muscle: 'antebraco', rect: [20, 97, 10, 30, 5] },
  { muscle: 'antebraco', rect: [90, 97, 10, 30, 5] },
  { muscle: 'abdomen', rect: [48, 80, 24, 40, 6] },
  { muscle: 'adutores', d: 'M56 124 L64 124 L62 150 L58 150 Z' },
  { muscle: 'quadriceps', rect: [40, 126, 16, 50, 8] },
  { muscle: 'quadriceps', rect: [64, 126, 16, 50, 8] },
  { muscle: 'panturrilha', rect: [42, 184, 12, 40, 6] },
  { muscle: 'panturrilha', rect: [66, 184, 12, 40, 6] },
];

const BACK: Region[] = [
  { muscle: 'trapezio', d: 'M46 50 Q60 40 74 50 L68 62 L52 62 Z' },
  { muscle: 'ombros', circle: [36, 58, 9] },
  { muscle: 'ombros', circle: [84, 58, 9] },
  { muscle: 'costas', d: 'M44 64 L58 64 L58 96 Q48 92 42 80 Z' },
  { muscle: 'costas', d: 'M76 64 L62 64 L62 96 Q72 92 78 80 Z' },
  { muscle: 'triceps', rect: [24, 68, 11, 26, 5.5] },
  { muscle: 'triceps', rect: [85, 68, 11, 26, 5.5] },
  { muscle: 'antebraco', rect: [20, 97, 10, 30, 5] },
  { muscle: 'antebraco', rect: [90, 97, 10, 30, 5] },
  { muscle: 'lombar', rect: [50, 98, 20, 20, 5] },
  { muscle: 'gluteos', rect: [42, 120, 36, 22, 10] },
  { muscle: 'posterior', rect: [40, 144, 16, 34, 8] },
  { muscle: 'posterior', rect: [64, 144, 16, 34, 8] },
  { muscle: 'panturrilha', rect: [42, 184, 12, 40, 6] },
  { muscle: 'panturrilha', rect: [66, 184, 12, 40, 6] },
];

type Props = {
  selected: MuscleKey | null;
  onSelect: (muscle: MuscleKey | null) => void;
};

/** Boneco de frente e de costas: tocar num músculo filtra os exercícios dele. */
export function BodyMap({ selected, onSelect }: Props) {
  const [side, setSide] = useState<Side>('frente');
  const regions = side === 'frente' ? FRONT : BACK;
  const tap = (m: MuscleKey) => onSelect(selected === m ? null : m);

  return (
    <View style={styles.wrap}>
      <View style={styles.toggle}>
        {(['frente', 'costas'] as const).map((s) => (
          <Pressable
            key={s}
            accessibilityRole="button"
            accessibilityState={{ selected: side === s }}
            onPress={() => setSide(s)}
            style={[styles.toggleBtn, side === s && styles.toggleOn]}>
            <Text style={[styles.toggleText, { color: side === s ? colors.onInk : colors.ink2 }]}>
              {s === 'frente' ? 'Frente' : 'Costas'}
            </Text>
          </Pressable>
        ))}
      </View>
      <Svg width={150} height={300} viewBox="0 0 120 240">
        {/* silhueta */}
        <G opacity={0.55}>
          <Circle cx={60} cy={24} r={13} fill={colors.track} />
          <Rect x={53} y={36} width={14} height={10} rx={4} fill={colors.track} />
          <Path d="M34 50 Q60 42 86 50 L84 120 L36 120 Z" fill={colors.track} />
          <Rect x={38} y={120} width={44} height={110} rx={14} fill={colors.track} />
          <Rect x={18} y={60} width={16} height={72} rx={8} fill={colors.track} />
          <Rect x={86} y={60} width={16} height={72} rx={8} fill={colors.track} />
        </G>
        {regions.map((r, i) => {
          const on = selected === r.muscle;
          const common = {
            fill: on ? colors.lime : colors.capOff,
            stroke: on ? colors.lime : colors.line,
            strokeWidth: 0.8,
            onPress: () => tap(r.muscle),
          };
          if (r.circle) return <Circle key={i} {...common} cx={r.circle[0]} cy={r.circle[1]} r={r.circle[2]} />;
          if (r.rect) {
            const [x, y, w, h, rx] = r.rect;
            return <Rect key={i} {...common} x={x} y={y} width={w} height={h} rx={rx} />;
          }
          return <Path key={i} {...common} d={r.d} />;
        })}
      </Svg>
      <Text variant="caption" tone="muted" style={styles.hint}>
        {selected ? `Filtrando: ${MUSCLE_LABELS[selected]} · toque de novo para limpar` : 'Toque num músculo para filtrar'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 8,
  },
  toggle: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.segTrack,
    borderWidth: 1,
    borderColor: colors.segEdge,
  },
  toggleBtn: {
    height: 30,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: colors.ink,
  },
  toggleText: {
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
  },
  hint: {
    textAlign: 'center',
  },
});
