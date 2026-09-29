import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TabPage } from '@/components/navigation/TabPage';
import { EmptyState, Glass, IconButton, NeonButton, SectionHeader, Text } from '@/components/ui';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { StatTile } from '@/components/ui/StatTile';
import { CapsulaAoVivo, HeroDescanso, HeroEmAndamento, HeroTreino } from '@/components/workout/HeroDoDia';
import { ListaExerciciosDoDia } from '@/components/workout/ListaExerciciosDoDia';
import { SemanaTreino } from '@/components/workout/SemanaTreino';
import { daysBetween, fromDateKey } from '@/lib/dates';
import { formatDayMonth, formatInt, formatTons, WEEKDAY_SHORT } from '@/lib/format';
import { minutosDaSessao } from '@/lib/treino/met';
import { concluidas, kcalEstimadas, minutosEstimados, numerosDaSemana, proximosTreinos, volume, volumePorDia } from '@/lib/treino/plano';
import { ehSemanaDeAlivio, horaDaProximaFase, semanaDoBloco, seriesNaSemana } from '@/lib/treino/progressao';
import { datasDaSemana, DIA_NOME, DIAS, diaDaData, estadoDoDia, notaFeitoEm, planoAtivo, type EstadoDoDia } from '@/lib/treino/semana';
import { currentWeightKg } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { DateKey } from '@/types';
import type { DiaSemana, PlanoDeTreino, SessaoDeTreino, TreinoDoDia } from '@/types/treino';

type Aba = 'exercicios' | 'cardio' | 'semana';
const ABAS: { key: Aba; label: string }[] = [
  { key: 'exercicios', label: 'Exercícios' },
  { key: 'cardio', label: 'Cardio' },
  { key: 'semana', label: 'Semana' },
];

/** Verde do fundo no Treino: bem mais fraco, para a tela ficar escura e de vidro. */
const BRILHO_TREINO = 0.35;

/** "Hoje", "Amanhã", "Ontem" ou "Qui, 02/10". */
function dayLabel(date: DateKey, today: DateKey): string {
  const diff = daysBetween(today, date);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  const wd = WEEKDAY_SHORT[fromDateKey(date).getDay()];
  return `${wd.charAt(0)}${wd.slice(1).toLowerCase()}, ${formatDayMonth(date)}`;
}

/** "segunda-feira", "sábado"… */
function diaCompleto(d: DiaSemana): string {
  return d === 'sab' || d === 'dom' ? DIA_NOME[d] : `${DIA_NOME[d]}-feira`;
}

const maiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Duração arredondada, sem as pausas ("48 min"; menos de 1 minuto vira "1 min"). */
function minutosLabel(s: Pick<SessaoDeTreino, 'inicio' | 'fim' | 'pausaMs'>): string {
  return `${Math.max(1, Math.round(minutosDaSessao(s.inicio, s.fim, s.pausaMs)))} min`;
}

/** Séries da semana (menos na semana de alívio do plano da IA). */
function naSemana(t: TreinoDoDia, plano: PlanoDeTreino | undefined, data: DateKey): TreinoDoDia {
  return { ...t, exercicios: t.exercicios.map((x) => ({ ...x, series: seriesNaSemana(x.series, plano, data) })) };
}

/**
 * Central de treino (layout "Foco no dia"): Meus treinos e a biblioteca no
 * topo, a semana, o corpo grande com os músculos do dia e o botão de iniciar,
 * e as abas Exercícios (linha do tempo), Cardio e Semana. Com o treino
 * rodando, aparece a cápsula com o tempo e o destaque vira o exercício atual.
 * O calendário nunca muda sozinho: o treino de segunda feito na terça continua
 * na segunda, marcado como "feito na terça".
 */
