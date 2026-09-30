import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { BackdropGlow } from '@/components/ui/BackdropGlow';
import { confirmDestructive, Glass, IconButton, NeonButton, Text, toast } from '@/components/ui';
import { LinhaAoVivo } from '@/components/workout/LinhaAoVivo';
import { MapaMuscular } from '@/components/workout/MapaMuscular';
import { exercicioPorId, MUSCULO_LABELS } from '@/lib/exercicios';
import { formatDecimal, formatDuration, formatInt } from '@/lib/format';
import { tempoDeTreinoMs } from '@/lib/treino/met';
import { bateRecorde, proximoExercicio, repsLabel, seriesFeitas, treinoResolvido, ultimasSeries } from '@/lib/treino/plano';
import { mudarSeries } from '@/lib/treino/editor';
import { AJUSTE_KG, seriesNaSemana, sugestaoDoExercicio, valoresDaProximaSerie } from '@/lib/treino/progressao';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, gradients, radius, spacing } from '@/theme/theme';
import type { Equipamento, SerieFeita } from '@/types/treino';

/** Altura do card do corpo. */
const PALCO = 272;

type IconeNome = React.ComponentProps<typeof Ionicons>['name'];

// Troca série ↔ descanso no card: o conteúdo novo cresce de leve enquanto aparece.
const ENTRA = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.94 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: Easing.out(Easing.cubic) },
}).duration(380);

