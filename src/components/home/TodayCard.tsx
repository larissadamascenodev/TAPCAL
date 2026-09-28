import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { Glass } from '@/components/ui/Glass';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';
import { formatInt } from '@/lib/format';
import { colors, fonts, gradients, macroColors, radius, spacing } from '@/theme/theme';
import type { Macros } from '@/types';

const ROWS = [
  { key: 'proteinG', label: 'Proteína' },
  { key: 'carbsG', label: 'Carboidrato' },
  { key: 'fatG', label: 'Gordura' },
] as const;

type Props = {
  goalKcal: number;
  eaten: Macros;
  goal: Macros;
  onPress?: () => void;
};

/**
 * Cartão único "Total de hoje": a meta em destaque, consumidas e quanto falta,
 * a barra do dia e as barrinhas de cada macro, cada uma na sua cor.
 */
export function TodayCard({ goalKcal, eaten, goal, onPress }: Props) {
  const left = goalKcal - eaten.kcal;
  const over = left < 0;
  const frac = goalKcal > 0 ? Math.min(1, Math.max(0, eaten.kcal / goalKcal)) : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Total de hoje: ${formatInt(eaten.kcal)} de ${formatInt(goalKcal)} calorias`}
      accessibilityHint="Toque duas vezes para fotografar um prato"
      onPress={onPress}>
      <Glass contentStyle={styles.content}>
        <View style={styles.head}>
          <Text style={styles.label}>Total de hoje</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.ink2} />
        </View>
        <Text style={styles.goal}>
          {formatInt(goalKcal)}
          <Text style={styles.goalUnit}> kcal meta</Text>
        </Text>

        <View style={styles.chips}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{formatInt(eaten.kcal)} consumidas</Text>
          </View>
          <View style={[styles.chip, over ? styles.chipWarn : styles.chipLime]}>
            <Text style={[styles.chipText, { color: over ? colors.warnText : colors.lime }]}>
              {over ? `${formatInt(-left)} acima da meta` : `faltam ${formatInt(left)}`}
            </Text>
          </View>
        </View>

        <View style={styles.track}>
          <LinearGradient
            colors={over ? gradients.barOver : gradients.bar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, { width: `${frac * 100}%` }]}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.macros}>
          {ROWS.map(({ key, label }) => (
            <View
              key={key}
              accessible
              accessibilityLabel={`${label}: ${formatInt(eaten[key])} de ${formatInt(goal[key])} gramas`}>
              <View style={styles.macroTop}>
                <View style={styles.macroName}>
                  <View style={[styles.dot, { backgroundColor: macroColors[key], shadowColor: macroColors[key] }]} />
                  <Text style={styles.macroLabel}>{label}</Text>
                </View>
                <Text style={styles.macroValue}>
                  <Text style={styles.macroStrong}>{formatInt(eaten[key])}</Text> / {formatInt(goal[key])} g
                </Text>
              </View>
              <ProgressBar
                value={goal[key] ? eaten[key] / goal[key] : 0}
                color={macroColors[key]}
                height={7}
                style={styles.macroBar}
              />
            </View>
          ))}
        </View>
      </Glass>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: fonts.body.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink2,
  },
  goal: {
    marginTop: 6,
    fontFamily: fonts.display.bold,
    fontSize: 54,
    lineHeight: 60,
    letterSpacing: -2.6,
    fontVariant: ['tabular-nums'],
  },
  goalUnit: {
    fontFamily: fonts.body.semibold,
    fontSize: 16,
    letterSpacing: 0,
    color: colors.ink3,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 14,
  },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    justifyContent: 'center',
    backgroundColor: colors.glassFillStrong,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipLime: {
    backgroundColor: colors.limeTint,
    borderColor: colors.limeEdge,
  },
  chipWarn: {
    backgroundColor: colors.warnTint,
    borderColor: colors.warnEdge,
  },
  chipText: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 10,
    marginTop: spacing.lg,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: colors.track,
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  divider: {
    height: 1,
    marginTop: 18,
    marginBottom: spacing.lg,
    backgroundColor: colors.divider,
  },
  macros: {
    gap: 14,
  },
  macroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  macroLabel: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    lineHeight: 19,
  },
  macroValue: {
    fontFamily: fonts.body.medium,
    fontSize: 14,
    lineHeight: 19,
    color: colors.ink3,
    fontVariant: ['tabular-nums'],
  },
  macroStrong: {
    fontFamily: fonts.body.bold,
    color: colors.ink,
  },
  macroBar: {
    marginTop: 7,
  },
});
