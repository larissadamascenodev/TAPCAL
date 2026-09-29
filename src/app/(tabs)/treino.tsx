import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TabPage } from '@/components/navigation/TabPage';
import { EmptyState, Glass, IconButton, NeonButton, SectionHeader, Text } from '@/components/ui';
import { StatTile } from '@/components/ui/StatTile';
import { MapaMuscular } from '@/components/workout/MapaMuscular';
import { SemanaTreino } from '@/components/workout/SemanaTreino';
import { daysBetween, fromDateKey } from '@/lib/dates';
import { exercicioPorId } from '@/lib/exercicios';
import { formatDayMonth, formatInt, formatTons, WEEKDAY_SHORT } from '@/lib/format';
import { minutosDaSessao } from '@/lib/treino/met';
import { ehSemanaDeAlivio, horaDaProximaFase, semanaDoBloco, seriesNaSemana } from '@/lib/treino/progressao';
import {
  concluidas,
  kcalEstimadas,
  minutosEstimados,
  numerosDaSemana,
  proximosTreinos,
  repsLabel,
  volume,
  volumePorDia,
} from '@/lib/treino/plano';
import { datasDaSemana, DIA_NOME, DIAS, diaDaData, estadoDoDia, notaFeitoEm, planoAtivo, type EstadoDoDia } from '@/lib/treino/semana';
import { currentWeightKg } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, gradients, radius, spacing } from '@/theme/theme';
import type { DateKey } from '@/types';
import type { DiaSemana, TreinoDoDia } from '@/types/treino';

/** "Hoje", "Amanhã", "Ontem" ou "Qui, 02/10". */
function dayLabel(date: DateKey, today: DateKey): string {
  const diff = daysBetween(today, date);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  const wd = WEEKDAY_SHORT[fromDateKey(date).getDay()];
  return `${wd.charAt(0)}${wd.slice(1).toLowerCase()}, ${formatDayMonth(date)}`;
}

/** Duração arredondada ("48 min"; menos de 1 minuto vira "1 min"). */
function minutosLabel(inicio: string, fim: string): string {
  return `${Math.max(1, Math.round(minutosDaSessao(inicio, fim)))} min`;
}

/**
 * Central de treino: a semana (segunda a domingo), o treino do dia escolhido,
 * atalhos, números da semana, próximos treinos e os concluídos. O calendário
 * nunca muda sozinho: o treino de segunda feito na terça continua na segunda,
 * marcado como "feito na terça", e as calorias entram no dia em que foi feito.
 */
