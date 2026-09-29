import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Glass, Text } from '@/components/ui';
import { exercicioPorId, MUSCULO_LABELS } from '@/lib/exercicios';
import { formatDecimal } from '@/lib/format';
import { proximoExercicio, repsLabel, ultimasSeries } from '@/lib/treino/plano';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { ExercicioNoTreino, SerieFeita, SessaoDeTreino, TreinoDoDia } from '@/types/treino';

import { MapaMuscular } from './MapaMuscular';

type Modo = 'andamento' | 'feito' | 'planejado';

type Props = {
  treino: TreinoDoDia;
  modo: Modo;
  /** Séries já feitas (do treino em andamento ou do treino concluído). */
  series: readonly SerieFeita[];
  /** Treinos anteriores, para "última vez". */
  historico: readonly SessaoDeTreino[];
  sexo?: 'feminino' | 'masculino';
  /** Em andamento: abre o exercício no treino. Planejado: começa o treino por ele. */
  onAbrir?: (exercicioNoTreinoId: string) => void;
};

const hora = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * Exercícios do dia, na ordem. Tocar num exercício abre as séries em linha do
 * tempo (feitas, a atual e as que faltam); dali dá para abrir o exercício.
 */
export function ListaExerciciosDoDia({ treino, modo, series, historico, sexo, onAbrir }: Props) {
  const atual = modo === 'andamento' ? treino.exercicios[proximoExercicio(treino, { series: [...series] })]?.id : undefined;
  const [aberto, setAberto] = useState<string | null>(null);
  const [abertoUsuario, setAbertoUsuario] = useState(false);
  // Em andamento, começa com o exercício atual aberto (até a pessoa tocar em outro).
  const expandido = abertoUsuario ? aberto : (atual ?? null);

  return (
    <View style={styles.lista}>
      {treino.exercicios.map((e, i) => (
        <Linha
          key={e.id}
          item={e}
          ordem={i + 1}
          modo={modo}
          atual={e.id === atual}
          feitas={series.filter((s) => s.exercicioNoTreinoId === e.id)}
          historico={historico}
          sexo={sexo}
          aberto={expandido === e.id}
          onToggle={() => {
            setAbertoUsuario(true);
            setAberto(expandido === e.id ? null : e.id);
          }}
          onAbrir={onAbrir && (() => onAbrir(e.id))}
        />
      ))}
      {treino.cardio && (
        <View style={styles.cardioFim}>
          <Ionicons name="walk-outline" size={16} color={colors.ink2} />
          <Text variant="caption" tone="secondary">
            No fim: {treino.cardio.minutos} min de {treino.cardio.atividade === 'eliptico' ? 'elíptico' : treino.cardio.atividade}, ritmo {treino.cardio.intensidade}
          </Text>
        </View>
      )}
    </View>
  );
}

