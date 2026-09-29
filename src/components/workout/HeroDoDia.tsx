import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { NeonButton, Text } from '@/components/ui';
import { exercicioPorId } from '@/lib/exercicios';
import { formatDuration } from '@/lib/format';
import { tempoDeTreinoMs } from '@/lib/treino/met';
import { proximoExercicio, seriesFeitas } from '@/lib/treino/plano';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { Musculo, SessaoEmAndamento, TreinoDoDia } from '@/types/treino';

import { MapaMuscular } from './MapaMuscular';

const ALTURA = 340;

/** Relógio que atualiza a cada segundo. */
function useAgora() {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return agora;
}

/** O ponto "ao vivo" pulsa devagar. */
const PULSO = {
  animationName: {
    '0%': { opacity: 1, transform: [{ scale: 1 }] },
    '100%': { opacity: 0.35, transform: [{ scale: 0.8 }] },
  },
  animationDuration: 900,
  animationIterationCount: 'infinite' as const,
  animationDirection: 'alternate' as const,
  animationTimingFunction: 'ease-in-out' as const,
};

/** Músculos do treino, do que tem mais séries para o que tem menos. */
export function musculosDoTreino(t: TreinoDoDia): Musculo[] {
  const conta = new Map<Musculo, number>();
  for (const e of t.exercicios) {
    const m = exercicioPorId(e.exercicioId)?.musculoPrincipal;
    if (m) conta.set(m, (conta.get(m) ?? 0) + e.series);
  }
  return [...conta.entries()].sort((a, b) => b[1] - a[1]).map(([m]) => m);
}

/**
 * Topo do Treino (opção "Foco no dia"): o corpo grande com os músculos do dia
 * à direita, direto no fundo escuro, e o texto por cima, à esquerda.
 */
function Palco({ musculos, sexo, children }: { musculos: readonly Musculo[]; sexo?: 'feminino' | 'masculino'; children: ReactNode }) {
  return (
    <View style={styles.palco}>
      {musculos.length > 0 && (
        <View style={styles.corpo} pointerEvents="none">
          <MapaMuscular principal={musculos[0]} secundarios={musculos.slice(1, 4)} sexo={sexo} altura={ALTURA - 40} podeVirar={false} />
        </View>
      )}
      <View style={styles.texto}>{children}</View>
    </View>
  );
}

/**
 * Treino do dia: "HOJE · TERÇA-FEIRA · 8 EXERCÍCIOS", o nome e o corpo.
 * Antes de começar tem o botão; com o treino rodando, o botão sai (o tempo e
 * o exercício atual ficam no card "Treino em andamento", logo abaixo).
 */
export function HeroTreino({
  kicker,
  treino,
  sexo,
  feito,
  emAndamento,
  bloqueado,
  dica,
  onIniciar,
}: {
  kicker: string;
  treino: TreinoDoDia;
  sexo?: 'feminino' | 'masculino';
  feito?: string;
  emAndamento?: boolean;
  bloqueado?: boolean;
  dica?: string;
  onIniciar: () => void;
}) {
  const n = treino.exercicios.length;
  return (
    <Palco musculos={musculosDoTreino(treino)} sexo={sexo}>
      <Text style={styles.kicker}>
        {kicker} · {n} {n === 1 ? 'exercício' : 'exercícios'}
      </Text>
      <Text style={styles.titulo} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75}>
        {treino.nome}
      </Text>
      {feito ? (
        <View style={styles.feito}>
          <Ionicons name="checkmark-circle" size={17} color={colors.lime} />
          <Text variant="caption" style={styles.feitoText}>
            {feito}
          </Text>
        </View>
      ) : emAndamento ? null : bloqueado ? (
        <Text variant="caption" tone="secondary" style={styles.nota}>
          Termine o treino em andamento para começar este.
        </Text>
      ) : (
        <>
          <NeonButton label="Iniciar treino" onPress={onIniciar} style={styles.btn} />
          {dica ? (
            <Text variant="caption" tone="muted" style={styles.nota}>
              {dica}
            </Text>
          ) : null}
        </>
      )}
    </Palco>
  );
}

