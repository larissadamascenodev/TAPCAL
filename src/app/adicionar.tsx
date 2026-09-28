import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Glass, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const OPCOES: { icon: IconName; label: string; fase: string }[] = [
  { icon: 'scan-outline', label: 'Escanear prato', fase: 'Fase 4' },
  { icon: 'search-outline', label: 'Adicionar alimento', fase: 'Fase 3' },
  { icon: 'water-outline', label: 'Registrar água', fase: 'Fase 3' },
  { icon: 'scale-outline', label: 'Registrar peso', fase: 'Fase 3' },
];

/** Aberto pelo botão + da barra inferior. Por enquanto só mostra o que vem por aí. */
export default function AdicionarScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.handle} />
      <Text variant="title">Adicionar</Text>
      <Text tone="secondary">Os registros rápidos chegam nas próximas fases.</Text>

      <View style={styles.list}>
        {OPCOES.map((o) => (
          <Glass key={o.label} style={styles.row} flush>
            <View style={styles.rowInner}>
              <View style={styles.iconWrap}>
                <Ionicons name={o.icon} size={20} color={colors.ember2} />
              </View>
              <Text variant="bodyStrong" style={styles.rowLabel}>
                {o.label}
              </Text>
              <Text variant="caption" tone="muted">
                {o.fase}
              </Text>
            </View>
          </Glass>
        ))}
      </View>

      <View style={styles.spacer} />
      <Button label="Fechar" variant="secondary" fullWidth onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.panel,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.line2,
    marginBottom: spacing.lg,
  },
  list: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    borderRadius: radius.lg,
  },
  rowInner: {
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
    backgroundColor: 'rgba(255,106,69,0.12)',
  },
  rowLabel: {
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
});