/** O que a carga quer dizer, pelo equipamento do exercício. */
function subDaCarga(equipamentos: readonly Equipamento[] | undefined): string {
  if (equipamentos?.includes('halteres')) return 'em cada halter';
  if (equipamentos?.includes('barra')) return 'total na barra';
  if (equipamentos?.includes('peso-corporal')) return 'peso extra';
  return 'no aparelho';
}

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
  const { atualizarPlano, registrarSerie, apagarSerie, finalizarTreino, cancelarTreino, pausarTreino, retomarTreino, iniciarDescanso, ajustarDescanso, pularDescanso } = useAppStore();
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
    if (done + 1 < exercise.series) return iniciarDescanso(exercise.descansoSeg);
    // Última série do exercício: descansa e já mostra o próximo (a carga dele aparece no descanso).
    const depois = useAppStore.getState().sessaoAtiva;
    if (!depois || treinoResolvido(treino, depois)) return;
    const prox = proximoExercicio(treino, depois);
    iniciarDescanso(exercise.descansoSeg);
    setIndex(prox);
    setInput(valoresDaProximaSerie(treino.exercicios[prox], depois, past, planos));
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

  // Mais uma série: muda no treino salvo (até 10).
  const noPlano = doPlano?.exercicios.find((e) => e.id === exercise.id);
  const podeSomar = !!noPlano && noPlano.series < 10;
  const adicionarSerie = () => {
    if (!plano || !doPlano) return;
    atualizarPlano({ ...plano, treinos: plano.treinos.map((t) => (t.id === doPlano.id ? mudarSeries(t, exercise.id, 1, done) : t)) });
    const total = exercise.series + 1;
    toast.card({
      titulo: `Série ${total} adicionada`,
      detalhe: `${formatDecimal(input.kg)} kg × ${input.reps} · no padrão das anteriores`,
      icone: 'add',
      tracos: { total, feitos: done },
    });
  };

  const exSets = session.series.filter((s) => s.exercicioNoTreinoId === exercise.id);
  const rows = Array.from({ length: Math.max(exercise.series, exSets.length) }, (_, i) => exSets[i] ?? null);
  const mainLabel = !exerciseDone ? `Concluir série ${done + 1}` : !isLast ? 'Próximo exercício' : 'Finalizar treino';

  const melhorUltima = lastTime.reduce<SerieFeita | null>((m, s) => (!m || s.cargaKg > m.cargaKg || (s.cargaKg === m.cargaKg && s.reps > m.reps) ? s : m), null);

  return (
    <View style={styles.root}>
      <BackdropGlow />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
        {/* Topo: minimizar, "Exercício X de Y" com um tracinho por exercício, opções */}
        <View style={styles.top}>
          <IconButton icon="chevron-back" label="Minimizar" onPress={() => router.back()} />
          <View style={styles.topoMeio}>
            <Text style={styles.eyebrow}>
              Exercício {index + 1} de {treino.exercicios.length}
            </Text>
            <View style={styles.progress} accessibilityLabel={`Exercício ${index + 1} de ${treino.exercicios.length}`}>
              {treino.exercicios.map((ex, i) => {
                const feito = seriesFeitas(session, ex.id) >= ex.series;
                return (
                  <Pressable
                    key={ex.id}
                    onPress={() => goTo(i)}
                    accessibilityRole="button"
                    accessibilityLabel={`Ir para ${exercicioPorId(ex.exercicioId)?.nome ?? `exercício ${i + 1}`}`}
                    hitSlop={{ top: 12, bottom: 12, left: 2, right: 2 }}
                    style={[styles.seg, feito && styles.segFeito, i === index && styles.segAtual]}
                  />
                );
              })}
            </View>
          </View>
          <IconButton icon="ellipsis-horizontal" label="Opções do treino" onPress={openOptions} />
        </View>

        {/* Tempo do treino numa pílula com a linha correndo em volta (verde no treino, branca no descanso), como o card da aba */}
        <PilulaTempo sessao={session} descansando={descansando} tempo={formatDuration(elapsed)} descanso={descansando ? formatDuration(restante) : undefined} pausado={pausado} onPausar={pausado ? retomarTreino : pausarTreino} />

        {/* Nome do exercício no centro e os músculos que ele trabalha */}
        <View style={styles.titulo}>
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

        {/* Card: o corpo à esquerda; à direita a série da vez (ou o descanso), a meta e a última vez */}
        <Glass flush rounded={radius.xl} contentStyle={styles.palco}>
          {info && (
            <View style={styles.corpoLado}>
              <MapaMuscular principal={info.musculoPrincipal} secundarios={info.musculosSecundarios} sexo={sexo} altura={PALCO - 24} />
            </View>
          )}
          <View style={styles.palcoDiv} />
          <View style={styles.palcoDir}>
            {/* Lugar de altura fixa: a troca série ↔ descanso anima por cima, sem mexer nas linhas de baixo */}
            <View style={styles.palcoTopo}>
              <Animated.View key={descansando ? 'descanso' : exerciseDone ? 'feito' : 'serie'} entering={ENTRA} style={styles.palcoTopoConteudo}>
                {descansando && descanso ? (
                  <>
                    <Text style={styles.descRotulo}>Descanso</Text>
                    <Text style={styles.descTempo} accessibilityLiveRegion="polite">
                      {formatDuration(restante)}
                    </Text>
                    <Text style={styles.proximaText} numberOfLines={1}>
                      Próxima · {formatDecimal(input.kg)} kg × {input.reps}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.descRotulo}>{exerciseDone ? 'Feito' : 'Série atual'}</Text>
                    <Text style={styles.serieGrande}>
                      {Math.min(done + (exerciseDone ? 0 : 1), exercise.series)}
                      <Text style={styles.serieGrandeDe}>/{exercise.series}</Text>
                    </Text>
                  </>
                )}
              </Animated.View>
            </View>
            <View style={styles.palcoLinha} />
            <InfoLinha icone="locate-outline" rotulo="Meta" valor={`${exercise.series} × ${reps}`} />
            <View style={styles.palcoLinha} />
            <InfoLinha icone="sync-outline" rotulo="Última vez" valor={melhorUltima ? `${formatDecimal(melhorUltima.cargaKg)} kg × ${melhorUltima.reps}` : 'primeira vez'} />
          </View>
        </Glass>
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
              sub={subDaCarga(info?.equipamentos)}
              valor={formatDecimal(input.kg)}
              unidade="kg"
              onMenos={() => setInput((v) => ({ ...v, kg: Math.max(0, v.kg - AJUSTE_KG) }))}
              onMais={() => setInput((v) => ({ ...v, kg: v.kg + AJUSTE_KG }))}
            />
            <Ajuste
              rotulo="Repetições"
              sub="nesta série"
              valor={String(input.reps)}
              onMenos={() => setInput((v) => ({ ...v, reps: Math.max(1, v.reps - 1) }))}
              onMais={() => setInput((v) => ({ ...v, reps: v.reps + 1 }))}
            />
          </View>
        )}

        {/* Séries em linha do tempo: as que faltam (e as que forem adicionadas) seguem o padrão das anteriores */}
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
              previa={`${formatDecimal(input.kg)} kg × ${input.reps}`}
              ultima={i === rows.length - 1 && !podeSomar}
              onApagar={
                set ? () => confirmDestructive('Apagar série?', `${formatDecimal(set.cargaKg)} kg × ${set.reps}`, 'Apagar', () => apagarSerie(exercise.id, set.numero)) : undefined
              }
            />
          ))}
        </View>
        {/* Mais uma série: um + discreto na sequência da linha do tempo (fica salvo no treino); tirar é no editar exercício */}
        {podeSomar && (
          <Pressable accessibilityRole="button" accessibilityLabel="Adicionar uma série" onPress={adicionarSerie} style={({ pressed }) => [styles.serie, pressed && styles.pressed]}>
            <View style={styles.serieTrilho}>
              <View style={[styles.serieNo, styles.serieNoMais]}>
                <Ionicons name="add" size={14} color={colors.ink3} />
              </View>
            </View>
            <View style={styles.serieCorpo}>
              <Text style={styles.serieMaisText}>Adicionar série</Text>
            </View>
          </Pressable>
        )}
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

