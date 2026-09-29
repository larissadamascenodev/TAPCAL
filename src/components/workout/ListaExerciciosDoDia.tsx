import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from 'expo-router';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { ZoomIn } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/ui';
import { exercicioPorId, MUSCULO_LABELS } from '@/lib/exercicios';
import { formatDecimal } from '@/lib/format';
import { proximoExercicio, repsLabel, ultimasSeries } from '@/lib/treino/plano';
import { colors, fonts, gradients, spacing } from '@/theme/theme';
import type { Cardio, ExercicioNoTreino, SerieFeita, SessaoDeTreino, TreinoDoDia } from '@/types/treino';

import { MapaMuscular } from './MapaMuscular';

type Modo = 'andamento' | 'feito' | 'planejado';

type Props = {
  treino: TreinoDoDia;
  modo: Modo;
  /** "Hoje · terça-feira", "Segunda-feira"… */
  titulo: string;
  /** Séries já feitas (do treino em andamento ou do treino concluído). */
  series: readonly SerieFeita[];
  /** Treinos anteriores, para "última vez". */
  historico: readonly SessaoDeTreino[];
  sexo?: 'feminino' | 'masculino';
  /**
   * Em andamento: abre o treino ao vivo nesse exercício (também ao tocar numa
   * série). Planejado: começa o treino por ele.
   */
  onAbrir?: (exercicioNoTreinoId: string) => void;
  /**
   * Edição do treino (vale também para plano da IA): adicionar no fim,
   * remover (arrastando para o lado ou no modo de edição) e mudar a ordem.
   * Segurar um exercício abre o modo de edição.
   */
  edicao?: {
    onAdicionar: () => void;
    onRemover: (exercicioNoTreinoId: string) => void;
    onMover: (exercicioNoTreinoId: string, delta: -1 | 1) => void;
  };
};

const tique = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

const NO = 40;
const NO_R = 18;
const NO_C = 2 * Math.PI * NO_R;

const hora = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Depois do selo, a linha verde desce até o próximo exercício. */
const DESCER = {
  animationName: { from: { height: '0%' as const }, to: { height: '100%' as const } },
  animationDuration: 520,
  animationDelay: 220,
  animationFillMode: 'both' as const,
  animationTimingFunction: 'ease-out' as const,
};

const nomeCardio = (c: Cardio) => (c.atividade === 'eliptico' ? 'elíptico' : c.atividade);

/**
 * Exercícios do dia em linha do tempo (sem cartões): cada exercício é um ponto
 * na linha; o atual tem um reflexo de vidro e o ponto em destaque. Fechado,
 * mostra só o exercício; aberto, as séries. O atual (ou o primeiro) já vem aberto.
 */
