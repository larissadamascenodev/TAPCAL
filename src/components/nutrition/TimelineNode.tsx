import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, fonts } from '@/theme/theme';

type Props = {
  time: string;
  /** Bolinha cheia (refeição feita) ou vazada (ainda falta). */
  done: boolean;
  /** O último item não desenha a linha para baixo. */
  last?: boolean;
  children: ReactNode;
};

/** Um passo da linha do tempo: horário e bolinha à esquerda, conteúdo à direita. */
export function TimelineNode({ time, done, last, children }: Props) {
  return (
    <View style={styles.node}>
      {!last && <View style={styles.line} />}
      <View style={styles.rail}>
        <Text style={styles.time}>{time}</Text>
        <View style={[styles.dot, done ? styles.dotOn : styles.dotOff]} />
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  node: {
    flexDirection: 'row',
  },
  line: {
    position: 'absolute',
    left: 24,
    top: 30,
    bottom: -6,
    width: 1.5,
    backgroundColor: colors.railLine,
  },
  rail: {
    width: 50,
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
  },
  time: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.ink3,
    fontVariant: ['tabular-nums'],
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotOn: {
    backgroundColor: colors.lime,
    shadowColor: colors.lime,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  dotOff: {
    backgroundColor: colors.ground,
    borderWidth: 2,
    borderColor: colors.line2,
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 26,
  },
});
