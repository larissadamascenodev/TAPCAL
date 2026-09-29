import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming, ZoomIn, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/ui';
import { exercicioPorId } from '@/lib/exercicios';
import { proximoExercicio } from '@/lib/treino/plano';
import { colors, fonts, gradients, radius, spacing } from '@/theme/theme';
import type { Cardio, ExercicioNoTreino, SerieFeita, TreinoDoDia } from '@/types/treino';

import { MapaMuscular } from './MapaMuscular';

type Modo = 'andamento' | 'feito' | 'planejado';

type Props = {
  treino: TreinoDoDia;
  modo: Modo;
  /** "Hoje · terça-feira", "Segunda-feira"… */
  titulo: string;
  /** Séries já feitas (do treino em andamento ou do treino concluído). */
  series: readonly SerieFeita[];
  sexo?: 'feminino' | 'masculino';
  /** Tocar num exercício: abre o resumo dele (séries feitas, tempo). */
  onVer: (exercicioNoTreinoId: string) => void;
  /**
   * Edição do treino (vale também para plano da IA). Fora do Editar: segurar
   * e arrastar muda a ordem. No Editar: a alça arrasta e deslizar remove.
   */
  edicao?: {
    onAdicionar: () => void;
    onRemover: (exercicioNoTreinoId: string) => void;
    onMoverPara: (exercicioNoTreinoId: string, indice: number) => void;
  };
};

const tique = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

const NO = 40;
const NO_R = 18;
const NO_C = 2 * Math.PI * NO_R;
/** Segurar por este tempo (ms) para começar a arrastar fora do Editar. */
const SEGURAR = 320;

/** Depois do selo, a linha desce até o próximo exercício. */
const DESCER = {
  animationName: { from: { height: '0%' as const }, to: { height: '100%' as const } },
  animationDuration: 520,
  animationDelay: 220,
  animationFillMode: 'both' as const,
  animationTimingFunction: 'ease-out' as const,
};

const nomeCardio = (c: Cardio) => (c.atividade === 'eliptico' ? 'elíptico' : c.atividade);

/**
 * Exercícios do dia em linha do tempo: cada exercício é um ponto na linha,
 * com o nome e quantas séries já foram feitas. O atual é um círculo tracejado
 * que fecha a cada série; feito, vira um selo com ✓. Tocar abre o resumo.
 */
