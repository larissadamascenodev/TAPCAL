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
  sampleSessions,
  sampleWeights,
} from '@/data/sample';
import { toDateKey } from '@/lib/dates';
import { emptyDay, rolloverDay } from '@/lib/day';
import { newId } from '@/lib/id';
import type {
  DayLog,
  FoodItem,
  MealType,
  Profile,
  WeightEntry,
  WorkoutPlan,
  WorkoutSession,
} from '@/types';

export type NewFoodItem = Omit<FoodItem, 'id' | 'createdAt'>;

type Data = {
  profile: Profile | null;
  today: DayLog;
  history: DayLog[];
  weights: WeightEntry[];
  workoutPlans: WorkoutPlan[];
  /** Treinos finalizados, do mais novo para o mais antigo. */
  sessions: WorkoutSession[];
  /** Treino em andamento, se houver. */
  activeSession: WorkoutSession | null;
};

type Actions = {
  /** Vira o dia se a data mudou. Chamado ao abrir o app e ao voltar do fundo. */
  ensureToday: () => void;
  setProfile: (profile: Profile) => void;

  addFood: (meal: MealType, item: NewFoodItem) => string;
  removeFood: (meal: MealType, id: string) => void;
  /** Soma (ou subtrai, com valor negativo) água do dia; nunca fica abaixo de zero. */
  addWater: (ml: number) => void;

  /** Registra o peso do dia (substitui se já houver um na mesma data). */
  logWeight: (weightKg: number) => void;

  setWorkoutPlans: (plans: WorkoutPlan[]) => void;
  startSession: (planId: string) => void;
  logSet: (exerciseId: string, weightKg: number, reps: number) => void;
  removeSet: (setId: string) => void;
  finishSession: () => void;
  cancelSession: () => void;

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
    workoutPlans: [],
    sessions: [],
    activeSession: null,
  };
}

export function sampleData(): Data {
  const today = toDateKey(now());
  return {
    profile: SAMPLE_PROFILE,
    today: sampleDay(today),
    history: [],
    weights: sampleWeights(today),
    workoutPlans: SAMPLE_WORKOUT_PLANS,
    sessions: sampleSessions(today),
    activeSession: null,
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

        setWorkoutPlans: (workoutPlans) => set({ workoutPlans }),

        startSession: (planId) => {
          if (get().activeSession) return;
          const date = rolled().date;
          set({
            activeSession: { id: newId(), planId, date, startedAt: nowIso(), finishedAt: null, sets: [] },
          });
        },

        logSet: (exerciseId, weightKg, reps) => {
          const s = get().activeSession;
          if (!s) return;
          const entry = { id: newId(), exerciseId, weightKg, reps, completedAt: nowIso() };
          set({ activeSession: { ...s, sets: [...s.sets, entry] } });
        },

        removeSet: (setId) => {
          const s = get().activeSession;
          if (!s) return;
          set({ activeSession: { ...s, sets: s.sets.filter((x) => x.id !== setId) } });
        },

        finishSession: () => {
          const s = get().activeSession;
          if (!s) return;
          // Treino sem nenhuma série não entra no histórico.
          const sessions = s.sets.length
            ? [{ ...s, finishedAt: nowIso() }, ...get().sessions]
            : get().sessions;
          set({ sessions, activeSession: null });
        },

        cancelSession: () => set({ activeSession: null }),

        loadSample: () => set(sampleData()),
        clearAll: () => set(blankData()),
      };
    },
    {
      name: 'tapcal-store',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): Data => ({
        profile: s.profile,
        today: s.today,
        history: s.history,
        weights: s.weights,
        workoutPlans: s.workoutPlans,
        sessions: s.sessions,
        activeSession: s.activeSession,
      }),
      // Ao reabrir o app num dia novo, zera refeições e água.
      onRehydrateStorage: () => (state) => state?.ensureToday(),
    },
  ),
);
