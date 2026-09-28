import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { Glass } from '@/components/ui/Glass';
import { Text } from '@/components/ui/Text';
import { formatLiters } from '@/lib/format';
import { colors, fonts, gradients, radius } from '@/theme/theme';

type Props = {
  ml: number;
  goalMl: number;
  onAdd: () => void;
};

/** Cartão da água: enche de azul conforme bebe, com botão de +250 ml. */
export function WaterTile({ ml, goalMl, onAdd }: Props) {
  const pct = goalMl > 0 ? Math.min(1, ml / goalMl) : 0;
  return (
    <Glass
      flush
      style={styles.tile}
      contentStyle={styles.content}
      underlay={
        <LinearGradient
          pointerEvents="none"
          colors={gradients.water}
          style={[styles.liquid, { height: `${Math.round(pct * 100)}%` }]}
        />
      }>
      <View style={styles.head}>
        <View style={styles.chip}>
          <Ionicons name="water-outline" size={16} color={colors.tide} />
        </View>
        <Text variant="label" tone="muted">
          Água
        </Text>
      </View>
      <Text style={styles.big}>
        {formatLiters(ml)}
        <Text variant="caption" tone="muted">
          {' '}L
        </Text>
      </Text>
      <Text variant="caption" tone="secondary">
        de {formatLiters(goalMl)} L hoje
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Adicionar 250 ml de água"
        onPress={onAdd}
        style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
        <Text style={styles.addText}>+ 250 ml</Text>
      </Pressable>
    </Glass>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 176,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  liquid: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chip: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFillStrong,
    borderWidth: 1,
    borderColor: colors.line,
  },
  big: {
    marginTop: 16,
    fontFamily: fonts.display.semibold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.8,
  },
  add: {
    alignSelf: 'flex-start',
    marginTop: 12,
    height: 32,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    justifyContent: 'center',
    backgroundColor: colors.tideTint,
    borderWidth: 1,
    borderColor: colors.tideEdge,
  },
  addText: {
    fontFamily: fonts.body.bold,
    fontSize: 12,
    color: colors.tideText,
  },
  pressed: {
    opacity: 0.7,
  },
});
