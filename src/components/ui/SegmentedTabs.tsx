import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { colors, fonts, radius } from '@/theme/theme';

import { Text } from './Text';

type Option<K extends string> = { key: K; label: string };

type Props<K extends string> = {
  options: readonly Option<K>[];
  value: K;
  onChange: (key: K) => void;
  /** Altura da pílula de fora (padrão 52). */
  height?: number;
  style?: StyleProp<ViewStyle>;
};

const PAD = 5;

/**
 * Abas em pílula: trilho escuro e uma pílula branca que desliza até a aba
 * escolhida. Usada no topo da Alimentação e nos dias do plano.
 */
export function SegmentedTabs<K extends string>({ options, value, onChange, height = 52, style }: Props<K>) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const index = Math.max(0, options.findIndex((o) => o.key === value));
  const segW = width > 0 ? (width - PAD * 2 - 2) / options.length : 0;

  return (
    <View onLayout={onLayout} style={[styles.track, { height, borderRadius: height / 2 }, style]} accessibilityRole="tablist">
      {segW > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.knob,
            { width: segW, borderRadius: (height - PAD * 2) / 2, transform: [{ translateX: index * segW }] },
            KNOB_MOTION,
          ]}
        />
      )}
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (on) return;
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              onChange(o.key);
            }}
            style={styles.tab}>
            <Text numberOfLines={1} style={[styles.label, on && styles.labelOn]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const KNOB_MOTION = {
  transitionProperty: 'transform' as const,
  transitionDuration: 380,
  transitionTimingFunction: 'ease-out' as const,
};

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: PAD,
    backgroundColor: colors.segTrack,
    borderWidth: 1,
    borderColor: colors.segEdge,
  },
  knob: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: PAD,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.body.bold,
    fontSize: 13.5,
    lineHeight: 18,
  },
  labelOn: {
    color: colors.onInk,
  },
});
