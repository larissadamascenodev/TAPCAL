import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';

import { BackdropGlow } from '@/components/ui/BackdropGlow';
import { confirmDestructive, Glass, IconButton, NeonButton, Text, toast } from '@/components/ui';
import { MapaMuscular } from '@/components/workout/MapaMuscular';
import { exercicioPorId, MUSCULO_LABELS } from '@/lib/exercicios';
import { formatDecimal, formatDuration, formatInt } from '@/lib/format';
import { tempoDeTreinoMs } from '@/lib/treino/met';
import { bateRecorde, proximoExercicio, recorde, repsLabel, seriesFeitas, ultimasSeries } from '@/lib/treino/plano';
import { seriesNaSemana, sugestaoDoExercicio, valoresDaProximaSerie } from '@/lib/treino/progressao';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { SerieFeita } from '@/types/treino';

const KG_STEP = 2.5;
/** Palco (animação do exercício ou o descanso): mesma altura nos dois, para nada pular. */
const PALCO = 300;
const ANEL = 188;
const ANEL_R = 84;
const ANEL_C = 2 * Math.PI * ANEL_R;

/** Relógio que atualiza a cada segundo. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const hora = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * Treino ao vivo: os tracinhos dos exercícios, o palco (desenho dos músculos
 * ou, depois de uma série, o descanso contando), carga e repetições, as
 * séries em linha do tempo e o botão de concluir, fixo embaixo.
 */