/** Linha do card: ícone num círculo, o rótulo pequeno e o valor. */
function InfoLinha({ icone, rotulo, valor }: { icone: IconeNome; rotulo: string; valor: string }) {
  return (
    <View style={styles.info}>
      <View style={styles.infoIcone}>
        <Ionicons name={icone} size={17} color={colors.ink2} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.infoRotulo}>{rotulo}</Text>
        <Text style={styles.infoValor} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {valor}
        </Text>
      </View>
    </View>
  );
}

/**
 * Pílula do tempo no topo: o estado (tempo de treino, descanso com o que
 * falta, pausado) em cima do tempo do treino, e pausar à direita. A linha em
 * volta é a mesma do card da aba Treino.
 */
function PilulaTempo({
  sessao,
  descansando,
  tempo,
  descanso,
  pausado,
  onPausar,
}: {
  sessao: NonNullable<ReturnType<typeof useAppStore.getState>['sessaoAtiva']>;
  descansando: boolean;
  tempo: string;
  /** Quanto falta do descanso ("1:29"), se estiver descansando. */
  descanso?: string;
  pausado: boolean;
  onPausar: () => void;
}) {
  const [tam, setTam] = useState({ w: 0, h: 0 });
  return (
    <View style={styles.pilulaWrap}>
      <View style={styles.pilula} onLayout={(e) => setTam({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {tam.w > 0 && <LinhaAoVivo sessao={sessao} descansando={descansando} largura={tam.w} altura={tam.h} raio={tam.h / 2} />}
        <View style={styles.pilulaMeio} accessible accessibilityLabel={`Tempo de treino ${tempo}${pausado ? ', pausado' : descanso ? `, descanso ${descanso}` : ''}`}>
          <Text style={[styles.pilulaRotulo, descanso && !pausado && styles.pilulaRotuloDescanso]} numberOfLines={1}>
            {pausado ? 'Pausado' : descanso ? `Descanso · ${descanso}` : 'Tempo de treino'}
          </Text>
          <Text style={[styles.pilulaTempo, pausado && styles.clockTextOff]}>{tempo}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={pausado ? 'Continuar o treino' : 'Pausar o treino'}
          onPress={onPausar}
          style={({ pressed }) => [styles.pilulaBtn, pausado && styles.pilulaBtnOn, pressed && styles.pressed]}>
          <Ionicons name={pausado ? 'play' : 'pause'} size={18} color={pausado ? colors.onLime : colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

/** Carga ou repetições: o rótulo e o que ele quer dizer em cima, o número grande e − | + numa pílula. */
function Ajuste({
  rotulo,
  sub,
  valor,
  unidade,
  onMenos,
  onMais,
}: {
  rotulo: string;
  sub: string;
  valor: string;
  unidade?: string;
  onMenos: () => void;
  onMais: () => void;
}) {
  return (
    <Glass flush rounded={radius.xl} style={styles.flex} contentStyle={styles.ajuste}>
      <Text style={styles.ajusteRotulo}>{rotulo}</Text>
      <Text style={styles.ajusteSub} numberOfLines={1}>
        {sub}
      </Text>
      <View style={styles.ajusteValorLinha}>
        <Text style={styles.ajusteValor}>{valor}</Text>
        {unidade ? <Text style={styles.ajusteUnidade}>{unidade}</Text> : null}
      </View>
      <View style={styles.pm}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Diminuir ${rotulo.toLowerCase()}`}
          onPress={onMenos}
          style={({ pressed }) => [styles.pmBtn, pressed && styles.pressed]}>
          <Ionicons name="remove" size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.pmDiv} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${rotulo.toLowerCase()}`}
          onPress={onMais}
          style={({ pressed }) => [styles.pmBtn, pressed && styles.pressed]}>
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
  clockTextOff: {
    color: colors.ink3,
  },
  progress: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  seg: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.track,
  },
  titulo: {
    alignItems: 'center',
    gap: 10,
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
    fontFamily: fonts.display.bold,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -1,
    textAlign: 'center',
  },
  musculos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  musculo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 32,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.frostCardEdgeTop,
  },
  musculoCor: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  musculoText: {
    fontFamily: fonts.body.semibold,
    fontSize: 13,
    color: colors.ink,
  },
  topoMeio: {
    alignItems: 'center',
  },
  segFeito: {
    backgroundColor: colors.ink,
  },
  segAtual: {
    backgroundColor: colors.lime,
  },
  pilulaWrap: {
    alignItems: 'center',
  },
  pilula: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 72,
    paddingLeft: 30,
    paddingRight: 11,
    borderRadius: 36,
    backgroundColor: colors.glassFillStrong,
  },
  pilulaTempo: {
    fontFamily: fonts.display.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'],
  },
  pilulaMeio: {
    minWidth: 128,
    alignItems: 'center',
  },
  pilulaRotulo: {
    fontFamily: fonts.body.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  pilulaRotuloDescanso: {
    color: colors.ink,
  },
  pilulaBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pilulaBtnOn: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  palcoDiv: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 6,
    backgroundColor: colors.lineSoft,
  },
  palcoDir: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 16,
    justifyContent: 'center',
  },
  palcoTopo: {
    height: 100,
  },
  palcoTopoConteudo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
  },
  palcoLinha: {
    height: 1,
    marginVertical: 12,
    backgroundColor: colors.lineSoft,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIcone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  infoRotulo: {
    fontFamily: fonts.body.bold,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  infoValor: {
    fontFamily: fonts.display.semibold,
    fontSize: 16,
    marginTop: 2,
  },
  palco: {
    flexDirection: 'row',
    alignItems: 'center',
    height: PALCO,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  corpoLado: {
    width: (PALCO - 24) / 2 + 20,
    alignItems: 'center',
  },
  serieGrande: {
    fontFamily: fonts.display.bold,
    fontSize: 58,
    lineHeight: 64,
    letterSpacing: -2.6,
    fontVariant: ['tabular-nums'],
  },
  serieGrandeDe: {
    fontSize: 28,
    color: colors.ink3,
    letterSpacing: -1,
  },
  descRotulo: {
    fontFamily: fonts.body.bold,
    fontSize: 10.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  descTempo: {
    fontFamily: fonts.display.bold,
    fontSize: 46,
    lineHeight: 54,
    letterSpacing: -2.2,
    fontVariant: ['tabular-nums'],
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
  ajusteSub: {
    fontFamily: fonts.body.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.ink3,
    marginTop: 2,
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
    justifyContent: 'center',
    gap: 4,
    marginTop: 6,
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
  serieNoMais: {
    borderStyle: 'dashed',
  },
  serieMaisText: {
    marginTop: 6,
    fontFamily: fonts.body.semibold,
    fontSize: 13,
    lineHeight: 21,
    color: colors.ink3,
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
