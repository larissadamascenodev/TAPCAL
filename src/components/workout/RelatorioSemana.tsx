import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Glass, SectionHeader, Text } from '@/components/ui';
import { daysBetween, fromDateKey } from '@/lib/dates';
import { exercicioPorId, MUSCULO_LABELS } from '@/lib/exercicios';
import { formatDayMonth, formatDecimal, formatInt, formatTons, WEEKDAY_SHORT } from '@/lib/format';
import { minutosDaSessao } from '@/lib/treino/met';
import { concluidas, proximosTreinos, repsLabel, volume, volumePorDia } from '@/lib/treino/plano';
import { niveisDoMapa, seriesPorMusculo, sessoesNoPeriodo, totaisDoPeriodo, treinosMaisFeitos, type Periodo } from '@/lib/treino/relatorio';
import { DIA_NOME, diaDaData } from '@/lib/treino/semana';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { DateKey } from '@/types';
import type { PlanoDeTreino, SessaoDeTreino, TreinoDoDia } from '@/types/treino';

import { MapaDeCalor } from './MapaMuscular';

type Props = {
  plano: PlanoDeTreino;
  planos: readonly PlanoDeTreino[];
  sessoes: readonly SessaoDeTreino[];
  hoje: DateKey;
  sexo?: 'feminino' | 'masculino';
};

/** "Hoje", "Amanhã", "Ontem" ou "Qui, 02/10". */
function quando(date: DateKey, hoje: DateKey): string {
  const diff = daysBetween(hoje, date);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  const wd = WEEKDAY_SHORT[fromDateKey(date).getDay()];
  return `${wd.charAt(0)}${wd.slice(1).toLowerCase()}, ${formatDayMonth(date)}`;
}

