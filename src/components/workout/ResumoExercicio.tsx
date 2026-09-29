import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Glass, IconButton, NeonButton, Text } from '@/components/ui';
import { exercicioPorId, MUSCULO_LABELS } from '@/lib/exercicios';
import { formatDecimal, formatDuration, formatInt } from '@/lib/format';
import { kcalAtividade, MET_MUSCULACAO } from '@/lib/treino/met';
import { recorde, repsLabel, resumoDoExercicio, ultimasSeries } from '@/lib/treino/plano';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { ExercicioNoTreino, SerieFeita, SessaoDeTreino } from '@/types/treino';

import { MapaMuscular } from './MapaMuscular';

const hora = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** "45 s", "1:30" ou "12:04" — curto, para caber numa linha. */
const curto = (seg: number) => (seg < 60 ? `${seg} s` : formatDuration(seg));

type Props = {
  /** Exercício aberto (null = fechado). */
  item: ExercicioNoTreino | null;
  /** Sessão do dia (em andamento ou concluída); ausente = ainda não começou. */
  sessao?: Pick<SessaoDeTreino, 'inicio' | 'series'>;
  /** Treino rodando: a próxima série aparece tracejada em verde. */
  aoVivo?: boolean;
  /** Treinos anteriores (última vez e recorde). */
  historico: readonly SessaoDeTreino[];
  /** Peso da pessoa, para as kcal estimadas do exercício. */
  pesoKg: number;
  sexo?: 'feminino' | 'masculino';
  /** Botão embaixo (ex.: "Abrir no treino ao vivo"); ausente = sem botão. */
  acao?: { label: string; onPress: () => void };
  onClose: () => void;
};

/**
 * Resumo de um exercício, no meio da tela: se está completo, os números do
 * exercício (tempo total, descanso, séries, volume, kcal e horário) e as
 * séries em linha do tempo, cada uma com quanto durou e o descanso antes.
 */