export default function TreinoScreen() {
  const state = useAppStore();
  const { today: day, planos, sessoes, sessaoAtiva, comecarTreino } = state;
  const sexo = state.profile?.sex;
  const today = day.date;
  const peso = currentWeightKg(state) ?? 70;
  const [dia, setDia] = useState<DiaSemana>(() => diaDaData(today));

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

  const start = (t: TreinoDoDia) => {
    comecarTreino(t.id);
    router.push('/treino-sessao');
  };

  const actions = (
    <View style={styles.actions}>
      <Action icon="add" label="Criar treino" onPress={() => router.push('/treino-novo')} />
      <Action icon="library-outline" label="Exercícios" onPress={() => router.push('/exercicios')} />
      <Action icon="bicycle-outline" label="Aeróbico" soon onPress={() => router.push({ pathname: '/em-breve', params: { secao: 'aerobico' } })} />
    </View>
  );

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
      <IconButton icon="albums-outline" label="Meus treinos" onPress={() => router.push('/meus-treinos')} />
    </View>
  );

  if (!plano) {
    return (
      <TabPage>
        {header}
        <EmptyState
          icon="barbell-outline"
          title="Monte seu treino"
          message="Escolha os dias, a divisão e os exercícios, ou deixe a IA montar para você."
        />
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
  // Na semana de alívio (plano da IA), cada exercício aparece com menos séries.
  const alivio = ehSemanaDeAlivio(plano, today);
  const t = e.treino && { ...e.treino, exercicios: e.treino.exercicios.map((x) => ({ ...x, series: seriesNaSemana(x.series, plano, today) })) };
  const data = semana[DIAS.indexOf(dia)];
  const emAndamento = sessaoAtiva && t && sessaoAtiva.treinoDoDiaId === t.id;
  const kicker = `${e.hoje ? 'HOJE · ' : ''}${DIA_NOME[dia].toUpperCase()}`;

  return (
    <TabPage>
      {header}
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

      {sessaoAtiva && !emAndamento && (
        <Pressable accessibilityRole="button" onPress={() => router.push('/treino-sessao')} style={styles.banner}>
          <View style={styles.liveDot} />
          <Text variant="bodyStrong" style={styles.flex}>
            Treino em andamento
          </Text>
          <Text variant="caption" style={styles.bannerLink}>
            Continuar
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.lime} />
        </Pressable>
      )}

      {/* Treino do dia escolhido */}
      <Glass flush tint={gradients.workoutHero} contentStyle={styles.hero}>
        {!t ? (
          <>
            <Text style={styles.kicker}>{kicker} · DESCANSO</Text>
            <Text style={styles.heroTitle}>Dia de recuperar</Text>
            {upcoming[0] && (
              <Text tone="secondary" style={styles.heroNote}>
                Próximo: {dayLabel(upcoming[0].data, today).toLowerCase()} · {upcoming[0].treino.nome}
              </Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.kicker}>
              {kicker}
              {emAndamento ? ' · EM ANDAMENTO' : e.tipo === 'feito' ? ' · FEITO' : ''}
            </Text>
            <Text style={styles.heroTitle}>{t.nome}</Text>
            <View style={styles.tags}>
              <Tag text={`${t.exercicios.length} exercícios`} />
              <Tag text={`~${minutosEstimados(t)} min`} />
              <Tag text={`~${formatInt(kcalEstimadas(t, peso))} kcal`} />
            </View>

            <View style={styles.exList}>
              {t.exercicios.map((x) => {
                const ex = exercicioPorId(x.exercicioId);
                return (
                  <View key={x.id} style={styles.exRow}>
                    <View style={styles.thumb}>
                      {ex && <MapaMuscular principal={ex.musculoPrincipal} altura={44} podeVirar={false} sexo={sexo} />}
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.exName} numberOfLines={1}>
                        {ex?.nome ?? 'Exercício'}
                      </Text>
                      <Text variant="caption" tone="muted">
                        {x.series} × {repsLabel(x)} · descanso {x.descansoSeg} s
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {t.cardio && (
              <View style={styles.cardioRow}>
                <Ionicons name="walk-outline" size={16} color={colors.ink2} />
                <Text variant="caption" tone="secondary">
                  No fim: {t.cardio.minutos} min de {t.cardio.atividade === 'eliptico' ? 'elíptico' : t.cardio.atividade}, ritmo {t.cardio.intensidade}
                </Text>
              </View>
            )}

            {emAndamento ? (
              <NeonButton label="Continuar treino" onPress={() => router.push('/treino-sessao')} style={styles.heroBtn} />
            ) : e.tipo === 'feito' && e.sessao ? (
              <View style={styles.doneRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.ok} />
                <Text variant="bodyStrong" style={styles.doneText}>
                  Concluído{e.feitoEm ? ` · ${notaFeitoEm(e.feitoEm)}` : ''} · {minutosLabel(e.sessao.inicio, e.sessao.fim)} ·{' '}
                  {formatInt(e.sessao.kcal)} kcal
                </Text>
              </View>
            ) : sessaoAtiva ? (
              <Text tone="secondary" style={styles.heroNote}>
                Termine o treino em andamento para começar este.
              </Text>
            ) : (
              <>
                <NeonButton label="Começar treino" onPress={() => start(t)} style={styles.heroBtn} />
                {data !== today && (
                  <Text variant="caption" tone="muted" style={styles.heroHint}>
                    {data < today ? 'Ficou para trás? Pode fazer hoje' : 'Quer adiantar? Pode fazer hoje'}: ele fica marcado{' '}
                    {dia === 'sab' || dia === 'dom' ? 'no' : 'na'} {DIA_NOME[dia]} e as calorias entram no seu dia de hoje.
                  </Text>
                )}
              </>
            )}
          </>
        )}
      </Glass>

      {actions}

      {/* Números da semana */}
      <SectionHeader title="Esta semana" />
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
                    style={[
                      styles.barFill,
                      { height: `${Math.max(v.volumeKg ? 6 : 0, (v.volumeKg / maxVol) * 100)}%` },
                      isToday && styles.barToday,
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, isToday && { color: colors.ink }]}>{wd.charAt(0)}</Text>
              </View>
            );
          })}
        </View>
      </Glass>

      {/* Próximos */}
      {upcoming.length > 0 && (
        <>
          <SectionHeader title="Próximos treinos" />
          <View>
            {upcoming.map((u) => {
              const naSemana = semana.includes(u.data);
              return (
                <Pressable
                  key={u.data}
                  accessibilityRole="button"
                  disabled={!naSemana}
                  onPress={() => setDia(diaDaData(u.data))}
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
                  {naSemana && <Ionicons name="chevron-forward" size={16} color={colors.ink3} />}
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {/* Concluídos */}
      <SectionHeader title="Concluídos" />
      {done.length ? (
        <View>
          {done.map((s) => {
            const tr = planos.find((p) => p.id === s.planoId)?.treinos.find((x) => x.id === s.treinoDoDiaId);
            const outroDia = diaDaData(s.data) !== s.diaPlanejado;
            const naSemana = semana.includes(s.data);
            return (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                disabled={!naSemana}
                onPress={() => setDia(s.diaPlanejado)}
                style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}>
                <View style={[styles.dateBox, styles.dateBoxDone]}>
                  <Ionicons name="checkmark" size={18} color={colors.ok} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.listTitle}>{tr?.nome ?? 'Treino'}</Text>
                  <Text variant="caption" tone="muted">
                    {dayLabel(s.data, today)}
                    {outroDia ? ` · treino de ${DIA_NOME[s.diaPlanejado]}` : ''} · {minutosLabel(s.inicio, s.fim)} ·{' '}
                    {formatInt(s.kcal)} kcal · {formatTons(volume(s.series))} t
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
    </TabPage>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <View style={styles.tag}>
      <Text variant="caption" tone="secondary" style={styles.tagText}>
        {text}
      </Text>
    </View>
  );
}

function Action({
  icon,
  label,
  soon,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  soon?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.actionWrap}>
      {({ pressed }) => (
        <Glass contentStyle={styles.action} style={pressed && styles.pressed}>
          <View style={styles.actionIcon}>
            <Ionicons name={icon} size={20} color={colors.lime} />
          </View>
          <Text style={styles.actionText}>{label}</Text>
          {soon && <Text style={styles.soon}>EM BREVE</Text>}
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
  center: {
    textAlign: 'center',
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
  cardioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.md,
  },
  faseBtn: {
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  h1: {
    fontFamily: fonts.display.semibold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.limeWash,
    borderWidth: 1,
    borderColor: colors.limeEdge,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lime,
  },
  bannerLink: {
    fontFamily: fonts.body.bold,
    color: colors.lime,
  },
  exList: {
    marginTop: spacing.md,
    gap: 8,
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    width: 40,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
  },
  exName: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    lineHeight: 19,
  },
  heroHint: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  doneText: {
    flex: 1,
    color: colors.ok,
  },
  hero: {
    padding: 18,
    minHeight: 210,
  },
  kicker: {
    fontFamily: fonts.body.bold,
    fontSize: 11.5,
    letterSpacing: 1.8,
    color: colors.lime,
  },
  heroTitle: {
    marginTop: spacing.sm,
    maxWidth: '85%',
    fontFamily: fonts.display.bold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -1,
  },
  heroNote: {
    marginTop: spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.md,
  },
  tag: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    justifyContent: 'center',
    backgroundColor: colors.track,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tagText: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
  },
  heroBtn: {
    marginTop: spacing.lg,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionWrap: {
    flex: 1,
  },
  action: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.lg,
    paddingHorizontal: 6,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.limeWash,
    borderWidth: 1,
    borderColor: colors.limeEdge,
  },
  actionText: {
    fontFamily: fonts.body.bold,
    fontSize: 13,
  },
  soon: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontFamily: fonts.body.bold,
    fontSize: 8.5,
    letterSpacing: 1,
    color: colors.lime,
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
    backgroundColor: colors.mint,
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
    backgroundColor: colors.okTint,
    borderColor: 'transparent',
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
