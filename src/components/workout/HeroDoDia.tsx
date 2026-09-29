import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { Glass, NeonButton, Text } from '@/components/ui';
import { exercicioPorId, MUSCULO_LABELS } from '@/lib/exercicios';
import { formatDuration } from '@/lib/format';
import { tempoDeTreinoMs } from '@/lib/treino/met';
import { proximoExercicio, seriesFeitas } from '@/lib/treino/plano';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { Musculo, SessaoEmAndamento, TreinoDoDia } from '@/types/treino';

import { MapaMuscular } from './MapaMuscular';
import { Mostrador } from './Mostrador';

/** Altura da área do corpo (o desenho tem metade disso de largura). */
const AREA = 236;
const MOSTRADOR = 184;

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
 * Topo do Treino: dia, nome do treino (até 2 linhas) e, embaixo, à esquerda o
 * que muda (músculos e exercícios, ou o mostrador do treino rodando) e à
 * direita o corpo com os músculos do dia.
 */
function Topo({
  kicker,
  treino,
  sexo,
  esquerda,
  children,
}: {
  kicker: string;
  treino: TreinoDoDia;
  sexo?: 'feminino' | 'masculino';
  esquerda: ReactNode;
  children?: ReactNode;
}) {
  const musculos = musculosDoTreino(treino);
  return (
    <View style={styles.hero}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.titulo} numberOfLines={2}>
        {treino.nome}
      </Text>
      <View style={styles.area}>
        <View style={styles.esquerda}>{esquerda}</View>
        {musculos.length > 0 && (
          <View style={styles.corpo} pointerEvents="none">
            <MapaMuscular principal={musculos[0]} secundarios={musculos.slice(1, 4)} sexo={sexo} altura={AREA} podeVirar={false} />
          </View>
        )}
      </View>
      {children}
    </View>
  );
}