/** Dia de descanso: só o texto, sem o corpo. */
export function HeroDescanso({ kicker, proximo }: { kicker: string; proximo?: string }) {
  return (
    <View style={styles.descanso}>
      <Text style={styles.kicker}>{kicker} · descanso</Text>
      <Text style={styles.titulo}>Dia de recuperar</Text>
      {proximo ? (
        <Text tone="secondary" style={styles.nota}>
          Próximo: {proximo}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * "Treino em andamento": o tempo correndo (com pausar/continuar), o exercício
 * atual com a série da vez e o progresso de séries. Tocar abre o treino ao vivo.
 */
export function CardEmAndamento({
  treino,
  sessao,
  sexo,
  mostrarNome,
  onAbrir,
  onPausar,
  onContinuar,
}: {
  treino: TreinoDoDia;
  sessao: SessaoEmAndamento;
  sexo?: 'feminino' | 'masculino';
  /** Mostra o nome do treino (quando a tela está em outro dia). */
  mostrarNome?: boolean;
  onAbrir: () => void;
  onPausar: () => void;
  onContinuar: () => void;
}) {
  const agora = useAgora();
  const reduce = useReducedMotion();
  const pausado = !!sessao.pausadoEm;
  const tempo = formatDuration(tempoDeTreinoMs(sessao, agora) / 1000);
  const total = treino.exercicios.reduce((s, e) => s + e.series, 0);
  const feitas = treino.exercicios.reduce((s, e) => s + Math.min(e.series, seriesFeitas(sessao, e.id)), 0);
  const acabou = treino.exercicios.every((e) => seriesFeitas(sessao, e.id) >= e.series);
  const i = proximoExercicio(treino, sessao);
  const atual = acabou ? undefined : treino.exercicios[i];
  const ex = atual ? exercicioPorId(atual.exercicioId) : undefined;
  const serie = atual ? Math.min(atual.series, seriesFeitas(sessao, atual.id) + 1) : 0;
  const pct = total ? feitas / total : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Treino ${pausado ? 'pausado' : 'em andamento'}, ${tempo}. ${
        atual ? `Agora: ${ex?.nome ?? 'exercício'}, série ${serie} de ${atual.series}.` : 'Tudo feito.'
      } ${feitas} de ${total} séries. Abrir treino`}
      onPress={onAbrir}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardTopo}>
        <Animated.View style={[styles.ponto, pausado && styles.pontoPausado, !pausado && !reduce && PULSO]} />
        <Text style={[styles.cardRotulo, pausado && styles.cardRotuloPausado]} numberOfLines={1}>
          {pausado ? 'Pausado' : 'Treino em andamento'}
          {mostrarNome ? ` · ${treino.nome}` : ''}
        </Text>
        <Ionicons name="chevron-forward" size={17} color={colors.ink3} />
      </View>

      <View style={styles.cardTempoLinha}>
        <Text style={[styles.cardTempo, pausado && styles.tempoPausado]}>{tempo}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={pausado ? 'Continuar o cronômetro' : 'Pausar o cronômetro'}
          hitSlop={8}
          onPress={pausado ? onContinuar : onPausar}
          style={({ pressed }) => [styles.pausa, pausado && styles.pausaOn, pressed && styles.pressed]}>
          <Ionicons name={pausado ? 'play' : 'pause'} size={20} color={pausado ? colors.onLime : colors.ink} />
        </Pressable>
      </View>

      <View style={styles.cardAgora}>
        <View style={styles.cardThumb}>
          {ex ? (
            <MapaMuscular principal={ex.musculoPrincipal} secundarios={ex.musculosSecundarios} altura={46} podeVirar={false} sexo={sexo} />
          ) : (
            <Ionicons name="trophy" size={22} color={colors.lime} />
          )}
        </View>
        <View style={styles.flex}>
          <Text variant="caption" tone="muted" style={styles.cardAgoraRotulo}>
            {atual ? `Agora · exercício ${i + 1} de ${treino.exercicios.length}` : 'Tudo feito'}
          </Text>
          <Text style={styles.cardExercicio} numberOfLines={1}>
            {atual ? (ex?.nome ?? 'Exercício') : 'Toque para finalizar o treino'}
          </Text>
        </View>
        {atual ? (
          <View style={styles.cardSerie}>
            <Text style={styles.cardSerieText}>
              {serie}/{atual.series}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.barra}>
        <View style={[styles.barraCheia, { width: `${Math.round(pct * 100)}%` }]} />
      </View>
      <Text variant="caption" tone="muted" style={styles.cardSeries}>
        {feitas} de {total} séries
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  palco: {
    height: ALTURA,
    marginHorizontal: -spacing.lg,
    overflow: 'hidden',
  },
  corpo: {
    position: 'absolute',
    right: -spacing.md,
    top: 4,
  },
  texto: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
  },
  kicker: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.ink3,
    maxWidth: '74%',
  },
  titulo: {
    marginTop: spacing.sm,
    maxWidth: '64%',
    fontFamily: fonts.display.bold,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -1.2,
  },
  btn: {
    marginTop: spacing.lg,
    maxWidth: 240,
  },
  nota: {
    marginTop: spacing.sm,
    maxWidth: '70%',
  },
  feito: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
    maxWidth: '70%',
  },
  feitoText: {
    flex: 1,
    fontFamily: fonts.body.bold,
    color: colors.ink2,
  },
  descanso: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    padding: 18,
    gap: 14,
    borderRadius: radius.xl,
    backgroundColor: colors.glassFillStrong,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.frostCardEdgeTop,
  },
  cardTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ponto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lime,
  },
  pontoPausado: {
    backgroundColor: colors.ink3,
  },
  cardRotulo: {
    flex: 1,
    fontFamily: fonts.body.bold,
    fontSize: 11.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.lime,
  },
  cardRotuloPausado: {
    color: colors.ink3,
  },
  cardTempoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  cardTempo: {
    fontFamily: fonts.display.bold,
    fontSize: 46,
    lineHeight: 52,
    letterSpacing: -1.6,
    fontVariant: ['tabular-nums'],
  },
  tempoPausado: {
    color: colors.ink3,
  },
  pausa: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  pausaOn: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  cardAgora: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
  },
  cardThumb: {
    width: 44,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
  },
  cardAgoraRotulo: {
    fontFamily: fonts.body.semibold,
  },
  cardExercicio: {
    fontFamily: fonts.body.bold,
    fontSize: 16,
    lineHeight: 21,
  },
  cardSerie: {
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 15,
    justifyContent: 'center',
    backgroundColor: colors.limeWash,
    borderWidth: 1,
    borderColor: colors.limeEdge,
  },
  cardSerieText: {
    fontFamily: fonts.display.bold,
    fontSize: 13,
    color: colors.lime,
    fontVariant: ['tabular-nums'],
  },
  barra: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: colors.track,
  },
  barraCheia: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lime,
  },
  cardSeries: {
    marginTop: -8,
    fontFamily: fonts.body.semibold,
  },
  pressed: {
    opacity: 0.8,
  },
});
