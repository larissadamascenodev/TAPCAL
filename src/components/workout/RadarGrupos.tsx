import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';

import { Text } from '@/components/ui';
import { GRUPO_LABELS, GRUPOS, type Grupo } from '@/lib/treino/relatorio';
import { colors, fonts } from '@/theme/theme';

const W = 320;
const H = 300;
const R = 96;
const CX = W / 2;
const CY = H / 2;
const ANEIS = 5;
/** Costas em cima à esquerda, seguindo no sentido do relógio (como na referência). */
const ANGULOS = [-120, -60, 0, 60, 120, 180].map((g) => (g * Math.PI) / 180);

const ponto = (i: number, r: number) => ({ x: CX + r * Math.cos(ANGULOS[i]), y: CY + r * Math.sin(ANGULOS[i]) });

/**
 * "Por grupos musculares": radar com as séries de cada grupo no período.
 * Anéis e eixos em vidro; a área preenchida no verde do app, bem suave.
 */
export function RadarGrupos({ valores }: { valores: Record<Grupo, number> }) {
  const max = Math.max(1, ...GRUPOS.map((g) => valores[g]));
  const area = GRUPOS.map((g, i) => {
    const p = ponto(i, (valores[g] / max) * R);
    return `${p.x},${p.y}`;
  }).join(' ');
  const vazio = GRUPOS.every((g) => valores[g] === 0);

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Séries por grupo muscular: ${GRUPOS.map((g) => `${GRUPO_LABELS[g]} ${valores[g]}`).join(', ')}`}>
      <Svg width={W} height={H}>
        {Array.from({ length: ANEIS }, (_, k) => (
          <Circle key={k} cx={CX} cy={CY} r={(R * (k + 1)) / ANEIS} fill="none" stroke={colors.lineSoft} strokeWidth={1} />
        ))}
        {GRUPOS.map((g, i) => {
          const p = ponto(i, R);
          return <Line key={g} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke={colors.lineSoft} strokeWidth={1} />;
        })}
        {!vazio && <Polygon points={area} fill={colors.muscleHeat1} stroke={colors.lime} strokeWidth={1.5} strokeLinejoin="round" />}
      </Svg>
      {GRUPOS.map((g, i) => {
        const p = ponto(i, R + 40);
        return (
          <View key={g} style={[styles.rotulo, { left: p.x - 50, top: p.y - 22 }]}>
            <Text style={styles.nome}>{GRUPO_LABELS[g]}</Text>
            <Text style={[styles.valor, valores[g] === 0 && styles.valorZero]}>{valores[g]}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: W,
    height: H,
    alignSelf: 'center',
  },
  rotulo: {
    position: 'absolute',
    width: 100,
    alignItems: 'center',
  },
  nome: {
    fontFamily: fonts.body.semibold,
    fontSize: 13,
    lineHeight: 17,
    color: colors.ink2,
  },
  valor: {
    fontFamily: fonts.display.bold,
    fontSize: 20,
    lineHeight: 25,
    color: colors.lime,
    fontVariant: ['tabular-nums'],
  },
  valorZero: {
    color: colors.ink3,
  },
});
