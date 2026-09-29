import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Glass, IconButton, NeonButton, Text } from '@/components/ui';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { exercicioPorId } from '@/lib/exercicios';
import { formatDuration, formatInt } from '@/lib/format';
import { tempoDeTreinoMs } from '@/lib/treino/met';
import { proximoExercicio, seriesFeitas } from '@/lib/treino/plano';
import { colors, fonts, gradients, radius, spacing } from '@/theme/theme';
import type { Musculo, SessaoEmAndamento, TreinoDoDia } from '@/types/treino';

import { MapaDeFoco } from './MapaMuscular';

/** Relógio que atualiza a cada segundo. */
function useAgora() {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return agora;
}

/** Músculos principais do treino, do que tem mais séries para o que tem menos (para o desenho do card). */
function musculosDoTreino(t: TreinoDoDia): Musculo[] {
  const conta = new Map<Musculo, number>();
  for (const e of t.exercicios) {
    const m = exercicioPorId(e.exercicioId)?.musculoPrincipal;
    if (m) conta.set(m, (conta.get(m) ?? 0) + e.series);
  }
  return [...conta.entries()].sort((a, b) => b[1] - a[1]).map(([m]) => m);
}

/** Dia de descanso. */
export function CardDescanso({ kicker, proximo }: { kicker: string; proximo?: string }) {
  return (
    <Glass flush tint={gradients.workoutHero} contentStyle={styles.card}>
      <Text style={styles.kicker}>{kicker} · DESCANSO</Text>
      <Text style={styles.title}>Dia de recuperar</Text>
      {proximo ? (
        <Text tone="secondary" style={styles.note}>
          Próximo: {proximo}
        </Text>
      ) : null}
    </Glass>
  );
}

/**
 * Treino do dia: quantos exercícios, o nome e "Iniciar treino". Os exercícios
 * ficam na lista logo abaixo do card. Feito: mostra o resumo no lugar do botão.
 */
export function CardTreino({
  kicker,
  sexo,
  treino,
  resumo,
  feito,
  bloqueado,
  dica,
  onIniciar,
}: {
  kicker: string;
  sexo?: 'feminino' | 'masculino';
  treino: TreinoDoDia;
  /** "~40 min · ~120 kcal". */
  resumo: string;
  /** Texto de concluído ("Concluído · feito na terça · 48 min · 210 kcal"). */
  feito?: string;
  /** Outro treino em andamento: não dá para iniciar este. */
  bloqueado?: boolean;
  dica?: string;
  onIniciar: () => void;
}) {
  const musculos = musculosDoTreino(treino);
  const n = treino.exercicios.length;
  return (
    <Glass flush tint={gradients.workoutHero} contentStyle={styles.card}>
      <View style={styles.corpo} pointerEvents="none">
        <MapaDeFoco musculos={musculos.slice(0, 3)} sexo={sexo} altura={130} />
      </View>
      <Text style={styles.kicker}>
        {kicker} · {n} {n === 1 ? 'EXERCÍCIO' : 'EXERCÍCIOS'}
        {feito ? ' · FEITO' : ''}
      </Text>
      <Text style={styles.title} numberOfLines={2}>
        {treino.nome}
      </Text>
      <Text variant="caption" tone="secondary" style={styles.resumo}>
        {resumo}
      </Text>
      {feito ? (
        <View style={styles.done}>
          <Ionicons name="checkmark-circle" size={18} color={colors.ok} />
          <Text variant="bodyStrong" style={styles.doneText}>
            {feito}
          </Text>
        </View>
      ) : bloqueado ? (
        <Text tone="secondary" style={styles.note}>
          Termine o treino em andamento para começar este.
        </Text>
      ) : (
        <>
          <NeonButton label="Iniciar treino" onPress={onIniciar} style={styles.btn} />
          {dica ? (
            <Text variant="caption" tone="muted" style={styles.dica}>
              {dica}
            </Text>
          ) : null}
        </>
      )}
    </Glass>
  );
}

/**
 * Treino em andamento: o card vira o cronômetro. Mostra o exercício atual e o
 * progresso das séries; o botão pausa ou continua, e tocar no card abre o treino.
 */
