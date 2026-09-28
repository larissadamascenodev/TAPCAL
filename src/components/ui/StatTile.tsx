import { StyleSheet, View } from 'react-native';

import { colors, fonts, radius } from '@/theme/theme';

import { Text } from './Text';

/** Número pequeno com rótulo em cima (Esta semana · 4 / 5). */
export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text variant="caption" tone="secondary" style={styles.label}>
        {label}
      </Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  label: {
    fontFamily: fonts.body.semibold,
    fontSize: 11,
  },
  value: {
    marginTop: 4,
    fontFamily: fonts.display.semibold,
    fontSize: 18,
    lineHeight: 23,
  },
});
