import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Body from 'react-native-body-highlighter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass } from '@/components/ui/Glass';
import { IconButton } from '@/components/ui/IconButton';
import { NeonButton } from '@/components/ui/NeonButton';
import { Text } from '@/components/ui/Text';
import {
  buscarExercicios,
  EQUIPAMENTO_LABELS,
  EQUIPAMENTO_ORDEM,
  historicoDoExercicio,
  midiaDoExercicio,
  MUSCULO_LABELS,
  MUSCULO_ORDEM,
  NIVEL_LABELS,
} from '@/lib/exercicios';
import { formatDayMonth, formatDecimal } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { Equipamento, Exercicio, Musculo } from '@/types/treino';

import { MapaMuscular } from './MapaMuscular';

/** Quantos exercícios a lista mostra de cada vez (cada miniatura é um desenho). */
const PAGINA = 40;

type Props = {
  /** Escolher exercícios para um treino (com ✓) ou só consultar. */
  picked?: ReadonlySet<string>;
  onToggle?: (id: string) => void;
};

/**
 * Biblioteca de exercícios: busca por nome e nomes alternativos, filtros por
 * músculo (chips ou tocando no corpo) e por equipamento. Tocar abre o detalhe;
 * no modo de escolha, o ✓ adiciona ou tira do treino.
 */
