import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { DishTitle, SheetBadge } from '@/components/nutrition/PlateSheet';
import { BottomSheet, confirmDestructive, Glass, GlassModal, IconButton, NeonButton, Text, TextField, toast } from '@/components/ui';
import { EditarExercicioSheet } from '@/components/workout/EditarExercicioSheet';
import { ExerciseLibrary } from '@/components/workout/ExerciseLibrary';
import { MapaMuscular } from '@/components/workout/MapaMuscular';
import { exercicioPorId } from '@/lib/exercicios';
import { formatDecimal } from '@/lib/format';
import {
  adicionarExercicios,
  alternarDia,
  atualizarTreino,
  copiarDia,
  editarExercicio,
  limparDia,
  moverExercicio,
  NOMES_SUGERIDOS,
  planoDoRascunho,
  problemasDoRascunho,
  rascunhoDoPlano,
  rascunhoVazio,
  removerExercicio,
  tirarDaBiblioteca,
  type Rascunho,
} from '@/lib/treino/editor';
import { minutosEstimados, repsLabel } from '@/lib/treino/plano';
import { DIA_CURTO, DIA_NOME, DIAS } from '@/lib/treino/semana';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { DiaSemana, ExercicioNoTreino, TreinoDoDia } from '@/types/treino';

type Passo = 'dias' | 'editor';

const naDia = (dia: DiaSemana) => `${dia === 'sab' || dia === 'dom' ? 'no' : 'na'} ${DIA_NOME[dia]}`;

/**
 * Montar do meu jeito (SPEC-TREINOS, etapa 3): nome do plano → dias → editor
 * de cada dia (nome, exercícios, séries, repetições, descanso, ordem, copiar e
 * limpar). Com `?planoId=`, edita um plano já salvo (inclusive um feito pela IA).
 */
