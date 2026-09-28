import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Glass, Sheet, Text } from '@/components/ui';
import { runShortcut, useHydrated } from '@/hooks/useShortcut';
import type { ShortcutAction } from '@/lib/shortcuts';
import { colors, fonts, radius, spacing } from '@/theme/theme';

type Option = {
  action: ShortcutAction;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  tint: string;
  label: string;
  hint: string;
};

const OPTIONS: Option[] = [
  { action: 'foto', icon: 'scan-outline', color: colors.lime, tint: colors.limeTint, label: 'Escanear alimento', hint: 'Foto do prato vira calorias' },
  { action: 'agua', icon: 'water-outline', color: colors.tide, tint: colors.tideTint, label: 'Hidratação', hint: 'Soma 250 ml de água' },
  { action: 'treino', icon: 'barbell-outline', color: colors.irisSoft, tint: colors.irisTint, label: 'Exercício', hint: 'Começa o treino de hoje' },
];

/**
 * Atalho único (tapcal://atalho), pensado para o toque duplo na traseira do
 * iPhone: abre esta escolha rápida entre foto, água e treino.
 */
export default function AtalhoScreen() {
  const ready = useHydrated();

  return (
    <Sheet
      title="O que você quer registrar?"
      footer={<Button label="Fechar" variant="secondary" fullWidth onPress={() => router.replace('/')} />}>
      {OPTIONS.map((o) => (
        <Pressable
          key={o.action}
          accessibilityRole="button"
          accessibilityHint={o.hint}
          disabled={!ready}
          onPress={() => runShortcut(o.action)}
          style={({ pressed }) => pressed && styles.pressed}>
          <Glass flush rounded={radius.xl} contentStyle={styles.row}>
            <View style={[styles.icon, { backgroundColor: o.tint }]}>
              <Ionicons name={o.icon} size={26} color={o.color} />
            </View>
            <View style={styles.text}>
              <Text style={styles.label}>{o.label}</Text>
              <Text variant="caption" tone="secondary">
                {o.hint}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.ink3} />
          </Glass>
        </Pressable>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  label: {
    fontFamily: fonts.display.semibold,
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: -0.3,
  },
  pressed: {
    opacity: 0.7,
  },
});