export default function TreinoScreen() {
  const state = useAppStore();
  const { today: day, planos, sessoes, sessaoAtiva, comecarTreino, pausarTreino, retomarTreino } = state;
  const sexo = state.profile?.sex;
  const today = day.date;
  const peso = currentWeightKg(state) ?? 70;
  const [dia, setDia] = useState<DiaSemana>(() => diaDaData(today));
  const [aba, setAba] = useState<Aba>('exercicios');

  const plano = planoAtivo(planos);
  const estados = useMemo(
    () => Object.fromEntries(DIAS.map((d) => [d, estadoDoDia(plano, sessoes, d, today)])) as Record<DiaSemana, EstadoDoDia>,
    [plano, sessoes, today],
  );
  const stats = useMemo(() => numerosDaSemana(plano, sessoes, today), [plano, sessoes, today]);
  const vol = useMemo(() => volumePorDia(sessoes, today), [sessoes, today]);
  const upcoming = useMemo(() => proximosTreinos(plano, sessoes, today, 3), [plano, sessoes, today]);
  const done = useMemo(() => concluidas(sessoes, 5), [sessoes]);
  const maxVol = Math.max(1, ...vol.map((v) => v.volumeKg));
  const semana = datasDaSemana(today);

  const start = (t: TreinoDoDia, ex?: string) => {
    comecarTreino(t.id);
    router.push(ex ? { pathname: '/treino-sessao', params: { ex } } : '/treino-sessao');
  };
  const abrirSessao = (ex?: string) => router.push(ex ? { pathname: '/treino-sessao', params: { ex } } : '/treino-sessao');

  const header = (
    <View style={styles.header}>
      <View style={styles.flex}>
        <Text style={styles.h1}>Treino</Text>
        {plano && (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {plano.nome} · {plano.treinos.length} {plano.treinos.length === 1 ? 'dia' : 'dias'} por semana
            {semanaDoBloco(plano, today) ? ` · semana ${semanaDoBloco(plano, today)} de ${plano.ia?.semanasNoBloco}` : ''}
          </Text>
        )}
      </View>
      <IconButton icon="library-outline" label="Biblioteca de exercícios" onPress={() => router.push('/exercicios')} />
      <IconButton icon="albums-outline" label="Meus treinos: criar, editar, duplicar e apagar" onPress={() => router.push('/meus-treinos')} />
    </View>
  );

  if (!plano) {
    return (
      <TabPage brilho={BRILHO_TREINO}>
        {header}
        <EmptyState icon="barbell-outline" title="Monte seu treino" message="Escolha os dias e os exercícios, ou deixe a IA montar para você." />
        <NeonButton label="Criar treino" onPress={() => router.push('/treino-novo')} />
        {planos.length > 0 && (
          <Text tone="secondary" style={styles.center} onPress={() => router.push('/meus-treinos')}>
            Ou ative um dos seus treinos salvos
          </Text>
        )}
      </TabPage>
    );
  }

  const e = estados[dia];
  const alivio = ehSemanaDeAlivio(plano, today);
  const t = e.treino && naSemana(e.treino, plano, today);
  const data = semana[DIAS.indexOf(dia)];
  const kicker = e.hoje ? 'Hoje' : maiuscula(DIA_NOME[dia]);

  // Treino em andamento: aparece em hoje e no dia a que o treino pertence.
  const planoDaSessao = sessaoAtiva ? planos.find((p) => p.id === sessaoAtiva.planoId) : undefined;
  const doAtivo = sessaoAtiva && planoDaSessao?.treinos.find((x) => x.id === sessaoAtiva.treinoDoDiaId);
  const treinoAtivo = doAtivo && sessaoAtiva ? naSemana(doAtivo, planoDaSessao, sessaoAtiva.data) : null;
  const mostraAtivo = !!(sessaoAtiva && treinoAtivo && (e.hoje || sessaoAtiva.diaPlanejado === dia));
  const lista = mostraAtivo ? treinoAtivo : t;
  const modo = mostraAtivo ? 'andamento' : e.tipo === 'feito' ? 'feito' : 'planejado';
  const seriesDaLista = mostraAtivo && sessaoAtiva ? sessaoAtiva.series : e.tipo === 'feito' && e.sessao ? e.sessao.series : [];
  const diaDaLista = mostraAtivo && sessaoAtiva ? sessaoAtiva.diaPlanejado : dia;
  const tituloLista = e.hoje && diaDaLista === dia ? `Hoje · ${diaCompleto(dia)}` : maiuscula(diaCompleto(diaDaLista));

  const comCardio = plano.treinos.filter((x) => x.cardio);

  return (
    <TabPage brilho={BRILHO_TREINO}>
      {header}

      {sessaoAtiva && treinoAtivo && (
        <CapsulaAoVivo treino={treinoAtivo} sessao={sessaoAtiva} onAbrir={() => abrirSessao()} onPausar={pausarTreino} onContinuar={retomarTreino} />
      )}

      <SemanaTreino hoje={today} estados={estados} selecionado={dia} onSelect={setDia} />

      {alivio && (
        <View style={styles.alivio}>
          <Ionicons name="leaf-outline" size={18} color={colors.tideText} />
          <View style={styles.flex}>
            <Text variant="bodyStrong" style={{ color: colors.tideText }}>
              Semana de alívio: menos séries, mesma técnica
            </Text>
            <Text variant="caption" tone="secondary">
              Mantenha as cargas. O corpo se recupera e volta mais forte no próximo bloco.
            </Text>
          </View>
        </View>
      )}

      {horaDaProximaFase(plano, today) && (
        <Glass contentStyle={styles.fase}>
          <Text variant="bodyStrong">{alivio ? 'Seu bloco termina nesta semana' : 'Seu bloco de 5 semanas terminou'}</Text>
          <Text variant="caption" tone="secondary">
            Monte a próxima fase com as mesmas respostas: exercícios novos e o cardio sobe um pouco.
          </Text>
          <NeonButton label="Montar a próxima fase" onPress={() => router.push({ pathname: '/treino-ia', params: { proximaFase: '1' } })} style={styles.faseBtn} />
        </Glass>
      )}

      {/* Destaque do dia: corpo grande com os músculos e o botão */}
      {mostraAtivo && sessaoAtiva && treinoAtivo ? (
        <HeroEmAndamento treino={treinoAtivo} sessao={sessaoAtiva} sexo={sexo} onAbrir={() => abrirSessao()} />
      ) : !t ? (
        <HeroDescanso kicker={kicker} proximo={upcoming[0] && `${dayLabel(upcoming[0].data, today).toLowerCase()} · ${upcoming[0].treino.nome}`} />
      ) : (
        <HeroTreino
          kicker={kicker}
          treino={t}
          sexo={sexo}
          resumo={[`~${minutosEstimados(t)} min`, `~${formatInt(kcalEstimadas(t, peso))} kcal`]}
          feito={
            e.tipo === 'feito' && e.sessao
              ? `Concluído${e.feitoEm ? ` · ${notaFeitoEm(e.feitoEm)}` : ''} · ${minutosLabel(e.sessao)} · ${formatInt(e.sessao.kcal)} kcal`
              : undefined
          }
          bloqueado={!!sessaoAtiva}
          dica={
            data !== today
              ? `${data < today ? 'Ficou para trás? Pode fazer hoje' : 'Quer adiantar? Pode fazer hoje'}: ele fica marcado ${dia === 'sab' || dia === 'dom' ? 'no' : 'na'} ${DIA_NOME[dia]} e as calorias entram no seu dia de hoje.`
              : undefined
          }
          onIniciar={() => start(t)}
        />
      )}

      <SegmentedTabs options={ABAS} value={aba} onChange={setAba} height={46} />

      {aba === 'exercicios' &&
        (lista ? (
          <ListaExerciciosDoDia
            key={`${lista.id}-${modo}`}
            treino={lista}
            modo={modo}
            titulo={tituloLista}
            series={seriesDaLista}
            historico={sessoes}
            sexo={sexo}
            onAbrir={modo === 'andamento' ? abrirSessao : modo === 'planejado' && !sessaoAtiva && t ? (ex) => start(t, ex) : undefined}
          />
        ) : (
          <Text tone="secondary" style={styles.vazio}>
            Dia de descanso: nenhum exercício. Escolha outro dia na semana para ver o treino.
          </Text>
        ))}

      {aba === 'cardio' && (
        <View style={styles.bloco}>
          <Glass flush>
            {comCardio.length ? (
              comCardio.map((x, i) => (
                <View key={x.id} style={[styles.linhaCardio, i < comCardio.length - 1 && styles.linhaSep]}>
                  <Text style={styles.cardioDia}>{DIA_NOME[x.dia].slice(0, 3).toUpperCase()}</Text>
                  <View style={styles.flex}>
                    <Text style={styles.listTitle}>
                      {x.cardio!.minutos} min de {x.cardio!.atividade === 'eliptico' ? 'elíptico' : x.cardio!.atividade}
                    </Text>
                    <Text variant="caption" tone="muted">
                      No fim do treino · ritmo {x.cardio!.intensidade}
                    </Text>
                  </View>
                  {estados[x.dia].tipo === 'feito' && <Ionicons name="checkmark" size={18} color={colors.ok} />}
                </View>
              ))
            ) : (
              <Text tone="secondary" style={styles.cardioVazio}>
                Seu plano não tem cardio. Caminhada, corrida, bicicleta e elíptico chegam logo, com a corrida pelo GPS.
              </Text>
            )}
          </Glass>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/em-breve', params: { secao: 'aerobico' } })}
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}>
            <Ionicons name="navigate-outline" size={17} color={colors.ink2} />
            <Text style={[styles.flex, styles.linkText]}>Registrar um cardio (em breve)</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
          </Pressable>
        </View>
      )}

      {aba === 'semana' && (
        <View style={styles.bloco}>
          <View style={styles.stats}>
            <StatTile label="Treinos" value={`${stats.feitos} / ${stats.planejados}`} />
            <StatTile label="Queimadas" value={`${formatInt(stats.kcal)} kcal`} />
            <StatTile label="Recordes" value={String(stats.recordes)} />
          </View>
          <Glass contentStyle={styles.chart}>
            <Text variant="caption" tone="secondary" style={styles.chartTitle}>
              Volume nos últimos 7 dias · {formatTons(stats.volumeKg)} t na semana
            </Text>
            <View style={styles.bars}>
              {vol.map((v) => {
                const isToday = v.data === today;
                const wd = WEEKDAY_SHORT[fromDateKey(v.data).getDay()];
                return (
                  <View key={v.data} style={styles.barCol} accessible accessibilityLabel={`${wd}: ${formatInt(v.volumeKg)} kg`}>
                    <View style={styles.barTrack}>
                      <View
                        style={[styles.barFill, { height: `${Math.max(v.volumeKg ? 6 : 0, (v.volumeKg / maxVol) * 100)}%` }, isToday && styles.barToday]}
                      />
                    </View>
                    <Text style={[styles.barLabel, isToday && { color: colors.ink }]}>{wd.charAt(0)}</Text>
                  </View>
                );
              })}
            </View>
          </Glass>

          {upcoming.length > 0 && (
            <>
              <SectionHeader title="Próximos treinos" />
              <View>
                {upcoming.map((u) => {
                  const nessaSemana = semana.includes(u.data);
                  return (
                    <Pressable
                      key={u.data}
                      accessibilityRole="button"
                      disabled={!nessaSemana}
                      onPress={() => {
                        setDia(diaDaData(u.data));
                        setAba('exercicios');
                      }}
                      style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}>
                      <View style={styles.dateBox}>
                        <Text style={styles.dateBoxDay}>{WEEKDAY_SHORT[fromDateKey(u.data).getDay()]}</Text>
                        <Text style={styles.dateBoxNum}>{u.data.slice(8)}</Text>
                      </View>
                      <View style={styles.flex}>
                        <Text style={styles.listTitle}>{u.treino.nome}</Text>
                        <Text variant="caption" tone="muted">
                          {dayLabel(u.data, today)} · {u.treino.exercicios.length} exercícios · ~{minutosEstimados(u.treino)} min
                        </Text>
                      </View>
                      {nessaSemana && <Ionicons name="chevron-forward" size={16} color={colors.ink3} />}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <SectionHeader title="Concluídos" />
          {done.length ? (
            <View>
              {done.map((s) => {
                const tr = planos.find((p) => p.id === s.planoId)?.treinos.find((x) => x.id === s.treinoDoDiaId);
                const outroDia = diaDaData(s.data) !== s.diaPlanejado;
                const nessaSemana = semana.includes(s.data);
                return (
                  <Pressable
                    key={s.id}
                    accessibilityRole="button"
                    disabled={!nessaSemana}
                    onPress={() => {
                      setDia(s.diaPlanejado);
                      setAba('exercicios');
                    }}
                    style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}>
                    <View style={[styles.dateBox, styles.dateBoxDone]}>
                      <Ionicons name="checkmark" size={18} color={colors.ok} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.listTitle}>{tr?.nome ?? 'Treino'}</Text>
                      <Text variant="caption" tone="muted">
                        {dayLabel(s.data, today)}
                        {outroDia ? ` · treino de ${DIA_NOME[s.diaPlanejado]}` : ''} · {minutosLabel(s)} · {formatInt(s.kcal)} kcal ·{' '}
                        {formatTons(volume(s.series))} t
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text variant="caption" tone="muted">
              Os treinos terminados aparecem aqui.
            </Text>
          )}
        </View>
      )}
    </TabPage>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    minWidth: 0,
  },
  center: {
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  h1: {
    fontFamily: fonts.display.semibold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -1,
  },
  alivio: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.tideTint,
    borderWidth: 1,
    borderColor: colors.tideEdge,
  },
  fase: {
    gap: 6,
    padding: 16,
  },
  faseBtn: {
    marginTop: spacing.sm,
  },
  vazio: {
    paddingVertical: spacing.lg,
  },
  bloco: {
    gap: spacing.md,
  },
  linhaCardio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  linhaSep: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  cardioDia: {
    width: 36,
    fontFamily: fonts.body.bold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.ink3,
  },
  cardioVazio: {
    padding: 16,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  linkText: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    color: colors.ink2,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chart: {
    gap: spacing.md,
  },
  chartTitle: {
    fontFamily: fonts.body.semibold,
  },
  bars: {
    flexDirection: 'row',
    height: 110,
    gap: 10,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    borderRadius: radius.sm,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: radius.sm,
    backgroundColor: colors.line2,
  },
  barToday: {
    backgroundColor: colors.lime,
  },
  barLabel: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    color: colors.ink3,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  dateBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dateBoxDone: {
    borderColor: colors.lineSoft,
  },
  dateBoxDay: {
    fontFamily: fonts.body.bold,
    fontSize: 9.5,
    letterSpacing: 1,
    color: colors.ink3,
  },
  dateBoxNum: {
    fontFamily: fonts.display.semibold,
    fontSize: 17,
    lineHeight: 20,
  },
  listTitle: {
    fontFamily: fonts.body.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.75,
  },
});
