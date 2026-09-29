import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Glass, NeonButton, Text } from '@/components/ui';
import { exercicioPorId, MUSCULO_LABELS } from '@/lib/exercicios';
import { formatDuration } from '@/lib/format';
import { tempoDeTreinoMs } from '@/lib/treino/met';
import { proximoExercicio, seriesFeitas } from '@/lib/treino/plano';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { Musculo, SessaoEmAndamento, TreinoDoDia } from '@/types/treino';

import { MapaMuscular } from './MapaMuscular';

/** Altura da área do corpo (o desenho tem metade disso de largura). */
const AREA = 236;

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

/** Caminho do contorno do cartão, começando no meio de cima e seguindo no sentido do relógio. */
function contorno(w: number, h: number, r: number, m: number) {
  const x0 = m;
  const y0 = m;
  const x1 = w - m;
  const y1 = h - m;
  const cx = w / 2;
  const d = `M${cx} ${y0}H${x1 - r}A${r} ${r} 0 0 1 ${x1} ${y0 + r}V${y1 - r}A${r} ${r} 0 0 1 ${x1 - r} ${y1}H${x0 + r}A${r} ${r} 0 0 1 ${x0} ${y1 - r}V${y0 + r}A${r} ${r} 0 0 1 ${x0 + r} ${y0}Z`;
  const perimetro = 2 * (x1 - x0 + (y1 - y0)) - 8 * r + 2 * Math.PI * r;
  return { d, perimetro };
}

const RAIO = radius.xl;
const TRACO = 2.5;

/**
 * Treino rodando (no lugar do topo): à esquerda o exercício da vez, a série e
 * um tracinho por série (feitas em branco, a atual em verde); à direita, o
 * tempo solto. A linha verde dá uma volta no cartão a cada minuto. No
 * descanso, o tempo vira o descanso e a linha (branca) conta o descanso.
 * Tocar abre o treino ao vivo no exercício atual.
 */
export function CardAoVivo({ treino, sessao, onAbrir }: { treino: TreinoDoDia; sessao: SessaoEmAndamento; onAbrir: () => void }) {
  const agora = useAgora();
  const [tam, setTam] = useState({ w: 0, h: 0 });
  const pausado = !!sessao.pausadoEm;
  const seg = tempoDeTreinoMs(sessao, agora) / 1000;
  const acabou = treino.exercicios.every((e) => seriesFeitas(sessao, e.id) >= e.series);
  const i = proximoExercicio(treino, sessao);
  const atual = acabou ? undefined : treino.exercicios[i];
  const ex = atual ? exercicioPorId(atual.exercicioId) : undefined;
  const feitas = atual ? seriesFeitas(sessao, atual.id) : 0;
  const restante = sessao.descansoAte ? Math.max(0, Math.ceil((Date.parse(sessao.descansoAte) - agora) / 1000)) : 0;
  const descansando = restante > 0 && !!atual;
  const volta = descansando ? restante / Math.max(1, sessao.descansoSeg ?? restante) : (seg % 60) / 60;
  const { d, perimetro } = contorno(tam.w, tam.h, RAIO, TRACO / 2);
  const rotulo = acabou ? 'Tudo feito' : pausado ? 'Pausado' : descansando ? `Descanso · próxima série ${feitas + 1}` : `Agora · série ${feitas + 1} de ${atual?.series}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${rotulo}. ${atual ? (ex?.nome ?? 'Exercício') : 'Abrir para finalizar o treino'}. ${formatDuration(descansando ? restante : seg)}. Abrir o treino`}
      onPress={onAbrir}
      onLayout={(e) => setTam({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {({ pressed }) => (
        <Glass rounded={RAIO} flush contentStyle={styles.cartao} style={pressed && styles.pressed}>
          {tam.w > 0 && (
            <Svg width={tam.w} height={tam.h} style={styles.volta} pointerEvents="none">
              <Path
                d={d}
                fill="none"
                stroke={descansando ? colors.ink : colors.lime}
                strokeWidth={TRACO}
                strokeLinecap="round"
                strokeDasharray={`${Math.max(0.001, volta) * perimetro} ${perimetro}`}
              />
            </Svg>
          )}
          <View style={styles.flex}>
            <View style={styles.aoVivo}>
              <View style={[styles.ponto, (pausado || descansando || acabou) && styles.pontoOff]} />
              <Text style={styles.rotulo} numberOfLines={1}>
                {rotulo}
              </Text>
            </View>
            <Text style={styles.cartaoNome} numberOfLines={2}>
              {atual ? (ex?.nome ?? 'Exercício') : 'Toque para finalizar o treino'}
            </Text>
            {atual ? (
              <View style={styles.tracos} accessibilityLabel={`${feitas} de ${atual.series} séries feitas`}>
                {Array.from({ length: atual.series }, (_, k) => (
                  <View key={k} style={[styles.traco, k < feitas && styles.tracoFeito, k === feitas && !descansando && styles.tracoAtual]} />
                ))}
              </View>
            ) : null}
          </View>
          <Text style={[styles.tempo, pausado && styles.tempoPausado]}>{formatDuration(descansando ? restante : seg)}</Text>
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
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 18,
    paddingLeft: 20,
    paddingRight: 20,
  },
  volta: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  aoVivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ponto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.lime,
  },
  pontoOff: {
    backgroundColor: colors.ink3,
  },
  rotulo: {
    flexShrink: 1,
    fontFamily: fonts.body.bold,
    fontSize: 10.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  cartaoNome: {
    marginTop: 6,
    fontFamily: fonts.display.semibold,
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: -0.4,
  },
  tracos: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 12,
  },
  traco: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.track,
  },
  tracoFeito: {
    backgroundColor: colors.ink,
  },
  tracoAtual: {
    backgroundColor: colors.lime,
  },
  tempo: {
    fontFamily: fonts.display.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1.4,
    fontVariant: ['tabular-nums'],
  },
  tempoPausado: {
    color: colors.ink3,
  },
  pressed: {
    opacity: 0.8,
  },
});