export function ExerciseLibrary({ picked, onToggle }: Props) {
  const sexo = useAppStore((s) => s.profile?.sex);
  const [busca, setBusca] = useState('');
  const [musculo, setMusculo] = useState<Musculo | null>(null);
  const [equipamento, setEquipamento] = useState<Equipamento | null>(null);
  const [mostrarCorpo, setMostrarCorpo] = useState(false);
  const [ladoCorpo, setLadoCorpo] = useState<'front' | 'back'>('front');
  const [limite, setLimite] = useState(PAGINA);
  const [aberto, setAberto] = useState<Exercicio | null>(null);
  const resultados = useMemo(() => buscarExercicios({ busca, musculo, equipamento }), [busca, musculo, equipamento]);
  const escolhendo = !!onToggle;

  const filtrar = (m: Musculo | null) => {
    setMusculo(m);
    setLimite(PAGINA);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.ink3} />
        <TextInput
          value={busca}
          onChangeText={(t) => {
            setBusca(t);
            setLimite(PAGINA);
          }}
          placeholder="Buscar exercício (ex.: supino, remada)"
          placeholderTextColor={colors.ink3}
          selectionColor={colors.lime2}
          keyboardAppearance="dark"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar exercício"
          style={styles.searchInput}
        />
        <IconButton
          icon={mostrarCorpo ? 'body' : 'body-outline'}
          label={mostrarCorpo ? 'Esconder o corpo' : 'Filtrar tocando no corpo'}
          size={36}
          onPress={() => setMostrarCorpo((v) => !v)}
        />
      </View>

      {mostrarCorpo && (
        <Glass contentStyle={styles.bodyCard}>
          <Body
            data={musculo ? [{ slug: musculo === 'abductors' ? 'gluteal' : musculo, intensity: 1 }] : []}
            side={ladoCorpo}
            gender={sexo === 'masculino' ? 'male' : 'female'}
            scale={0.6}
            colors={[colors.musclePrimary]}
            defaultFill={colors.bodyFill}
            border={colors.bodyEdge}
            onBodyPartPress={(part) => {
              const slug = part.slug as Musculo | undefined;
              if (slug && MUSCULO_ORDEM.includes(slug)) filtrar(musculo === slug ? null : slug);
            }}
          />
          <View style={styles.bodyActions}>
            <Text variant="caption" tone="muted" style={styles.flex}>
              {musculo ? `Filtrando: ${MUSCULO_LABELS[musculo]}` : 'Toque num músculo para filtrar'}
            </Text>
            <IconButton
              icon="sync"
              label={ladoCorpo === 'front' ? 'Ver de costas' : 'Ver de frente'}
              size={34}
              onPress={() => setLadoCorpo(ladoCorpo === 'front' ? 'back' : 'front')}
            />
          </View>
        </Glass>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Todos" on={!musculo} onPress={() => filtrar(null)} />
        {MUSCULO_ORDEM.map((m) => (
          <Chip key={m} label={MUSCULO_LABELS[m]} on={musculo === m} onPress={() => filtrar(musculo === m ? null : m)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip small label="Qualquer equipamento" on={!equipamento} onPress={() => setEquipamento(null)} />
        {EQUIPAMENTO_ORDEM.map((q) => (
          <Chip key={q} small label={EQUIPAMENTO_LABELS[q]} on={equipamento === q} onPress={() => setEquipamento(equipamento === q ? null : q)} />
        ))}
      </ScrollView>

      <Text variant="caption" tone="muted">
        {resultados.length} {resultados.length === 1 ? 'exercício' : 'exercícios'}
        {picked && picked.size ? ` · ${picked.size} no treino` : ''}
      </Text>

      <View>
        {resultados.slice(0, limite).map((e) => {
          const on = picked?.has(e.id) ?? false;
          return (
            <Pressable
              key={e.id}
              accessibilityRole="button"
              accessibilityLabel={e.nome}
              onPress={() => setAberto(e)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <Miniatura exercicio={e} sexo={sexo} />
              <View style={styles.flex}>
                <Text style={styles.rowName}>{e.nome}</Text>
                <Text variant="caption" tone="muted">
                  {MUSCULO_LABELS[e.musculoPrincipal]}
                </Text>
              </View>
              {escolhendo ? (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={on ? `Tirar ${e.nome} do treino` : `Adicionar ${e.nome} ao treino`}
                  hitSlop={8}
                  onPress={() => onToggle?.(e.id)}
                  style={[styles.check, on && styles.checkOn]}>
                  <Ionicons name={on ? 'checkmark' : 'add'} size={18} color={on ? colors.onLime : colors.ink} />
                </Pressable>
              ) : (
                <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
              )}
            </Pressable>
          );
        })}
        {resultados.length > limite && (
          <Pressable accessibilityRole="button" onPress={() => setLimite(limite + PAGINA)} style={({ pressed }) => [styles.more, pressed && styles.pressed]}>
            <Text style={styles.moreText}>Ver mais {Math.min(PAGINA, resultados.length - limite)}</Text>
          </Pressable>
        )}
      </View>

      <DetalheExercicio
        exercicio={aberto}
        sexo={sexo}
        onClose={() => setAberto(null)}
        picked={aberto ? (picked?.has(aberto.id) ?? false) : false}
        onToggle={escolhendo && aberto ? () => onToggle?.(aberto.id) : undefined}
      />
    </View>
  );
}

function Chip({ label, on, small, onPress }: { label: string; on: boolean; small?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={onPress} style={[styles.chip, small && styles.chipSmall, on && styles.chipOn]}>
      <Text style={[styles.chipText, small && styles.chipTextSmall, { color: on ? colors.onInk : colors.ink2 }]}>{label}</Text>
    </Pressable>
  );
}

/** Miniatura da lista: o GIF, quando houver, ou o mapa muscular pequeno. */
function Miniatura({ exercicio, sexo }: { exercicio: Exercicio; sexo?: 'feminino' | 'masculino' }) {
  const midia = midiaDoExercicio(exercicio, sexo);
  return (
    <View style={styles.thumb}>
      {midia.tipo === 'gif' ? (
        <Image source={{ uri: midia.url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <MapaMuscular principal={exercicio.musculoPrincipal} sexo={sexo} altura={96} podeVirar={false} />
      )}
    </View>
  );
}

/** Detalhe do exercício: GIF ou mapa muscular, músculos, equipamento, instruções e histórico. */
function DetalheExercicio({
  exercicio,
  sexo,
  onClose,
  picked,
  onToggle,
}: {
  exercicio: Exercicio | null;
  sexo?: 'feminino' | 'masculino';
  onClose: () => void;
  picked: boolean;
  onToggle?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const plans = useAppStore((s) => s.workoutPlans);
  const sessions = useAppStore((s) => s.sessions);
  const historico = useMemo(() => (exercicio ? historicoDoExercicio(exercicio.id, plans, sessions) : null), [exercicio, plans, sessions]);
  const midia = exercicio ? midiaDoExercicio(exercicio, sexo) : null;

  return (
    <Modal transparent visible={!!exercicio} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      {exercicio && midia && (
        <View style={styles.modalRoot}>
          <Pressable accessibilityLabel="Fechar" onPress={onClose} style={[StyleSheet.absoluteFill, styles.scrim]} />
          <Glass rounded={28} flush style={styles.sheet} contentStyle={styles.sheetInner}>
            <ScrollView style={styles.sheetScroll} contentContainerStyle={[styles.sheetContent, { paddingBottom: insets.bottom + spacing.lg }]} showsVerticalScrollIndicator={false}>
              <View style={styles.sheetHead}>
                <View style={styles.flex}>
                  <Text style={styles.sheetTitle}>{exercicio.nome}</Text>
                  <Text variant="caption" tone="muted">
                    {NIVEL_LABELS[exercicio.nivel]} · {exercicio.tipo === 'composto' ? 'Composto' : 'Isolado'}
                  </Text>
                </View>
                <IconButton icon="close" label="Fechar" size={38} onPress={onClose} />
              </View>

              <View style={styles.media}>
                {midia.tipo === 'gif' ? (
                  <Image source={{ uri: midia.url }} style={styles.gif} resizeMode="contain" />
                ) : (
                  <MapaMuscular principal={exercicio.musculoPrincipal} secundarios={exercicio.musculosSecundarios} sexo={sexo} altura={260} />
                )}
              </View>

              <View style={styles.facts}>
                <Fact label="Principal" value={MUSCULO_LABELS[exercicio.musculoPrincipal]} strong />
                {exercicio.musculosSecundarios.length > 0 && (
                  <Fact label="Secundários" value={exercicio.musculosSecundarios.map((m) => MUSCULO_LABELS[m]).join(', ')} />
                )}
                <Fact label="Equipamento" value={exercicio.equipamentos.map((q) => EQUIPAMENTO_LABELS[q]).join(', ')} />
              </View>

              <Text variant="label" tone="muted">
                Como fazer
              </Text>
              <View style={styles.steps}>
                {exercicio.instrucoes.map((passo, i) => (
                  <View key={i} style={styles.step}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>{i + 1}</Text>
                    </View>
                    <Text tone="secondary" style={styles.stepText}>
                      {passo}
                    </Text>
                  </View>
                ))}
              </View>

              <Text variant="label" tone="muted">
                Seu histórico
              </Text>
              {historico && historico.ultimaData ? (
                <View style={styles.facts}>
                  <Fact
                    label={`Última vez (${formatDayMonth(historico.ultimaData)})`}
                    value={historico.ultima.map((x) => `${formatDecimal(x.weightKg)} kg × ${x.reps}`).join(' · ')}
                  />
                  {historico.recorde && <Fact label="Recorde" value={`${formatDecimal(historico.recorde.weightKg)} kg × ${historico.recorde.reps}`} strong />}
                </View>
              ) : (
                <Text variant="caption" tone="muted">
                  Você ainda não fez este exercício.
                </Text>
              )}

              {onToggle && (
                <NeonButton
                  label={picked ? 'Tirar do treino' : 'Adicionar ao treino'}
                  onPress={() => {
                    onToggle();
                    onClose();
                  }}
                  style={styles.cta}
                />
              )}
            </ScrollView>
          </Glass>
        </View>
      )}
    </Modal>
  );
}

function Fact({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.fact}>
      <Text variant="caption" tone="muted" style={styles.factLabel}>
        {label}
      </Text>
      <Text style={[styles.factValue, strong && { color: colors.lime }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 54,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.frostCardEdge,
    borderTopColor: colors.frostCardEdgeTop,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    color: colors.ink,
    fontFamily: fonts.body.semibold,
    fontSize: 15.5,
  },
  bodyCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  bodyActions: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chips: {
    gap: 6,
  },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipSmall: {
    height: 30,
    paddingHorizontal: 12,
  },
  chipOn: {
    backgroundColor: colors.ink,
    borderColor: 'transparent',
  },
  chipText: {
    fontFamily: fonts.body.semibold,
    fontSize: 13,
  },
  chipTextSmall: {
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  thumb: {
    width: 60,
    height: 72,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
  },
  rowName: {
    fontFamily: fonts.body.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  check: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  checkOn: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  more: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  moreText: {
    fontFamily: fonts.body.bold,
    color: colors.lime,
  },
  pressed: {
    opacity: 0.7,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    backgroundColor: colors.modalScrimSolid,
  },
  sheet: {
    maxHeight: '92%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    backgroundColor: colors.panel,
  },
  // A folha tem altura máxima; o miolo encolhe e a rolagem fica dentro dele.
  sheetInner: {
    flexShrink: 1,
    minHeight: 0,
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetContent: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  sheetTitle: {
    fontFamily: fonts.display.bold,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.5,
  },
  media: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 22,
    backgroundColor: colors.glassSubtle,
  },
  gif: {
    width: '100%',
    aspectRatio: 1,
  },
  facts: {
    gap: 10,
  },
  fact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  factLabel: {
    fontFamily: fonts.body.semibold,
  },
  factValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontFamily: fonts.body.bold,
    fontSize: 14,
  },
  steps: {
    gap: 10,
  },
  step: {
    flexDirection: 'row',
    gap: 10,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.limeWash,
    borderWidth: 1,
    borderColor: colors.limeEdge,
  },
  stepNumText: {
    fontFamily: fonts.body.bold,
    fontSize: 12,
    color: colors.lime,
  },
  stepText: {
    flex: 1,
    lineHeight: 20,
  },
  cta: {
    marginTop: spacing.sm,
  },
});
