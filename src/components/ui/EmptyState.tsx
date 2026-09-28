import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/theme';

import { Glass } from './Glass';
import { Text } from './Text';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
};

/** Bloco de "ainda não tem nada aqui", usado enquanto as telas não têm dados. */
export function EmptyState({ icon, title, message }: Props) {
  return (
    <Glass style={styles.card}>
      <View style={styles.inner}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={26} color={colors.ember2} />
        </View>
        <Text variant="heading" style={styles.center}>
          {title}
        </Text>
        <Text tone="secondary" style={styles.center}>
          {message}
        </Text>
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.sm,
  },
  inner: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emberTint,
    marginBottom: spacing.xs,
  },
  center: {
    textAlign: 'center',
  },
});
