import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { DateStrip } from '@/components/home/DateStrip';
import { TabPage } from '@/components/navigation/TabPage';
import { EmptyState, Glass, NeonButton, SectionHeader, Text } from '@/components/ui';
import { StatTile } from '@/components/ui/StatTile';
import { ExerciseAnim } from '@/components/workout/ExerciseAnim';
import { daysBetween, fromDateKey } from '@/lib/dates';
import { formatDayMonth, formatInt, formatTons, WEEKDAY_SHORT } from '@/lib/format';
import {
  estimatedMinutes,
  finishedSessions,
  planForDate,
  sessionMinutes,
  sessionVolume,
  upcomingPlans,
  weekStats,
  recentVolumeByDay,
} from '@/lib/workout';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, gradients, radius, spacing } from '@/theme/theme';
import type { DateKey, WorkoutPlan } from '@/types';

/** "Hoje", "Amanhã" ou "Qui, 02/10". */
function dayLabel(date: DateKey, today: DateKey): string {
  const diff = daysBetween(today, date);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  const wd = WEEKDAY_SHORT[fromDateKey(date).getDay()];
  return `${wd.charAt(0)}${wd.slice(1).toLowerCase()}, ${formatDayMonth(date)}`;
}

/**
 * Central de treino: calendário, o treino do dia em destaque, atalhos (novo
 * treino, biblioteca, aeróbico), a divisão da semana, números da semana,
 * próximos treinos e os concluídos.
 */
