import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { colors } from '@/theme/theme';

type Props = {
  /** Lado do quadrado (pontos). */
  tamanho: number;
  /** Quantos traços em volta. */
  tracos: number;
  /** Fração acesa (0 a 1), a partir do topo, no sentido do relógio. */
  aceso: number;
  /** Comprimento de cada traço (padrão 7% do tamanho). */
  comprimento?: number;
  /** Espessura dos traços. */
  espessura?: number;
  /** Cor dos traços acesos (padrão: branco). */
  cor?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Mostrador de traços em volta de um número (tempo de treino, descanso): os
 * traços acesos em branco, os que faltam apagados e o traço da vez maior, no
 * verde do app — o único verde do mostrador.
 */
export function Mostrador({ tamanho, tracos, aceso, comprimento, espessura = 2.4, cor = colors.tracoAceso, children, style }: Props) {
  const c = tamanho / 2;
  const len = comprimento ?? tamanho * 0.07;
  const rFora = c - espessura * 2;
  const rDentro = rFora - len;
  const f = Math.max(0, Math.min(1, aceso));
  const vez = Math.min(tracos - 1, Math.round(f * tracos));

  const linhas = Array.from({ length: tracos }, (_, i) => {
    const a = (i / tracos) * 2 * Math.PI - Math.PI / 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const daVez = i === vez;
    const r1 = daVez ? rDentro - len * 0.45 : rDentro;
    return { i, x1: c + r1 * cos, y1: c + r1 * sin, x2: c + rFora * cos, y2: c + rFora * sin, daVez, on: i < vez };
  });

  return (
    <View style={[{ width: tamanho, height: tamanho }, style]}>
      <Svg width={tamanho} height={tamanho} style={StyleSheet.absoluteFill}>
        {linhas.map((l) =>
          l.daVez ? null : (
            <Line key={l.i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.on ? cor : colors.tracoApagado} strokeWidth={espessura} strokeLinecap="round" />
          ),
        )}
        {linhas
          .filter((l) => l.daVez)
          .map((l) => [
            <Line key="brilho" x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={colors.tracoBrilho} strokeWidth={espessura * 4} strokeLinecap="round" />,
            <Line key="vez" x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={colors.lime} strokeWidth={espessura * 1.6} strokeLinecap="round" />,
          ])}
      </Svg>
      <View style={styles.centro}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
