import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Glass, IconButton, NeonButton, Text } from '@/components/ui';
import { exercicioPorId, MUSCULO_LABELS } from '@/lib/exercicios';
import { formatDecimal, formatDuration, formatInt } from '@/lib/format';
import { recorde, repsLabel, resumoDoExercicio, ultimasSeries } from '@/lib/treino/plano';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { ExercicioNoTreino, SessaoDeTreino } from '@/types/treino';

import { MapaMuscular } from './MapaMuscular';

const hora = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

type Props = {
  /** Exercício aberto (null = fechado). */
  item: ExercicioNoTreino | null;
  /** Sessão do dia (em andamento ou concluída); ausente = ainda não começou. */
  sessao?: Pick<SessaoDeTreino, 'inicio' | 'series'>;
  /** Treinos anteriores (última vez e recorde). */
  historico: readonly SessaoDeTreino[];
  sexo?: 'feminino' | 'masculino';
  /** Botão embaixo (ex.: "Abrir no treino ao vivo"); ausente = sem botão. */
  acao?: { label: string; onPress: () => void };
  onClose: () => void;
};

/**
 * Resumo de um exercício, no meio da tela: se está completo, o tempo gasto
 * nele, as séries feitas em linha do tempo (com o descanso entre elas), o
 * volume e a comparação com a última vez.
 */
