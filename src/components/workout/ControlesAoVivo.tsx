import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Glass, NeonButton, Text, toast } from '@/components/ui';
import { exercicioPorId } from '@/lib/exercicios';
import { formatDecimal, formatInt } from '@/lib/format';
import { bateRecorde, proximoExercicio, repsLabel, seriesFeitas, treinoResolvido } from '@/lib/treino/plano';
import { AJUSTE_KG, valoresDaProximaSerie } from '@/lib/treino/progressao';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { ExercicioNoTreino, PlanoDeTreino, SessaoDeTreino, SessaoEmAndamento, TreinoDoDia } from '@/types/treino';

import { useAgora } from './HeroDoDia';

type Props = {
  treino: TreinoDoDia;
  sessao: SessaoEmAndamento;
  historico: readonly SessaoDeTreino[];
  planos: readonly PlanoDeTreino[];
};

const tique = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Botões embaixo do card do treino em andamento:
 * - treinando: "Concluir série" (abre o modal com carga e repetições, ou pular o exercício);
 * - descansando: −15 s | Pular descanso | +15 s;
 * - tudo feito: "Finalizar treino".
 */
export function ControlesAoVivo({ treino, sessao, historico, planos }: Props) {
  const agora = useAgora();
  const { registrarSerie, iniciarDescanso, ajustarDescanso, pularDescanso, pularExercicio, finalizarTreino, pausarTreino, retomarTreino } = useAppStore();
  const pausado = !!sessao.pausadoEm;
  const [aberto, setAberto] = useState(false);
  // Última série feita (ou último exercício pulado): o treino do dia se fecha sozinho.
  const fecharSeAcabou = () => {
    const s = useAppStore.getState().sessaoAtiva;
    if (!s || !treinoResolvido(treino, s)) return false;
    finalizarTreino();
    const kcal = useAppStore.getState().sessoes[0]?.kcal ?? 0;
    toast(`Treino concluído · ${formatInt(kcal)} kcal no seu dia. Bom trabalho!`);
    return true;
  };
  const acabou = treinoResolvido(treino, sessao);
  const atual = acabou ? undefined : treino.exercicios[proximoExercicio(treino, sessao)];
  const descansando = !!atual && !!sessao.descansoAte && Date.parse(sessao.descansoAte) > agora;

  if (acabou) {
    return (
      <NeonButton
        label="Finalizar treino"
        onPress={() => {
          const n = sessao.series.length;
          finalizarTreino();
          const kcal = useAppStore.getState().sessoes[0]?.kcal ?? 0;
          toast(n ? `Treino salvo · ${formatInt(kcal)} kcal no seu dia. Bom trabalho!` : 'Treino encerrado sem séries');
        }}
      />
    );
  }
  if (!atual) return null;

  if (descansando) {
    return (
      <View style={styles.descanso}>
        <Redondo label="−15" onPress={() => ajustarDescanso(-15)} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pular descanso"
          onPress={() => {
            tique();
            pularDescanso();
          }}
          style={({ pressed }) => [styles.pular, pressed && styles.pressed]}>
          <Ionicons name="play-skip-forward" size={13} color={colors.onInk} />
          <Text style={styles.pularText} numberOfLines={1}>
            PULAR DESCANSO
          </Text>
        </Pressable>
        <Redondo label="+15" onPress={() => ajustarDescanso(15)} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.descanso}>
        <NeonButton label="Concluir série" onPress={() => setAberto(true)} style={styles.flex} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={pausado ? 'Continuar o treino' : 'Pausar o treino'}
          onPress={() => {
            tique();
            if (pausado) retomarTreino();
            else pausarTreino();
          }}
          style={({ pressed }) => [styles.redondo, pausado && styles.redondoOn, pressed && styles.pressed]}>
          <Ionicons name={pausado ? 'play' : 'pause'} size={20} color={pausado ? colors.onLime : colors.ink} />
        </Pressable>
      </View>
      <ConcluirSerieModal
        visible={aberto}
        item={atual}
        sessao={sessao}
        historico={historico}
        planos={planos}
        onClose={() => setAberto(false)}
        onConcluir={(kg, reps) => {
          const recorde = bateRecorde([...historico, sessao], atual.exercicioId, kg, reps);
          registrarSerie(atual.id, kg, reps);
          setAberto(false);
          if (fecharSeAcabou()) return;
          // Descansa entre as séries e também antes do próximo exercício.
          iniciarDescanso(atual.descansoSeg);
          toast(recorde ? `Novo recorde: ${formatDecimal(kg)} kg` : 'Série registrada');
        }}
        onPular={() => {
          pularExercicio(atual.id);
          setAberto(false);
          if (fecharSeAcabou()) return;
          toast(`${exercicioPorId(atual.exercicioId)?.nome ?? 'Exercício'} pulado`);
        }}
      />
    </>
  );
}

