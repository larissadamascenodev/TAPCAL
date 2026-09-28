import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Glass, Sheet, Text, toast } from '@/components/ui';
import { formatLiters } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme/theme';

type IconName = keyof typeof Ionicons.glyphMap;

type Option = {
  icon: IconName;
  label: string;
  hint: string;
  run: () => void;
};

/** Aberto pelo botão + da barra inferior: atalhos para registrar algo. */
export default function AdicionarScreen() {
  const addWater = useAppStore((s) => s.addWater);

  const go = (href: Href) => router.replace(href);

  const options: Option[] = [
    {
      icon: 'scan-outline',
      label: 'Escanear prato',
      hint: 'Em breve',
      run: () => go({ pathname: '/em-breve', params: { secao: 'scanner' } }),
    },
    { icon: 'create-outline', label: 'Adicionar alimento', hint: 'Digitar à mão', run: () => go('/alimento') },
    {
      icon: 'water-outline',
      label: 'Registrar água',
      hint: '+250 ml',
      run: () => {
        addWater(250);
        const ml = useAppStore.getState().today.waterMl;
        toast(`${formatLiters(ml)} L de água hoje`);
        router.back();
      },
    },
    { icon: 'scale-outline', label: 'Registrar peso', hint: 'Peso de hoje', run: () => go('/peso') },
  ];

  return (
    <Sheet title="Adicionar" footer={<Button label="Fechar" variant="secondary" fullWidth onPress={() => router.back()} />}>
      {options.map((o) => (
        <Pressable key={o.label} accessibilityRole="button" onPress={o.run} style={({ pressed }) => pressed && styles.pressed}>
          <Glass flush rounded={radius.lg} contentStyle={styles.row}>
            <View style={styles.iconWrap}>
              <Ionicons name={o.icon} size={20} color={colors.ember2} />
            </View>
            <Text variant="bodyStrong" style={styles.label}>
              {o.label}
            </Text>
            <Text variant="caption" tone="muted">
              {o.hint}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
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
    gap: spacing.md,
    padding: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emberTint,
  },
  label: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