export function ResumoExercicio({ item, sessao, aoVivo, historico, pesoKg, sexo, acao, onClose }: Props) {
  const ex = item ? exercicioPorId(item.exercicioId) : undefined;
  const r = item && sessao ? resumoDoExercicio(sessao, item.id) : null;
  const feitas = r?.series.length ?? 0;
  const completo = !!item && feitas >= item.series;
  const antes = item ? historico.filter((s) => s.inicio !== sessao?.inicio) : [];
  const ultima = item ? (ultimasSeries([...antes], item.exercicioId)?.series ?? []) : [];
  const melhor = (lista: readonly SerieFeita[]) =>
    lista.reduce<number>((m, s, i) => (m < 0 || s.cargaKg > lista[m].cargaKg || (s.cargaKg === lista[m].cargaKg && s.reps > lista[m].reps) ? i : m), -1);
  const melhorUltima = ultima[melhor(ultima)] ?? null;
  const pr = item ? recorde(antes, item.exercicioId) : null;
  // Só a melhor série de hoje leva o selo, e só se passou do recorde anterior.
  const iMelhor = melhor(r?.series ?? []);
  const ehRecorde = (i: number) => {
    const s = r?.series[i];
    return i === iMelhor && !!s && !!pr && (s.cargaKg > pr.cargaKg || (s.cargaKg === pr.cargaKg && s.reps > pr.reps));
  };
  const cargaHoje = r?.series.length ? Math.max(...r.series.map((s) => s.cargaKg)) : null;
  const dif = cargaHoje !== null && melhorUltima ? cargaHoje - melhorUltima.cargaKg : null;
  const tempoSeg = r ? Math.round(r.tempoMs / 1000) : 0;
  const kcal = r?.tempoMs ? Math.round(kcalAtividade(MET_MUSCULACAO, pesoKg, r.tempoMs / 60_000)) : 0;
  const primeira = r?.series[0];
  const inicioIso = primeira ? new Date(Date.parse(primeira.concluidaEm) - (primeira.duracaoSeg ?? 0) * 1000).toISOString() : null;
  const linhas = item ? Math.max(item.series, feitas) : 0;

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
                    {completo && <Ionicons name="checkmark" size={11} color={colors.onLime} />}
                    <Text style={[styles.seloText, completo && styles.seloTextOk]}>
                      {completo ? 'COMPLETO' : feitas ? `FALTAM ${item.series - feitas}` : 'AINDA NÃO COMEÇOU'}
                    </Text>
                  </View>
                  <Text style={styles.nome} numberOfLines={2}>
                    {ex?.nome ?? 'Exercício'}
                  </Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>
                    {ex ? MUSCULO_LABELS[ex.musculoPrincipal] : ''} · meta {item.series} × {repsLabel(item)}
                  </Text>
                </View>
                <IconButton icon="close" label="Fechar" size={34} onPress={onClose} />
              </View>

              {/* Números do exercício: soltos, numa grade com linhas finas */}
              <View style={styles.grade}>
                <View style={styles.gradeLinha}>
                  <Num rotulo="Tempo total" valor={tempoSeg ? formatDuration(tempoSeg) : '—'} />
                  <Num rotulo="Descanso" valor={r?.descansoTotalSeg ? formatDuration(r.descansoTotalSeg) : '—'} meio />
                  <Num rotulo="Séries" valor={`${Math.min(feitas, item.series)}`} extra={`/${item.series}`} />
                </View>
                <View style={[styles.gradeLinha, styles.gradeLinhaDebaixo]}>
                  <Num rotulo="Volume" valor={r?.volumeKg ? formatInt(r.volumeKg) : '—'} extra={r?.volumeKg ? 'kg' : undefined} />
                  <Num rotulo="Kcal (est.)" valor={kcal ? formatInt(kcal) : '—'} meio />
                  <Num rotulo="Começou" valor={inicioIso ? hora(inicioIso) : '—'} />
                </View>
              </View>

              {/* Séries em linha do tempo */}
              <View>
                {Array.from({ length: linhas }, (_, i) => {
                  const s = r?.series[i];
                  const agora = !s && aoVivo && i === feitas;
                  const dur = r?.duracoesSeg[i];
                  const desc = r?.descansosSeg[i];
                  return (
                    <View key={i} style={styles.serie}>
                      <View style={styles.trilho}>
                        {s ? (
                          <View style={[styles.no, styles.noFeito]}>
                            <Ionicons name="checkmark" size={13} color={colors.onLime} />
                          </View>
                        ) : (
                          <View style={[styles.no, agora && styles.noAgora]}>
                            <Text style={[styles.noNum, agora && styles.noNumAgora]}>{i + 1}</Text>
                          </View>
                        )}
                        {i < linhas - 1 && <View style={[styles.linha, s && styles.linhaFeita]} />}
                      </View>
                      <View style={styles.flex}>
                        <View style={styles.valorLinha}>
                          <Text style={[styles.valor, !s && styles.valorFuturo]} numberOfLines={1}>
                            {s ? `${formatDecimal(s.cargaKg)} kg × ${s.reps}` : `Série ${i + 1}`}
                          </Text>
                          {s && ehRecorde(i) && (
                            <View style={styles.pr}>
                              <Text style={styles.prText}>RECORDE</Text>
                            </View>
                          )}
                        </View>
                        <Text variant="caption" tone="muted" numberOfLines={1}>
                          {s ? `série ${i + 1} · ${hora(s.concluidaEm)}` : agora ? 'agora' : `meta ${repsLabel(item)}`}
                        </Text>
                      </View>
                      {s ? (
                        <View style={styles.tempos}>
                          {dur != null ? <Text style={styles.tempoSerie}>{curto(dur)} na série</Text> : null}
                          {desc ? <Text style={styles.tempoDesc}>{curto(desc)} de descanso</Text> : null}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>

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

              {acao && !completo && <NeonButton label={acao.label} onPress={acao.onPress} />}
            </ScrollView>
          </Glass>
        )}
      </View>
    </Modal>
  );
}

function Num({ rotulo, valor, extra, meio }: { rotulo: string; valor: string; extra?: string; meio?: boolean }) {
  return (
    <View style={[styles.num, meio && styles.numMeio]}>
      <Text style={styles.numRotulo} numberOfLines={1}>
        {rotulo}
      </Text>
      <Text style={styles.numValor} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {valor}
        {extra ? <Text style={styles.numExtra}> {extra}</Text> : null}
      </Text>
    </View>
  );
}

const NO = 26;

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
    maxHeight: '86%',
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
  // Completo: verde neon translúcido, letra escura para destacar.
  seloOk: {
    backgroundColor: colors.seloVerde,
  },
  seloText: {
    fontFamily: fonts.body.bold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.ink,
  },
  seloTextOk: {
    color: colors.onLime,
  },
  nome: {
    marginTop: 6,
    fontFamily: fonts.display.semibold,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  grade: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.lineSoft,
  },
  gradeLinha: {
    flexDirection: 'row',
  },
  gradeLinhaDebaixo: {
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
  },
  num: {
    flex: 1,
    minWidth: 0,
    gap: 3,
    paddingVertical: 12,
  },
  numMeio: {
    paddingHorizontal: 12,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.lineSoft,
    marginRight: 12,
  },
  numRotulo: {
    fontFamily: fonts.body.bold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  numValor: {
    fontFamily: fonts.display.semibold,
    fontSize: 17,
    fontVariant: ['tabular-nums'],
  },
  numExtra: {
    fontFamily: fonts.body.semibold,
    fontSize: 12,
    color: colors.ink3,
  },
  serie: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  trilho: {
    width: NO,
    alignItems: 'center',
  },
  no: {
    width: NO,
    height: NO,
    marginTop: 2,
    borderRadius: NO / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.line2,
  },
  noFeito: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  noAgora: {
    borderColor: colors.lime,
    borderStyle: 'dashed',
    borderWidth: 2,
  },
  noNum: {
    fontFamily: fonts.display.semibold,
    fontSize: 11,
    color: colors.ink3,
  },
  noNumAgora: {
    color: colors.lime,
  },
  linha: {
    width: 2,
    height: 24,
    marginVertical: 3,
    borderRadius: 1,
    backgroundColor: colors.lineSoft,
  },
  linhaFeita: {
    backgroundColor: colors.limeEdge,
  },
  valorLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valor: {
    flexShrink: 1,
    fontFamily: fonts.display.semibold,
    fontSize: 16,
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
  },
  valorFuturo: {
    color: colors.ink3,
  },
  pr: {
    height: 18,
    paddingHorizontal: 7,
    borderRadius: 9,
    justifyContent: 'center',
    backgroundColor: colors.seloVerde,
  },
  prText: {
    fontFamily: fonts.body.bold,
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: colors.onLime,
  },
  tempos: {
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  tempoSerie: {
    fontFamily: fonts.body.bold,
    fontSize: 12,
    color: colors.ink2,
    fontVariant: ['tabular-nums'],
  },
  tempoDesc: {
    fontFamily: fonts.body.semibold,
    fontSize: 11.5,
    color: colors.ink3,
    fontVariant: ['tabular-nums'],
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
});
