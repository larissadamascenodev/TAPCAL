import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, fonts, radius, spacing, tabBar } from '@/theme/theme';

import { Text } from './Text';

/** Aviso em card: ícone, título, detalhe e (opcional) um tracinho por item, com o novo em verde. */
export type ToastCard = {
  titulo: string;
  detalhe?: string;
  icone?: React.ComponentProps<typeof Ionicons>['name'];
  /** Ex.: séries do exercício: `total` tracinhos, os `feitos` em branco e o último (o novo) em verde. */
  tracos?: { total: number; feitos: number };
};

type Aviso = string | ToastCard;

let show: ((aviso: Aviso) => void) | null = null;

/** Mostra um aviso curto embaixo, logo acima da barra (ex.: "+250 ml registrados"). */
export function toast(message: string) {
  show?.(message);
}

/** Aviso mais completo, em card (ex.: "Série 5 adicionada"). */
toast.card = (card: ToastCard) => show?.(card);

/** Fica no layout raiz e desenha os avisos chamados por `toast()`. */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<Aviso | null>(null);
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
      }, typeof m === 'string' ? 2000 : 2800);
    };
    return () => {
      show = null;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [anim]);

  if (!message) return null;
  const card = typeof message === 'string' ? null : message;
  const entra = {
    opacity: anim,
    transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ],
  };

  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom: insets.bottom + tabBar.bottomGap + tabBar.height + spacing.md }]}>
      {card ? (
        <Animated.View accessibilityLiveRegion="polite" style={[styles.card, entra]}>
          <View style={styles.cardLinha}>
            <View style={styles.cardIcone}>
              <Ionicons name={card.icone ?? 'checkmark'} size={20} color={colors.lime} />
            </View>
            <View style={styles.cardTexto}>
              <Text style={styles.cardTitulo} numberOfLines={1}>
                {card.titulo}
              </Text>
              {card.detalhe ? (
                <Text variant="caption" tone="muted" numberOfLines={2}>
                  {card.detalhe}
                </Text>
              ) : null}
            </View>
          </View>
          {card.tracos && card.tracos.total > 0 ? (
            <View style={styles.tracos}>
              {Array.from({ length: card.tracos.total }, (_, k) => (
                <View key={k} style={[styles.traco, k < card.tracos!.feitos && styles.tracoFeito, k === card.tracos!.total - 1 && styles.tracoNovo]} />
              ))}
            </View>
          ) : null}
        </Animated.View>
      ) : (
        <Animated.View accessibilityLiveRegion="polite" style={[styles.toast, entra]}>
          <View style={styles.icone}>
            <Ionicons name="checkmark" size={13} color={colors.lime} />
          </View>
          <Text variant="bodyStrong" style={styles.text} numberOfLines={2}>
            {message as string}
          </Text>
        </Animated.View>
      )}
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
  card: {
    width: '88%',
    maxWidth: 380,
    gap: 12,
    padding: 14,
    borderRadius: radius.xl,
    backgroundColor: colors.toastFill,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.frostCardEdgeTop,
    shadowColor: colors.shadow,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
  cardLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcone: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.limeTint,
    borderWidth: 1,
    borderColor: colors.limeEdge,
  },
  cardTexto: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  cardTitulo: {
    fontFamily: fonts.display.semibold,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.3,
  },
  tracos: {
    flexDirection: 'row',
    gap: 5,
  },
  traco: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.track,
  },
  tracoFeito: {
    backgroundColor: colors.ink,
  },
  tracoNovo: {
    backgroundColor: colors.lime,
  },
});
