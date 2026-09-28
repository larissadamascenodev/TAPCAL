import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Tapi } from '@/components/mascot/Tapi';
import { Text } from '@/components/ui/Text';
import { formatInt } from '@/lib/format';
import { goalPercent, POKE_MESSAGES, type Mood } from '@/lib/mascot';
import { colors, fonts } from '@/theme/theme';

import { CalorieGauge, GAUGE_VB_W } from './CalorieGauge';

/** Tempo do pulinho + risada depois de um toque. */
const POKE_MS = 1600;

// Medidas do mockup para um medidor de 340 de largura.
const HERO_H = 372;
const GAUGE_TOP = 44;
const MASCOT_TOP = 104;
const MASCOT_W = 204;

/** O balão dá um "pulinho" a cada fala nova. */
const POP = {
  animationName: { from: { transform: [{ scale: 0.94 }] }, to: { transform: [{ scale: 1 }] } },
  animationDuration: 250,
  animationTimingFunction: 'ease-out',
} as const;

type Props = {
  eaten: number;
  goal: number;
  mood: Mood;
  message: string;
  width: number;
};

/**
 * Topo da Início: balão de fala, medidor de calorias e o Tapi no meio.
 * Tocar no Tapi faz ele pular e dizer outra coisa.
 */
export function MascotHero({ eaten, goal, mood, message, width }: Props) {
  const k = width / GAUGE_VB_W;
  const [poke, setPoke] = useState<string | null>(null);
  const count = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onPoke = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPoke(POKE_MESSAGES[count.current++ % POKE_MESSAGES.length]);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPoke(null), POKE_MS);
  };

  const text = poke ?? message;
  const pct = goalPercent(eaten, goal);

  return (
    <View style={{ width, height: HERO_H * k, alignSelf: 'center' }}>
      <View style={[styles.abs, { top: GAUGE_TOP * k }]}>
        <CalorieGauge eaten={eaten} goal={goal} width={width} />
      </View>

      <View style={[styles.bubbleWrap, { top: 6 * k }]} pointerEvents="none">
        <Animated.View key={text} style={[styles.bubble, POP]} accessibilityLiveRegion="polite">
          <Text style={styles.bubbleText}>{text}</Text>
          <View style={[styles.tail, styles.tailBig]} />
          <View style={[styles.tail, styles.tailSmall]} />
        </Animated.View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tapi, o mascote. Toque para brincar"
        onPress={onPoke}
        style={[styles.mascot, { top: MASCOT_TOP * k, left: (width - MASCOT_W * k) / 2 }]}>
        <Tapi mood={mood} poking={poke !== null} width={MASCOT_W * k} />
      </Pressable>

      <View style={[styles.ends, { bottom: 26 * k }]} pointerEvents="none">
        <Text style={styles.endText}>0</Text>
        <Text style={styles.endText}>{formatInt(goal)} KCAL</Text>
      </View>
      <Text style={styles.pct} tone="secondary" variant="caption">
        <Text style={styles.pctStrong}>{pct}%</Text> da meta de hoje
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  bubbleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  bubble: {
    maxWidth: 250,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.bubble,
    shadowColor: colors.shadow,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  bubbleText: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
    color: colors.onBubble,
  },
  tail: {
    position: 'absolute',
    borderRadius: 10,
    backgroundColor: colors.bubble,
  },
  tailBig: {
    left: '55%',
    bottom: -9,
    width: 12,
    height: 12,
  },
  tailSmall: {
    left: '50%',
    bottom: -18,
    width: 7,
    height: 7,
  },
  mascot: {
    position: 'absolute',
  },
  ends: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  endText: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    letterSpacing: 0.9,
    color: colors.ink3,
  },
  pct: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
  },
  pctStrong: {
    fontFamily: fonts.display.semibold,
    color: colors.ink,
  },
});