const horas = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}` : `${min} min`);

/**
 * Aba Semana: números do período (semana ou 30 dias), mapa de calor dos
 * músculos, músculos mais trabalhados, treinos mais feitos, volume por dia e
 * as listas de próximos e concluídos, que abrem aqui mesmo.
 */
export function RelatorioSemana({ plano, planos, sessoes, hoje, sexo }: Props) {
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const [aberto, setAberto] = useState<string | null>(null);
  const doPeriodo = useMemo(() => sessoesNoPeriodo(sessoes, periodo, hoje), [sessoes, periodo, hoje]);
  const totais = totaisDoPeriodo(doPeriodo);
  const musculos = useMemo(() => seriesPorMusculo(doPeriodo), [doPeriodo]);
  const maisFeitos = useMemo(() => treinosMaisFeitos(doPeriodo, [...planos]), [doPeriodo, planos]);
  const vol = useMemo(() => volumePorDia(sessoes, hoje), [sessoes, hoje]);
  const proximos = useMemo(() => proximosTreinos(plano, sessoes, hoje, 3), [plano, sessoes, hoje]);
  const feitos = useMemo(() => concluidas(sessoes, 6), [sessoes]);
  const maxVol = Math.max(1, ...vol.map((v) => v.volumeKg));
  const maxMusculo = musculos[0]?.series ?? 1;
  const maxTreino = maisFeitos[0]?.vezes ?? 1;
  const alternar = (id: string) => setAberto((a) => (a === id ? null : id));

  return (
    <View style={styles.wrap}>
      <View style={styles.periodos} accessibilityRole="radiogroup">
        {(['semana', '30dias'] as const).map((p) => (
          <Pressable
            key={p}
            accessibilityRole="radio"
            accessibilityState={{ selected: periodo === p }}
            onPress={() => setPeriodo(p)}
            style={[styles.periodo, periodo === p && styles.periodoOn]}>
            <Text style={[styles.periodoText, periodo === p && styles.periodoTextOn]}>{p === 'semana' ? 'Esta semana' : 'Últimos 30 dias'}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.tiles}>
        <Numero rotulo="Treinos" valor={periodo === 'semana' ? `${totais.treinos}/${plano.treinos.length}` : String(totais.treinos)} />
        <Numero rotulo="Tempo" valor={horas(totais.minutos)} />
        <Numero rotulo="Queimadas" valor={`${formatInt(totais.kcal)}`} unidade="kcal" />
      </View>

      {/* Mapa de calor */}
      <Glass contentStyle={styles.card}>
        <Text style={styles.cardTitulo}>Músculos trabalhados</Text>
        {musculos.length ? (
          <>
            <View style={styles.mapa}>
              <MapaDeCalor niveis={niveisDoMapa(musculos)} sexo={sexo} altura={210} />
            </View>
            <View style={styles.legenda}>
              <Text variant="caption" tone="muted">
                menos
              </Text>
              <View style={[styles.legendaCor, { backgroundColor: colors.muscleHeat1 }]} />
              <View style={[styles.legendaCor, { backgroundColor: colors.muscleHeat2 }]} />
              <View style={[styles.legendaCor, { backgroundColor: colors.musclePrimary }]} />
              <Text variant="caption" tone="muted">
                mais séries
              </Text>
            </View>
            <View style={styles.barrasH}>
              {musculos.slice(0, 6).map((m, i) => (
                <View key={m.musculo} style={styles.barraH}>
                  <Text style={styles.barraNome}>{MUSCULO_LABELS[m.musculo]}</Text>
                  <View style={styles.barraTrilho}>
                    {/* Verde só no mais trabalhado; o resto em vidro claro. */}
                    <View style={[styles.barraCheia, i > 0 && styles.barraClara, { width: `${(m.series / maxMusculo) * 100}%` }]} />
                  </View>
                  <Text style={styles.barraValor}>{m.series}</Text>
                </View>
              ))}
            </View>
            <Text variant="caption" tone="muted">
              Séries por músculo principal.
            </Text>
          </>
        ) : (
          <Text tone="secondary">Os músculos aparecem aqui depois do primeiro treino do período.</Text>
        )}
      </Glass>

      {/* Treinos mais feitos */}
      {maisFeitos.length > 0 && (
        <Glass contentStyle={styles.card}>
          <Text style={styles.cardTitulo}>Treinos mais feitos</Text>
          {maisFeitos.slice(0, 5).map((t) => (
            <View key={t.nome} style={styles.barraH}>
              <Text style={[styles.barraNome, styles.barraNomeLargo]} numberOfLines={1}>
                {t.nome}
              </Text>
              <View style={styles.barraTrilho}>
                <View style={[styles.barraCheia, styles.barraClara, { width: `${(t.vezes / maxTreino) * 100}%` }]} />
              </View>
              <Text style={styles.barraValor}>{t.vezes}×</Text>
            </View>
          ))}
        </Glass>
      )}

      {/* Volume por dia */}
      <Glass contentStyle={styles.card}>
        <Text style={styles.cardTitulo}>Volume nos últimos 7 dias</Text>
        <View style={styles.bars}>
          {vol.map((v) => {
            const isHoje = v.data === hoje;
            const wd = WEEKDAY_SHORT[fromDateKey(v.data).getDay()];
            return (
              <View key={v.data} style={styles.barCol} accessible accessibilityLabel={`${wd}: ${formatInt(v.volumeKg)} kg`}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${Math.max(v.volumeKg ? 6 : 0, (v.volumeKg / maxVol) * 100)}%` }, isHoje && styles.barHoje]} />
                </View>
                <Text style={[styles.barLabel, isHoje && { color: colors.ink }]}>{wd.charAt(0)}</Text>
              </View>
            );
          })}
        </View>
        <Text variant="caption" tone="muted">
          Carga × repetições de cada dia · {formatTons(vol.reduce((s, v) => s + v.volumeKg, 0))} t no total
        </Text>
      </Glass>

      {/* Próximos */}
      {proximos.length > 0 && (
        <>
          <SectionHeader title="Próximos treinos" />
          <Glass flush>
            {proximos.map((u, i) => {
              const id = `p-${u.data}`;
              return (
                <Expansivel
                  key={id}
                  aberto={aberto === id}
                  onPress={() => alternar(id)}
                  ultimo={i === proximos.length - 1}
                  data={u.data}
                  titulo={u.treino.nome}
                  subtitulo={`${quando(u.data, hoje)} · ${u.treino.exercicios.length} exercícios`}>
                  <ExerciciosPlanejados treino={u.treino} />
                </Expansivel>
              );
            })}
          </Glass>
        </>
      )}

      {/* Concluídos */}
      <SectionHeader title="Concluídos" />
      {feitos.length ? (
        <Glass flush>
          {feitos.map((s, i) => {
            const tr = planos.find((p) => p.id === s.planoId)?.treinos.find((x) => x.id === s.treinoDoDiaId);
            const outroDia = diaDaData(s.data) !== s.diaPlanejado;
            const id = `c-${s.id}`;
            return (
              <Expansivel
                key={id}
                aberto={aberto === id}
                onPress={() => alternar(id)}
                ultimo={i === feitos.length - 1}
                data={s.data}
                feito
                titulo={tr?.nome ?? 'Treino'}
                subtitulo={`${quando(s.data, hoje)}${outroDia ? ` · treino de ${DIA_NOME[s.diaPlanejado]}` : ''} · ${Math.max(1, Math.round(minutosDaSessao(s.inicio, s.fim, s.pausaMs)))} min · ${formatInt(s.kcal)} kcal`}>
                <SeriesFeitas sessao={s} />
              </Expansivel>
            );
          })}
        </Glass>
      ) : (
        <Text variant="caption" tone="muted">
          Os treinos terminados aparecem aqui.
        </Text>
      )}
    </View>
  );
}

