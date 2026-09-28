import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { DishTitle, SheetBadge } from '@/components/nutrition/PlateSheet';
import { confirmDestructive, Glass, GlassModal, IconButton, NeonButton, Text, toast } from '@/components/ui';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { ExerciseAnim } from '@/components/workout/ExerciseAnim';
import { ExerciseLibrary } from '@/components/workout/ExerciseLibrary';
import type { MuscleKey } from '@/data/exercises';
import { WEEKDAY_LETTERS, WEEKDAY_SHORT } from '@/lib/format';
import { buildPlans, SPLITS, splitsFor, suggestedWeekdays, toggleExercise, type SplitKey } from '@/lib/split';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { WorkoutPlan } from '@/types';

type Step = 'tipo' | 'dias' | 'divisao' | 'foco' | 'revisao';
const ORDER: Step[] = ['tipo', 'dias', 'divisao', 'foco', 'revisao'];

/** Ênfases que a pessoa pode escolher (viram um exercício a mais no grupo). */
const FOCUS: { key: MuscleKey; label: string }[] = [
  { key: 'peito', label: 'Peito' },
  { key: 'costas', label: 'Costas' },
  { key: 'ombros', label: 'Ombros' },
  { key: 'biceps', label: 'Bíceps' },
  { key: 'triceps', label: 'Tríceps' },
  { key: 'quadriceps', label: 'Quadríceps' },
  { key: 'posterior', label: 'Posterior' },
  { key: 'gluteos', label: 'Glúteos' },
  { key: 'panturrilha', label: 'Panturrilha' },
  { key: 'abdomen', label: 'Abdômen' },
];

