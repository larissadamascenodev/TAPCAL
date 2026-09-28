import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Glass, Sheet, Stepper, Text, toast } from '@/components/ui';
import { formatDecimal } from '@/lib/format';
import { currentWeightKg } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { fonts, spacing } from '@/theme/theme';

const STEP = 0.1;
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Registrar o peso do dia (um por dia; registrar de novo substitui). */
export default function PesoScreen() {
  const state = useAppStore();
  const start = currentWeightKg(state) ?? 70;
  const [kg, setKg] = useState(round1(start));
  const already = state.weights.some((w) => w.date === state.today.date);

  const save = () => {
    state.logWeight(kg);
    toast(`${formatDecimal(kg)} kg registrados`);
    router.back();
  };

  return (
    <Sheet
      title="Registrar peso"
      subtitle={already ? 'Você já se pesou hoje. Salvar de novo substitui o registro.' : 'Um registro por dia, de preferência pela manhã.'}
      footer={
        <>
          <Button label="Cancelar" variant="secondary" onPress={() => router.back()} />
          <Button label="Salvar peso" onPress={save} style={styles.save} />
        </>
      }>
      <Glass contentStyle={styles.card}>
        <Text variant="label" tone="muted">
          Peso de hoje
        </Text>
        <Text style={styles.value} accessibilityLiveRegion="polite">
          {formatDecimal(kg)}
          <Text variant="caption" tone="muted">
            {' '}kg
          </Text>
        </Text>
        <View style={styles.steppers}>
          <View style={styles.stepperCol}>
            <Stepper label="1 kg" size={44} onMinus={() => setKg((v) => round1(Math.max(30, v - 1)))} onPlus={() => setKg((v) => round1(Math.min(300, v + 1)))} />
            <Text variant="caption" tone="muted">
              1 kg
            </Text>
          </View>
          <View style={styles.stepperCol}>
            <Stepper label="100 g" size={44} onMinus={() => setKg((v) => round1(Math.max(30, v - STEP)))} onPlus={() => setKg((v) => round1(Math.min(300, v + STEP)))} />
            <Text variant="caption" tone="muted">
              100 g
            </Text>
          </View>
        </View>
      </Glass>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  value: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    fontFamily: fonts.display.bold,
    fontSize: 56,
    lineHeight: 62,
    letterSpacing: -2.5,
    fontVariant: ['tabular-nums'],
  },
  steppers: {
    flexDirection: 'row',
    gap: spacing.xxl,
  },
  stepperCol: {
    alignItems: 'center',
    gap: 6,
  },
  save: {
    flex: 1,
  },
});
