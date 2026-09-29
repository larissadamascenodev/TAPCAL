import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  confirmDestructive,
  Glass,
  IconButton,
  Screen,
  Stepper,
  Text,
  toast,
} from '@/components/ui';
import { MapaMuscular } from '@/components/workout/MapaMuscular';
import { exercicioPorId, MUSCULO_LABELS } from '@/lib/exercicios';
import { formatDecimal, formatDuration, formatInt } from '@/lib/format';
import { tempoDeTreinoMs } from '@/lib/treino/met';
import { bateRecorde, proximoExercicio, recorde, repsLabel, seriesFeitas, ultimasSeries } from '@/lib/treino/plano';
import { historicoQueConta, seriesNaSemana, sugerirCarga, type Sugestao } from '@/lib/treino/progressao';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { ExercicioNoTreino, PlanoDeTreino, SessaoDeTreino, SessaoEmAndamento } from '@/types/treino';

const KG_STEP = 2.5;

/** Relógio que atualiza a cada segundo. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Sugestão da progressão de carga para o exercício (null = sem histórico). */
function progressao(ex: ExercicioNoTreino, past: SessaoDeTreino[], planos: PlanoDeTreino[]): Sugestao | null {
  const info = exercicioPorId(ex.exercicioId);
  return info ? sugerirCarga(ex, info, historicoQueConta(past, planos, ex.exercicioId)) : null;
}

/**
 * Carga e repetições iniciais: as da última série feita hoje; senão, a
 * sugestão da progressão (com base na última vez); senão, a carga inicial do plano.
 */
function suggestion(ex: ExercicioNoTreino, session: SessaoEmAndamento, past: SessaoDeTreino[], planos: PlanoDeTreino[]) {
  const here = session.series.filter((s) => s.exercicioNoTreinoId === ex.id).at(-1);
  if (here) return { kg: here.cargaKg, reps: here.reps };
  const sug = progressao(ex, past, planos);
  if (sug) return { kg: sug.cargaKg, reps: sug.repsAlvo };
  return { kg: ex.cargaInicialKg ?? 10, reps: ex.repsMin };
}