export function ResumoExercicio({ item, sessao, historico, sexo, acao, onClose }: Props) {
  const ex = item ? exercicioPorId(item.exercicioId) : undefined;
  const r = item && sessao ? resumoDoExercicio(sessao, item.id) : null;
  const feitas = r?.series.length ?? 0;
  const completo = !!item && feitas >= item.series;
  const antes = item ? historico.filter((s) => s.inicio !== sessao?.inicio) : [];
  const ultima = item ? ultimasSeries([...antes], item.exercicioId)?.series ?? [] : [];
  const melhorUltima = ultima.reduce<(typeof ultima)[number] | null>((m, s) => (!m || s.cargaKg > m.cargaKg || (s.cargaKg === m.cargaKg && s.reps > m.reps) ? s : m), null);
  const pr = item ? recorde(antes, item.exercicioId) : null;
  // Só a melhor série de hoje leva o selo, e só se passou do recorde anterior.
  const melhorHoje = (r?.series ?? []).reduce<number>((m, s, i, arr) => (m < 0 || s.cargaKg > arr[m].cargaKg || (s.cargaKg === arr[m].cargaKg && s.reps > arr[m].reps) ? i : m), -1);
  const ehRecorde = (i: number) => {
    const s = r?.series[i];
    return i === melhorHoje && !!s && !!pr && (s.cargaKg > pr.cargaKg || (s.cargaKg === pr.cargaKg && s.reps > pr.reps));
  };
  const cargaHoje = r?.series.length ? Math.max(...r.series.map((s) => s.cargaKg)) : null;
  const dif = cargaHoje !== null && melhorUltima ? cargaHoje - melhorUltima.cargaKg : null;

  return (
    <Modal transparent visible={!!item} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        {Platform.OS !== 'android' && <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />}
        <Pressable accessibilityLabel="Fechar" onPress={onClose} style={[StyleSheet.absoluteFill, styles.scrim]} />
        {item && (
          <Glass rounded={radius.xxl} flush style={styles.card} contentStyle={styles.inner}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
              <View style={styles.cab}>
                <View style={styles.thumb}>{ex && <MapaMuscular principal={ex.musculoPrincipal} secundarios={ex.musculosSecundarios} altura={64} podeVirar={false} sexo={sexo} />}</View>
                <View style={styles.flex}>
                  <View style={[styles.selo, completo && styles.seloOk]}>
                    {completo && <Ionicons name="checkmark" size={11} color={colors.ink} />}
                    <Text style={styles.seloText}>{completo ? 'COMPLETO' : feitas ? `FALTAM ${item.series - feitas}` : 'AINDA NÃO COMEÇOU'}</Text>
                  </View>
                  <Text style={styles.nome} numberOfLines={2}>
                    {ex?.nome ?? 'Exercício'}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {ex ? MUSCULO_LABELS[ex.musculoPrincipal] : ''}
                    {r?.series.length ? ` · feito às ${hora(r.series[r.series.length - 1].concluidaEm)}` : ` · ${item.series} × ${repsLabel(item)}`}
                  </Text>
                </View>
                <IconButton icon="close" label="Fechar" size={34} onPress={onClose} />
              </View>

              <View style={styles.nums}>
                <Num rotulo="Tempo" valor={r?.tempoMs ? formatDuration(r.tempoMs / 1000) : '—'} />
                <Num rotulo="Séries" valor={String(feitas)} extra={`/${item.series}`} />
                <Num rotulo="Volume" valor={r?.volumeKg ? formatInt(r.volumeKg) : '—'} extra={r?.volumeKg ? 'kg' : undefined} />
              </View>

              {r && r.series.length > 0 ? (
                <View style={styles.series}>
                  {r.series.map((s, i) => (
                    <View key={`${s.numero}-${i}`} style={styles.serie}>
                      <View style={styles.trilho}>
                        <View style={styles.no}>
                          <Ionicons name="checkmark" size={12} color={colors.onInk} />
                        </View>
                        {i < r.series.length - 1 && <View style={styles.linha} />}
                      </View>
                      <View style={styles.flex}>
                        <View style={styles.valorLinha}>
                          <Text style={styles.valor}>
                            {formatDecimal(s.cargaKg)} kg × {s.reps}
                          </Text>
                          {ehRecorde(i) && (
                            <View style={styles.pr}>
                              <Text style={styles.prText}>RECORDE</Text>
                            </View>
                          )}
                        </View>
                        <Text variant="caption" tone="muted">
                          série {i + 1} · {hora(s.concluidaEm)}
                        </Text>
                      </View>
                      {r.descansosSeg[i] ? (
                        <View style={styles.desc}>
                          <Text style={styles.descValor}>{formatDuration(r.descansosSeg[i] ?? 0)}</Text>
                          <Text variant="caption" tone="muted">
                            descanso
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : (
                <Text tone="secondary" style={styles.vazio}>
                  Nenhuma série feita ainda. Meta: {item.series} × {repsLabel(item)}, descanso de {item.descansoSeg} s.
                </Text>
              )}

              {melhorUltima && (
                <View style={styles.rodape}>
                  <Text variant="caption" tone="muted" style={styles.flex}>
                    Última vez:{' '}
                    <Text variant="caption" style={styles.rodapeForte}>
                      {formatDecimal(melhorUltima.cargaKg)} kg × {melhorUltima.reps}
                    </Text>
                  </Text>
                  {dif !== null && dif !== 0 && (
                    <Text variant="caption" tone="secondary">
                      {dif > 0 ? '+' : ''}
                      {formatDecimal(dif)} kg
                    </Text>
                  )}
                </View>
              )}

              {acao && !completo && <NeonButton label={acao.label} onPress={acao.onPress} style={styles.acao} />}
            </ScrollView>
          </Glass>
        )}
      </View>
    </Modal>
  );
}

function Num({ rotulo, valor, extra }: { rotulo: string; valor: string; extra?: string }) {
  return (
    <View style={styles.num}>
      <Text style={styles.numRotulo}>{rotulo}</Text>
      <Text style={styles.numValor}>
        {valor}
        {extra ? <Text style={styles.numExtra}> {extra}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  scrim: {
    backgroundColor: colors.modalScrim,
  },
  card: {
    maxHeight: '82%',
    backgroundColor: colors.sheetGlass,
  },
  inner: {
    flexShrink: 1,
    minHeight: 0,
  },
  scroll: {
    padding: 20,
    gap: spacing.lg,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  cab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  thumb: {
    width: 60,
    height: 70,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
  },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    height: 22,
    paddingHorizontal: 9,
    borderRadius: 11,
    backgroundColor: colors.glassFill,
  },
  seloOk: {
    backgroundColor: colors.glassFillStrong,
  },
  seloText: {
    fontFamily: fonts.body.bold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.ink,
  },
  nome: {
    marginTop: 6,
    fontFamily: fonts.display.semibold,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  nums: {
    flexDirection: 'row',
    gap: 8,
  },
  num: {
    flex: 1,
    gap: 4,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.glassFill,
  },
  numRotulo: {
    fontFamily: fonts.body.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  numValor: {
    fontFamily: fonts.display.semibold,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
  },
  numExtra: {
    fontFamily: fonts.body.semibold,
    fontSize: 12,
    color: colors.ink3,
  },
  series: {},
  serie: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  trilho: {
    width: 24,
    alignItems: 'center',
  },
  no: {
    width: 24,
    height: 24,
    marginTop: 3,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  linha: {
    width: 2,
    height: 26,
    marginVertical: 3,
    borderRadius: 1,
    backgroundColor: colors.line2,
  },
  valorLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valor: {
    fontFamily: fonts.display.semibold,
    fontSize: 16,
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
  },
  pr: {
    height: 18,
    paddingHorizontal: 7,
    borderRadius: 9,
    justifyContent: 'center',
    backgroundColor: colors.limeTint,
  },
  prText: {
    fontFamily: fonts.body.bold,
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: colors.lime,
  },
  desc: {
    alignItems: 'flex-end',
  },
  descValor: {
    fontFamily: fonts.display.semibold,
    fontSize: 13,
    color: colors.ink2,
    fontVariant: ['tabular-nums'],
  },
  vazio: {
    lineHeight: 21,
  },
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
  },
  rodapeForte: {
    fontFamily: fonts.body.bold,
    color: colors.ink,
  },
  acao: {
    marginTop: spacing.xs,
  },
});
