/**
 * Store local do TapCal (zustand + AsyncStorage).
 *
 * - Refeições e água vivem em `today` e zeram a cada novo dia; o dia antigo vai
 *   para `history`. Toda ação que grava algo vira o dia antes, então um lanche
 *   registrado depois da meia-noite já cai no dia certo.
 * - Na fase 5 este store passa a sincronizar com o Supabase.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  SAMPLE_PROFILE,
  SAMPLE_WORKOUT_PLANS,
  sampleDay,
  sampleHistory,
  sampleSessions,
  sampleWeights,
} from '@/data/sample';
import { toDateKey } from '@/lib/dates';
import { emptyDay, rolloverDay } from '@/lib/day';
import { registrarExerciciosDoUsuario } from '@/lib/exercicios';
import { updateFoodInMeals, type FoodPatch } from '@/lib/foodEdit';
import { newId } from '@/lib/id';
import { exercicioDoUsuario, type NovoExercicio } from '@/lib/treino/editor';
import { kcalDaSessao } from '@/lib/treino/met';
import { converterPlanos } from '@/lib/treino/migracao';
import type {
  DayLog,
  FoodItem,
  MealType,
  Profile,
  WeightEntry,
  WorkoutPlan,
  WorkoutSession,
} from '@/types';
import type { Exercicio, PlanoDeTreino, RespostasTreinoIA, SessaoDeTreino, SessaoEmAndamento } from '@/types/treino';

export type NewFoodItem = Omit<FoodItem, 'id' | 'createdAt'>;

type Data = {
  profile: Profile | null;
  today: DayLog;
  history: DayLog[];
  weights: WeightEntry[];
  /** Planos de treino; só um ativo por vez. */
  planos: PlanoDeTreino[];
  /** Treinos terminados. */
  sessoes: SessaoDeTreino[];
  /** Treino em andamento, se houver. */
  sessaoAtiva: SessaoEmAndamento | null;
  /** Exercícios criados pela pessoa ("Não achou? Criar exercício"). */
  exerciciosUsuario: Exercicio[];
  /** Respostas do mini-onboarding do treino com IA (vêm preenchidas da segunda vez). */
  respostasTreinoIA: RespostasTreinoIA | null;
};

type Actions = {
  /** Vira o dia se a data mudou. Chamado ao abrir o app e ao voltar do fundo. */
  ensureToday: () => void;
  setProfile: (profile: Profile) => void;

  addFood: (meal: MealType, item: NewFoodItem) => string;
  removeFood: (meal: MealType, id: string) => void;
  /** Edita nome e porção de um alimento de hoje; com `toMeal`, muda ele de refeição. */
  updateFood: (meal: MealType, id: string, patch: FoodPatch, toMeal?: MealType) => void;
  /** Soma (ou subtrai, com valor negativo) água do dia; nunca fica abaixo de zero. */
  addWater: (ml: number) => void;

  /** Registra o peso do dia (substitui se já houver um na mesma data). */
  logWeight: (weightKg: number) => void;

  /** Guarda um plano novo; por padrão vira o ativo (o anterior fica em Meus treinos). */
  salvarPlano: (plano: PlanoDeTreino, ativar?: boolean) => void;
  /** Substitui um plano existente pela versão editada (mesmo id). */
  atualizarPlano: (plano: PlanoDeTreino) => void;
  ativarPlano: (id: string) => void;
  duplicarPlano: (id: string) => void;
  apagarPlano: (id: string) => void;
  /** Começa um treino do plano ativo HOJE, seja de que dia ele for. */
  comecarTreino: (treinoDoDiaId: string) => void;
  registrarSerie: (exercicioNoTreinoId: string, cargaKg: number, reps: number) => void;
  apagarSerie: (exercicioNoTreinoId: string, numero: number) => void;
  /** Termina o treino: calcula as kcal e guarda (sem nenhuma série, descarta). */
  finalizarTreino: () => void;
  cancelarTreino: () => void;
  /** Pausa o cronômetro do treino (o tempo parado não conta). */
  pausarTreino: () => void;
  retomarTreino: () => void;
  /** Descanso entre séries: começa, ajusta (± segundos) e pula. Fica no treino para a aba Treino mostrar. */
  iniciarDescanso: (segundos: number) => void;
  ajustarDescanso: (segundos: number) => void;
  pularDescanso: () => void;
  /** Pula o exercício hoje (as séries já feitas continuam); o treino segue para o próximo. */
  pularExercicio: (exercicioNoTreinoId: string) => void;
  /** Cria um exercício só desta pessoa e devolve ele (para já entrar no treino). */
  criarExercicio: (novo: NovoExercicio) => Exercicio;
  salvarRespostasTreinoIA: (r: RespostasTreinoIA) => void;

  loadSample: () => void;
  clearAll: () => void;
};

