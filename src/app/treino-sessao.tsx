import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { BackdropGlow } from '@/components/ui/BackdropGlow';
import { confirmDestructive, Glass, IconButton, NeonButton, Text, toast } from '@/components/ui';
import { Mostrador } from '@/components/workout/Mostrador';
import { MapaMuscular } from '@/components/workout/MapaMuscular';
import { exercicioPorId, MUSCULO_LABELS } from '@/lib/exercicios';
import { formatDecimal, formatDuration, formatInt } from '@/lib/format';
import { tempoDeTreinoMs } from '@/lib/treino/met';
import { bateRecorde, proximoExercicio, recorde, repsLabel, seriesFeitas, ultimasSeries } from '@/lib/treino/plano';
import { AJUSTE_KG, seriesNaSemana, sugestaoDoExercicio, valoresDaProximaSerie } from '@/lib/treino/progressao';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, gradients, radius, spacing } from '@/theme/theme';
import type { SerieFeita } from '@/types/treino';

/** Palco (o corpo ou o descanso): mesma altura nos dois, para nada pular. */
const MOSTRADOR = 216;

/** Traços do mostrador no descanso: um por segundo até 2 min; acima disso, um a cada poucos segundos. */
const tracosDoDescanso = (total: number) => (total <= 120 ? Math.max(1, total) : Math.round(total / Math.ceil(total / 120)));

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
 * Treino ao vivo: os tracinhos dos exercícios, o nome e os músculos, o palco
 * (o corpo solto no fundo ou, depois de uma série, o mostrador do descanso),
 * a faixa com última vez, recorde e meta, carga e repetições lado a lado, as
 * séries em linha do tempo e o botão de concluir, fixo embaixo.
 */