function Linha({
  item,
  ordem,
  modo,
  atual,
  feitas,
  historico,
  sexo,
  aberto,
  onToggle,
  onAbrir,
}: {
  item: ExercicioNoTreino;
  ordem: number;
  modo: Modo;
  atual: boolean;
  feitas: readonly SerieFeita[];
  historico: readonly SessaoDeTreino[];
  sexo?: 'feminino' | 'masculino';
  aberto: boolean;
  onToggle: () => void;
  onAbrir?: () => void;
}) {
  const ex = exercicioPorId(item.exercicioId);
  const nome = ex?.nome ?? 'Exercício';
  const completo = feitas.length >= item.series;
  const reps = repsLabel(item);
  const ultima = ultimasSeries([...historico], item.exercicioId)?.series ?? [];
  const linhas = Math.max(item.series, feitas.length);
  const mostraProgresso = modo !== 'planejado';

  return (
    <Glass contentStyle={styles.card} style={atual && styles.cardAtual}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
        accessibilityLabel={`${ordem}. ${nome}, ${item.series} séries de ${reps}${mostraProgresso ? `, ${feitas.length} feitas` : ''}`}
        onPress={onToggle}
        style={styles.head}>
        <Text style={styles.ordem}>{String(ordem).padStart(2, '0')}</Text>
        <View style={styles.thumb}>{ex && <MapaMuscular principal={ex.musculoPrincipal} altura={46} podeVirar={false} sexo={sexo} />}</View>
        <View style={styles.flex}>
          <Text style={styles.nome} numberOfLines={2}>
            {nome}
          </Text>
          <Text variant="caption" tone="muted">
            {item.series} × {reps}
            {ex ? ` · ${MUSCULO_LABELS[ex.musculoPrincipal]}` : ''}
          </Text>
        </View>
        {mostraProgresso &&
          (completo ? (
            <View style={styles.ok}>
              <Ionicons name="checkmark" size={16} color={colors.onLime} />
            </View>
          ) : (
            <Text style={[styles.conta, feitas.length > 0 && styles.contaOn]}>
              {feitas.length}/{item.series}
            </Text>
          ))}
        <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={18} color={colors.ink3} />
      </Pressable>

      {aberto && (
        <View style={styles.corpo}>
          {Array.from({ length: linhas }, (_, k) => {
            const s = feitas[k];
            const agora = !s && modo === 'andamento' && k === feitas.length;
            const antes = ultima[k];
            return (
              <View key={k} style={styles.passo}>
                <View style={styles.trilho}>
                  <View style={[styles.bolinha, s ? styles.bolinhaFeita : agora ? styles.bolinhaAgora : null]}>
                    {s ? <Ionicons name="checkmark" size={12} color={colors.onLime} /> : null}
                  </View>
                  {k < linhas - 1 && <View style={[styles.linha, s && styles.linhaFeita]} />}
                </View>
                <View style={styles.passoTexto}>
                  <Text style={[styles.serieTitulo, !s && !agora && styles.pendente]}>
                    Série {k + 1}
                    {s ? ` · ${formatDecimal(s.cargaKg)} kg × ${s.reps}` : agora ? ' · agora' : ` · ${reps} reps`}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {s
                      ? `Feita às ${hora(s.concluidaEm)}`
                      : antes
                        ? `Última vez: ${formatDecimal(antes.cargaKg)} kg × ${antes.reps}`
                        : k === 0 && item.cargaInicialKg
                          ? `Carga inicial: ${formatDecimal(item.cargaInicialKg)} kg`
                          : `Descanso de ${item.descansoSeg} s depois`}
                  </Text>
                </View>
              </View>
            );
          })}
          {item.observacao ? (
            <Text variant="caption" tone="secondary" style={styles.obs}>
              {item.observacao}
            </Text>
          ) : null}
          {onAbrir && (
            <Pressable accessibilityRole="button" onPress={onAbrir} style={({ pressed }) => [styles.abrir, pressed && styles.pressed]}>
              <Ionicons name={modo === 'andamento' ? 'open-outline' : 'play'} size={16} color={colors.lime} />
              <Text style={styles.abrirText}>{modo === 'andamento' ? 'Abrir exercício' : 'Começar por este'}</Text>
            </Pressable>
          )}
        </View>
      )}
    </Glass>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    minWidth: 0,
  },
  lista: {
    gap: 10,
  },
  card: {
    padding: 12,
  },
  cardAtual: {
    borderColor: colors.limeEdge,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ordem: {
    width: 22,
    fontFamily: fonts.display.bold,
    fontSize: 13,
    letterSpacing: 0.5,
    color: colors.lime,
  },
  thumb: {
    width: 42,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
  },
  nome: {
    fontFamily: fonts.body.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  conta: {
    fontFamily: fonts.body.bold,
    fontSize: 13,
    color: colors.ink3,
    fontVariant: ['tabular-nums'],
  },
  contaOn: {
    color: colors.lime,
  },
  ok: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lime,
  },
  corpo: {
    marginTop: spacing.md,
    paddingLeft: 32,
  },
  passo: {
    flexDirection: 'row',
    gap: 12,
  },
  trilho: {
    width: 22,
    alignItems: 'center',
  },
  bolinha: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  bolinhaFeita: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  bolinhaAgora: {
    borderColor: colors.lime,
    borderWidth: 2,
  },
  linha: {
    flex: 1,
    width: 2,
    minHeight: 14,
    backgroundColor: colors.line,
  },
  linhaFeita: {
    backgroundColor: colors.limeEdge,
  },
  passoTexto: {
    flex: 1,
    paddingBottom: 14,
    gap: 1,
  },
  serieTitulo: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  pendente: {
    color: colors.ink2,
  },
  obs: {
    marginBottom: spacing.sm,
  },
  abrir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.limeEdge,
    backgroundColor: colors.limeWash,
  },
  abrirText: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    color: colors.lime,
  },
  cardioFim: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
