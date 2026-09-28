import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Glass } from '@/components/ui/Glass';
import { Text } from '@/components/ui/Text';
import { colors, fonts, gradients, radius } from '@/theme/theme';

type Props = {
  title: string;
  subtitle: string;
  /** Texto do botão; sem ele, o cartão não tem botão (ex.: treino já feito). */
  action?: string;
  onPress?: () => void;
};

/** Cartão do treino do dia na Início, com botão para começar. */
export function WorkoutTile({ title, subtitle, action, onPress }: Props) {
  return (
    <Glass frost flush rounded={26} tint={gradients.workout} style={styles.tile} contentStyle={styles.content}>
      <View style={styles.head}>
        <View style={styles.chip}>
          <Ionicons name="barbell-outline" size={16} color={colors.irisSoft} />
        </View>
        <Text variant="label" tone="muted">
          Treino
        </Text>
      </View>
      <View>
      <Text style={styles.big} numberOfLines={1} adjustsFontSizeToFit>
        {title}
      </Text>
      <Text variant="caption" tone="secondary" numberOfLines={2}>
        {subtitle}
      </Text>
      {action && onPress && (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [styles.go, pressed && styles.pressed]}>
          <Ionicons name="play" size={10} color={colors.onInk} />
          <Text style={styles.goText}>{action}</Text>
        </Pressable>
      )}
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 1,
  },
  content: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
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
    fontFamily: fonts.display.bold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -1,
  },
  go: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    height: 32,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
  goText: {
    fontFamily: fonts.body.bold,
    fontSize: 12,
    color: colors.onInk,
  },
  pressed: {
    opacity: 0.8,
  },
});