function Numero({ rotulo, valor, unidade }: { rotulo: string; valor: string; unidade?: string }) {
  return (
    <Glass style={styles.flex} contentStyle={styles.tile}>
      <Text variant="label" tone="muted">
        {rotulo}
      </Text>
      <Text style={styles.tileValor}>
        {valor}
        {unidade ? <Text style={styles.tileUnidade}> {unidade}</Text> : null}
      </Text>
    </Glass>
  );
}

function Expansivel({
  aberto,
  onPress,
  ultimo,
  data,
  feito,
  titulo,
  subtitulo,
  children,
}: {
  aberto: boolean;
  onPress: () => void;
  ultimo: boolean;
  data: DateKey;
  feito?: boolean;
  titulo: string;
  subtitulo: string;
  children: ReactNode;
}) {
  return (
    <View style={[styles.exp, !ultimo && styles.expLinha]}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: aberto }} onPress={onPress} style={({ pressed }) => [styles.expCabeca, pressed && styles.pressed]}>
        <View style={styles.data}>
          {feito ? (
            <Ionicons name="checkmark" size={18} color={colors.lime} />
          ) : (
            <>
              <Text style={styles.dataDia}>{WEEKDAY_SHORT[fromDateKey(data).getDay()]}</Text>
              <Text style={styles.dataNum}>{data.slice(8)}</Text>
            </>
          )}
        </View>
        <View style={styles.flex}>
          <Text style={styles.expTitulo} numberOfLines={1}>
            {titulo}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {subtitulo}
          </Text>
        </View>
        <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={17} color={colors.ink3} />
      </Pressable>
      {aberto && <View style={styles.expCorpo}>{children}</View>}
    </View>
  );
}

function ExerciciosPlanejados({ treino }: { treino: TreinoDoDia }) {
  return (
    <>
      {treino.exercicios.map((e, i) => (
        <View key={e.id} style={styles.sub}>
          <Text style={styles.subNum}>{String(i + 1).padStart(2, '0')}</Text>
          <Text style={[styles.flex, styles.subNome]} numberOfLines={1}>
            {exercicioPorId(e.exercicioId)?.nome ?? 'Exercício'}
          </Text>
          <Text variant="caption" tone="muted">
            {e.series} × {repsLabel(e)}
          </Text>
        </View>
      ))}
    </>
  );
}

