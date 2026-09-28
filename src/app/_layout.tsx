import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ToastHost } from '@/components/ui/Toast';
import { useDayRollover } from '@/hooks/useDayRollover';
import { colors } from '@/theme/theme';

SplashScreen.preventAutoHideAsync();

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.ember,
    background: colors.ground,
    card: colors.panel,
    text: colors.ink,
    border: colors.line,
    notification: colors.ember,
  },
};

export default function RootLayout() {
  useDayRollover();

  const [fontsLoaded, fontError] = useFonts({
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ground } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="adicionar" options={{ presentation: 'modal' }} />
        <Stack.Screen name="alimento" options={{ presentation: 'modal' }} />
        <Stack.Screen name="peso" options={{ presentation: 'modal' }} />
        <Stack.Screen name="treino-sessao" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="em-breve" options={{ presentation: 'modal' }} />
        <Stack.Screen name="busca" options={{ presentation: 'modal' }} />
        <Stack.Screen name="scanner" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
      </Stack>
      <ToastHost />
    </ThemeProvider>
  );
}