/** Legenda dos músculos (com as cores do corpo) e o número de exercícios. */
function Resumo({ treino }: { treino: TreinoDoDia }) {
  const musculos = musculosDoTreino(treino).slice(0, 4);
  const n = treino.exercicios.length;
  return (
    <View style={styles.resumo}>
      <View style={styles.legenda}>
        {musculos.map((m, i) => (
          <View key={m} style={styles.legendaItem}>
            <View style={[styles.legendaPonto, { backgroundColor: i === 0 ? colors.musclePrimary : colors.muscleSecondary }]} />
            <Text style={styles.legendaText} numberOfLines={1}>
              {MUSCULO_LABELS[m]}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.qtd}>
        <Text style={styles.qtdNum}>{n}</Text>
        <Text style={styles.qtdRotulo}>{n === 1 ? 'exercício' : 'exercícios'}</Text>
      </View>
    </View>
  );
}

/** Treino do dia antes de começar (ou já feito). */
export function HeroTreino({
  kicker,
  treino,
  sexo,
  feito,
  bloqueado,
  dica,
  onIniciar,
}: {
  kicker: string;
  treino: TreinoDoDia;
  sexo?: 'feminino' | 'masculino';
  feito?: string;
  bloqueado?: boolean;
  dica?: string;
  onIniciar: () => void;
}) {
  return (
    <Topo kicker={kicker} treino={treino} sexo={sexo} esquerda={<Resumo treino={treino} />}>
      {feito ? (
        <View style={styles.feito}>
          <Ionicons name="checkmark-circle" size={17} color={colors.ink2} />
          <Text variant="caption" style={styles.feitoText}>
            {feito}
          </Text>
        </View>
      ) : bloqueado ? (
        <Text variant="caption" tone="secondary">
          Termine o treino em andamento para começar este.
        </Text>
      ) : (
        <>
          <NeonButton label="Iniciar treino" onPress={onIniciar} />
          {dica ? (
            <Text variant="caption" tone="muted">
              {dica}
            </Text>
          ) : null}
        </>
      )}
    </Topo>
  );
}

/** Dia de descanso: só o texto, sem o corpo. */
export function HeroDescanso({ kicker, proximo }: { kicker: string; proximo?: string }) {
  return (
    <View style={styles.descanso}>
      <Text style={styles.kicker}>{kicker} · descanso</Text>
      <Text style={styles.titulo}>Dia de recuperar</Text>
      {proximo ? <Text tone="secondary">Próximo: {proximo}</Text> : null}
    </View>
  );
}

/**
 * Treino rodando: no lugar da legenda entra o mostrador (tempo no meio, os
 * traços acendendo com as séries); embaixo, o exercício da vez e os botões
 * Pausar e Abrir. Com tudo feito, o botão vira Finalizar.
 */
export function HeroEmAndamento({
  kicker,
  treino,
  sessao,
  sexo,
  onAbrir,
  onPausar,
  onContinuar,
}: {
  kicker: string;
  treino: TreinoDoDia;
  sessao: SessaoEmAndamento;
  sexo?: 'feminino' | 'masculino';
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

  const mostrador = (
    <Mostrador tamanho={MOSTRADOR} tracos={48} aceso={total ? feitas / total : 0}>
      <View style={styles.aoVivo}>
        <Animated.View style={[styles.ponto, pausado && styles.pontoPausado, !pausado && !reduce && PULSO]} />
        <Text style={styles.aoVivoText}>{pausado ? 'PAUSADO' : 'AO VIVO'}</Text>
      </View>
      <Text style={[styles.tempo, pausado && styles.tempoPausado]} accessibilityLabel={`Tempo de treino ${tempo}`}>
        {tempo}
      </Text>
      <Text style={styles.tempoSeries}>
        {feitas} de {total} séries
      </Text>
    </Mostrador>
  );

  return (
    <Topo kicker={kicker} treino={treino} sexo={sexo} esquerda={mostrador}>
      <Pressable accessibilityRole="button" accessibilityLabel={atual ? `Agora: ${ex?.nome ?? 'exercício'}, série ${serie} de ${atual.series}. Abrir o treino` : 'Tudo feito. Abrir o treino para finalizar'} onPress={onAbrir}>
        {({ pressed }) => (
          <Glass rounded={radius.lg} flush contentStyle={styles.agora} style={pressed && styles.pressed}>
            <View style={styles.flex}>
              <Text style={styles.agoraNome} numberOfLines={1}>
                {atual ? (ex?.nome ?? 'Exercício') : 'Tudo feito'}
              </Text>
              <Text variant="caption" tone="muted">
                {atual ? `Agora · série ${serie} de ${atual.series}` : 'Abra o treino e toque em Finalizar'}
              </Text>
            </View>
            {atual ? (
              <Text style={styles.agoraNum}>
                {i + 1}/{treino.exercicios.length}
              </Text>
            ) : null}
          </Glass>
        )}
      </Pressable>
      <View style={styles.acoes}>
        <BotaoVidro icon={pausado ? 'play' : 'pause'} label={pausado ? 'Continuar' : 'Pausar'} onPress={pausado ? onContinuar : onPausar} />
        <NeonButton label={acabou ? 'Finalizar' : 'Abrir'} onPress={onAbrir} style={styles.flex} />
      </View>
    </Topo>
  );
}

/** Botão de apoio em pílula de vidro (ao lado do botão principal). */
function BotaoVidro({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.flex}>
      {({ pressed }) => (
        <Glass rounded={29} flush strong contentStyle={styles.botaoVidro} style={pressed && styles.pressed}>
          <Ionicons name={icon} size={15} color={colors.ink} />
          <Text style={styles.botaoVidroText}>{label}</Text>
        </Glass>
      )}
    </Pressable>
  );
}

/** Treino rodando visto de outro dia: uma linha com o tempo; tocar abre o treino. */
export function LinhaAoVivo({ treino, sessao, onAbrir }: { treino: TreinoDoDia; sessao: SessaoEmAndamento; onAbrir: () => void }) {
  const agora = useAgora();
  const pausado = !!sessao.pausadoEm;
  const tempo = formatDuration(tempoDeTreinoMs(sessao, agora) / 1000);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${treino.nome} ${pausado ? 'pausado' : 'em andamento'}, ${tempo}. Abrir o treino`} onPress={onAbrir}>
      {({ pressed }) => (
        <Glass rounded={radius.pill} flush contentStyle={styles.linha} style={pressed && styles.pressed}>
          <View style={[styles.ponto, pausado && styles.pontoPausado]} />
          <Text style={styles.linhaNome} numberOfLines={1}>
            {treino.nome}
          </Text>
          <Text style={[styles.linhaTempo, pausado && styles.tempoPausado]}>{tempo}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
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
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  kicker: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  titulo: {
    marginTop: -4,
    fontFamily: fonts.display.semibold,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.6,
  },
  area: {
    flexDirection: 'row',
    alignItems: 'center',
    height: AREA,
  },
  esquerda: {
    flex: 1,
    justifyContent: 'center',
  },
  corpo: {
    width: AREA / 2,
    height: AREA,
    marginRight: -spacing.xs,
  },
  resumo: {
    gap: spacing.lg,
  },
  legenda: {
    gap: 9,
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  legendaPonto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendaText: {
    fontFamily: fonts.body.semibold,
    fontSize: 13.5,
    color: colors.ink2,
  },
  qtd: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  qtdNum: {
    fontFamily: fonts.display.bold,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.8,
  },
  qtdRotulo: {
    fontFamily: fonts.body.bold,
    fontSize: 13,
    color: colors.ink3,
  },
  feito: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feitoText: {
    flex: 1,
    fontFamily: fonts.body.bold,
    color: colors.ink2,
  },
  descanso: {
    gap: spacing.sm,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  aoVivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aoVivoText: {
    fontFamily: fonts.body.bold,
    fontSize: 9.5,
    letterSpacing: 1.8,
    color: colors.ink2,
  },
  ponto: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.lime,
  },
  pontoPausado: {
    backgroundColor: colors.ink3,
  },
  tempo: {
    marginTop: 2,
    fontFamily: fonts.display.bold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1.6,
    fontVariant: ['tabular-nums'],
  },
  tempoPausado: {
    color: colors.ink3,
  },
  tempoSeries: {
    fontFamily: fonts.body.bold,
    fontSize: 11.5,
    color: colors.ink3,
  },
  agora: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  agoraNome: {
    fontFamily: fonts.body.bold,
    fontSize: 14.5,
    lineHeight: 19,
  },
  agoraNum: {
    fontFamily: fonts.display.semibold,
    fontSize: 13,
    color: colors.ink2,
    fontVariant: ['tabular-nums'],
  },
  acoes: {
    flexDirection: 'row',
    gap: 10,
  },
  botaoVidro: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  botaoVidroText: {
    fontFamily: fonts.display.bold,
    fontSize: 13,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 18,
  },
  linhaNome: {
    flex: 1,
    fontFamily: fonts.body.bold,
    fontSize: 14,
  },
  linhaTempo: {
    fontFamily: fonts.display.semibold,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.8,
  },
});