export function ListaExerciciosDoDia({ treino, modo, titulo, series, historico, sexo, onAbrir, edicao }: Props) {
  const [editando, setEditando] = useState(false);
  // O selo de "feito" entra com animação quando a pessoa volta para a lista
  // (as séries são marcadas no treino ao vivo, com esta tela escondida).
  const focado = useIsFocused();
  const [vistos, setVistos] = useState<readonly string[]>([]);
  const completos = treino.exercicios.filter((e) => modo !== 'planejado' && series.filter((s) => s.exercicioNoTreinoId === e.id).length >= e.series).map((e) => e.id);
  if (focado && completos.some((id) => !vistos.includes(id))) setVistos(completos);
  const selados = new Set(completos.filter((id) => focado || vistos.includes(id)));
  const idAtual =
    modo === 'andamento'
      ? treino.exercicios[proximoExercicio(treino, { series: [...series] })]?.id
      : modo === 'planejado'
        ? treino.exercicios[0]?.id
        : undefined;
  // A escolha da pessoa vale enquanto o exercício atual não muda; quando ele
  // termina, a lista volta a abrir o próximo sozinha.
  const [escolha, setEscolha] = useState<{ id: string | null; base: string | undefined } | null>(null);
  const aberto = escolha && escolha.base === idAtual ? escolha.id : (idAtual ?? null);

  return (
    <View>
      <View style={styles.cabecalho}>
        <Text style={[styles.dia, styles.flex]}>{titulo}</Text>
        {edicao ? (
          <Pressable accessibilityRole="button" hitSlop={10} onPress={() => setEditando((v) => !v)}>
            <Text style={[styles.editar, editando && styles.editarOn]}>{editando ? 'Pronto' : 'Editar'}</Text>
          </Pressable>
        ) : (
          <Text variant="caption" tone="muted">
            {treino.exercicios.length} {treino.exercicios.length === 1 ? 'exercício' : 'exercícios'}
          </Text>
        )}
      </View>
      {editando && (
        <Text variant="caption" tone="muted" style={styles.dicaEdicao}>
          Mude a ordem com as setas ou tire o que não vai fazer. Vale para as próximas vezes deste treino.
        </Text>
      )}
      {treino.exercicios.map((e, i) => {
        const feitas = series.filter((s) => s.exercicioNoTreinoId === e.id);
        const ultimo = i === treino.exercicios.length - 1 && !treino.cardio && !edicao;
        if (editando && edicao) {
          return (
            <ItemEdicao
              key={e.id}
              item={e}
              ordem={i + 1}
              primeiro={i === 0}
              ultimoDaLista={i === treino.exercicios.length - 1}
              sexo={sexo}
              onRemover={() => edicao.onRemover(e.id)}
              onMover={(d) => edicao.onMover(e.id, d)}
            />
          );
        }
        const linha = (
          <Item
            key={e.id}
            item={e}
            ordem={i + 1}
            modo={modo}
            atual={e.id === idAtual}
            feitas={feitas}
            selo={selados.has(e.id)}
            historico={historico}
            sexo={sexo}
            aberto={aberto === e.id}
            ultimo={ultimo}
            onToggle={() => setEscolha({ id: aberto === e.id ? null : e.id, base: idAtual })}
            onAbrir={onAbrir && (() => onAbrir(e.id))}
            onLongPress={
              edicao &&
              (() => {
                tique();
                setEditando(true);
              })
            }
          />
        );
        if (!edicao) return linha;
        // Arrastar para o lado mostra "Remover".
        return (
          <ReanimatedSwipeable
            key={e.id}
            friction={2}
            rightThreshold={60}
            overshootRight={false}
            renderRightActions={(_p, _t, metodos) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remover ${exercicioPorId(e.exercicioId)?.nome ?? 'exercício'} do treino`}
                onPress={() => {
                  metodos.close();
                  edicao.onRemover(e.id);
                }}
                style={styles.remover}>
                <Ionicons name="trash-outline" size={18} color={colors.warnText} />
                <Text style={styles.removerText}>Remover</Text>
              </Pressable>
            )}>
            {linha}
          </ReanimatedSwipeable>
        );
      })}
      {edicao && (
        <View style={styles.item}>
          <View style={styles.trilho}>
            <View style={[styles.no, styles.noAdd]}>
              <Ionicons name="add" size={16} color={colors.lime} />
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={edicao.onAdicionar}
            style={({ pressed }) => [styles.conteudo, styles.adicionar, pressed && styles.pressed]}>
            <Text style={styles.adicionarText}>Adicionar exercício</Text>
          </Pressable>
        </View>
      )}
      {treino.cardio && (
        <View style={styles.item}>
          <View style={styles.trilho}>
            <View style={styles.no}>
              <Ionicons name="heart" size={12} color={colors.ink2} />
            </View>
          </View>
          <View style={[styles.conteudo, styles.cardio]}>
            <Text style={styles.nome}>Cardio no fim</Text>
            <Text variant="caption" tone="muted">
              {treino.cardio.minutos} min de {nomeCardio(treino.cardio)}, ritmo {treino.cardio.intensidade}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

/** Exercício no modo de edição: remover e mudar a ordem. */
function ItemEdicao({
  item,
  ordem,
  primeiro,
  ultimoDaLista,
  sexo,
  onRemover,
  onMover,
}: {
  item: ExercicioNoTreino;
  ordem: number;
  primeiro: boolean;
  ultimoDaLista: boolean;
  sexo?: 'feminino' | 'masculino';
  onRemover: () => void;
  onMover: (delta: -1 | 1) => void;
}) {
  const ex = exercicioPorId(item.exercicioId);
  const nome = ex?.nome ?? 'Exercício';
  return (
    <View style={styles.item}>
      <View style={styles.trilho}>
        <View style={styles.no}>
          <Text style={styles.noText}>{String(ordem).padStart(2, '0')}</Text>
        </View>
        <View style={styles.linha} />
      </View>
      <View style={[styles.conteudo, styles.edicaoLinha]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Remover ${nome}`} hitSlop={6} onPress={onRemover} style={styles.menos}>
          <Ionicons name="remove" size={16} color={colors.warnText} />
        </Pressable>
        <View style={styles.thumb}>{ex && <MapaMuscular principal={ex.musculoPrincipal} altura={40} podeVirar={false} sexo={sexo} />}</View>
        <View style={styles.flex}>
          <Text style={styles.nome} numberOfLines={1}>
            {nome}
          </Text>
          <Text variant="caption" tone="muted">
            {item.series} × {repsLabel(item)}
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Subir ${nome}`} disabled={primeiro} hitSlop={4} onPress={() => onMover(-1)} style={[styles.seta, primeiro && styles.setaOff]}>
          <Ionicons name="chevron-up" size={18} color={colors.ink} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Descer ${nome}`} disabled={ultimoDaLista} hitSlop={4} onPress={() => onMover(1)} style={[styles.seta, ultimoDaLista && styles.setaOff]}>
          <Ionicons name="chevron-down" size={18} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Ponto do exercício na linha do tempo:
 * - o atual (treino rodando) é um círculo aberto, tracejado, que vai se
 *   fechando em verde a cada série feita;
 * - feito, vira um selo verde com o check (entra com um "pop");
 * - os outros, só o número.
 */
function NoDoExercicio({ ordem, estado, progresso, selo }: { ordem: number; estado: 'feito' | 'atual' | 'proximo' | 'depois'; progresso: number; selo: boolean }) {
  const numero = String(ordem).padStart(2, '0');
  if (estado === 'feito' && selo) {
    return (
      <Animated.View entering={ZoomIn.springify().damping(11).stiffness(180)} style={styles.selo}>
        <Ionicons name="checkmark" size={21} color={colors.onLime} />
      </Animated.View>
    );
  }
  if (estado === 'atual' || estado === 'feito') {
    const p = estado === 'feito' ? 1 : progresso;
    return (
      <View style={styles.noAberto}>
        <Svg width={NO} height={NO} style={styles.noSvg}>
          <Circle cx={NO / 2} cy={NO / 2} r={NO_R} fill="none" stroke={colors.limeEdge} strokeWidth={2} strokeDasharray="2.5 4" strokeLinecap="round" />
          {p > 0 && (
            <Circle
              cx={NO / 2}
              cy={NO / 2}
              r={NO_R}
              fill="none"
              stroke={colors.lime}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray={`${NO_C * p} ${NO_C}`}
              transform={`rotate(-90 ${NO / 2} ${NO / 2})`}
            />
          )}
        </Svg>
        <Text style={[styles.noText, styles.noTextAtual]}>{numero}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.no, estado === 'proximo' && styles.noProximo]}>
      <Text style={[styles.noText, estado === 'proximo' && styles.noTextProximo]}>{numero}</Text>
    </View>
  );
}

function Item({
  item,
  ordem,
  modo,
  atual,
  feitas,
  selo,
  historico,
  sexo,
  aberto,
  ultimo,
  onToggle,
  onAbrir,
  onLongPress,
}: {
  item: ExercicioNoTreino;
  ordem: number;
  modo: Modo;
  atual: boolean;
  feitas: readonly SerieFeita[];
  /** Mostra o selo de feito (a animação dele toca quando a lista está à vista). */
  selo: boolean;
  historico: readonly SessaoDeTreino[];
  sexo?: 'feminino' | 'masculino';
  aberto: boolean;
  ultimo: boolean;
  onToggle: () => void;
  onAbrir?: () => void;
  onLongPress?: () => void;
}) {
  const ex = exercicioPorId(item.exercicioId);
  const nome = ex?.nome ?? 'Exercício';
  const completo = modo !== 'planejado' && feitas.length >= item.series;
  const reps = repsLabel(item);
  const antes = ultimasSeries([...historico], item.exercicioId)?.series ?? [];
  const linhas = Math.max(item.series, feitas.length);
  const estado = completo ? 'feito' : atual && modo === 'andamento' ? 'atual' : atual ? 'proximo' : 'depois';
  const aoVivo = modo === 'andamento' && !!onAbrir;

  return (
    <View style={styles.item}>
      <View style={styles.trilho}>
        <View style={styles.noWrap}>
          <NoDoExercicio ordem={ordem} estado={estado} progresso={Math.min(1, feitas.length / Math.max(1, item.series))} selo={selo} />
        </View>
        {!ultimo && (
          <View style={styles.linha}>
            {completo && selo && <Animated.View style={[styles.linhaFeita, DESCER]} />}
          </View>
        )}
      </View>

      <View style={styles.conteudo}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: aberto }}
          accessibilityLabel={`${ordem}. ${nome}${modo !== 'planejado' ? `, ${feitas.length} de ${item.series} séries` : `, ${item.series} séries`}`}
          onPress={onToggle}
          onLongPress={onLongPress}
          delayLongPress={350}
          style={({ pressed }) => [styles.cabeca, pressed && styles.pressed]}>
          {(atual || aberto) && (
            <LinearGradient pointerEvents="none" colors={gradients.timelineAtual} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.reflexo} />
          )}
          <View style={[styles.thumb, completo && styles.thumbFeito]}>
            {ex && <MapaMuscular principal={ex.musculoPrincipal} altura={46} podeVirar={false} sexo={sexo} />}
          </View>
          <View style={styles.flex}>
            {estado === 'atual' ? <Text style={styles.agoraRotulo}>Agora</Text> : null}
            <Text style={[styles.nome, completo && styles.nomeFeito]} numberOfLines={2}>
              {nome}
            </Text>
            <View style={styles.meta}>
              <Text variant="caption" tone="muted" numberOfLines={1} style={styles.flexShrink}>
                {ex ? MUSCULO_LABELS[ex.musculoPrincipal] : ''} · {item.series} × {reps}
              </Text>
              {modo !== 'planejado' && (
                <View style={styles.pontos} accessibilityLabel={`${Math.min(feitas.length, item.series)} de ${item.series} séries feitas`}>
                  {Array.from({ length: item.series }, (_, k) => (
                    <View key={k} style={[styles.pontoSerie, k < feitas.length && styles.pontoSerieFeito]} />
                  ))}
                </View>
              )}
            </View>
          </View>
          <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={17} color={colors.ink3} />
        </Pressable>

        {aberto && (
          <View style={styles.series}>
            {Array.from({ length: linhas }, (_, k) => {
              const s = feitas[k];
              const agora = !s && modo === 'andamento' && k === feitas.length;
              const ult = antes[k];
              return (
                <Pressable
                  key={k}
                  disabled={!aoVivo}
                  accessibilityRole={aoVivo ? 'button' : undefined}
                  accessibilityLabel={`Série ${k + 1}${s ? `, feita: ${formatDecimal(s.cargaKg)} kg × ${s.reps}` : ''}`}
                  accessibilityHint={aoVivo ? 'Abre o treino ao vivo neste exercício' : undefined}
                  onPress={onAbrir}
                  style={({ pressed }) => [styles.serie, agora && styles.serieAgora, pressed && styles.pressed]}>
                  {s ? (
                    <Animated.View entering={ZoomIn.duration(260)} style={[styles.bolinha, styles.bolinhaFeita]}>
                      <Ionicons name="checkmark" size={11} color={colors.onLime} />
                    </Animated.View>
                  ) : (
                    <View style={[styles.bolinha, agora && styles.bolinhaAgora]}>
                      <Text style={[styles.bolinhaText, agora && styles.bolinhaTextAgora]}>{k + 1}</Text>
                    </View>
                  )}
                  <View style={styles.flex}>
                    <Text style={[styles.serieTitulo, !s && !agora && styles.serieFutura]}>
                      {s ? `${formatDecimal(s.cargaKg)} kg × ${s.reps}` : `Série ${k + 1} · ${reps} repetições`}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {s
                        ? `série ${k + 1} · feita às ${hora(s.concluidaEm)}`
                        : agora
                          ? 'é a vez desta série'
                          : ult
                            ? `última vez: ${formatDecimal(ult.cargaKg)} kg × ${ult.reps}`
                            : k === 0 && item.cargaInicialKg
                              ? `carga inicial: ${formatDecimal(item.cargaInicialKg)} kg`
                              : `descanso de ${item.descansoSeg} s`}
                    </Text>
                  </View>
                  {aoVivo && agora ? <Ionicons name="chevron-forward" size={16} color={colors.lime} /> : null}
                </Pressable>
              );
            })}
            {item.observacao ? (
              <Text variant="caption" tone="secondary" style={styles.obs}>
                {item.observacao}
              </Text>
            ) : null}
            {onAbrir && (
              <Pressable accessibilityRole="button" onPress={onAbrir} hitSlop={8} style={({ pressed }) => [styles.acao, pressed && styles.pressed]}>
                <Text style={styles.acaoText}>{modo === 'andamento' ? 'Abrir no treino ao vivo' : 'Começar por este'}</Text>
                <Ionicons name="chevron-forward" size={15} color={colors.ink} />
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    minWidth: 0,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dia: {
    fontFamily: fonts.display.semibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  item: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  trilho: {
    width: NO,
    alignItems: 'center',
  },
  noWrap: {
    width: NO,
    height: NO,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  no: {
    width: NO,
    height: NO,
    borderRadius: NO / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  noProximo: {
    borderColor: colors.line2,
  },
  noAberto: {
    width: NO,
    height: NO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  selo: {
    width: NO,
    height: NO,
    borderRadius: NO / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lime,
    borderWidth: 2.5,
    borderColor: colors.limeLight,
    transform: [{ rotate: '-8deg' }],
    shadowColor: colors.lime,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  noText: {
    fontFamily: fonts.display.semibold,
    fontSize: 13,
    color: colors.ink3,
    fontVariant: ['tabular-nums'],
  },
  noTextProximo: {
    color: colors.ink,
  },
  noTextAtual: {
    color: colors.lime,
  },
  linha: {
    flex: 1,
    width: 2,
    marginTop: 6,
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: colors.line,
  },
  linhaFeita: {
    width: 2,
    backgroundColor: colors.lime,
  },
  conteudo: {
    flex: 1,
    minWidth: 0,
    paddingBottom: spacing.md,
  },
  cabeca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginLeft: -10,
    borderRadius: 18,
    overflow: 'hidden',
  },
  reflexo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 18,
  },
  thumb: {
    width: 44,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  thumbFeito: {
    opacity: 0.6,
  },
  agoraRotulo: {
    fontFamily: fonts.body.bold,
    fontSize: 10.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.lime,
    marginBottom: 1,
  },
  nome: {
    fontFamily: fonts.body.bold,
    fontSize: 16,
    lineHeight: 21,
  },
  nomeFeito: {
    color: colors.ink2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  flexShrink: {
    flexShrink: 1,
  },
  series: {
    gap: 4,
    paddingTop: spacing.sm,
  },
  serie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginLeft: -10,
    borderRadius: 14,
  },
  serieAgora: {
    backgroundColor: colors.limeWash,
    borderWidth: 1,
    borderColor: colors.limeEdge,
  },
  bolinha: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.line2,
  },
  bolinhaFeita: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  bolinhaAgora: {
    borderColor: colors.lime,
    borderStyle: 'dashed',
  },
  bolinhaText: {
    fontFamily: fonts.body.bold,
    fontSize: 10.5,
    color: colors.ink3,
  },
  bolinhaTextAgora: {
    color: colors.lime,
  },
  pontos: {
    flexDirection: 'row',
    gap: 3,
  },
  pontoSerie: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.track,
  },
  pontoSerieFeito: {
    backgroundColor: colors.lime,
  },
  obs: {
    marginTop: 4,
  },
  serieTitulo: {
    fontFamily: fonts.body.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  serieFutura: {
    color: colors.ink2,
  },
  acao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingVertical: 6,
  },
  acaoText: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
  },
  cardio: {
    paddingTop: 18,
  },
  editar: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    color: colors.ink2,
  },
  editarOn: {
    color: colors.lime,
  },
  dicaEdicao: {
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  remover: {
    width: 104,
    marginVertical: 6,
    marginLeft: 8,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.warnTint,
    borderWidth: 1,
    borderColor: colors.warnEdge,
  },
  removerText: {
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
    color: colors.warnText,
  },
  noAdd: {
    borderStyle: 'dashed',
    borderColor: colors.line2,
  },
  adicionar: {
    justifyContent: 'center',
    minHeight: 58,
    paddingTop: 14,
  },
  adicionarText: {
    fontFamily: fonts.body.bold,
    fontSize: 15,
    color: colors.lime,
  },
  edicaoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
  },
  menos: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warnTint,
    borderWidth: 1,
    borderColor: colors.warnEdge,
  },
  seta: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  setaOff: {
    opacity: 0.3,
  },
  pressed: {
    opacity: 0.7,
  },
});