export default function TreinoSessaoScreen() {
  const insets = useSafeAreaInsets();
  const { sessaoAtiva: session, planos, sessoes: past } = useAppStore();
  const { registrarSerie, apagarSerie, finalizarTreino, cancelarTreino, pausarTreino, retomarTreino, iniciarDescanso, ajustarDescanso, pularDescanso } = useAppStore();
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

  if (!session || !treino || !exercise) return <Redirect href="/treino" />;

  const info = exercicioPorId(exercise.exercicioId);
  const done = seriesFeitas(session, exercise.id);
  const exerciseDone = done >= exercise.series;
  const isLast = index === treino.exercicios.length - 1;
  const elapsed = tempoDeTreinoMs(session, now) / 1000;
  const pausado = !!session.pausadoEm;
  // O descanso fica no treino (a aba Treino mostra o mesmo tempo).
  const descanso = session.descansoAte ? { ate: Date.parse(session.descansoAte), total: session.descansoSeg ?? 60 } : null;
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
    pularDescanso();
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
    if (done + 1 < exercise.series) iniciarDescanso(exercise.descansoSeg);
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

  const melhorUltima = lastTime.reduce<SerieFeita | null>((m, s) => (!m || s.cargaKg > m.cargaKg || (s.cargaKg === m.cargaKg && s.reps > m.reps) ? s : m), null);
  const difUltima = melhorUltima ? input.kg - melhorUltima.cargaKg : null;

  return (
    <View style={styles.root}>
      <BackdropGlow />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}>
        {/* Topo: minimizar, tempo de treino (toque pausa) e opções */}
        <View style={styles.top}>
          <IconButton icon="chevron-down" label="Minimizar" onPress={() => router.back()} />
          <Pressable
            style={styles.clock}
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
                style={styles.seg}>
                <View style={[styles.segFill, i === index && styles.segFillAtual, { width: `${Math.max(f, i === index ? 0.12 : 0) * 100}%` }]} />
              </Pressable>
            );
          })}
        </View>

        {/* Nome do exercício e os músculos */}
        <View style={styles.titulo}>
          <Text style={styles.eyebrow}>
            Exercício {index + 1} de {treino.exercicios.length}
          </Text>
          <Text style={styles.exName} numberOfLines={2}>
            {info?.nome ?? 'Exercício'}
          </Text>
          {info && (
            <View style={styles.musculos}>
              {[info.musculoPrincipal, ...info.musculosSecundarios.slice(0, 2)].map((m, i) => (
                <View key={m} style={styles.musculo}>
                  <View style={[styles.musculoCor, { backgroundColor: i === 0 ? colors.musclePrimary : colors.muscleSecondary }]} />
                  <Text style={styles.musculoText}>{MUSCULO_LABELS[m]}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Palco: o mostrador (série da vez, ou o descanso contando) e o corpo ao lado */}
        <View style={styles.palco}>
          {descansando && descanso ? (
            <Animated.View key="descanso" entering={FadeIn.duration(220)} exiting={FadeOut.duration(160)}>
              {/* Os traços acendem no sentido do relógio conforme o descanso passa; o número desce. */}
              <Mostrador tamanho={MOSTRADOR} tracos={tracosDoDescanso(descanso.total)} aceso={1 - restante / descanso.total} cor={colors.tracoAceso}>
                <Text style={styles.descRotulo}>DESCANSO</Text>
                <Text style={styles.descTempo} accessibilityLiveRegion="polite">
                  {formatDuration(restante)}
                </Text>
                <Text style={styles.proximaText}>
                  Próxima · {formatDecimal(input.kg)} kg × {input.reps}
                </Text>
              </Mostrador>
            </Animated.View>
          ) : (
            <Animated.View key="serie" entering={FadeIn.duration(220)} exiting={FadeOut.duration(160)}>
              {/* Um traço por segundo, no sentido do relógio, como o card da aba. */}
              <Mostrador tamanho={MOSTRADOR} tracos={60} aceso={(Math.floor(elapsed) % 60) / 60}>
                <Text style={styles.descRotulo}>{exerciseDone ? 'FEITO' : 'SÉRIE'}</Text>
                <Text style={styles.serieGrande}>
                  {Math.min(done + (exerciseDone ? 0 : 1), exercise.series)}
                  <Text style={styles.serieGrandeDe}>/{exercise.series}</Text>
                </Text>
                <Text style={styles.proximaText}>{exerciseDone ? 'todas as séries' : `${formatDecimal(input.kg)} kg × ${input.reps}`}</Text>
              </Mostrador>
            </Animated.View>
          )}
          {info && (
            <View style={styles.corpoLado}>
              <MapaMuscular principal={info.musculoPrincipal} secundarios={info.musculosSecundarios} sexo={sexo} altura={MOSTRADOR - 20} />
            </View>
          )}
        </View>
        {descansando && descanso ? (
          <View style={styles.descansoBtns}>
            <Redondo label="−15" sub="s" onPress={() => ajustarDescanso(-15)} />
            <Pressable accessibilityRole="button" accessibilityLabel="Pular o descanso" onPress={pularDescanso} style={({ pressed }) => [styles.pular, pressed && styles.pressed]}>
              <Ionicons name="play-skip-forward" size={15} color={colors.onInk} />
              <Text style={styles.pularText} numberOfLines={1}>
                PULAR DESCANSO
              </Text>
            </Pressable>
            <Redondo label="+15" sub="s" onPress={() => ajustarDescanso(15)} />
          </View>
        ) : null}

        {/* Última vez, recorde e meta: uma faixa fina */}
        <View style={styles.fatos}>
          <Fato primeiro rotulo="Última vez" valor={melhorUltima ? `${formatDecimal(melhorUltima.cargaKg)} × ${melhorUltima.reps}` : 'primeira'} />
          <Fato rotulo="Recorde" valor={record ? `${formatDecimal(record.cargaKg)} kg` : '—'} />
          <Fato rotulo="Meta" valor={`${exercise.series} × ${reps}`} />
        </View>
        {sugestao && (
          <View style={styles.sugestao}>
            <Ionicons name={sugestao.tipo === 'reduzir' ? 'trending-down' : sugestao.tipo === 'manter' ? 'repeat' : 'trending-up'} size={15} color={colors.ink2} />
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

        {/* Carga e repetições, lado a lado */}
        {!exerciseDone && (
          <View style={styles.ajustes}>
            <Ajuste
              rotulo="Carga"
              valor={formatDecimal(input.kg)}
              unidade="kg"
              dica={difUltima === null ? 'primeira vez' : difUltima === 0 ? 'igual à última' : `${difUltima > 0 ? '+' : ''}${formatDecimal(difUltima)} kg da última`}
              onMenos={() => setInput((v) => ({ ...v, kg: Math.max(0, v.kg - AJUSTE_KG) }))}
              onMais={() => setInput((v) => ({ ...v, kg: v.kg + AJUSTE_KG }))}
            />
            <Ajuste
              rotulo="Repetições"
              valor={String(input.reps)}
              dica={`meta ${reps}`}
              onMenos={() => setInput((v) => ({ ...v, reps: Math.max(1, v.reps - 1) }))}
              onMais={() => setInput((v) => ({ ...v, reps: v.reps + 1 }))}
            />
          </View>
        )}

        {/* Séries em linha do tempo */}
        <View style={styles.seriesCab}>
          <Text style={styles.seriesTitulo}>Séries</Text>
          <Text variant="caption" tone="muted">
            {Math.min(done, exercise.series)} de {exercise.series}
          </Text>
        </View>
        <View>
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
      <View pointerEvents="box-none" style={styles.rodape}>
        <LinearGradient pointerEvents="none" colors={gradients.photoFade} style={StyleSheet.absoluteFill} />
        <View style={[styles.rodapeBtn, { paddingBottom: insets.bottom + spacing.md }]}>
          <NeonButton label={mainLabel} onPress={onMain} />
        </View>
      </View>
    </View>
  );
}

function Redondo({ label, sub, onPress }: { label: string; sub: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} segundos`} onPress={onPress} style={({ pressed }) => [styles.redondo, pressed && styles.pressed]}>
      <Text style={styles.redondoText}>
        {label} {sub}
      </Text>
    </Pressable>
  );
}

function Fato({ rotulo, valor, primeiro }: { rotulo: string; valor: string; primeiro?: boolean }) {
  return (
    <View style={[styles.fato, primeiro && styles.fatoPrimeiro]}>
      <Text style={styles.fatoRotulo}>{rotulo}</Text>
      <Text style={styles.fatoValor} numberOfLines={1}>
        {valor}
      </Text>
    </View>
  );
}

/** Carga ou repetições: número grande, a dica embaixo e − | + numa pílula. */
function Ajuste({
  rotulo,
  valor,
  unidade,
  dica,
  onMenos,
  onMais,
}: {
  rotulo: string;
  valor: string;
  unidade?: string;
  dica: string;
  onMenos: () => void;
  onMais: () => void;
}) {
  return (
    <Glass flush rounded={radius.xl} style={styles.flex} contentStyle={styles.ajuste}>
      <Text style={styles.ajusteRotulo}>{rotulo}</Text>
      <View style={styles.ajusteValorLinha}>
        <Text style={styles.ajusteValor}>{valor}</Text>
        {unidade ? <Text style={styles.ajusteUnidade}>{unidade}</Text> : null}
      </View>
      <Text style={styles.ajusteDica} numberOfLines={1}>
        {dica}
      </Text>
      <View style={styles.pm}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Diminuir ${rotulo.toLowerCase()}`} onPress={onMenos} style={({ pressed }) => [styles.pmBtn, pressed && styles.pressed]}>
          <Ionicons name="remove" size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.pmDiv} />
        <Pressable accessibilityRole="button" accessibilityLabel={`Aumentar ${rotulo.toLowerCase()}`} onPress={onMais} style={({ pressed }) => [styles.pmBtn, pressed && styles.pressed]}>
          <Ionicons name="add" size={22} color={colors.ink} />
        </Pressable>
      </View>
    </Glass>
  );
}

/** Série na linha do tempo: feita (✓), a atual (círculo tracejado) ou a que falta. */
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
    <Pressable disabled={!onApagar} onLongPress={onApagar} accessibilityHint={onApagar ? 'Toque e segure para apagar' : undefined} style={styles.serie}>
      <View style={styles.serieTrilho}>
        {serie ? (
          <Animated.View entering={ZoomIn.duration(260)} style={[styles.serieNo, styles.serieNoFeito]}>
            <Ionicons name="checkmark" size={13} color={colors.lime} />
          </Animated.View>
        ) : (
          <View style={[styles.serieNo, atual && styles.serieNoAtual]}>
            <Text style={[styles.serieNum, atual && styles.serieNumAtual]}>{numero}</Text>
          </View>
        )}
        {!ultima && <View style={[styles.serieLinha, serie && styles.serieLinhaFeita]} />}
      </View>
      <View style={styles.serieCorpo}>
        <Text style={[styles.serieValor, !serie && !atual && styles.serieValorFutura]}>{serie ? `${formatDecimal(serie.cargaKg)} kg × ${serie.reps}` : previa}</Text>
        <Text style={styles.serieNota}>{serie ? `série ${numero}` : atual ? 'agora' : `série ${numero}`}</Text>
      </View>
      {serie ? <Text style={styles.serieHora}>{hora(serie.concluidaEm)}</Text> : null}
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
  flex: {
    flex: 1,
    minWidth: 0,
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
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  segFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.ink,
  },
  segFillAtual: {
    backgroundColor: colors.lime,
  },
  titulo: {
    gap: 6,
    marginTop: spacing.xs,
  },
  eyebrow: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  exName: {
    fontFamily: fonts.display.semibold,
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: -0.7,
  },
  musculos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  musculo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  musculoCor: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  musculoText: {
    fontFamily: fonts.body.semibold,
    fontSize: 12.5,
    color: colors.ink2,
  },
  palco: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
  },
  corpoLado: {
    flex: 1,
    alignItems: 'center',
    marginRight: -spacing.sm,
  },
  serieGrande: {
    fontFamily: fonts.display.bold,
    fontSize: 54,
    lineHeight: 60,
    letterSpacing: -2.4,
    fontVariant: ['tabular-nums'],
  },
  serieGrandeDe: {
    fontSize: 26,
    color: colors.ink3,
    letterSpacing: -1,
  },
  descRotulo: {
    fontFamily: fonts.body.bold,
    fontSize: 10.5,
    letterSpacing: 2.2,
    color: colors.ink3,
  },
  descTempo: {
    fontFamily: fonts.display.bold,
    fontSize: 48,
    lineHeight: 54,
    letterSpacing: -2.4,
    fontVariant: ['tabular-nums'],
  },
  proxima: {
    marginTop: 4,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
  },
  proximaText: {
    fontFamily: fonts.body.bold,
    fontSize: 12,
    color: colors.ink2,
  },
  descansoBtns: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: -spacing.xs,
  },
  redondo: {
    width: 72,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.frostCardEdgeTop,
  },
  redondoText: {
    fontFamily: fonts.display.semibold,
    fontSize: 14,
    lineHeight: 17,
  },
  pular: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 58,
    paddingHorizontal: 10,
    flex: 1,
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: colors.ink,
  },
  pularText: {
    fontFamily: fonts.display.bold,
    fontSize: 11.5,
    letterSpacing: 0.8,
    color: colors.onInk,
  },
  fatos: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.lineSoft,
  },
  fato: {
    flex: 1,
    gap: 3,
    paddingHorizontal: 12,
    borderLeftWidth: 1,
    borderLeftColor: colors.lineSoft,
  },
  fatoPrimeiro: {
    borderLeftWidth: 0,
    paddingLeft: 0,
  },
  fatoRotulo: {
    fontFamily: fonts.body.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  fatoValor: {
    fontFamily: fonts.display.semibold,
    fontSize: 15,
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
    color: colors.ink2,
  },
  ajustes: {
    flexDirection: 'row',
    gap: 10,
  },
  ajuste: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  ajusteRotulo: {
    fontFamily: fonts.body.bold,
    fontSize: 10.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  ajusteValorLinha: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  ajusteValor: {
    fontFamily: fonts.display.bold,
    fontSize: 46,
    lineHeight: 52,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  ajusteUnidade: {
    fontFamily: fonts.body.bold,
    fontSize: 13,
    color: colors.ink3,
  },
  ajusteDica: {
    fontFamily: fonts.body.semibold,
    fontSize: 11.5,
    color: colors.ink3,
  },
  pm: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    height: 46,
    marginTop: 12,
    borderRadius: 23,
    overflow: 'hidden',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.frostCardEdgeTop,
  },
  pmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pmDiv: {
    width: 1,
    backgroundColor: colors.line,
  },
  seriesCab: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.sm,
  },
  seriesTitulo: {
    fontFamily: fonts.display.semibold,
    fontSize: 16,
  },
  serie: {
    flexDirection: 'row',
    gap: 14,
  },
  serieTrilho: {
    width: 26,
    alignItems: 'center',
  },
  serieNo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  serieNoFeito: {
    backgroundColor: colors.limeTint,
    borderColor: colors.limeEdge,
  },
  serieNoAtual: {
    borderColor: colors.lime,
    borderStyle: 'dashed',
    borderWidth: 2,
  },
  serieNum: {
    fontFamily: fonts.display.semibold,
    fontSize: 11,
    color: colors.ink3,
  },
  serieNumAtual: {
    color: colors.lime,
  },
  serieLinha: {
    flex: 1,
    width: 2,
    minHeight: 12,
    marginVertical: 4,
    borderRadius: 1,
    backgroundColor: colors.lineSoft,
  },
  serieLinhaFeita: {
    backgroundColor: colors.limeEdge,
  },
  serieCorpo: {
    flex: 1,
    paddingVertical: 6,
  },
  serieValor: {
    fontFamily: fonts.display.semibold,
    fontSize: 16,
    lineHeight: 21,
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
  serieHora: {
    marginTop: 12,
    fontFamily: fonts.body.bold,
    fontSize: 12,
    color: colors.ink3,
    fontVariant: ['tabular-nums'],
  },
  rodape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 36,
  },
  rodapeBtn: {
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.7,
  },
});
