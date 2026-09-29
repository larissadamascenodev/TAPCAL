import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

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
  /** Em andamento: abre o exercício no treino. Planejado: começa o treino por ele. */
  onAbrir?: (exercicioNoTreinoId: string) => void;
  /** Em andamento: tocar numa série que falta abre o registro dela. */
  onSerie?: (exercicioNoTreinoId: string) => void;
};

const NO = 30;

const hora = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const nomeCardio = (c: Cardio) => (c.atividade === 'eliptico' ? 'elíptico' : c.atividade);

/**
 * Exercícios do dia em linha do tempo (sem cartões): cada exercício é um ponto
 * na linha; o atual tem um reflexo de vidro e o ponto em destaque. Fechado,
 * mostra só o exercício; aberto, as séries. O atual (ou o primeiro) já vem aberto.
 */
export function ListaExerciciosDoDia({ treino, modo, titulo, series, historico, sexo, onAbrir, onSerie }: Props) {
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
        <Text style={styles.dia}>{titulo}</Text>
        <Text variant="caption" tone="muted">
          {treino.exercicios.length} {treino.exercicios.length === 1 ? 'exercício' : 'exercícios'}
        </Text>
      </View>
      {treino.exercicios.map((e, i) => {
        const feitas = series.filter((s) => s.exercicioNoTreinoId === e.id);
        const ultimo = i === treino.exercicios.length - 1 && !treino.cardio;
        return (
          <Item
            key={e.id}
            item={e}
            ordem={i + 1}
            modo={modo}
            atual={e.id === idAtual}
            feitas={feitas}
            historico={historico}
            sexo={sexo}
            aberto={aberto === e.id}
            ultimo={ultimo}
            onToggle={() => setEscolha({ id: aberto === e.id ? null : e.id, base: idAtual })}
            onAbrir={onAbrir && (() => onAbrir(e.id))}
            onSerie={onSerie && (() => onSerie(e.id))}
          />
        );
      })}
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

function Item({
  item,
  ordem,
  modo,
  atual,
  feitas,
  historico,
  sexo,
  aberto,
  ultimo,
  onToggle,
  onAbrir,
  onSerie,
}: {
  item: ExercicioNoTreino;
  ordem: number;
  modo: Modo;
  atual: boolean;
  feitas: readonly SerieFeita[];
  historico: readonly SessaoDeTreino[];
  sexo?: 'feminino' | 'masculino';
  aberto: boolean;
  ultimo: boolean;
  onToggle: () => void;
  onAbrir?: () => void;
  onSerie?: () => void;
}) {
  const ex = exercicioPorId(item.exercicioId);
  const nome = ex?.nome ?? 'Exercício';
  const completo = modo !== 'planejado' && feitas.length >= item.series;
  const reps = repsLabel(item);
  const antes = ultimasSeries([...historico], item.exercicioId)?.series ?? [];
  const linhas = Math.max(item.series, feitas.length);

  return (
    <View style={styles.item}>
      <View style={styles.trilho}>
        <View style={[styles.no, atual && styles.noAtual, completo && styles.noFeito]}>
          {completo ? (
            <Ionicons name="checkmark" size={15} color={colors.lime} />
          ) : (
            <Text style={[styles.noText, atual && styles.noTextAtual]}>{String(ordem).padStart(2, '0')}</Text>
          )}
        </View>
        {!ultimo && <View style={[styles.linha, completo && styles.linhaFeita]} />}
      </View>

      <View style={styles.conteudo}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: aberto }}
          accessibilityLabel={`${ordem}. ${nome}${modo !== 'planejado' ? `, ${feitas.length} de ${item.series} séries` : `, ${item.series} séries`}`}
          onPress={onToggle}
          style={({ pressed }) => [styles.cabeca, pressed && styles.pressed]}>
          {(atual || aberto) && (
            <LinearGradient pointerEvents="none" colors={gradients.timelineAtual} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.reflexo} />
          )}
          <View style={styles.thumb}>{ex && <MapaMuscular principal={ex.musculoPrincipal} altura={44} podeVirar={false} sexo={sexo} />}</View>
          <View style={styles.flex}>
            <Text style={[styles.nome, completo && styles.nomeFeito]} numberOfLines={2}>
              {nome}
            </Text>
            <Text variant="caption" tone="muted">
              {ex ? MUSCULO_LABELS[ex.musculoPrincipal] : ''} · {item.series} {item.series === 1 ? 'série' : 'séries'}
            </Text>
            <View style={styles.pontos} accessibilityLabel={`${Math.min(feitas.length, item.series)} de ${item.series} séries feitas`}>
              {Array.from({ length: item.series }, (_, k) => (
                <View key={k} style={[styles.pontoSerie, k < feitas.length && styles.pontoSerieFeito]} />
              ))}
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
                  disabled={!onSerie || !!s}
                  accessibilityRole={onSerie && !s ? 'button' : undefined}
                  accessibilityHint={onSerie && !s ? 'Registrar carga e repetições' : undefined}
                  onPress={onSerie}
                  style={({ pressed }) => [styles.serie, pressed && styles.pressed]}>
                  {s ? (
                    <Animated.View entering={ZoomIn.duration(280)} style={[styles.bolinha, styles.bolinhaFeita]} />
                  ) : (
                    <View style={[styles.bolinha, agora && styles.bolinhaAgora]} />
                  )}
                  <View style={styles.flex}>
                    <Text style={[styles.serieTitulo, !s && !agora && styles.serieFutura]}>
                      Série {k + 1} · {s ? `${formatDecimal(s.cargaKg)} kg × ${s.reps}` : `${reps} repetições`}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {s
                        ? `feita às ${hora(s.concluidaEm)}`
                        : agora && onSerie
                          ? 'agora · toque para registrar'
                          : agora
                            ? 'agora'
                          : ult
                            ? `última vez: ${formatDecimal(ult.cargaKg)} kg × ${ult.reps}`
                            : k === 0 && item.cargaInicialKg
                              ? `carga inicial: ${formatDecimal(item.cargaInicialKg)} kg`
                              : `descanso de ${item.descansoSeg} s`}
                    </Text>
                  </View>
                  {agora && onSerie ? <Ionicons name="create-outline" size={16} color={colors.lime} /> : null}
                </Pressable>
              );
            })}
            {item.observacao ? (
              <Text variant="caption" tone="secondary">
                {item.observacao}
              </Text>
            ) : null}
            {onAbrir && (
              <Pressable accessibilityRole="button" onPress={onAbrir} hitSlop={8} style={({ pressed }) => [styles.acao, pressed && styles.pressed]}>
                <Text style={styles.acaoText}>{modo === 'andamento' ? 'Abrir exercício' : 'Começar por este'}</Text>
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
  no: {
    width: NO,
    height: NO,
    marginTop: 14,
    borderRadius: NO / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  noAtual: {
    borderColor: colors.lime,
  },
  noFeito: {
    backgroundColor: colors.glassFillStrong,
    borderColor: colors.line2,
  },
  noText: {
    fontFamily: fonts.display.semibold,
    fontSize: 11,
    color: colors.ink3,
  },
  noTextAtual: {
    color: colors.ink,
  },
  linha: {
    flex: 1,
    width: 1.5,
    marginTop: 4,
    backgroundColor: colors.line,
  },
  linhaFeita: {
    backgroundColor: colors.ink3,
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
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nome: {
    fontFamily: fonts.body.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  nomeFeito: {
    color: colors.ink2,
  },
  series: {
    gap: 10,
    paddingTop: spacing.sm,
    paddingLeft: 4,
  },
  serie: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bolinha: {
    width: 10,
    height: 10,
    marginTop: 5,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.line2,
  },
  bolinhaFeita: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  bolinhaAgora: {
    borderColor: colors.lime,
    borderWidth: 2,
  },
  pontos: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  pontoSerie: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.track,
  },
  pontoSerieFeito: {
    backgroundColor: colors.lime,
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
  pressed: {
    opacity: 0.7,
  },
});