export default function TreinoEditorScreen() {
  const { planoId } = useLocalSearchParams<{ planoId?: string }>();
  const anterior = useAppStore((s) => (planoId ? s.planos.find((p) => p.id === planoId) : undefined));
  const temAtivo = useAppStore((s) => s.planos.some((p) => p.ativo));
  const { salvarPlano, atualizarPlano } = useAppStore();
  const sexo = useAppStore((s) => s.profile?.sex);

  const [r, setR] = useState<Rascunho>(() => (anterior ? rascunhoDoPlano(anterior) : rascunhoVazio()));
  const [passo, setPasso] = useState<Passo>(anterior ? 'editor' : 'dias');
  const [dia, setDia] = useState<DiaSemana | null>(() => anterior?.treinos[0]?.dia ?? null);
  const [mexeu, setMexeu] = useState(false);
  const [escolhendo, setEscolhendo] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [copiando, setCopiando] = useState(false);

  const mudar = (f: (x: Rascunho) => Rascunho) => {
    setR(f);
    setMexeu(true);
  };
  const treino = r.treinos.find((t) => t.dia === dia) ?? r.treinos[0];
  const mudarTreino = (f: (t: TreinoDoDia) => TreinoDoDia) => treino && mudar((x) => atualizarTreino(x, treino.dia, f));
  const problemas = problemasDoRascunho(r);
  const item = treino?.exercicios.find((e) => e.id === editando) ?? null;

  const fechar = () => {
    if (!mexeu) return router.back();
    confirmDestructive('Sair sem salvar?', 'O que você montou até aqui será perdido.', 'Sair', () => router.back());
  };

  const irParaEditor = () => {
    if (!treino) return;
    setDia(dia && r.treinos.some((t) => t.dia === dia) ? dia : r.treinos[0].dia);
    setPasso('editor');
  };

  const salvar = () => {
    if (problemas.length) {
      const p = problemas[0];
      if (p.dia) setDia(p.dia);
      toast(p.mensagem);
      return;
    }
    if (anterior) {
      atualizarPlano(planoDoRascunho(r, anterior));
      toast('Treino atualizado');
      router.back();
      return;
    }
    const doSave = () => {
      salvarPlano(planoDoRascunho(r));
      toast('Treino salvo e ativado');
      router.dismissTo('/treino');
    };
    if (temAtivo) confirmDestructive('Usar este treino?', 'Ele passa a ser o seu treino ativo. O atual fica guardado em Meus treinos.', 'Usar', doSave);
    else doSave();
  };

  const limpar = () => {
    if (!treino) return;
    const alvo = treino.dia;
    const fazer = () => {
      const resto = r.treinos.filter((t) => t.dia !== alvo);
      mudar((x) => limparDia(x, alvo));
      if (resto.length) setDia(resto[0].dia);
      else setPasso('dias');
    };
    if (!treino.exercicios.length) fazer();
    else confirmDestructive(`Limpar ${DIA_NOME[alvo]}?`, 'Os exercícios saem e o dia vira descanso.', 'Limpar', fazer);
  };

  const copiarPara = (destino: DiaSemana) => {
    if (!treino) return;
    const de = treino.dia;
    const fazer = () => {
      mudar((x) => copiarDia(x, de, destino));
      setCopiando(false);
      toast(`Copiado para ${DIA_NOME[destino]}`);
    };
    const existente = r.treinos.find((t) => t.dia === destino);
    if (existente?.exercicios.length) confirmDestructive(`Substituir ${DIA_NOME[destino]}?`, `O treino ${naDia(destino)} será trocado por este.`, 'Substituir', fazer);
    else fazer();
  };

  const footer =
    passo === 'dias' ? (
      <NeonButton label="Continuar" onPress={irParaEditor} disabled={!r.treinos.length || !r.nome.trim()} />
    ) : (
      <View style={styles.footer}>
        {problemas[0] && (
          <Text variant="caption" tone="muted" style={styles.center}>
            {problemas[0].mensagem}
          </Text>
        )}
        <NeonButton label={anterior ? 'Salvar alterações' : 'Salvar treino'} onPress={salvar} disabled={problemas.length > 0} />
      </View>
    );

  return (
    <GlassModal
      badge={<SheetBadge icon="construct-outline" label={anterior ? 'EDITAR TREINO' : 'DO MEU JEITO'} />}
      leading={passo === 'editor' ? <IconButton icon="calendar-outline" label="Voltar para os dias" size={38} onPress={() => setPasso('dias')} /> : undefined}
      onClose={fechar}
      footer={footer}>
      {passo === 'dias' ? (
        <>
          <DishTitle>{anterior ? 'Nome e dias' : 'Seu treino'}</DishTitle>
          <TextField label="Nome do plano" value={r.nome} onChangeText={(nome) => mudar((x) => ({ ...x, nome }))} placeholder="Meu treino" maxLength={40} />
          <Text variant="label" tone="muted" style={styles.gapTop}>
            Em quais dias você treina
          </Text>
          <View style={styles.days}>
            {DIAS.map((d) => {
              const on = r.treinos.some((t) => t.dia === d);
              return (
                <Pressable
                  key={d}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={DIA_NOME[d]}
                  onPress={() => {
                    const t = r.treinos.find((x) => x.dia === d);
                    if (t?.exercicios.length) {
                      confirmDestructive(`Tirar ${DIA_NOME[d]}?`, 'Os exercícios desse dia saem e ele vira descanso.', 'Tirar', () => mudar((x) => alternarDia(x, d)));
                    } else mudar((x) => alternarDia(x, d));
                  }}
                  style={[styles.day, on && styles.dayOn]}>
                  <Text style={[styles.dayText, { color: on ? colors.onLime : colors.ink2 }]}>{DIA_CURTO[d]}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text variant="caption" tone="muted">
            {r.treinos.length} {r.treinos.length === 1 ? 'dia' : 'dias'} de treino · {7 - r.treinos.length} de descanso. Depois você monta cada dia.
          </Text>
        </>
      ) : treino ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {r.treinos.map((t) => {
              const on = t.dia === treino.dia;
              const ok = t.exercicios.length > 0;
              return (
                <Pressable
                  key={t.dia}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${DIA_NOME[t.dia]}: ${ok ? `${t.exercicios.length} exercícios` : 'sem exercícios'}`}
                  onPress={() => setDia(t.dia)}
                  style={[styles.tab, on && styles.tabOn]}>
                  <Text style={[styles.tabText, { color: on ? colors.onInk : colors.ink2 }]}>{DIA_CURTO[t.dia]}</Text>
                  {ok ? (
                    <Ionicons name="checkmark" size={13} color={on ? colors.onInk : colors.ok} />
                  ) : (
                    <View style={[styles.tabDot, on && { backgroundColor: colors.onInk }]} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <TextField
            label={`Nome do treino ${naDia(treino.dia)}`}
            value={treino.nome}
            onChangeText={(nome) => mudarTreino((t) => ({ ...t, nome }))}
            placeholder="Ex.: Pernas e glúteos"
            maxLength={40}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} keyboardShouldPersistTaps="handled">
            {NOMES_SUGERIDOS.map((n) => (
              <Pressable
                key={n}
                accessibilityRole="button"
                accessibilityLabel={`Usar o nome ${n}`}
                onPress={() => mudarTreino((t) => ({ ...t, nome: n }))}
                style={[styles.sugestao, treino.nome === n && styles.sugestaoOn]}>
                <Text style={[styles.sugestaoText, treino.nome === n && { color: colors.lime }]}>{n}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.listHead}>
            <Text variant="label" tone="muted" style={styles.flex}>
              Exercícios, na ordem
            </Text>
            {treino.exercicios.length > 0 && (
              <Text variant="caption" tone="muted">
                ~{minutosEstimados(treino)} min
              </Text>
            )}
          </View>

          {treino.exercicios.length === 0 && (
            <Text tone="secondary" style={styles.empty}>
              Nenhum exercício ainda. Adicione da biblioteca.
            </Text>
          )}
          {treino.exercicios.map((e, i) => (
            <LinhaExercicio
              key={e.id}
              item={e}
              ordem={i + 1}
              primeiro={i === 0}
              ultimo={i === treino.exercicios.length - 1}
              sexo={sexo}
              onEditar={() => setEditando(e.id)}
              onSubir={() => mudarTreino((t) => moverExercicio(t, e.id, -1))}
              onDescer={() => mudarTreino((t) => moverExercicio(t, e.id, 1))}
              onRemover={() => mudarTreino((t) => removerExercicio(t, e.id))}
            />
          ))}

          <Pressable accessibilityRole="button" onPress={() => setEscolhendo(true)} style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
            <Ionicons name="add" size={20} color={colors.lime} />
            <Text style={styles.addText}>Adicionar exercícios</Text>
          </Pressable>

          <View style={styles.dayActions}>
            <Acao icon="copy-outline" label="Copiar para outro dia" onPress={() => setCopiando(true)} disabled={!treino.exercicios.length} />
            <Acao icon="trash-outline" label="Limpar dia" danger onPress={limpar} />
          </View>

          <Modal visible={escolhendo} animationType="slide" onRequestClose={() => setEscolhendo(false)}>
            <GlassModal
              badge={<SheetBadge icon="library-outline" label={`${DIA_CURTO[treino.dia]} · ADICIONAR`} />}
              onClose={() => setEscolhendo(false)}
              footer={
                <NeonButton
                  label={`Pronto · ${treino.exercicios.length} ${treino.exercicios.length === 1 ? 'exercício' : 'exercícios'}`}
                  onPress={() => setEscolhendo(false)}
                />
              }>
              <ExerciseLibrary
                picked={new Set(treino.exercicios.map((e) => e.exercicioId))}
                onToggle={(id) => {
                  const ex = exercicioPorId(id);
                  if (!ex) return;
                  mudarTreino((t) => (t.exercicios.some((x) => x.exercicioId === id) ? tirarDaBiblioteca(t, id) : adicionarExercicios(t, [ex])));
                }}
              />
            </GlassModal>
          </Modal>

          <EditarExercicioSheet
            item={item}
            onClose={() => setEditando(null)}
            onSave={(m) => item && mudarTreino((t) => editarExercicio(t, item.id, m))}
            onRemove={() => item && mudarTreino((t) => removerExercicio(t, item.id))}
          />

          <BottomSheet visible={copiando} title="Copiar para qual dia?" subtitle={`Copia "${treino.nome}" com todos os exercícios.`} onClose={() => setCopiando(false)}>
            {DIAS.filter((d) => d !== treino.dia).map((d) => {
              const t = r.treinos.find((x) => x.dia === d);
              return (
                <Pressable
                  key={d}
                  accessibilityRole="button"
                  accessibilityLabel={`Copiar para ${DIA_NOME[d]}`}
                  onPress={() => copiarPara(d)}
                  style={({ pressed }) => [styles.copyRow, pressed && styles.pressed]}>
                  <View style={styles.copyDay}>
                    <Text style={styles.copyDayText}>{DIA_CURTO[d]}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.exName}>{DIA_NOME[d].charAt(0).toUpperCase() + DIA_NOME[d].slice(1)}</Text>
                    <Text variant="caption" tone="muted">
                      {t ? (t.exercicios.length ? `${t.nome} · será substituído` : 'Dia de treino, ainda vazio') : 'Descanso · vira dia de treino'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
                </Pressable>
              );
            })}
          </BottomSheet>
        </>
      ) : null}
    </GlassModal>
  );
}

function LinhaExercicio({
  item,
  ordem,
  primeiro,
  ultimo,
  sexo,
  onEditar,
  onSubir,
  onDescer,
  onRemover,
}: {
  item: ExercicioNoTreino;
  ordem: number;
  primeiro: boolean;
  ultimo: boolean;
  sexo?: 'feminino' | 'masculino';
  onEditar: () => void;
  onSubir: () => void;
  onDescer: () => void;
  onRemover: () => void;
}) {
  const ex = exercicioPorId(item.exercicioId);
  const nome = ex?.nome ?? 'Exercício';
  const detalhe = [
    `${item.series} × ${repsLabel(item)}`,
    `${item.descansoSeg} s`,
    item.cargaInicialKg ? `${formatDecimal(item.cargaInicialKg)} kg` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Glass contentStyle={styles.exCard}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${nome}`} onPress={onEditar} style={styles.exMain}>
        <Text style={styles.ordem}>{ordem}</Text>
        <View style={styles.thumb}>{ex && <MapaMuscular principal={ex.musculoPrincipal} altura={44} podeVirar={false} sexo={sexo} />}</View>
        <View style={styles.flex}>
          <Text style={styles.exName} numberOfLines={2}>
            {nome}
          </Text>
          <Text variant="caption" tone="muted">
            {detalhe}
          </Text>
          {item.observacao ? (
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              {item.observacao}
            </Text>
          ) : null}
        </View>
        <Ionicons name="create-outline" size={18} color={colors.ink3} />
      </Pressable>
      <View style={styles.exTools}>
        <IconButton icon="chevron-up" label={`Subir ${nome}`} size={32} onPress={onSubir} disabled={primeiro} />
        <IconButton icon="chevron-down" label={`Descer ${nome}`} size={32} onPress={onDescer} disabled={ultimo} />
        <View style={styles.flex} />
        <IconButton icon="trash-outline" label={`Tirar ${nome}`} size={32} onPress={onRemover} />
      </View>
    </Glass>
  );
}

function Acao({
  icon,
  label,
  danger,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const color = danger ? colors.warnText : colors.ink2;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.acao, (pressed || disabled) && styles.dim]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.acaoText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    minWidth: 0,
  },
  center: {
    textAlign: 'center',
  },
  gapTop: {
    marginTop: spacing.sm,
  },
  footer: {
    gap: spacing.sm,
  },
  days: {
    flexDirection: 'row',
    gap: 6,
  },
  day: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dayOn: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  dayText: {
    fontFamily: fonts.body.bold,
    fontSize: 11.5,
    letterSpacing: 0.6,
  },
  tabs: {
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tabOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  tabText: {
    fontFamily: fonts.body.bold,
    fontSize: 13,
    letterSpacing: 0.8,
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warn,
  },
  sugestao: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  sugestaoOn: {
    borderColor: colors.limeEdge,
    backgroundColor: colors.limeWash,
  },
  sugestaoText: {
    fontFamily: fonts.body.semibold,
    fontSize: 13,
    color: colors.ink2,
  },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  exCard: {
    padding: 12,
    gap: 4,
  },
  exMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ordem: {
    width: 16,
    textAlign: 'center',
    fontFamily: fonts.display.bold,
    fontSize: 15,
    color: colors.lime,
  },
  thumb: {
    width: 40,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
  },
  exName: {
    fontFamily: fonts.body.bold,
    fontSize: 14.5,
    lineHeight: 19,
  },
  exTools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 26,
  },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.limeEdge,
    backgroundColor: colors.limeWash,
  },
  addText: {
    fontFamily: fonts.body.bold,
    fontSize: 15,
    color: colors.lime,
  },
  dayActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  acao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  acaoText: {
    fontFamily: fonts.body.bold,
    fontSize: 13,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  copyDay: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
  },
  copyDayText: {
    fontFamily: fonts.body.bold,
    fontSize: 11.5,
    letterSpacing: 0.8,
    color: colors.ink2,
  },
  dim: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
});
