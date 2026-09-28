import { Tabs } from 'expo-router/js-tabs';

import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';
import { colors } from '@/theme/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.ground },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="alimentacao" options={{ title: 'Alimentação' }} />
      <Tabs.Screen name="treino" options={{ title: 'Treino' }} />
    </Tabs>
  );
}