export function ListaExerciciosDoDia({ treino, modo, titulo, series, sexo, onVer, edicao }: Props) {
  const [editando, setEditando] = useState(false);
  // O selo de "feito" entra com animação quando a pessoa volta para a lista
  // (as séries são marcadas no treino ao vivo, com esta tela escondida).
  const focado = useIsFocused();
  const [vistos, setVistos] = useState<readonly string[]>([]);
  const feitasDe = (id: string) => series.filter((s) => s.exercicioNoTreinoId === id).length;
  const completos = treino.exercicios.filter((e) => modo !== 'planejado' && feitasDe(e.id) >= e.series).map((e) => e.id);
  if (focado && completos.some((id) => !vistos.includes(id))) setVistos(completos);
  const selados = new Set(completos.filter((id) => focado || vistos.includes(id)));
  const idAtual = modo === 'andamento' ? treino.exercicios[proximoExercicio(treino, { series: [...series] })]?.id : undefined;

  // Arrastar para mudar a ordem: alturas medidas de cada linha, qual está
  // sendo arrastada, quanto andou e para que posição vai.
  const alturasRef = useRef<number[]>([]);
  const alturas = useSharedValue<number[]>([]);
  const arrastando = useSharedValue(-1);
  const dy = useSharedValue(0);
  const alvo = useSharedValue(-1);
  const n = treino.exercicios.length;
  const medir = (i: number, h: number) => {
    const lista = alturasRef.current.slice(0, n);
    lista[i] = h;
    alturasRef.current = lista;
    alturas.value = [...lista];
  };
  const soltar = (id: string, de: number, para: number) => {
    if (edicao && para >= 0 && para !== de) edicao.onMoverPara(id, para);
    arrastando.value = -1;
    dy.value = 0;
    alvo.value = -1;
  };
  const arrasto = { alturas, arrastando, dy, alvo, onSoltar: soltar, onAltura: medir };

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
            {n} {n === 1 ? 'exercício' : 'exercícios'}
          </Text>
        )}
      </View>
      {editando && (
        <Text variant="caption" tone="muted" style={styles.dicaEdicao}>
          Segure a alça e arraste para mudar a ordem. Deslize para o lado para remover. Vale para as próximas vezes deste treino.
        </Text>
      )}

      {treino.exercicios.map((e, i) => {
        const feitas = feitasDe(e.id);
        if (editando && edicao) {
          const nome = exercicioPorId(e.exercicioId)?.nome ?? 'exercício';
          return (
            <Arrastavel key={e.id} id={e.id} index={i} pelaAlca {...arrasto}>
              {(alca) => (
                <ReanimatedSwipeable
                  friction={2}
                  rightThreshold={60}
                  overshootRight={false}
                  renderRightActions={(_p, _t, metodos) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remover ${nome} do treino`}
                      onPress={() => {
                        metodos.close();
                        edicao.onRemover(e.id);
                      }}
                      style={styles.remover}>
                      <Ionicons name="trash-outline" size={18} color={colors.warnText} />
                      <Text style={styles.removerText}>Remover</Text>
                    </Pressable>
                  )}>
                  <ItemEdicao item={e} ordem={i + 1} sexo={sexo} alca={alca} />
                </ReanimatedSwipeable>
              )}
            </Arrastavel>
          );
        }
        const completo = modo !== 'planejado' && feitas >= e.series;
        return (
          <Arrastavel key={e.id} id={e.id} index={i} desligado={!edicao} {...arrasto}>
            {() => (
              <Item
                item={e}
                ordem={i + 1}
                modo={modo}
                estado={completo ? 'feito' : e.id === idAtual ? 'atual' : 'depois'}
                feitas={feitas}
                selo={selados.has(e.id)}
                sexo={sexo}
                ultimo={i === n - 1 && !treino.cardio && !edicao}
                onPress={() => onVer(e.id)}
              />
            )}
          </Arrastavel>
        );
      })}

      {edicao && (
        <View style={styles.item}>
          <View style={styles.trilho}>
            <View style={[styles.no, styles.noAdd]}>
              <Ionicons name="add" size={17} color={colors.ink2} />
            </View>
          </View>
          <Pressable accessibilityRole="button" onPress={edicao.onAdicionar} style={({ pressed }) => [styles.conteudo, styles.adicionar, pressed && styles.pressed]}>
            <Text style={styles.adicionarText}>Adicionar exercício</Text>
          </Pressable>
        </View>
      )}
      {treino.cardio && (
        <View style={styles.item}>
          <View style={styles.trilho}>
            <View style={[styles.no, styles.noCardio]}>
              <Ionicons name="heart-outline" size={15} color={colors.ink2} />
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

type ArrastoProps = {
  alturas: SharedValue<number[]>;
  arrastando: SharedValue<number>;
  dy: SharedValue<number>;
  alvo: SharedValue<number>;
  onSoltar: (id: string, de: number, para: number) => void;
  onAltura: (index: number, altura: number) => void;
};

/**
 * Linha que pode ser arrastada para cima ou para baixo. Fora do Editar,
 * começa segurando a linha; no Editar, pela alça (que o filho recebe).
 */
function Arrastavel({
  id,
  index,
  pelaAlca,
  desligado,
  alturas,
  arrastando,
  dy,
  alvo,
  onSoltar,
  onAltura,
  children,
}: ArrastoProps & {
  id: string;
  index: number;
  pelaAlca?: boolean;
  desligado?: boolean;
  children: (alca: ReactNode) => ReactNode;
}) {
  const pan = Gesture.Pan()
    .enabled(!desligado)
    .activateAfterLongPress(pelaAlca ? 0 : SEGURAR)
    .onStart(() => {
      arrastando.set(index);
      alvo.set(index);
      dy.set(0);
      runOnJS(tique)();
    })
    .onUpdate((e) => {
      dy.set(e.translationY);
      const hs = alturas.value;
      let topo = 0;
      for (let k = 0; k < index; k++) topo += hs[k] ?? 0;
      const centro = topo + (hs[index] ?? 0) / 2 + e.translationY;
      // Posição nova = quantas outras linhas ficam acima do centro da arrastada.
      let y = 0;
      let novo = 0;
      for (let k = 0; k < hs.length; k++) {
        if (k === index) continue;
        if (centro > y + (hs[k] ?? 0) / 2) novo++;
        y += hs[k] ?? 0;
      }
      if (novo !== alvo.value) runOnJS(tique)();
      alvo.set(novo);
    })
    .onEnd(() => {
      runOnJS(onSoltar)(id, index, alvo.value);
    })
    .onFinalize((_e, ok) => {
      if (!ok) {
        arrastando.set(-1);
        dy.set(0);
      }
    });
  if (pelaAlca) pan.failOffsetX([-24, 24]);

  const estilo = useAnimatedStyle(() => {
    const a = arrastando.value;
    if (a < 0) return { zIndex: 0, transform: [{ translateY: 0 }, { scale: 1 }] };
    if (a === index) return { zIndex: 10, transform: [{ translateY: dy.value }, { scale: 1.03 }] };
    const h = alturas.value[a] ?? 0;
    const t = alvo.value;
    const desloca = a < index && index <= t ? -h : a > index && index >= t ? h : 0;
    return { zIndex: 0, transform: [{ translateY: withTiming(desloca, { duration: 160 }) }, { scale: 1 }] };
  });

  const alca = pelaAlca ? (
    <GestureDetector gesture={pan}>
      <View accessible accessibilityLabel="Arrastar para mudar a ordem" hitSlop={8} style={styles.alca}>
        <Ionicons name="reorder-three" size={24} color={colors.ink3} />
      </View>
    </GestureDetector>
  ) : null;

  const linha = (
    <Animated.View style={estilo} onLayout={(e) => onAltura(index, e.nativeEvent.layout.height)}>
      {children(alca)}
    </Animated.View>
  );
  return pelaAlca ? linha : <GestureDetector gesture={pan}>{linha}</GestureDetector>;
}

/** Exercício no modo de edição: alça para arrastar; deslizar remove. */
function ItemEdicao({ item, ordem, sexo, alca }: { item: ExercicioNoTreino; ordem: number; sexo?: 'feminino' | 'masculino'; alca: ReactNode }) {
  const ex = exercicioPorId(item.exercicioId);
  return (
    <View style={styles.edicao}>
      <View style={styles.edicaoNum}>
        <Text style={[styles.noText, styles.edicaoNumText]}>{String(ordem).padStart(2, '0')}</Text>
      </View>
      <View style={styles.thumb}>{ex && <MapaMuscular principal={ex.musculoPrincipal} altura={46} podeVirar={false} sexo={sexo} />}</View>
      <View style={styles.flex}>
        <Text style={styles.nome} numberOfLines={2}>
          {ex?.nome ?? 'Exercício'}
        </Text>
        <Text variant="caption" tone="muted">
          {item.series} {item.series === 1 ? 'série' : 'séries'}
        </Text>
      </View>
      {alca}
    </View>
  );
}

/**
 * Ponto do exercício na linha do tempo:
 * - o atual (treino rodando) é um círculo aberto, tracejado, que vai se
 *   fechando a cada série feita;
 * - feito, vira um selo com o ✓ (entra com um "pop");
 * - os outros, só o número.
 */
function NoDoExercicio({ ordem, estado, progresso, selo }: { ordem: number; estado: 'feito' | 'atual' | 'depois'; progresso: number; selo: boolean }) {
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
          <Circle cx={NO / 2} cy={NO / 2} r={NO_R} fill="none" stroke={colors.line2} strokeWidth={2} strokeDasharray="2.5 4" strokeLinecap="round" />
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
    <View style={styles.no}>
      <Text style={styles.noText}>{numero}</Text>
    </View>
  );
}

function Item({
  item,
  ordem,
  modo,
  estado,
  feitas,
  selo,
  sexo,
  ultimo,
  onPress,
}: {
  item: ExercicioNoTreino;
  ordem: number;
  modo: Modo;
  estado: 'feito' | 'atual' | 'depois';
  feitas: number;
  /** Mostra o selo de feito (a animação dele toca quando a lista está à vista). */
  selo: boolean;
  sexo?: 'feminino' | 'masculino';
  ultimo: boolean;
  onPress: () => void;
}) {
  const ex = exercicioPorId(item.exercicioId);
  const nome = ex?.nome ?? 'Exercício';
  const completo = estado === 'feito';
  const meta =
    modo === 'planejado'
      ? `${item.series} ${item.series === 1 ? 'série' : 'séries'}`
      : `${Math.min(feitas, item.series)} de ${item.series} ${item.series === 1 ? 'série' : 'séries'}`;

  return (
    <View style={styles.item}>
      <View style={styles.trilho}>
        <View style={styles.noWrap}>
          <NoDoExercicio ordem={ordem} estado={estado} progresso={Math.min(1, feitas / Math.max(1, item.series))} selo={selo} />
        </View>
        {!ultimo && <View style={styles.linha}>{completo && selo && <Animated.View style={[styles.linhaFeita, DESCER]} />}</View>}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${ordem}. ${nome}, ${meta}`}
        accessibilityHint="Abre o resumo do exercício"
        onPress={onPress}
        style={({ pressed }) => [styles.conteudo, styles.cabeca, pressed && styles.pressed]}>
        {estado === 'atual' && (
          <LinearGradient pointerEvents="none" colors={gradients.timelineAtual} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.reflexo} />
        )}
        <View style={styles.thumb}>{ex && <MapaMuscular principal={ex.musculoPrincipal} altura={46} podeVirar={false} sexo={sexo} />}</View>
        <View style={styles.flex}>
          {estado === 'atual' ? <Text style={styles.agoraRotulo}>Agora</Text> : null}
          <Text style={[styles.nome, completo && styles.nomeFeito]} numberOfLines={2}>
            {nome}
          </Text>
          <Text variant="caption" tone="muted">
            {meta}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
      </Pressable>
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
    marginBottom: spacing.sm,
  },
  dia: {
    fontFamily: fonts.display.semibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  editar: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    color: colors.ink2,
  },
  editarOn: {
    color: colors.ink,
  },
  dicaEdicao: {
    marginBottom: spacing.md,
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
    marginTop: 22,
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
  noAdd: {
    marginTop: 12,
    borderStyle: 'dashed',
    borderColor: colors.line2,
  },
  noCardio: {
    marginTop: 12,
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
  },
  // Número centralizado de verdade no círculo (sem o respiro da fonte).
  noText: {
    width: NO,
    textAlign: 'center',
    fontFamily: fonts.display.semibold,
    fontSize: 13,
    lineHeight: 16,
    includeFontPadding: false,
    color: colors.ink3,
    fontVariant: ['tabular-nums'],
  },
  noTextAtual: {
    color: colors.ink,
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
    backgroundColor: colors.ink2,
  },
  conteudo: {
    flex: 1,
    minWidth: 0,
  },
  cabeca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 76,
    marginVertical: 4,
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
  },
  agoraRotulo: {
    fontFamily: fonts.body.bold,
    fontSize: 10.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.ink2,
  },
  nome: {
    fontFamily: fonts.body.bold,
    fontSize: 15.5,
    lineHeight: 20,
  },
  nomeFeito: {
    color: colors.ink2,
  },
  cardio: {
    paddingTop: 18,
    paddingBottom: spacing.md,
  },
  adicionar: {
    justifyContent: 'center',
    minHeight: 64,
  },
  adicionarText: {
    fontFamily: fonts.body.bold,
    fontSize: 15,
    color: colors.ink,
  },
  edicao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 72,
    marginBottom: 8,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 6,
    borderRadius: radius.lg,
    backgroundColor: colors.glassSubtle,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  edicaoNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  edicaoNumText: {
    width: 30,
    fontSize: 11,
  },
  alca: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remover: {
    width: 104,
    marginBottom: 8,
    marginLeft: 8,
    borderRadius: radius.lg,
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
  pressed: {
    opacity: 0.7,
  },
});
