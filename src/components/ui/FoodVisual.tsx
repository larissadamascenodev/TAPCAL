import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, Text as RNText, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, gradients } from '@/theme/theme';

export type VisualTone = keyof typeof gradients.visual;

type Props = {
  emoji: string;
  tone: VisualTone;
  height: number;
  /** Tamanho do prato de vidro (o emoji acompanha). */
  plate?: number;
  /** Escurece a parte de baixo, para o texto por cima ficar legível. */
  scrim?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/**
 * Fundo colorido com um prato de vidro e o alimento em cima. Faz as vezes da
 * foto nas refeições e receitas, até termos fotos próprias.
 */
export function FoodVisual({ emoji, tone, height, plate = 76, scrim, style, children }: Props) {
  return (
    <View style={[styles.wrap, { height }, style]}>
      <LinearGradient colors={gradients.visual[tone]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.center, scrim && { paddingBottom: height * 0.2 }]}>
        <View style={[styles.plate, { width: plate, height: plate, borderRadius: plate / 2 }]}>
          <LinearGradient
            colors={[colors.plateHi, colors.plateLo]}
            start={{ x: 0.2, y: 0.1 }}
            end={{ x: 0.8, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: plate / 2 }]}
          />
          <RNText style={{ fontSize: plate * 0.55, lineHeight: plate * 0.7 }}>{emoji}</RNText>
        </View>
      </View>
      {scrim && (
        <LinearGradient colors={gradients.visualScrim} start={{ x: 0, y: 0.35 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plate: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.plateLo,
    borderTopColor: colors.plateEdge,
    shadowColor: colors.shadow,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
});