function Redondo({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} segundos de descanso`}
      onPress={() => {
        tique();
        onPress();
      }}
      style={({ pressed }) => [styles.redondo, pressed && styles.pressed]}>
      <Text style={styles.redondoText}>{label} s</Text>
    </Pressable>
  );
}

/** Modal no meio da tela: carga e repetições da série, concluir ou pular o exercício. */
function ConcluirSerieModal({
  visible,
  item,
  sessao,
  historico,
  planos,
  onClose,
  onConcluir,
  onPular,
}: {
  visible: boolean;
  item: ExercicioNoTreino;
  sessao: SessaoEmAndamento;
  historico: readonly SessaoDeTreino[];
  planos: readonly PlanoDeTreino[];
  onClose: () => void;
  onConcluir: (kg: number, reps: number) => void;
  onPular: () => void;
}) {
  const ex = exercicioPorId(item.exercicioId);
  const feitas = seriesFeitas(sessao, item.id);
  // Começa com a sugestão (última série de hoje, progressão ou carga do plano) a cada vez que abre.
  const [valores, setValores] = useState(() => valoresDaProximaSerie(item, sessao, historico, planos));
  const [chave, setChave] = useState(`${item.id}-${feitas}-${visible}`);
  const agoraChave = `${item.id}-${feitas}-${visible}`;
  if (chave !== agoraChave) {
    setChave(agoraChave);
    setValores(valoresDaProximaSerie(item, sessao, historico, planos));
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        {Platform.OS !== 'android' && <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />}
        <Pressable accessibilityLabel="Fechar" onPress={onClose} style={[StyleSheet.absoluteFill, styles.scrim]} />
        <Glass rounded={radius.xxl} flush style={styles.card} contentStyle={styles.inner}>
          <View style={styles.cab}>
            <View style={styles.flex}>
              <Text style={styles.serie}>
                Série {feitas + 1} de {item.series} · meta {repsLabel(item)}
              </Text>
              <Text style={styles.nome} numberOfLines={2}>
                {ex?.nome ?? 'Exercício'}
              </Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar" hitSlop={8} onPress={onClose} style={styles.fechar}>
              <Ionicons name="close" size={18} color={colors.ink} />
            </Pressable>
          </View>

          <View style={styles.ajustes}>
            <Ajuste
              rotulo="Carga"
              valor={formatDecimal(valores.kg)}
              unidade="kg"
              onMenos={() => setValores((v) => ({ ...v, kg: Math.max(0, v.kg - AJUSTE_KG) }))}
              onMais={() => setValores((v) => ({ ...v, kg: v.kg + AJUSTE_KG }))}
            />
            <Ajuste
              rotulo="Repetições"
              valor={String(valores.reps)}
              onMenos={() => setValores((v) => ({ ...v, reps: Math.max(1, v.reps - 1) }))}
              onMais={() => setValores((v) => ({ ...v, reps: v.reps + 1 }))}
            />
          </View>

          <NeonButton label="Concluir série" onPress={() => onConcluir(valores.kg, valores.reps)} />
          <Pressable accessibilityRole="button" onPress={onPular} hitSlop={6} style={({ pressed }) => [styles.pularEx, pressed && styles.pressed]}>
            <Ionicons name="play-skip-forward-outline" size={15} color={colors.ink2} />
            <Text style={styles.pularExText}>Pular este exercício</Text>
          </Pressable>
        </Glass>
      </View>
    </Modal>
  );
}

function Ajuste({ rotulo, valor, unidade, onMenos, onMais }: { rotulo: string; valor: string; unidade?: string; onMenos: () => void; onMais: () => void }) {
  return (
    <View style={styles.ajuste}>
      <Text style={styles.ajusteRotulo}>{rotulo}</Text>
      <View style={styles.ajusteValorLinha}>
        <Text style={styles.ajusteValor}>{valor}</Text>
        {unidade ? <Text style={styles.ajusteUnidade}>{unidade}</Text> : null}
      </View>
      <View style={styles.pm}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Diminuir ${rotulo.toLowerCase()}`} onPress={onMenos} style={({ pressed }) => [styles.pmBtn, pressed && styles.pressed]}>
          <Ionicons name="remove" size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.pmDiv} />
        <Pressable accessibilityRole="button" accessibilityLabel={`Aumentar ${rotulo.toLowerCase()}`} onPress={onMais} style={({ pressed }) => [styles.pmBtn, pressed && styles.pressed]}>
          <Ionicons name="add" size={22} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    minWidth: 0,
  },
  descanso: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  redondoOn: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  redondoText: {
    fontFamily: fonts.display.semibold,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  pular: {
    flex: 1,
    height: 58,
    borderRadius: 29,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.ink,
  },
  pularText: {
    fontFamily: fonts.display.bold,
    fontSize: 11.5,
    letterSpacing: 0.8,
    color: colors.onInk,
  },
  root: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  scrim: {
    backgroundColor: colors.modalScrim,
  },
  card: {
    backgroundColor: colors.sheetGlass,
  },
  inner: {
    padding: 20,
    gap: spacing.lg,
  },
  cab: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  serie: {
    fontFamily: fonts.body.bold,
    fontSize: 10.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  nome: {
    marginTop: 6,
    fontFamily: fonts.display.semibold,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.4,
  },
  fechar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  ajustes: {
    flexDirection: 'row',
    gap: 10,
  },
  ajuste: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderRadius: radius.xl,
    backgroundColor: colors.glassFill,
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
    fontSize: 44,
    lineHeight: 50,
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
  pularEx: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: -spacing.xs,
    paddingVertical: 6,
  },
  pularExText: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    color: colors.ink2,
  },
  pressed: {
    opacity: 0.7,
  },
});
