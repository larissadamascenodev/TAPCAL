import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { colors, gradients, radius, tabBar } from '@/theme/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/** Desfoque mínimo da barra: só o bastante para os ícones não brigarem com o conteúdo. */
const MENU_BLUR = 14;

/** Ícone e rótulo de cada aba, pelo nome do arquivo da rota em src/app/(tabs). */
const TABS: Record<string, { label: string; icon: IconName; iconOn: IconName }> = {
  index: { label: 'Início', icon: 'home-outline', iconOn: 'home' },
  alimentacao: { label: 'Alimentação', icon: 'restaurant-outline', iconOn: 'restaurant' },
  treino: { label: 'Treino', icon: 'barbell-outline', iconOn: 'barbell' },
  resultados: { label: 'Resultados', icon: 'bar-chart-outline', iconOn: 'bar-chart' },
};

function tap() {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
}

/**
 * Barra inferior flutuante: pílula de vidro só com ícones (Início, Alimentação,
 * Treino e Resultados) e o botão + no mesmo vidro ao lado (abre /adicionar).
 */
export function FloatingTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const useBlur = Platform.OS !== 'android';

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: insets.bottom + tabBar.bottomGap }]}>
      <View style={styles.pill}>
        <GlassLayers useBlur={useBlur} />

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
              <Ionicons name={focused ? tab.iconOn : tab.icon} size={23} color={focused ? colors.lime : colors.ink2} />
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
        <GlassLayers useBlur={useBlur} />
        <Ionicons name="add" size={32} color={colors.ink} />
      </Pressable>
    </View>
  );
}

/** Vidro líquido da barra e do botão +: desfoque, brilho diagonal e borda clara. */
function GlassLayers({ useBlur }: { useBlur: boolean }) {
  return (
    <>
      {useBlur && <BlurView intensity={MENU_BLUR} tint="dark" style={StyleSheet.absoluteFill} />}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.fill]} />
      <LinearGradient
        pointerEvents="none"
        colors={gradients.glassStrong}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </>
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
    borderTopColor: colors.glassHighlight,
    backgroundColor: Platform.OS === 'android' ? colors.panel2 : 'transparent',
    // sombra para descolar a barra do conteúdo
    shadowColor: colors.shadow,
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  fill: {
    backgroundColor: colors.navFill,
  },
  tab: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.navActive,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderTopColor: colors.line,
  },
  plus: {
    width: tabBar.plusSize,
    height: tabBar.plusSize,
    borderRadius: tabBar.plusSize / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line2,
    borderTopColor: colors.glassHighlight,
    backgroundColor: Platform.OS === 'android' ? colors.panel2 : 'transparent',
    shadowColor: colors.shadow,
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  plusPressed: {
    transform: [{ scale: 0.94 }],
  },
});