function SeriesFeitas({ sessao }: { sessao: SessaoDeTreino }) {
  const grupos = new Map<string, typeof sessao.series>();
  for (const x of sessao.series) grupos.set(x.exercicioNoTreinoId, [...(grupos.get(x.exercicioNoTreinoId) ?? []), x]);
  return (
    <>
      {[...grupos.values()].map((series, i) => (
        <View key={series[0].exercicioNoTreinoId} style={styles.sub}>
          <Text style={styles.subNum}>{String(i + 1).padStart(2, '0')}</Text>
          <View style={styles.flex}>
            <Text style={styles.subNome} numberOfLines={1}>
              {exercicioPorId(series[0].exercicioId)?.nome ?? 'Exercício'}
            </Text>
            <Text variant="caption" tone="muted">
              {series.map((x) => `${formatDecimal(x.cargaKg)}×${x.reps}`).join(' · ')}
            </Text>
          </View>
        </View>
      ))}
      <Text variant="caption" tone="muted" style={styles.subTotal}>
        Volume: {formatTons(volume(sessao.series))} t
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    minWidth: 0,
  },
  wrap: {
    gap: spacing.md,
  },
  periodos: {
    flexDirection: 'row',
    gap: 8,
  },
  periodo: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  periodoOn: {
    backgroundColor: colors.glassFillStrong,
    borderColor: colors.line2,
  },
  periodoText: {
    fontFamily: fonts.body.bold,
    fontSize: 13,
    color: colors.ink3,
  },
  periodoTextOn: {
    color: colors.ink,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    padding: 14,
    gap: 4,
  },
  tileValor: {
    fontFamily: fonts.display.bold,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  tileUnidade: {
    fontFamily: fonts.body.semibold,
    fontSize: 12,
    letterSpacing: 0,
    color: colors.ink3,
  },
  card: {
    gap: spacing.md,
    padding: 16,
  },
  cardTitulo: {
    fontFamily: fonts.display.semibold,
    fontSize: 16,
    lineHeight: 21,
  },
  mapa: {
    alignItems: 'center',
  },
  legenda: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  legendaCor: {
    width: 16,
    height: 8,
    borderRadius: 4,
  },
  barrasH: {
    gap: 10,
  },
  barraH: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barraNome: {
    width: 104,
    fontFamily: fonts.body.semibold,
    fontSize: 13,
    color: colors.ink2,
  },
  barraNomeLargo: {
    width: 130,
  },
  barraTrilho: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  barraCheia: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.lime,
  },
  barraClara: {
    backgroundColor: colors.line2,
  },
  barraValor: {
    width: 30,
    textAlign: 'right',
    fontFamily: fonts.body.bold,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
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
  barHoje: {
    backgroundColor: colors.lime,
  },
  barLabel: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    color: colors.ink3,
  },
  exp: {
    paddingHorizontal: 14,
  },
  expLinha: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  expCabeca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  data: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dataDia: {
    fontFamily: fonts.body.bold,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.ink3,
  },
  dataNum: {
    fontFamily: fonts.display.semibold,
    fontSize: 15,
    lineHeight: 18,
  },
  expTitulo: {
    fontFamily: fonts.body.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  expCorpo: {
    gap: 10,
    paddingBottom: 14,
    paddingLeft: 56,
  },
  sub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subNum: {
    width: 20,
    fontFamily: fonts.display.semibold,
    fontSize: 11,
    color: colors.ink3,
  },
  subNome: {
    fontFamily: fonts.body.semibold,
    fontSize: 14,
  },
  subTotal: {
    marginTop: 2,
  },
  pressed: {
    opacity: 0.75,
  },
});
