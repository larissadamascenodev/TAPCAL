import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Body, { type ExtendedBodyPart } from 'react-native-body-highlighter';

import { IconButton } from '@/components/ui/IconButton';
import { ladoDoMusculo, slugDoDesenho } from '@/lib/exercicios';
import { colors } from '@/theme/theme';
import type { Musculo } from '@/types/treino';

type Props = {
  principal: Musculo;
  secundarios?: readonly Musculo[];
  sexo?: 'feminino' | 'masculino';
  /** Altura do desenho em pontos (a largura é metade). */
  altura?: number;
  /** Mostra o botão de virar (frente/costas). */
  podeVirar?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Mapa muscular: corpo de frente ou de costas (pelo músculo principal), com o
 * principal em verde neon e os secundários em verde mais claro. Reutilizado no
 * detalhe do exercício, no onboarding de treino e nos relatórios.
 */
export function MapaMuscular({ principal, secundarios = [], sexo = 'feminino', altura = 240, podeVirar = true, style }: Props) {
  const [lado, setLado] = useState<'frente' | 'costas'>(ladoDoMusculo(principal));
  // Troca de exercício com outro lado: começa pelo lado certo de novo.
  const [ultimo, setUltimo] = useState(principal);
  if (ultimo !== principal) {
    setUltimo(principal);
    setLado(ladoDoMusculo(principal));
  }

  const principalSlug = slugDoDesenho(principal);
  const data: ExtendedBodyPart[] = [
    ...secundarios.map((m) => slugDoDesenho(m)).filter((m) => m !== principalSlug).map((slug) => ({ slug, intensity: 1 })),
    { slug: principalSlug, intensity: 2 },
  ];

  return (
    <View style={[styles.wrap, style]} accessible accessibilityRole="image" accessibilityLabel={`Mapa muscular, ${lado}`}>
      <Body
        data={data}
        side={lado === 'frente' ? 'front' : 'back'}
        gender={sexo === 'feminino' ? 'female' : 'male'}
        scale={altura / 400}
        colors={[colors.muscleSecondary, colors.musclePrimary]}
        defaultFill={colors.bodyFill}
        border={colors.bodyEdge}
      />
      {podeVirar && (
        <IconButton
          icon="sync"
          label={lado === 'frente' ? 'Ver de costas' : 'Ver de frente'}
          size={34}
          onPress={() => setLado(lado === 'frente' ? 'costas' : 'frente')}
          style={styles.flip}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  foco: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flip: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
});

/** Frente e costas lado a lado, com vários músculos em destaque (foco do treino). */
export function MapaDeFoco({ musculos, sexo = 'feminino', altura = 200 }: { musculos: readonly Musculo[]; sexo?: 'feminino' | 'masculino'; altura?: number }) {
  const data: ExtendedBodyPart[] = [...new Set(musculos.map(slugDoDesenho))].map((slug) => ({ slug, intensity: 1 }));
  const corpo = (side: 'front' | 'back') => (
    <Body
      data={data}
      side={side}
      gender={sexo === 'feminino' ? 'female' : 'male'}
      scale={altura / 400}
      colors={[colors.musclePrimary]}
      defaultFill={colors.bodyFill}
      border={colors.bodyEdge}
    />
  );
  return (
    <View style={styles.foco} accessible accessibilityRole="image" accessibilityLabel="Mapa dos músculos de foco, de frente e de costas">
      {corpo('front')}
      {corpo('back')}
    </View>
  );
}
