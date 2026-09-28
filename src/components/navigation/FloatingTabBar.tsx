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
const TABS: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  index: { label: 'Início', icon: 'home-outline', iconActive: 'home' },
  alimentacao: { label: 'Alimentação', icon: 'restaurant-outline', iconActive: 'restaurant' },
  treino: { label: 'Treino', icon: 'barbell-outline', iconActive: 'barbell' },
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
        {useBlur && <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />}
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
              <Ionicons
                name={focused ? tab.iconActive : tab.icon}
                size={21}
                color={focused ? colors.ember2 : colors.ink3}
              />
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
          colors={gradients.ember}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="add" size={30} color={colors.onEmber} />
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
    gap: spacing.md,
  },
  pill: {
    flex: 1,
    height: tabBar.height,
    borderRadius: radius.pill,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line2,
    backgroundColor: Platform.OS === 'android' ? colors.panel2 : 'transparent',
    // sombra para descolar a barra do conteúdo
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  pillFill: {
    backgroundColor: 'rgba(22,22,28,0.55)',
  },
  tab: {
    flex: 1,
    height: tabBar.height - 12,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabActive: {
    backgroundColor: 'rgba(255,106,69,0.14)',
  },
  tabLabel: {
    fontFamily: fonts.body.semibold,
    fontSize: 11,
    lineHeight: 14,
  },
  plus: {
    width: tabBar.plusSize,
    height: tabBar.plusSize,
    borderRadius: tabBar.plusSize / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ember,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  plusPressed: {
    transform: [{ scale: 0.94 }],
  },
});
