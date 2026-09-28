import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { gradients } from '@/theme/theme';

type Props = {
  /** Altura do brilho a partir do topo da tela. */
  height?: number;
};

/**
 * Brilho laranja no topo de cada tela, que some no fundo escuro.
 * Duas camadas: uma vertical (brilho → fundo) e uma diagonal mais forte à esquerda,
 * imitando o degradê radial dos mockups.
 */
export function TopGlow({ height = 420 }: Props) {
  return (
    <View pointerEvents="none" style={[styles.wrap, { height }]}>
      <LinearGradient
        colors={gradients.topGlow}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Termina transparente antes da borda de baixo, para não deixar linha visível */}
      <LinearGradient
        colors={['rgba(255,197,107,0.16)', 'rgba(255,106,69,0)']}
        locations={[0, 0.7]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 0.8 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