export type AppState = Data & Actions;

const now = () => new Date();
const nowIso = () => now().toISOString();

function blankData(): Data {
  return {
    profile: null,
    today: emptyDay(toDateKey(now())),
    history: [],
    weights: [],
    planos: [],
    sessoes: [],
    sessaoAtiva: null,
    exerciciosUsuario: [],
    respostasTreinoIA: null,
  };
}

export function sampleData(): Data {
  const today = toDateKey(now());
  const weights = sampleWeights(today);
  const { plano, sessoes } = converterPlanos(SAMPLE_WORKOUT_PLANS, sampleSessions(today), weights[0].weightKg, `${today}T09:00:00`);
  return {
    profile: SAMPLE_PROFILE,
    today: sampleDay(today),
    history: sampleHistory(today),
    weights,
    planos: plano ? [plano] : [],
    sessoes,
    sessaoAtiva: null,
    exerciciosUsuario: [],
    respostasTreinoIA: null,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      /** Aplica a virada de dia e devolve o `today` atualizado. */
      const rolled = () => {
        const { today, history } = get();
        const next = rolloverDay(today, history, toDateKey(now()));
        if (next.today !== today) set(next);
        return next.today;
      };

      return {
        // Até existir onboarding (fase 6), o app abre com os dados de exemplo.
        ...sampleData(),

        ensureToday: () => {
          rolled();
        },

        setProfile: (profile) => set({ profile }),

        addFood: (meal, item) => {
          const today = rolled();
          const id = newId();
          const full: FoodItem = { ...item, id, createdAt: nowIso() };
          set({ today: { ...today, meals: { ...today.meals, [meal]: [...today.meals[meal], full] } } });
          return id;
        },

        removeFood: (meal, id) => {
          const today = rolled();
          set({
            today: {
              ...today,
              meals: { ...today.meals, [meal]: today.meals[meal].filter((f) => f.id !== id) },
            },
          });
        },

        updateFood: (meal, id, patch, toMeal) => {
          const today = rolled();
          set({ today: { ...today, meals: updateFoodInMeals(today.meals, meal, id, patch, toMeal) } });
        },

        addWater: (ml) => {
          const today = rolled();
          set({ today: { ...today, waterMl: Math.max(0, today.waterMl + ml) } });
        },

        logWeight: (weightKg) => {
          const date = rolled().date;
          const others = get().weights.filter((w) => w.date !== date);
          const weights = [...others, { id: newId(), date, weightKg }].sort((a, b) =>
            a.date < b.date ? -1 : 1,
          );
          set({ weights });
        },

        salvarPlano: (plano, ativar = true) => {
          const outros = get().planos.map((p) => (ativar ? { ...p, ativo: false } : p));
          set({ planos: [...outros, { ...plano, ativo: ativar }] });
        },

        atualizarPlano: (plano) => set({ planos: get().planos.map((p) => (p.id === plano.id ? plano : p)) }),

        ativarPlano: (id) => set({ planos: get().planos.map((p) => ({ ...p, ativo: p.id === id })) }),

        duplicarPlano: (id) => {
          const p = get().planos.find((x) => x.id === id);
          if (!p) return;
          const novoId = newId();
          // Ids novos em tudo, para as sessões de um não se misturarem com as do outro.
          const copia: PlanoDeTreino = {
            ...p,
            id: novoId,
            nome: `${p.nome} (cópia)`,
            ativo: false,
            criadoEm: nowIso(),
            treinos: p.treinos.map((t) => {
              const tId = newId();
              return { ...t, id: tId, exercicios: t.exercicios.map((e) => ({ ...e, id: newId() })) };
            }),
          };
          set({ planos: [...get().planos, copia] });
        },

        apagarPlano: (id) => set({ planos: get().planos.filter((p) => p.id !== id) }),

        comecarTreino: (treinoDoDiaId) => {
          if (get().sessaoAtiva) return;
          const plano = get().planos.find((p) => p.ativo);
          const treino = plano?.treinos.find((t) => t.id === treinoDoDiaId);
          if (!plano || !treino) return;
          set({
            sessaoAtiva: {
              id: newId(),
              planoId: plano.id,
              treinoDoDiaId: treino.id,
              diaPlanejado: treino.dia,
              data: rolled().date,
              inicio: nowIso(),
              series: [],
              ...(treino.cardio ? { cardioMinutos: treino.cardio.minutos } : {}),
            },
          });
        },

        registrarSerie: (exercicioNoTreinoId, cargaKg, reps) => {
          const s = get().sessaoAtiva;
          const treino = get()
            .planos.find((p) => p.id === s?.planoId)
            ?.treinos.find((t) => t.id === s?.treinoDoDiaId);
          const ex = treino?.exercicios.find((e) => e.id === exercicioNoTreinoId);
          if (!s || !ex) return;
          const doExercicio = s.series.filter((x) => x.exercicioNoTreinoId === exercicioNoTreinoId);
          const numero = doExercicio.length + 1;
          const agora = nowIso();
          const t = Date.parse(agora);
          // A série começa quando a anterior (de qualquer exercício) terminou, ou quando o descanso acabou.
          const anterior = Date.parse(s.series.at(-1)?.concluidaEm ?? s.inicio);
          const desde = Math.max(anterior, s.proximaDesde ? Math.min(Date.parse(s.proximaDesde), t) : anterior);
          const ultimaDoEx = doExercicio.at(-1);
          const serie = {
            exercicioNoTreinoId,
            exercicioId: ex.exercicioId,
            numero,
            cargaKg,
            reps,
            concluidaEm: agora,
            duracaoSeg: Math.max(0, Math.round((t - desde) / 1000)),
            ...(ultimaDoEx ? { descansoSeg: Math.max(0, Math.round((desde - Date.parse(ultimaDoEx.concluidaEm)) / 1000)) } : {}),
          };
          const { proximaDesde, ...resto } = s;
          set({ sessaoAtiva: { ...resto, series: [...s.series, serie] } });
        },

        apagarSerie: (exercicioNoTreinoId, numero) => {
          const s = get().sessaoAtiva;
          if (!s) return;
          // Tira a série e renumera as seguintes do mesmo exercício.
          const series = s.series
            .filter((x) => !(x.exercicioNoTreinoId === exercicioNoTreinoId && x.numero === numero))
            .map((x) => (x.exercicioNoTreinoId === exercicioNoTreinoId && x.numero > numero ? { ...x, numero: x.numero - 1 } : x));
          set({ sessaoAtiva: { ...s, series } });
        },

        finalizarTreino: () => {
          const s = get().sessaoAtiva;
          if (!s) return;
          if (!s.series.length) {
            set({ sessaoAtiva: null });
            return;
          }
          const { weights, profile, planos } = get();
          const peso = weights.at(-1)?.weightKg ?? profile?.startWeightKg ?? 70;
          const cardio = planos.find((p) => p.id === s.planoId)?.treinos.find((t) => t.id === s.treinoDoDiaId)?.cardio;
          const fim = nowIso();
          // Terminar pausado: a pausa em curso também fica fora da conta.
          const { pausadoEm, descansoAte, descansoSeg, pulados, proximaDesde, ...resto } = s;
          const pausaMs = (s.pausaMs ?? 0) + (pausadoEm ? Math.max(0, Date.parse(fim) - Date.parse(pausadoEm)) : 0);
          const base = pausaMs ? { ...resto, pausaMs } : resto;
          const sessao: SessaoDeTreino = { ...base, fim, kcal: kcalDaSessao(base, fim, peso, cardio) };
          set({ sessoes: [sessao, ...get().sessoes], sessaoAtiva: null });
        },

        cancelarTreino: () => set({ sessaoAtiva: null }),

        pausarTreino: () => {
          const s = get().sessaoAtiva;
          if (s && !s.pausadoEm) set({ sessaoAtiva: { ...s, pausadoEm: nowIso() } });
        },

        retomarTreino: () => {
          const s = get().sessaoAtiva;
          if (!s?.pausadoEm) return;
          const { pausadoEm, ...resto } = s;
          set({ sessaoAtiva: { ...resto, pausaMs: (s.pausaMs ?? 0) + Math.max(0, now().getTime() - Date.parse(pausadoEm)) } });
        },

        iniciarDescanso: (segundos) => {
          const s = get().sessaoAtiva;
          if (!s || segundos <= 0) return;
          const ate = new Date(now().getTime() + segundos * 1000).toISOString();
          set({ sessaoAtiva: { ...s, descansoAte: ate, descansoSeg: segundos, proximaDesde: ate } });
        },

        ajustarDescanso: (segundos) => {
          const s = get().sessaoAtiva;
          if (!s?.descansoAte) return;
          const agora = now().getTime();
          const ate = Math.max(agora + 1000, Date.parse(s.descansoAte) + segundos * 1000);
          const total = Math.max(s.descansoSeg ?? 0, Math.ceil((ate - agora) / 1000));
          set({ sessaoAtiva: { ...s, descansoAte: new Date(ate).toISOString(), descansoSeg: total, proximaDesde: new Date(ate).toISOString() } });
        },

        pularExercicio: (exercicioNoTreinoId) => {
          const s = get().sessaoAtiva;
          if (!s || s.pulados?.includes(exercicioNoTreinoId)) return;
          const { descansoAte, descansoSeg, ...resto } = s;
          set({ sessaoAtiva: { ...resto, pulados: [...(s.pulados ?? []), exercicioNoTreinoId], proximaDesde: nowIso() } });
        },

        pularDescanso: () => {
          const s = get().sessaoAtiva;
          if (!s?.descansoAte) return;
          const { descansoAte, descansoSeg, ...resto } = s;
          set({ sessaoAtiva: { ...resto, proximaDesde: nowIso() } });
        },

        salvarRespostasTreinoIA: (r) => set({ respostasTreinoIA: r }),

        criarExercicio: (novo) => {
          const ex = exercicioDoUsuario(novo);
          set({ exerciciosUsuario: [...get().exerciciosUsuario, ex] });
          return ex;
        },

        loadSample: () => set(sampleData()),
        clearAll: () => set(blankData()),
      };
    },
    {
      name: 'tapcal-store',
      version: 2,
      // v1 → v2: treinos no formato do SPEC e rotina de trabalho no perfil.
      migrate: (antigo, versao) => migrarStore(antigo as Record<string, unknown>, versao) as unknown as Data,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): Data => ({
        profile: s.profile,
        today: s.today,
        history: s.history,
        weights: s.weights,
        planos: s.planos,
        sessoes: s.sessoes,
        sessaoAtiva: s.sessaoAtiva,
        exerciciosUsuario: s.exerciciosUsuario,
        respostasTreinoIA: s.respostasTreinoIA,
      }),
      // Ao reabrir o app num dia novo, zera refeições e água.
      onRehydrateStorage: () => (state) => state?.ensureToday(),
    },
  ),
);

