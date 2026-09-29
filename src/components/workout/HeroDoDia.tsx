import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconButton, NeonButton, Text } from '@/components/ui';
import { exercicioPorId } from '@/lib/exercicios';
import { formatDecimal, formatDuration } from '@/lib/format';
import { tempoDeTreinoMs } from '@/lib/treino/met';
import { proximoExercicio, repsLabel, seriesFeitas } from '@/lib/treino/plano';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { Musculo, SessaoEmAndamento, TreinoDoDia } from '@/types/treino';

import { MapaMuscular } from './MapaMuscular';

const ALTURA = 360;
// O corpo termina acima da linha dos botões (o cronômetro fica à direita, embaixo dele).

/** Relógio que atualiza a cada segundo. */
function useAgora() {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return agora;
}

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
          <MapaMuscular principal={musculos[0]} secundarios={musculos.slice(1, 4)} sexo={sexo} altura={ALTURA - 84} podeVirar={false} />
        </View>
      )}
      <View style={styles.texto}>{children}</View>
    </View>
  );
}

/** Treino do dia antes de começar (ou já feito). */
export function HeroTreino({
  kicker,
  treino,
  sexo,
  resumo,
  feito,
  bloqueado,
  dica,
  onIniciar,
}: {
  kicker: string;
  treino: TreinoDoDia;
  sexo?: 'feminino' | 'masculino';
  resumo: string[];
  feito?: string;
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
      <View style={styles.chips}>
        {resumo.map((r) => (
          <View key={r} style={styles.chip}>
            <Text style={styles.chipText}>{r}</Text>
          </View>
        ))}
      </View>
      {feito ? (
        <View style={styles.feito}>
          <Ionicons name="checkmark-circle" size={17} color={colors.lime} />
          <Text variant="caption" style={styles.feitoText}>
            {feito}
          </Text>
        </View>
      ) : bloqueado ? (
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

/** Treino rodando: o destaque passa a ser o exercício atual, com as séries dele. */
export function HeroEmAndamento({
  treino,
  sessao,
  sexo,
  onAbrir,
  onPausar,
  onContinuar,
}: {
  treino: TreinoDoDia;
  sessao: SessaoEmAndamento;
  sexo?: 'feminino' | 'masculino';
  onAbrir: () => void;
  onPausar: () => void;
  onContinuar: () => void;
}) {
  const i = proximoExercicio(treino, sessao);
  const atual = treino.exercicios[i];
  const ex = atual ? exercicioPorId(atual.exercicioId) : undefined;
  const feitas = atual ? sessao.series.filter((s) => s.exercicioNoTreinoId === atual.id) : [];
  const acabou = treino.exercicios.every((e) => seriesFeitas(sessao, e.id) >= e.series);
  if (!atual || acabou) {
    return (
      <Palco musculos={musculosDoTreino(treino)} sexo={sexo}>
        <Text style={styles.kicker}>Tudo feito</Text>
        <Text style={styles.titulo} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75}>
          {treino.nome}
        </Text>
        <View style={styles.acoes}>
          <NeonButton label="Finalizar treino" onPress={onAbrir} style={styles.flex} />
          <Cronometro sessao={sessao} onPausar={onPausar} onContinuar={onContinuar} />
        </View>
      </Palco>
    );
  }
  return (
    <Palco musculos={ex ? [ex.musculoPrincipal, ...ex.musculosSecundarios] : []} sexo={sexo}>
      <Text style={styles.kicker}>
        Agora · exercício {i + 1} de {treino.exercicios.length}
      </Text>
      <Text style={styles.titulo} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75}>
        {ex?.nome ?? 'Exercício'}
      </Text>
      <View style={styles.series}>
        {Array.from({ length: Math.max(atual.series, feitas.length) }, (_, k) => {
          const s = feitas[k];
          const agora = !s && k === feitas.length;
          return (
            <View key={k} style={[styles.serie, s && styles.serieFeita, agora && styles.serieAgora]}>
              <Text style={[styles.serieText, (s || agora) && styles.serieTextOn]}>
                {s ? `${formatDecimal(s.cargaKg)}×${s.reps}` : agora ? 'agora' : repsLabel(atual)}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.acoes}>
        <NeonButton label="Abrir exercício" onPress={onAbrir} style={styles.flex} />
        <Cronometro sessao={sessao} onPausar={onPausar} onContinuar={onContinuar} />
      </View>
    </Palco>
  );
}

/** Tempo de treino correndo, com pausar/continuar (fica ao lado do botão do destaque). */
function Cronometro({ sessao, onPausar, onContinuar }: { sessao: SessaoEmAndamento; onPausar: () => void; onContinuar: () => void }) {
  const agora = useAgora();
  const pausado = !!sessao.pausadoEm;
  const tempo = formatDuration(tempoDeTreinoMs(sessao, agora) / 1000);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Tempo de treino ${tempo}${pausado ? ', pausado' : ''}. Toque para ${pausado ? 'continuar' : 'pausar'}`}
      onPress={pausado ? onContinuar : onPausar}
      style={({ pressed }) => [styles.crono, pressed && styles.pressed]}>
      <Ionicons name={pausado ? 'play' : 'pause'} size={13} color={pausado ? colors.lime : colors.ink2} />
      <Text style={[styles.tempo, pausado && styles.tempoPausado]}>{tempo}</Text>
    </Pressable>
  );
}

/** Cápsula viva do treino em andamento: tempo, séries e pausar/continuar. Tocar abre o treino. */
export function CapsulaAoVivo({
  treino,
  sessao,
  onAbrir,
  onPausar,
  onContinuar,
}: {
  treino: TreinoDoDia;
  sessao: SessaoEmAndamento;
  onAbrir: () => void;
  onPausar: () => void;
  onContinuar: () => void;
}) {
  const agora = useAgora();
  const pausado = !!sessao.pausadoEm;
  const tempo = formatDuration(tempoDeTreinoMs(sessao, agora) / 1000);
  const total = treino.exercicios.reduce((s, e) => s + e.series, 0);
  const feitas = treino.exercicios.reduce((s, e) => s + Math.min(e.series, seriesFeitas(sessao, e.id)), 0);
  return (
    <View style={styles.capsulaWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Treino ${pausado ? 'pausado' : 'em andamento'}, ${tempo}, ${feitas} de ${total} séries. Abrir treino`}
        onPress={onAbrir}
        style={({ pressed }) => [styles.capsula, pressed && styles.pressed]}>
        <View style={[styles.ponto, pausado && styles.pontoPausado]} />
        <Text style={[styles.tempo, pausado && styles.tempoPausado]}>{tempo}</Text>
        <Text variant="caption" tone="muted" style={styles.capsulaSeries}>
          {feitas}/{total} séries
        </Text>
        <IconButton icon={pausado ? 'play' : 'pause'} label={pausado ? 'Continuar o cronômetro' : 'Pausar o cronômetro'} size={34} onPress={pausado ? onContinuar : onPausar} />
      </Pressable>
    </View>
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
    fontSize: 11.5,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  titulo: {
    marginTop: spacing.sm,
    maxWidth: '74%',
    fontFamily: fonts.display.bold,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -1.2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.md,
  },
  chip: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipText: {
    fontFamily: fonts.body.bold,
    fontSize: 11.5,
    color: colors.ink2,
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
  series: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.md,
    maxWidth: '72%',
  },
  serie: {
    minWidth: 58,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  serieFeita: {
    backgroundColor: colors.glassFillStrong,
    borderColor: colors.line,
  },
  serieAgora: {
    borderColor: colors.lime,
  },
  serieText: {
    fontFamily: fonts.body.bold,
    fontSize: 12,
    color: colors.ink3,
    fontVariant: ['tabular-nums'],
  },
  serieTextOn: {
    color: colors.ink,
  },
  flex: {
    flex: 1,
  },
  acoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.lg,
  },
  crono: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 58,
    paddingHorizontal: 16,
    borderRadius: 29,
    backgroundColor: colors.glassFillStrong,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.frostCardEdgeTop,
  },
  capsulaWrap: {
    alignItems: 'center',
  },
  capsula: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingLeft: 16,
    paddingRight: 6,
    borderRadius: 23,
    backgroundColor: colors.glassFillStrong,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.frostCardEdgeTop,
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
  tempo: {
    fontFamily: fonts.display.bold,
    fontSize: 17,
    fontVariant: ['tabular-nums'],
  },
  tempoPausado: {
    color: colors.ink3,
  },
  capsulaSeries: {
    fontFamily: fonts.body.bold,
  },
  pressed: {
    opacity: 0.8,
  },
});
