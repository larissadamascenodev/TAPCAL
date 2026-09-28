import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { GoalWarning } from '@/lib/goals';
import { colors, radius, spacing } from '@/theme/theme';

/** Avisos das travas de segurança do motor de metas (ex.: piso de calorias). */
export function GoalWarnings({ warnings }: { warnings: GoalWarning[] }) {
  if (!warnings.length) return null;
  return (
    <View style={styles.wrap}>
      {warnings.map((w) => (
        <View key={w.code} style={styles.row}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.gold} style={styles.icon} />
          <Text variant="caption" tone="secondary" style={styles.text}>
            {w.message}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: colors.goldEdge,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  icon: {
    marginTop: 1,
  },
  text: {
    flex: 1,
  },
});
