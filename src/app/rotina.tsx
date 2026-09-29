import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Glass, Sheet, Text, toast } from '@/components/ui';
import { ROUTINE_LABELS } from '@/lib/goals';
import { useAppStore } from '@/store/useAppStore';
import type { WorkRoutine } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme/theme';

const OPCOES: { value: WorkRoutine; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'sentado', icon: 'desktop-outline' },
  { value: 'dinamico', icon: 'walk-outline' },
  { value: 'pesado', icon: 'hammer-outline' },
];

/** Escolher a rotina de trabalho — é ela que define o gasto do dia a dia (o treino entra à parte). */
export default function RotinaScreen() {
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  if (!profile) return null;

  const pick = (r: WorkRoutine) => {
    setProfile({ ...profile, workRoutine: r });
    toast('Rotina atualizada — suas metas foram recalculadas');
    router.back();
  };

  return (
    <Sheet
      title="Rotina de trabalho"
      subtitle="Como é o seu dia fora do treino. As calorias do treino entram no seu orçamento do dia em que você treinar.">
      <Glass flush>
        {OPCOES.map((o, i) => {
          const on = profile.workRoutine === o.value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => pick(o.value)}
              style={[styles.row, i < OPCOES.length - 1 && styles.rowLine]}>
              <View style={[styles.icon, on && styles.iconOn]}>
                <Ionicons name={o.icon} size={20} color={on ? colors.lime2 : colors.ink2} />
              </View>
              <Text style={styles.label}>{ROUTINE_LABELS[o.value]}</Text>
              {on && <Ionicons name="checkmark-circle" size={22} color={colors.lime} />}
            </Pressable>
          );
        })}
      </Glass>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
  },
  iconOn: {
    backgroundColor: colors.limeTint,
  },
  label: {
    flex: 1,
    fontFamily: fonts.body.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
});