/** Criar um treino novo: personalizado (dias → divisão → foco → exercícios) ou com IA. */
export default function TreinoNovoScreen() {
  const hasPlans = useAppStore((s) => s.workoutPlans.length > 0);
  const setWorkoutPlans = useAppStore((s) => s.setWorkoutPlans);

  const [step, setStep] = useState<Step>('tipo');
  const [weekdays, setWeekdays] = useState<number[]>(suggestedWeekdays(3));
  const [split, setSplit] = useState<SplitKey>('abc');
  const [focus, setFocus] = useState<MuscleKey[]>([]);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [tab, setTab] = useState('plano-a');
  const [picking, setPicking] = useState(false);

  const days = weekdays.length;
  const options = splitsFor(days).length ? splitsFor(days) : [SPLITS[0]];
  const back = () => setStep(ORDER[Math.max(0, ORDER.indexOf(step) - 1)]);

  const setDays = (n: number) => {
    setWeekdays(suggestedWeekdays(n));
    const fit = splitsFor(n);
    if (fit.length && !fit.some((s) => s.key === split)) setSplit(fit[fit.length - 1].key);
  };

  const toggleDay = (d: number) => {
    const next = weekdays.includes(d) ? weekdays.filter((x) => x !== d) : [...weekdays, d].sort();
    setWeekdays(next);
    const fit = splitsFor(next.length);
    if (fit.length && !fit.some((s) => s.key === split)) setSplit(fit[fit.length - 1].key);
  };

  const review = () => {
    const built = buildPlans({ weekdays, split: options.some((o) => o.key === split) ? split : options[0].key, focus });
    setPlans(built);
    setTab(built[0].id);
    setStep('revisao');
  };

  const plan = plans.find((p) => p.id === tab) ?? plans[0];
  const updatePlan = (next: WorkoutPlan) => setPlans((ps) => ps.map((p) => (p.id === next.id ? next : p)));

  const save = () => {
    const doSave = () => {
      setWorkoutPlans(plans);
      toast('Treino salvo');
      router.back();
    };
    if (hasPlans) {
      confirmDestructive('Trocar seu treino?', 'A divisão atual será substituída por esta.', 'Trocar', doSave);
    } else doSave();
  };

  const footer =
    step === 'dias' ? (
      <NeonButton label="Continuar" onPress={() => setStep('divisao')} disabled={days < 1} />
    ) : step === 'divisao' ? (
      <NeonButton label="Continuar" onPress={() => setStep('foco')} />
    ) : step === 'foco' ? (
      <NeonButton label="Montar treino" onPress={review} />
    ) : step === 'revisao' ? (
      <NeonButton label="Salvar treino" onPress={save} disabled={plans.some((p) => !p.exercises.length)} />
    ) : undefined;

  return (
    <GlassModal
      badge={<SheetBadge icon="barbell-outline" label={step === 'tipo' ? 'NOVO TREINO' : 'PERSONALIZADO'} />}
      leading={step !== 'tipo' ? <IconButton icon="chevron-back" label="Voltar" size={38} onPress={back} /> : undefined}
      onClose={() => router.back()}
      footer={footer}>
      {step === 'tipo' && (
        <>
          <DishTitle>Como quer montar?</DishTitle>
          <Choice
            icon="construct-outline"
            title="Personalizado"
            text="Você escolhe os dias, a divisão, o foco e os exercícios."
            onPress={() => setStep('dias')}
          />
          <Choice
            icon="sparkles"
            title="Montar com assistente IA"
            text="Responde algumas perguntas e a IA monta o treino para você."
            badge="EM BREVE"
            onPress={() => toast('O assistente chega na próxima etapa')}
          />
        </>
      )}

      {step === 'dias' && (
        <>
          <DishTitle>Quantos dias por semana?</DishTitle>
          <View style={styles.row}>
            {[2, 3, 4, 5, 6].map((n) => (
              <Pressable
                key={n}
                accessibilityRole="radio"
                accessibilityState={{ selected: days === n }}
                onPress={() => setDays(n)}
                style={[styles.bigChip, days === n && styles.bigChipOn]}>
                <Text style={[styles.bigChipText, { color: days === n ? colors.onInk : colors.ink }]}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <Text variant="label" tone="muted" style={styles.gapTop}>
            Em quais dias
          </Text>
          <View style={styles.row}>
            {WEEKDAY_LETTERS.map((l, d) => {
              const on = weekdays.includes(d);
              return (
                <Pressable
                  key={d}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={WEEKDAY_SHORT[d]}
                  onPress={() => toggleDay(d)}
                  style={[styles.day, on && styles.dayOn]}>
                  <Text style={[styles.dayText, { color: on ? colors.onLime : colors.ink2 }]}>{l}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text variant="caption" tone="muted">
            {days} {days === 1 ? 'dia' : 'dias'} de treino · {7 - days} de descanso
          </Text>
        </>
      )}

      {step === 'divisao' && (
        <>
          <DishTitle>Como dividir?</DishTitle>
          {options.map((s) => (
            <Choice
              key={s.key}
              icon={split === s.key ? 'radio-button-on' : 'radio-button-off'}
              title={s.name}
              text={s.description}
              badge={s.templates
                .slice(0, Math.min(s.templates.length, days))
                .map((_, i) => String.fromCharCode(65 + i))
                .join(' · ')}
              selected={split === s.key}
              onPress={() => setSplit(s.key)}
            />
          ))}
        </>
      )}

      {step === 'foco' && (
        <>
          <DishTitle>Quer dar ênfase a algo?</DishTitle>
          <Text tone="secondary">Opcional. Os grupos escolhidos ganham um exercício a mais.</Text>
          <View style={styles.wrap}>
            {FOCUS.map((f) => {
              const on = focus.includes(f.key);
              return (
                <Pressable
                  key={f.key}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => setFocus(on ? focus.filter((x) => x !== f.key) : [...focus, f.key])}
                  style={[styles.chip, on && styles.chipOn]}>
                  <Text style={[styles.chipText, { color: on ? colors.onLime : colors.ink2 }]}>{f.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {step === 'revisao' && plan && (
        <>
          <DishTitle>Seu treino</DishTitle>
          {plans.length > 1 && (
            <SegmentedTabs
              options={plans.map((p) => ({ key: p.id, label: p.name.replace('Treino ', '') }))}
              value={plan.id}
              onChange={setTab}
              height={46}
            />
          )}
          <View>
            <Text style={styles.planFocus}>{plan.focus}</Text>
            <Text variant="caption" tone="muted">
              {plan.name} · {plan.weekdays.map((d) => WEEKDAY_SHORT[d]).join(', ')} · {plan.exercises.length} exercícios
            </Text>
          </View>
          <View>
            {plan.exercises.map((e) => (
              <View key={e.id} style={styles.exRow}>
                {e.catalogId ? <ExerciseAnim id={e.catalogId} still style={styles.thumb} /> : <View style={styles.thumb} />}
                <View style={styles.flex}>
                  <Text style={styles.exName}>{e.name}</Text>
                  <Text variant="caption" tone="muted">
                    {e.targetSets} × {e.targetReps} · {e.muscleGroup}
                  </Text>
                </View>
                <IconButton
                  icon="close"
                  label={`Tirar ${e.name}`}
                  size={32}
                  onPress={() => updatePlan({ ...plan, exercises: plan.exercises.filter((x) => x.id !== e.id) })}
                />
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => setPicking(true)}
              style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
              <Ionicons name="add" size={18} color={colors.lime} />
              <Text style={styles.addText}>Adicionar exercício</Text>
            </Pressable>
          </View>

          <Modal visible={picking} animationType="slide" onRequestClose={() => setPicking(false)}>
            <GlassModal
              badge={<SheetBadge icon="library-outline" label={`${plan.name.toUpperCase()} · EXERCÍCIOS`} />}
              onClose={() => setPicking(false)}
              footer={<NeonButton label={`Pronto · ${plan.exercises.length} exercícios`} onPress={() => setPicking(false)} />}>
              <ExerciseLibrary
                picked={new Set(plan.exercises.map((e) => e.catalogId ?? ''))}
                onToggle={(id) => updatePlan(toggleExercise(plan, id))}
              />
            </GlassModal>
          </Modal>
        </>
      )}
    </GlassModal>
  );
}

function Choice({
  icon,
  title,
  text,
  badge,
  selected,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  badge?: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} onPress={onPress}>
      {({ pressed }) => (
        <Glass
          strong={selected}
          style={[selected && styles.choiceOn, pressed && styles.pressed]}
          contentStyle={styles.choice}>
          <View style={styles.choiceIcon}>
            <Ionicons name={icon} size={22} color={colors.lime} />
          </View>
          <View style={styles.flex}>
            {badge ? <Text style={styles.choiceBadge}>{badge}</Text> : null}
            <Text style={styles.choiceTitle}>{title}</Text>
            <Text variant="caption" tone="secondary" style={styles.choiceText}>
              {text}
            </Text>
          </View>
        </Glass>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    minWidth: 0,
  },
  gapTop: {
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bigChip: {
    flex: 1,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.frostCardEdge,
    borderTopColor: colors.frostCardEdgeTop,
  },
  bigChipOn: {
    backgroundColor: colors.ink,
    borderColor: 'transparent',
  },
  bigChipText: {
    fontFamily: fonts.display.bold,
    fontSize: 26,
  },
  day: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dayOn: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  dayText: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
  },
  chip: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipOn: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  chipText: {
    fontFamily: fonts.body.semibold,
    fontSize: 14,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  choiceOn: {
    borderColor: colors.limeEdge,
    borderTopColor: colors.limeEdge,
  },
  choiceIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.limeWash,
    borderWidth: 1,
    borderColor: colors.limeEdge,
  },
  choiceTitle: {
    fontFamily: fonts.display.semibold,
    fontSize: 17,
    lineHeight: 22,
  },
  choiceBadge: {
    marginBottom: 3,
    fontFamily: fonts.body.bold,
    fontSize: 10.5,
    letterSpacing: 1.5,
    color: colors.lime,
  },
  choiceText: {
    marginTop: 3,
    lineHeight: 18,
  },
  planFocus: {
    fontFamily: fonts.display.semibold,
    fontSize: 20,
    lineHeight: 25,
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.glassFill,
  },
  exName: {
    fontFamily: fonts.body.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  addText: {
    fontFamily: fonts.body.bold,
    fontSize: 15,
    color: colors.lime,
  },
  pressed: {
    opacity: 0.75,
  },
});
