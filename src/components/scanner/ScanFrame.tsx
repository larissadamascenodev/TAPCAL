import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { colors, gradients } from '@/theme/theme';

type Props = {
  /** Liga a linha dourada que varre a foto (durante a análise). */
  scanning?: boolean;
};

const CORNER = 34;
const STROKE = 3;

/** Cantos brancos do enquadramento e a linha de varredura do mockup. */
export function ScanFrame({ scanning = false }: Props) {
  const [height, setHeight] = useState(0);
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!scanning) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scanning, anim]);

  const onLayout = (e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [height * 0.1, height * 0.88] });

  return (
    <View pointerEvents="none" style={styles.frame} onLayout={onLayout}>
      <View style={[styles.corner, styles.tl]} />
      <View style={[styles.corner, styles.tr]} />
      <View style={[styles.corner, styles.bl]} />
      <View style={[styles.corner, styles.br]} />
      {scanning && height > 0 && (
        <Animated.View style={[styles.sweep, { transform: [{ translateY }] }]}>
          <LinearGradient
            colors={gradients.sweep}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    top: 70,
    bottom: 70,
    left: 46,
    right: 46,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: colors.white,
  },
  tl: { left: 0, top: 0, borderLeftWidth: STROKE, borderTopWidth: STROKE, borderTopLeftRadius: 18 },
  tr: { right: 0, top: 0, borderRightWidth: STROKE, borderTopWidth: STROKE, borderTopRightRadius: 18 },
  bl: { left: 0, bottom: 0, borderLeftWidth: STROKE, borderBottomWidth: STROKE, borderBottomLeftRadius: 18 },
  br: { right: 0, bottom: 0, borderRightWidth: STROKE, borderBottomWidth: STROKE, borderBottomRightRadius: 18 },
  sweep: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 0,
    height: 2,
    shadowColor: colors.ember2,
    shadowOpacity: 1,
    shadowRadius: 10,
  },
});
