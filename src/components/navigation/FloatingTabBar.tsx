import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, fonts, gradients, radius, spacing, tabBar } from '@/theme/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/** Ícone e rótulo de cada aba, pelo nome do arquivo da rota em src/app/(tabs). */
const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Início', icon: 'home-outline' },
  alimentacao: { label: 'Alimentação', icon: 'restaurant-outline' },
  treino: { label: 'Treino', icon: 'barbell-outline' },
};

function tap() {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
}

/**
 * Barra inferior flutuante: pílula de vidro com Início, Alimentação e Treino,
 * e o botão + em laranja ao lado (abre /adicionar).
 */
export function FloatingTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const useBlur = Platform.OS !== 'android';

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: insets.bottom + tabBar.bottomGap }]}>
      <View style={styles.pill}>
        {useBlur && <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.pillFill]} />

        {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              tap();
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              onPress={onPress}
              style={[styles.tab, focused && styles.tabActive]}>
              <Ionicons name={tab.icon} size={22} color={focused ? colors.ink : colors.ink3} />
              <Text
                variant="caption"
                numberOfLines={1}
                style={[styles.tabLabel, { color: focused ? colors.ink : colors.ink3 }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Adicionar"
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/adicionar');
        }}
        style={({ pressed }) => [styles.plus, pressed && styles.plusPressed]}>
        <LinearGradient
          colors={gradients.fab}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="add" size={32} color={colors.onEmber} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: tabBar.sideGap,
    right: tabBar.sideGap,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pill: {
    flex: 1,
    height: tabBar.height,
    borderRadius: radius.pill,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.line2,
    backgroundColor: Platform.OS === 'android' ? colors.panel2 : 'transparent',
    // sombra para descolar a barra do conteúdo
    shadowColor: colors.shadow,
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  pillFill: {
    backgroundColor: colors.navFill,
  },
  tab: {
    minWidth: 72,
    height: 52,
    paddingHorizontal: spacing.sm,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabActive: {
    backgroundColor: colors.navActive,
  },
  tabLabel: {
    fontFamily: fonts.body.bold,
    fontSize: 10,
    lineHeight: 13,
  },
  plus: {
    width: tabBar.plusSize,
    height: tabBar.plusSize,
    borderRadius: tabBar.plusSize / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ember,
    shadowOpacity: 0.6,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  plusPressed: {
    transform: [{ scale: 0.94 }],
  },
});