export default function TreinoScreen() {
  const { today: day, workoutPlans, sessions, activeSession, startSession } = useAppStore();
  const today = day.date;
  const [date, setDate] = useState(today);
  const shown = date > today && daysBetween(today, date) > 30 ? today : date;

  const plan = planForDate(workoutPlans, shown);
  const sessionOfDay = sessions.find((s) => s.date === shown && s.finishedAt);
  const activePlan = activeSession ? workoutPlans.find((p) => p.id === activeSession.planId) : null;
  const stats = useMemo(() => weekStats(sessions, workoutPlans, today), [sessions, workoutPlans, today]);
  const volume = useMemo(() => recentVolumeByDay(sessions, today), [sessions, today]);
  const upcoming = useMemo(() => upcomingPlans(workoutPlans, today, 3), [workoutPlans, today]);
  const done = useMemo(() => finishedSessions(sessions, 5), [sessions]);
  const maxVol = Math.max(1, ...volume.map((v) => v.volumeKg));

  const start = (p: WorkoutPlan) => {
    startSession(p.id);
    router.push('/treino-sessao');
  };

  const actions = (
    <View style={styles.actions}>
      <Action icon="add" label="Novo treino" onPress={() => router.push('/treino-novo')} />
      <Action icon="library-outline" label="Exercícios" onPress={() => router.push('/exercicios')} />
      <Action icon="bicycle-outline" label="Aeróbico" soon onPress={() => router.push({ pathname: '/em-breve', params: { secao: 'aerobico' } })} />
    </View>
  );

  if (!workoutPlans.length) {
    return (
      <TabPage>
        <EmptyState
          icon="barbell-outline"
          title="Monte seu treino"
          message="Escolha os dias, a divisão e os exercícios, ou deixe a IA montar para você."
        />
        {actions}
      </TabPage>
    );
  }

  return (
    <TabPage>
      <DateStrip today={today} past={6} future={13} selected={shown} onSelect={setDate} />

      {/* Treino do dia escolhido, em destaque */}
      <Glass flush tint={gradients.workoutHero} contentStyle={styles.hero}>
        {activeSession && activePlan && shown === today ? (
          <>
            <Text style={styles.kicker}>EM ANDAMENTO · {activePlan.name.toUpperCase()}</Text>
            <Text style={styles.heroTitle}>{activePlan.focus}</Text>
            <NeonButton label="Continuar treino" onPress={() => router.push('/treino-sessao')} style={styles.heroBtn} />
          </>
        ) : plan ? (
          <>
            <Text style={styles.kicker}>
              {dayLabel(shown, today).toUpperCase()} · {plan.name.toUpperCase()}
            </Text>
            <Text style={styles.heroTitle}>{plan.focus}</Text>
            <View style={styles.tags}>
              <Tag text={`${plan.exercises.length} exercícios`} />
              <Tag text={`~${estimatedMinutes(plan)} min`} />
            </View>
            <View style={styles.thumbs}>
              {plan.exercises.slice(0, 5).map((e) =>
                e.catalogId ? <ExerciseAnim key={e.id} id={e.catalogId} still style={styles.heroThumb} /> : null,
              )}
            </View>
            {sessionOfDay ? (
              <View style={styles.doneRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.ok} />
                <Text variant="bodyStrong" style={{ color: colors.ok }}>
                  Concluído · {sessionMinutes(sessionOfDay)} min · {formatTons(sessionVolume(sessionOfDay))} t
                </Text>
              </View>
            ) : shown === today ? (
              <NeonButton label="Começar treino" onPress={() => start(plan)} style={styles.heroBtn} />
            ) : shown > today ? (
              <Text tone="secondary" style={styles.heroNote}>
                Planejado
              </Text>
            ) : (
              <Text tone="secondary" style={styles.heroNote}>
                Não registrado
              </Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.kicker}>{dayLabel(shown, today).toUpperCase()} · DESCANSO</Text>
            <Text style={styles.heroTitle}>Dia de recuperar</Text>
            {upcoming[0] && (
              <Text tone="secondary" style={styles.heroNote}>
                Próximo: {dayLabel(upcoming[0].date, today).toLowerCase()} · {upcoming[0].plan.focus.toLowerCase()}
              </Text>
            )}
          </>
        )}
      </Glass>

      {actions}

      {/* Divisão da semana */}
      <SectionHeader title="Sua divisão" action="Refazer" onAction={() => router.push('/treino-novo')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.splitRow}>
        {workoutPlans.map((p) => (
          <Glass key={p.id} contentStyle={styles.splitCard} style={styles.splitWrap}>
            <Text style={styles.splitLetter}>{p.name.replace('Treino ', '')}</Text>
            <Text style={styles.splitFocus} numberOfLines={2}>
              {p.focus}
            </Text>
            <Text variant="caption" tone="muted">
              {p.weekdays.map((d) => WEEKDAY_SHORT[d]).join(' · ')}
            </Text>
            <Text variant="caption" tone="muted">
              {p.exercises.length} exercícios
            </Text>
          </Glass>
        ))}
      </ScrollView>

      {/* Números da semana */}
      <SectionHeader title="Esta semana" />
      <View style={styles.stats}>
        <StatTile label="Treinos" value={`${stats.done} / ${stats.planned}`} />
        <StatTile label="Volume" value={`${formatTons(stats.volumeKg)} t`} />
        <StatTile label="Recordes" value={String(stats.records)} />
      </View>
      <Glass contentStyle={styles.chart}>
        <Text variant="caption" tone="secondary" style={styles.chartTitle}>
          Volume nos últimos 7 dias (kg × repetições)
        </Text>
        <View style={styles.bars}>
          {volume.map((v) => {
            const isToday = v.date === today;
            return (
              <View key={v.date} style={styles.barCol} accessible accessibilityLabel={`${WEEKDAY_SHORT[fromDateKey(v.date).getDay()]}: ${formatInt(v.volumeKg)} kg`}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${Math.max(v.volumeKg ? 6 : 0, (v.volumeKg / maxVol) * 100)}%` },
                      isToday && styles.barToday,
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, isToday && { color: colors.ink }]}>
                  {WEEKDAY_SHORT[fromDateKey(v.date).getDay()].charAt(0)}
                </Text>
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
            {upcoming.map((u) => (
              <Pressable
                key={u.date}
                accessibilityRole="button"
                onPress={() => setDate(u.date)}
                style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}>
                <View style={styles.dateBox}>
                  <Text style={styles.dateBoxDay}>{WEEKDAY_SHORT[fromDateKey(u.date).getDay()]}</Text>
                  <Text style={styles.dateBoxNum}>{u.date.slice(8)}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.listTitle}>{u.plan.focus}</Text>
                  <Text variant="caption" tone="muted">
                    {dayLabel(u.date, today)} · {u.plan.name} · {u.plan.exercises.length} exercícios
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* Concluídos */}
      <SectionHeader title="Concluídos" />
      {done.length ? (
        <View>
          {done.map((s) => {
            const p = workoutPlans.find((x) => x.id === s.planId);
            return (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                onPress={() => setDate(s.date)}
                style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}>
                <View style={[styles.dateBox, styles.dateBoxDone]}>
                  <Ionicons name="checkmark" size={18} color={colors.ok} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.listTitle}>{p?.focus ?? 'Treino'}</Text>
                  <Text variant="caption" tone="muted">
                    {dayLabel(s.date, today)} · {sessionMinutes(s)} min · {s.sets.length} séries · {formatTons(sessionVolume(s))} t
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
  thumbs: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.md,
  },
  heroThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
  splitRow: {
    gap: spacing.sm,
  },
  splitWrap: {
    width: 150,
  },
  splitCard: {
    gap: 4,
    minHeight: 150,
  },
  splitLetter: {
    fontFamily: fonts.display.bold,
    fontSize: 34,
    lineHeight: 38,
    color: colors.lime,
  },
  splitFocus: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
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
