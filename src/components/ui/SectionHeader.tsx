import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/theme';

import { Text } from './Text';

type Props = {
  title: string;
  aside?: string;
};

/** Título de seção com texto discreto à direita ("Refeições · 4 de 4"). */
export function SectionHeader({ title, aside }: Props) {
  return (
    <View style={styles.row}>
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      {aside ? (
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
});