export function CardEmAndamento({
  treino,
  sessao,
  kcal,
  onAbrir,
  onPausar,
  onContinuar,
}: {
  treino: TreinoDoDia;
  sessao: SessaoEmAndamento;
  /** kcal estimadas para tantos minutos de treino. */
  kcal: (minutos: number) => number;
  onAbrir: () => void;
  onPausar: () => void;
  onContinuar: () => void;
}) {
  const agora = useAgora();
  const ms = tempoDeTreinoMs(sessao, agora);
  const pausado = !!sessao.pausadoEm;
  const i = proximoExercicio(treino, sessao);
  const atual = treino.exercicios[i];
  const feitas = atual ? seriesFeitas(sessao, atual.id) : 0;
  const total = treino.exercicios.reduce((s, e) => s + e.series, 0);
  const todas = treino.exercicios.reduce((s, e) => s + Math.min(e.series, seriesFeitas(sessao, e.id)), 0);
  const acabou = total > 0 && todas >= total;
  const nome = atual ? (exercicioPorId(atual.exercicioId)?.nome ?? 'Exercício') : '';

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Treino em andamento, ${formatDuration(ms / 1000)}. Abrir treino`} onPress={onAbrir}>
      {({ pressed }) => (
        <Glass flush tint={gradients.workoutHero} contentStyle={styles.card} style={pressed && styles.pressed}>
          <View style={styles.liveRow}>
            <View style={[styles.liveDot, pausado && styles.liveDotPausado]} />
            <Text style={[styles.kicker, styles.flex]} numberOfLines={1}>
              {pausado ? 'PAUSADO' : 'EM ANDAMENTO'} · {treino.nome.toUpperCase()}
            </Text>
          </View>
          <View style={styles.timerRow}>
            <Text style={[styles.timer, pausado && styles.timerPausado]}>{formatDuration(ms / 1000)}</Text>
            <IconButton
              icon={pausado ? 'play' : 'pause'}
              label={pausado ? 'Continuar o cronômetro' : 'Pausar o cronômetro'}
              size={50}
              onPress={pausado ? onContinuar : onPausar}
            />
          </View>
          <Text variant="caption" tone="secondary">
            ~{formatInt(kcal(ms / 60_000))} kcal até agora · {todas} de {total} séries
          </Text>
          <ProgressBar value={total ? todas / total : 0} color={colors.lime} height={6} style={styles.bar} />
          <View style={styles.atual}>
            <Text variant="label" tone="muted">
              {acabou ? 'Tudo feito' : 'Agora'}
            </Text>
            <Text style={styles.atualNome} numberOfLines={1}>
              {acabou ? 'Finalize o treino para salvar' : nome}
            </Text>
            {!acabou && atual ? (
              <Text variant="caption" tone="secondary">
                Exercício {i + 1} de {treino.exercicios.length} · série {Math.min(atual.series, feitas + 1)} de {atual.series}
              </Text>
            ) : null}
          </View>
          <NeonButton label={acabou ? 'Finalizar treino' : 'Abrir treino'} onPress={onAbrir} style={styles.btn} />
        </Glass>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    padding: 18,
    overflow: 'hidden',
  },
  corpo: {
    position: 'absolute',
    right: -22,
    top: 4,
    opacity: 0.55,
  },
  kicker: {
    fontFamily: fonts.body.bold,
    fontSize: 11.5,
    letterSpacing: 1.8,
    color: colors.lime,
  },
  title: {
    marginTop: spacing.sm,
    maxWidth: '66%',
    fontFamily: fonts.display.bold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -1,
  },
  resumo: {
    marginTop: 6,
  },
  note: {
    marginTop: spacing.md,
  },
  btn: {
    marginTop: spacing.lg,
  },
  dica: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  done: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  doneText: {
    flex: 1,
    color: colors.ok,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lime,
  },
  liveDotPausado: {
    backgroundColor: colors.ink3,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  timer: {
    fontFamily: fonts.display.bold,
    fontSize: 52,
    lineHeight: 58,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  timerPausado: {
    color: colors.ink3,
  },
  bar: {
    marginTop: spacing.md,
  },
  atual: {
    marginTop: spacing.lg,
    gap: 3,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.glassFill,
  },
  atualNome: {
    fontFamily: fonts.display.semibold,
    fontSize: 18,
    lineHeight: 23,
  },
  pressed: {
    opacity: 0.85,
  },
});
