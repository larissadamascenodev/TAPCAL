import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, spacing, tabBar } from '@/theme/theme';

import { Text } from './Text';

let show: ((message: string) => void) | null = null;

/** Mostra um aviso curto embaixo, logo acima da barra (ex.: "+250 ml registrados"). */
export function toast(message: string) {
  show?.(message);
}

/** Fica no layout raiz e desenha os avisos chamados por `toast()`. */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const [anim] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    show = (m) => {
      setMessage(m);
      if (timer.current) clearTimeout(timer.current);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() =>
          setMessage(null),
        );
      }, 2000);
    };
    return () => {
      show = null;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [anim]);

  if (!message) return null;

  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom: insets.bottom + tabBar.bottomGap + tabBar.height + spacing.md }]}>
      <Animated.View
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          {
            opacity: anim,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          },
        ]}>
        <View style={styles.icone}>
          <Ionicons name="checkmark" size={13} color={colors.lime} />
        </View>
        <Text variant="bodyStrong" style={styles.text} numberOfLines={2}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '88%',
    paddingLeft: 10,
    paddingRight: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.toastFill,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.frostCardEdgeTop,
    shadowColor: colors.shadow,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  icone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.limeTint,
  },
  text: {
    flexShrink: 1,
    fontSize: 13.5,
  },
});