export default function TreinoSessaoScreen() {
  const { sessaoAtiva: session, planos, sessoes: past } = useAppStore();
  const { registrarSerie, apagarSerie, finalizarTreino, cancelarTreino, pausarTreino, retomarTreino } = useAppStore();
  // Vindo da lista de exercícios da aba Treino: abre direto naquele exercício.
  const { ex: exInicial } = useLocalSearchParams<{ ex?: string }>();
  const sexo = useAppStore((s) => s.profile?.sex);
  const plano = session ? planos.find((p) => p.id === session.planoId) : undefined;
  const doPlano = session ? plano?.treinos.find((t) => t.id === session.treinoDoDiaId) : undefined;
  // Na semana de alívio (plano da IA), menos séries e as mesmas cargas.
  const treino = doPlano && session && { ...doPlano, exercicios: doPlano.exercicios.map((e) => ({ ...e, series: seriesNaSemana(e.series, plano, session.data) })) };
  const now = useNow();

  const [index, setIndex] = useState(() => {
    if (!session || !treino) return 0;
    const pedido = exInicial ? treino.exercicios.findIndex((e) => e.id === exInicial) : -1;
    return pedido >= 0 ? pedido : proximoExercicio(treino, session);
  });
  const exercise = treino?.exercicios[index];
  const [input, setInput] = useState(() =>
    session && exercise ? suggestion(exercise, session, past, planos) : { kg: 10, reps: 10 },
  );
  const [restUntil, setRestUntil] = useState<number | null>(null);

  if (!session || !treino || !exercise) return <Redirect href="/treino" />;

  const info = exercicioPorId(exercise.exercicioId);
  const done = seriesFeitas(session, exercise.id);
  const exerciseDone = done >= exercise.series;
  const isLast = index === treino.exercicios.length - 1;
  const elapsed = tempoDeTreinoMs(session, now) / 1000;
  const pausado = !!session.pausadoEm;
  const restLeft = restUntil ? Math.ceil((restUntil - now) / 1000) : 0;
  const lastTime = ultimasSeries(past, exercise.exercicioId)?.series ?? [];
  const record = recorde(past, exercise.exercicioId);
  // A linha do motivo só aparece antes da primeira série do exercício hoje.
  const sugestao = done === 0 ? progressao(exercise, past, planos) : null;

  const goTo = (i: number) => {
    const ex = treino.exercicios[i];
    setIndex(i);
    setInput(suggestion(ex, session, past, planos));
    setRestUntil(null);
  };

  const finish = () => {
    const count = session.series.length;
    finalizarTreino();
    const kcal = useAppStore.getState().sessoes[0]?.kcal ?? 0;
    toast(count ? `Treino salvo · ${formatInt(kcal)} kcal no seu dia. Bom trabalho!` : 'Treino encerrado sem séries');
    router.back();
  };

  const completeSet = () => {
    // Recorde conta contra os treinos anteriores e as séries já feitas hoje.
    const isRecord = bateRecorde([...past, session], exercise.exercicioId, input.kg, input.reps);
    registrarSerie(exercise.id, input.kg, input.reps);
    toast(isRecord ? `Novo recorde: ${formatDecimal(input.kg)} kg` : 'Série registrada');
    if (done + 1 < exercise.series) setRestUntil(Date.now() + exercise.descansoSeg * 1000);
  };

  const onMain = () => {
    if (!exerciseDone) return completeSet();
    if (!isLast) return goTo(index + 1);
    finish();
  };

  const openOptions = () => {
    const cancel = () =>
      confirmDestructive('Descartar treino?', 'As séries de hoje não serão salvas.', 'Descartar', () => {
        cancelarTreino();
        router.back();
      });
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.('Finalizar e salvar o treino?')) finish();
      return;
    }
    Alert.alert('Treino', undefined, [
      { text: 'Finalizar e salvar', onPress: finish },
      { text: 'Descartar treino', style: 'destructive', onPress: cancel },
      { text: 'Voltar', style: 'cancel' },
    ]);
  };

  const exSets = session.series.filter((s) => s.exercicioNoTreinoId === exercise.id);
  const rows = Array.from({ length: Math.max(exercise.series, exSets.length) }, (_, i) => exSets[i] ?? null);
  const mainLabel = !exerciseDone ? `Concluir série ${done + 1}` : !isLast ? 'Próximo exercício' : 'Finalizar treino';
  const reps = repsLabel(exercise);

  return (
    <Screen withTabBar={false}>
      <View style={styles.top}>
        <IconButton icon="chevron-down" label="Minimizar" onPress={() => router.back()} />
        <Pressable
          style={[styles.clock, pausado && styles.clockPausado]}
          accessibilityRole="button"
          accessibilityLabel={`Tempo de treino ${formatDuration(elapsed)}${pausado ? ', pausado' : ''}. Toque para ${pausado ? 'continuar' : 'pausar'}`}
          onPress={pausado ? retomarTreino : pausarTreino}>
          <Ionicons name={pausado ? 'play' : 'pause'} size={13} color={pausado ? colors.lime : colors.ink2} />
          <Text style={[styles.clockText, pausado && { color: colors.ink3 }]}>{formatDuration(elapsed)}</Text>
        </Pressable>
        <IconButton icon="ellipsis-horizontal" label="Opções do treino" onPress={openOptions} />
      </View>

      <View style={styles.progress} accessibilityLabel={`Exercício ${index + 1} de ${treino.exercicios.length}`}>
        {treino.exercicios.map((ex, i) => (
          <Pressable
            key={ex.id}
            onPress={() => goTo(i)}
            accessibilityRole="button"
            accessibilityLabel={`Ir para ${exercicioPorId(ex.exercicioId)?.nome ?? `exercício ${i + 1}`}`}
            hitSlop={{ top: 12, bottom: 12 }}
            style={[styles.seg, (i === index || seriesFeitas(session, ex.id) >= ex.series) && styles.segOn]}
          />
        ))}
      </View>

      <View style={styles.titleBlock}>
        <Text variant="label" tone="muted">
          Exercício {index + 1} de {treino.exercicios.length}
          {info ? ` · ${MUSCULO_LABELS[info.musculoPrincipal]}` : ''}
        </Text>
        <Text style={styles.exName}>{info?.nome ?? 'Exercício'}</Text>
      </View>

      {info && (
        <View style={styles.anim}>
          <MapaMuscular principal={info.musculoPrincipal} secundarios={info.musculosSecundarios} sexo={sexo} altura={180} />
        </View>
      )}

      <Glass flush contentStyle={styles.stage}>
        <Info
          icon="time-outline"
          text={
            lastTime.length
              ? `Última vez: ${lastTime.map((s) => `${formatDecimal(s.cargaKg)} kg × ${s.reps}`).join(' · ')}`
              : 'Primeira vez neste exercício'
          }
        />
        <Info icon="trophy-outline" text={record ? `Recorde: ${formatDecimal(record.cargaKg)} kg × ${record.reps}` : 'Sem recorde ainda'} />
        <Info icon="flag-outline" text={`Meta: ${exercise.series} × ${reps} · descanso ${exercise.descansoSeg} s`} />
        {exercise.observacao ? <Info icon="chatbubble-ellipses-outline" text={exercise.observacao} /> : null}
      </Glass>

      {!exerciseDone && (
        <View style={styles.inputs}>
          <Glass flush style={styles.inputCard} contentStyle={styles.input}>
            <Text variant="label" tone="muted">
              Carga
            </Text>
            <Text style={styles.inputValue}>
              {formatDecimal(input.kg)}
              <Text variant="caption" tone="muted">
                {' '}kg
              </Text>
            </Text>
            <Stepper
              label="carga"
              onMinus={() => setInput((v) => ({ ...v, kg: Math.max(0, v.kg - KG_STEP) }))}
              onPlus={() => setInput((v) => ({ ...v, kg: v.kg + KG_STEP }))}
            />
          </Glass>
          <Glass flush style={styles.inputCard} contentStyle={styles.input}>
            <Text variant="label" tone="muted">
              Repetições
            </Text>
            <Text style={styles.inputValue}>{input.reps}</Text>
            <Stepper
              label="repetições"
              onMinus={() => setInput((v) => ({ ...v, reps: Math.max(1, v.reps - 1) }))}
              onPlus={() => setInput((v) => ({ ...v, reps: v.reps + 1 }))}
            />
          </Glass>
        </View>
      )}

      {!exerciseDone && sugestao && (
        <View style={[styles.motivo, sugestao.tipo === 'subir' || sugestao.tipo === 'mais-reps' ? styles.motivoSobe : null]} accessibilityLiveRegion="polite">
          <Ionicons
            name={sugestao.tipo === 'subir' || sugestao.tipo === 'mais-reps' ? 'trending-up' : sugestao.tipo === 'reduzir' ? 'trending-down' : 'repeat'}
            size={16}
            color={sugestao.tipo === 'subir' || sugestao.tipo === 'mais-reps' ? colors.lime : colors.ink2}
          />
          <Text variant="caption" style={styles.motivoText}>
            {sugestao.motivo}
          </Text>
        </View>
      )}

      <View style={styles.sets}>
        {rows.map((set, i) => {
          const current = !set && i === done;
          return (
            <Pressable
              key={set ? `s${set.numero}` : `p${i}`}
              disabled={!set}
              onLongPress={() =>
                set &&
                confirmDestructive('Apagar série?', `${formatDecimal(set.cargaKg)} kg × ${set.reps}`, 'Apagar', () =>
                  apagarSerie(exercise.id, set.numero),
                )
              }
              accessibilityHint={set ? 'Toque e segure para apagar' : undefined}
              style={[styles.setRow, current && styles.setCurrent]}>
              <Text style={[styles.setNum, current && { color: colors.lime2 }]}>{i + 1}</Text>
              <Text variant="bodyStrong" style={styles.setValue} tone={set || current ? 'primary' : 'muted'}>
                {set
                  ? `${formatDecimal(set.cargaKg)} kg × ${set.reps}`
                  : current
                    ? `${formatDecimal(input.kg)} kg × ${input.reps}`
                    : `${reps} reps`}
              </Text>
              <View style={[styles.check, set && styles.checkDone]}>
                {set && <Ionicons name="checkmark" size={14} color={colors.ok} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {restLeft > 0 && (
        <View style={styles.rest}>
          <View>
            <Text style={styles.restTime}>{formatDuration(restLeft)}</Text>
            <Text variant="caption" tone="secondary">
              Descanso · próxima série
            </Text>
          </View>
          <Pressable onPress={() => setRestUntil(null)} style={styles.skip} accessibilityRole="button">
            <Text variant="caption" style={styles.skipText}>
              Pular
            </Text>
          </Pressable>
        </View>
      )}

      <Button
        label={mainLabel}
        fullWidth
        icon={<Ionicons name={exerciseDone && !isLast ? 'arrow-forward' : 'checkmark'} size={18} color={colors.onLime} />}
        onPress={onMain}
        style={styles.main}
      />
    </Screen>
  );
}

function Info({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.info}>
      <Ionicons name={icon} size={15} color={colors.ink3} />
      <Text variant="caption" tone="secondary" style={styles.infoText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  clock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 42,
    paddingHorizontal: spacing.lg,
    borderRadius: 21,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  clockPausado: {
    borderColor: colors.limeEdge,
  },
  clockText: {
    fontFamily: fonts.display.semibold,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  progress: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.xs,
  },
  seg: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.track,
  },
  segOn: {
    backgroundColor: colors.lime,
  },
  titleBlock: {
    marginTop: spacing.sm,
    gap: 6,
  },
  anim: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.glassSubtle,
  },
  exName: {
    fontFamily: fonts.display.bold,
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: -1.1,
  },
  stage: {
    padding: spacing.lg,
    gap: 10,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
  },
  inputs: {
    flexDirection: 'row',
    gap: 10,
  },
  motivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  motivoSobe: {
    backgroundColor: colors.limeWash,
    borderColor: colors.limeEdge,
  },
  motivoText: {
    flex: 1,
    fontFamily: fonts.body.semibold,
    color: colors.ink,
  },
  inputCard: {
    flex: 1,
  },
  input: {
    padding: 14,
    alignItems: 'center',
  },
  inputValue: {
    marginTop: 6,
    marginBottom: 10,
    fontFamily: fonts.display.bold,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  sets: {
    gap: 6,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: radius.md + 2,
    backgroundColor: colors.glassSubtle,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  setCurrent: {
    borderColor: colors.limeEdge,
    backgroundColor: colors.limeWash,
  },
  setNum: {
    width: 20,
    fontFamily: fonts.display.semibold,
    color: colors.ink3,
  },
  setValue: {
    flex: 1,
    fontSize: 14,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.handle,
  },
  checkDone: {
    borderWidth: 0,
    backgroundColor: colors.okFill,
  },
  rest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.irisTint,
    borderWidth: 1,
    borderColor: colors.irisEdge,
  },
  restTime: {
    fontFamily: fonts.display.semibold,
    fontSize: 22,
    lineHeight: 26,
    fontVariant: ['tabular-nums'],
  },
  skip: {
    marginLeft: 'auto',
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    justifyContent: 'center',
    backgroundColor: colors.navActive,
  },
  skipText: {
    fontFamily: fonts.body.bold,
  },
  main: {
    height: 58,
    marginTop: spacing.xs,
  },
});