// A biblioteca (lib/exercicios) enxerga os exercícios criados pela pessoa.
registrarExerciciosDoUsuario(useAppStore.getState().exerciciosUsuario);
useAppStore.subscribe((s, antes) => {
  if (s.exerciciosUsuario !== antes.exerciciosUsuario) registrarExerciciosDoUsuario(s.exerciciosUsuario);
});

/**
 * Migração dos dados salvos. v1 → v2: os treinos antigos viram um plano no
 * formato novo (as sessões vêm junto) e o nível de atividade vira a rotina de
 * trabalho — o treino deixa de entrar no fator e passa a somar pelas kcal.
 */
export function migrarStore(antigo: Record<string, unknown>, versao: number): Record<string, unknown> {
  if (versao >= 2) return antigo;
  const { workoutPlans, sessions, activeSession: _descartado, ...resto } = antigo as {
    workoutPlans?: WorkoutPlan[];
    sessions?: WorkoutSession[];
    activeSession?: unknown;
  } & Record<string, unknown>;
  const perfil = resto.profile as (Profile & { activityLevel?: string }) | null | undefined;
  const pesos = (resto.weights as WeightEntry[] | undefined) ?? [];
  const peso = pesos.at(-1)?.weightKg ?? perfil?.startWeightKg ?? 70;
  const { plano, sessoes } = converterPlanos(workoutPlans ?? [], sessions ?? [], peso);
  let profile = perfil ?? null;
  if (perfil && !perfil.workRoutine) {
    const { activityLevel, ...semNivel } = perfil;
    profile = { ...semNivel, workRoutine: activityLevel === 'muito_intenso' ? 'pesado' : 'sentado' };
  }
  return { ...resto, profile, planos: plano ? [plano] : [], sessoes, sessaoAtiva: null };
}