export default function TreinoSessaoScreen() {
  const insets = useSafeAreaInsets();
  const { sessaoAtiva: session, planos, sessoes: past } = useAppStore();
  const { registrarSerie, apagarSerie, finalizarTreino, cancelarTreino, pausarTreino, retomarTreino } = useAppStore();
  // Vindo da aba Treino: abre direto no exercício tocado.
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
  const [input, setInput] = useState(() => (session && exercise ? valoresDaProximaSerie(exercise, session, past, planos) : { kg: 10, reps: 10 }));
  const [descanso, setDescanso] = useState<{ ate: number; total: number } | null>(null);

  if (!session || !treino || !exercise) return <Redirect href="/treino" />;

  const info = exercicioPorId(exercise.exercicioId);
  const done = seriesFeitas(session, exercise.id);
  const exerciseDone = done >= exercise.series;
  const isLast = index === treino.exercicios.length - 1;
  const elapsed = tempoDeTreinoMs(session, now) / 1000;
  const pausado = !!session.pausadoEm;
  const restante = descanso ? Math.max(0, Math.ceil((descanso.ate - now) / 1000)) : 0;
  const descansando = restante > 0 && !exerciseDone;
  const lastTime = ultimasSeries(past, exercise.exercicioId)?.series ?? [];
  const record = recorde(past, exercise.exercicioId);
  const sugestao = done === 0 ? sugestaoDoExercicio(exercise, past, planos) : null;
  const reps = repsLabel(exercise);

  const goTo = (i: number) => {
    const ex = treino.exercicios[i];
    setIndex(i);
    setInput(valoresDaProximaSerie(ex, session, past, planos));
    setDescanso(null);
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
    if (done + 1 < exercise.series) setDescanso({ ate: Date.now() + exercise.descansoSeg * 1000, total: exercise.descansoSeg });
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

  const ajustarDescanso = (seg: number) =>
    setDescanso((d) => (d ? { ate: Math.max(Date.now() + 1000, d.ate + seg * 1000), total: Math.max(d.total, Math.ceil((d.ate + seg * 1000 - Date.now()) / 1000)) } : d));

  const exSets = session.series.filter((s) => s.exercicioNoTreinoId === exercise.id);
  const rows = Array.from({ length: Math.max(exercise.series, exSets.length) }, (_, i) => exSets[i] ?? null);
  const mainLabel = !exerciseDone ? `Concluir série ${done + 1}` : !isLast ? 'Próximo exercício' : 'Finalizar treino';

  return (
    <View style={styles.root}>
      <BackdropGlow forca={0.35} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}>
        {/* Topo: minimizar, tempo de treino (toque pausa) e opções */}
        <View style={styles.top}>
          <IconButton icon="chevron-down" label="Minimizar" onPress={() => router.back()} />
          <Pressable
            style={[styles.clock, pausado && styles.clockPausado]}
            accessibilityRole="button"
            accessibilityLabel={`Tempo de treino ${formatDuration(elapsed)}${pausado ? ', pausado' : ''}. Toque para ${pausado ? 'continuar' : 'pausar'}`}
            onPress={pausado ? retomarTreino : pausarTreino}>
            <View style={[styles.liveDot, pausado && styles.liveDotOff]} />
            <Text style={[styles.clockText, pausado && styles.clockTextOff]}>{formatDuration(elapsed)}</Text>
            <Ionicons name={pausado ? 'play' : 'pause'} size={12} color={colors.ink3} />
          </Pressable>
          <IconButton icon="ellipsis-horizontal" label="Opções do treino" onPress={openOptions} />
        </View>

        {/* Tracinhos: um por exercício, enchendo conforme as séries */}
        <View style={styles.progress} accessibilityLabel={`Exercício ${index + 1} de ${treino.exercicios.length}`}>
          {treino.exercicios.map((ex, i) => {
            const f = Math.min(1, seriesFeitas(session, ex.id) / ex.series);
            return (
              <Pressable
                key={ex.id}
                onPress={() => goTo(i)}
                accessibilityRole="button"
                accessibilityLabel={`Ir para ${exercicioPorId(ex.exercicioId)?.nome ?? `exercício ${i + 1}`}`}
                hitSlop={{ top: 12, bottom: 12 }}
                style={[styles.seg, i === index && styles.segAtual]}>
                <View style={[styles.segFill, { width: `${f * 100}%` }]} />
              </Pressable>
            );
          })}
        </View>

        {/* Nome do exercício */}
        <View style={styles.titulo}>
          <Text style={styles.eyebrow}>
            Exercício {index + 1} de {treino.exercicios.length}
            {info ? ` · ${MUSCULO_LABELS[info.musculoPrincipal]}` : ''}
          </Text>
          <Text style={styles.exName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
            {info?.nome ?? 'Exercício'}
          </Text>
        </View>

        {/* Palco: desenho dos músculos, ou o descanso contando */}
        <Glass flush style={styles.palcoGlass} contentStyle={styles.palco}>
          {descansando && descanso ? (
            <Animated.View key="descanso" entering={FadeIn.duration(220)} exiting={FadeOut.duration(160)} style={styles.descanso}>
              <View style={styles.anel}>
                <Svg width={ANEL} height={ANEL}>
                  <G rotation={-90} origin={`${ANEL / 2}, ${ANEL / 2}`}>
                    <Circle cx={ANEL / 2} cy={ANEL / 2} r={ANEL_R} fill="none" stroke={colors.track} strokeWidth={8} />
                    <Circle
                      cx={ANEL / 2}
                      cy={ANEL / 2}
                      r={ANEL_R}
                      fill="none"
                      stroke={colors.lime}
                      strokeWidth={8}
                      strokeLinecap="round"
                      strokeDasharray={`${(restante / descanso.total) * ANEL_C} ${ANEL_C}`}
                    />
                  </G>
                </Svg>
                <View style={styles.anelCentro}>
                  <Text style={styles.anelRotulo}>DESCANSO</Text>
                  <Text style={styles.anelTempo} accessibilityLiveRegion="polite">
                    {formatDuration(restante)}
                  </Text>
                </View>
              </View>
              <Text variant="caption" tone="secondary">
                Próxima: série {done + 1} · {formatDecimal(input.kg)} kg × {input.reps}
              </Text>
              <View style={styles.descansoBtns}>
                <Pill label="−15 s" onPress={() => ajustarDescanso(-15)} />
                <Pill label="Pular" forte onPress={() => setDescanso(null)} />
                <Pill label="+15 s" onPress={() => ajustarDescanso(15)} />
              </View>
            </Animated.View>
          ) : (
            <Animated.View key="corpo" entering={FadeIn.duration(220)} exiting={FadeOut.duration(160)} style={styles.corpo}>
              {info && <MapaMuscular principal={info.musculoPrincipal} secundarios={info.musculosSecundarios} sexo={sexo} altura={PALCO - 60} />}
              {info && (
                <View style={styles.musculos}>
                  <View style={[styles.musculo, styles.musculoPrincipal]}>
                    <View style={[styles.musculoCor, { backgroundColor: colors.musclePrimary }]} />
                    <Text style={styles.musculoText}>{MUSCULO_LABELS[info.musculoPrincipal]}</Text>
                  </View>
                  {info.musculosSecundarios.slice(0, 2).map((m) => (
                    <View key={m} style={styles.musculo}>
                      <View style={[styles.musculoCor, { backgroundColor: colors.muscleSecondary }]} />
                      <Text style={styles.musculoText}>{MUSCULO_LABELS[m]}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>
          )}
        </Glass>

        {/* Última vez, recorde e meta */}
        <View style={styles.fatos}>
          <Fato icon="time-outline" rotulo="Última vez" valor={lastTime.length ? lastTime.map((s) => `${formatDecimal(s.cargaKg)}×${s.reps}`).join(' · ') : 'primeira vez'} />
          <Fato icon="trophy-outline" rotulo="Recorde" valor={record ? `${formatDecimal(record.cargaKg)} kg × ${record.reps}` : '—'} />
          <Fato icon="flag-outline" rotulo="Meta" valor={`${exercise.series} × ${reps} · ${exercise.descansoSeg} s`} />
        </View>
        {sugestao && (
          <View style={styles.sugestao}>
            <Ionicons name={sugestao.tipo === 'reduzir' ? 'trending-down' : sugestao.tipo === 'manter' ? 'repeat' : 'trending-up'} size={15} color={colors.lime} />
            <Text variant="caption" style={styles.sugestaoText}>
              {sugestao.motivo}
            </Text>
          </View>
        )}
        {exercise.observacao ? (
          <Text variant="caption" tone="secondary">
            {exercise.observacao}
          </Text>
        ) : null}

        {/* Carga e repetições */}
        {!exerciseDone && (
          <Glass flush contentStyle={styles.entrada}>
            <Ajuste
              rotulo="Carga"
              valor={formatDecimal(input.kg)}
              unidade="kg"
              onMenos={() => setInput((v) => ({ ...v, kg: Math.max(0, v.kg - KG_STEP) }))}
              onMais={() => setInput((v) => ({ ...v, kg: v.kg + KG_STEP }))}
            />
            <View style={styles.entradaLinha} />
            <Ajuste
              rotulo="Repetições"
              valor={String(input.reps)}
              unidade={`meta ${reps}`}
              onMenos={() => setInput((v) => ({ ...v, reps: Math.max(1, v.reps - 1) }))}
              onMais={() => setInput((v) => ({ ...v, reps: v.reps + 1 }))}
            />
          </Glass>
        )}

        {/* Séries em linha do tempo */}
        <View style={styles.series}>
          {rows.map((set, i) => (
            <LinhaSerie
              key={set ? `s${set.numero}` : `p${i}`}
              numero={i + 1}
              serie={set}
              atual={!set && i === done}
              previa={!set && i === done ? `${formatDecimal(input.kg)} kg × ${input.reps}` : `${reps} repetições`}
              ultima={i === rows.length - 1}
              onApagar={
                set
                  ? () => confirmDestructive('Apagar série?', `${formatDecimal(set.cargaKg)} kg × ${set.reps}`, 'Apagar', () => apagarSerie(exercise.id, set.numero))
                  : undefined
              }
            />
          ))}
        </View>
      </ScrollView>

      {/* Botão fixo embaixo */}
      <View style={[styles.rodape, { paddingBottom: insets.bottom + spacing.md }]}>
        <NeonButton label={mainLabel} onPress={onMain} />
      </View>
    </View>
  );
}

function Pill({ label, forte, onPress }: { label: string; forte?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.pill, forte && styles.pillForte, pressed && styles.pressed]}>
      <Text style={[styles.pillText, forte && styles.pillTextForte]}>{label}</Text>
    </Pressable>
  );
}

function Fato({ icon, rotulo, valor }: { icon: keyof typeof Ionicons.glyphMap; rotulo: string; valor: string }) {
  return (
    <View style={styles.fato}>
      <View style={styles.fatoTopo}>
        <Ionicons name={icon} size={12} color={colors.ink3} />
        <Text style={styles.fatoRotulo}>{rotulo}</Text>
      </View>
      <Text style={styles.fatoValor} numberOfLines={2}>
        {valor}
      </Text>
    </View>
  );
}

/** Uma linha de ajuste: − valor + (carga ou repetições). */
function Ajuste({ rotulo, valor, unidade, onMenos, onMais }: { rotulo: string; valor: string; unidade: string; onMenos: () => void; onMais: () => void }) {
  return (
    <View style={styles.ajuste}>
      <RoundBtn icon="remove" label={`Diminuir ${rotulo.toLowerCase()}`} onPress={onMenos} />
      <View style={styles.ajusteMeio}>
        <Text style={styles.ajusteRotulo}>{rotulo}</Text>
        <Text style={styles.ajusteValor}>{valor}</Text>
        <Text style={styles.ajusteUnidade}>{unidade}</Text>
      </View>
      <RoundBtn icon="add" label={`Aumentar ${rotulo.toLowerCase()}`} onPress={onMais} />
    </View>
  );
}

function RoundBtn({ icon, label, onPress }: { icon: 'add' | 'remove'; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={6} onPress={onPress} style={({ pressed }) => [styles.round, pressed && styles.pressed]}>
      <Ionicons name={icon} size={24} color={colors.ink} />
    </Pressable>
  );
}

/** Série na linha do tempo: feita (selo com ✓), a atual (círculo tracejado) ou a que falta. */
function LinhaSerie({
  numero,
  serie,
  atual,
  previa,
  ultima,
  onApagar,
}: {
  numero: number;
  serie: SerieFeita | null;
  atual: boolean;
  previa: string;
  ultima: boolean;
  onApagar?: () => void;
}) {
  return (
    <Pressable
      disabled={!onApagar}
      onLongPress={onApagar}
      accessibilityHint={onApagar ? 'Toque e segure para apagar' : undefined}
      style={styles.serie}>
      <View style={styles.serieTrilho}>
        {serie ? (
          <Animated.View entering={ZoomIn.duration(260)} style={[styles.serieNo, styles.serieNoFeito]}>
            <Ionicons name="checkmark" size={15} color={colors.onLime} />
          </Animated.View>
        ) : (
          <View style={[styles.serieNo, atual && styles.serieNoAtual]}>
            <Text style={[styles.serieNum, atual && styles.serieNumAtual]}>{numero}</Text>
          </View>
        )}
        {!ultima && <View style={[styles.serieLinha, serie && styles.serieLinhaFeita]} />}
      </View>
      <View style={[styles.serieCorpo, atual && styles.serieCorpoAtual]}>
        <Text style={[styles.serieValor, !serie && !atual && styles.serieValorFutura]}>{serie ? `${formatDecimal(serie.cargaKg)} kg × ${serie.reps}` : previa}</Text>
        <Text style={styles.serieNota}>{serie ? `série ${numero} · ${hora(serie.concluidaEm)}` : atual ? `série ${numero} · agora` : `série ${numero}`}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 21,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.frostCardEdgeTop,
  },
  clockPausado: {
    borderColor: colors.line2,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.lime,
  },
  liveDotOff: {
    backgroundColor: colors.ink3,
  },
  clockText: {
    fontFamily: fonts.display.semibold,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  clockTextOff: {
    color: colors.ink3,
  },
  progress: {
    flexDirection: 'row',
    gap: 5,
    marginTop: spacing.xs,
  },
  seg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  segAtual: {
    height: 6,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  segFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.lime,
  },
  titulo: {
    gap: 4,
    marginTop: spacing.xs,
  },
  eyebrow: {
    fontFamily: fonts.body.bold,
    fontSize: 11.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  exName: {
    fontFamily: fonts.display.bold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -1,
  },
  palcoGlass: {
    borderRadius: radius.xl,
  },
  palco: {
    height: PALCO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corpo: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  musculos: {
    flexDirection: 'row',
    gap: 6,
  },
  musculo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  musculoPrincipal: {
    borderColor: colors.line,
  },
  musculoCor: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  musculoText: {
    fontFamily: fonts.body.bold,
    fontSize: 11.5,
    color: colors.ink2,
  },
  descanso: {
    alignItems: 'center',
    gap: spacing.md,
  },
  anel: {
    width: ANEL,
    height: ANEL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anelCentro: {
    position: 'absolute',
    alignItems: 'center',
  },
  anelRotulo: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.ink3,
  },
  anelTempo: {
    fontFamily: fonts.display.bold,
    fontSize: 46,
    lineHeight: 52,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  descansoBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pillForte: {
    backgroundColor: colors.glassFillStrong,
    borderColor: colors.line2,
  },
  pillText: {
    fontFamily: fonts.body.bold,
    fontSize: 13,
    color: colors.ink2,
  },
  pillTextForte: {
    color: colors.ink,
  },
  fatos: {
    flexDirection: 'row',
    gap: 8,
  },
  fato: {
    flex: 1,
    gap: 4,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.glassSubtle,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  fatoTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  fatoRotulo: {
    fontFamily: fonts.body.bold,
    fontSize: 10.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  fatoValor: {
    fontFamily: fonts.body.bold,
    fontSize: 13,
    lineHeight: 17,
    fontVariant: ['tabular-nums'],
  },
  sugestao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sugestaoText: {
    flex: 1,
    fontFamily: fonts.body.semibold,
    color: colors.ink,
  },
  entrada: {
    paddingVertical: 6,
  },
  entradaLinha: {
    height: 1,
    marginHorizontal: 16,
    backgroundColor: colors.lineSoft,
  },
  ajuste: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  ajusteMeio: {
    flex: 1,
    alignItems: 'center',
  },
  ajusteRotulo: {
    fontFamily: fonts.body.bold,
    fontSize: 10.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  ajusteValor: {
    fontFamily: fonts.display.bold,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -1.8,
    fontVariant: ['tabular-nums'],
  },
  ajusteUnidade: {
    fontFamily: fonts.body.semibold,
    fontSize: 12,
    color: colors.ink3,
  },
  round: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFillStrong,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.frostCardEdgeTop,
  },
  series: {
    marginTop: spacing.xs,
  },
  serie: {
    flexDirection: 'row',
    gap: 14,
  },
  serieTrilho: {
    width: 32,
    alignItems: 'center',
  },
  serieNo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  serieNoFeito: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  serieNoAtual: {
    borderColor: colors.lime,
    borderStyle: 'dashed',
    borderWidth: 2,
  },
  serieNum: {
    fontFamily: fonts.display.semibold,
    fontSize: 12,
    color: colors.ink3,
  },
  serieNumAtual: {
    color: colors.lime,
  },
  serieLinha: {
    flex: 1,
    width: 2,
    minHeight: 10,
    marginVertical: 4,
    borderRadius: 1,
    backgroundColor: colors.lineSoft,
  },
  serieLinhaFeita: {
    backgroundColor: colors.limeEdge,
  },
  serieCorpo: {
    flex: 1,
    marginVertical: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
  },
  serieCorpoAtual: {
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  serieValor: {
    fontFamily: fonts.display.semibold,
    fontSize: 17,
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
  },
  serieValorFutura: {
    color: colors.ink3,
  },
  serieNota: {
    fontFamily: fonts.body.medium,
    fontSize: 12,
    color: colors.ink3,
  },
  rodape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
});
