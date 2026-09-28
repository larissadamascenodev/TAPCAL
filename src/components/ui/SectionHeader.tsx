import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme/theme';

import { Text } from './Text';

type Props = {
  title: string;
  aside?: string;
  /** Link à direita ("Ver diário ›"); substitui o `aside`. */
  action?: string;
  onAction?: () => void;
};

/** Título de seção com texto discreto ou um link à direita ("Refeições · 4 de 4"). */
export function SectionHeader({ title, aside, action, onAction }: Props) {
  return (
    <View style={styles.row}>
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      {action && onAction ? (
        <Pressable accessibilityRole="link" hitSlop={8} onPress={onAction} style={styles.action}>
          <Text variant="caption" tone="secondary" style={styles.actionText}>
            {action}
          </Text>
          <Ionicons name="chevron-forward" size={15} color={colors.ink2} />
        </Pressable>
      ) : aside ? (
        <Text variant="caption" tone="muted">
          {aside}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.md,
    marginHorizontal: spacing.xs,
  },
  title: {
    fontSize: 17,
    letterSpacing: -0.3,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    fontFamily: fonts.body.bold,
  },
});
