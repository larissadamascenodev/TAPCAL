/**
 * Tipos da parte de treino (SPEC-TREINOS). Os nomes dos músculos são os slugs do
 * react-native-body-highlighter, para acender o músculo no desenho.
 */

export type Musculo =
  | 'chest'
  | 'upper-back'
  | 'lower-back'
  | 'trapezius'
  | 'deltoids'
  | 'biceps'
  | 'triceps'
  | 'forearm'
  | 'abs'
  | 'obliques'
  | 'quadriceps'
  | 'hamstring'
  | 'gluteal'
  | 'adductors'
  | 'abductors'
  | 'calves'
  | 'tibialis';

export type Equipamento =
  | 'barra'
  | 'halteres'
  | 'maquina'
  | 'polia'
  | 'smith'
  | 'peso-corporal'
  | 'elastico'
  | 'kettlebell'
  | 'banco'
  | 'barra-fixa'
  | 'anilha';

export type RegiaoArticular = 'joelho' | 'ombro' | 'lombar' | 'punho' | 'cotovelo' | 'quadril';

export type Exercicio = {
  /** Slug estável, ex.: 'agachamento-livre-barra'. */
  id: string;
  nome: string;
  nomesAlternativos: string[];
  musculoPrincipal: Musculo;
  musculosSecundarios: Musculo[];
  /** Tudo o que é necessário para fazer. */
  equipamentos: Equipamento[];
  locais: ('academia' | 'casa')[];
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  tipo: 'composto' | 'isolado';
  /** Quanto o exercício força cada região; usado para evitar exercícios quando há lesão. */
  estresseArticular: Partial<Record<RegiaoArticular, 'alto' | 'moderado'>>;
  /** 3 a 5 passos curtos, escritos por nós. */
  instrucoes: string[];
  midia?: { gifUrl?: string; gifUrlFeminino?: string };
  /** 'usuario' = criado pela própria pessoa. */
  origem: 'tapcal' | 'usuario';
};

// ─── Plano e semana de treino ───────────────────────────────────────────────

export type DiaSemana = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

export type ExercicioNoTreino = {
  id: string;
  exercicioId: string;
  series: number;
  repsMin: number;
  /** Igual a repsMin quando for número fixo. */
  repsMax: number;
  descansoSeg: number;
  cargaInicialKg?: number;
  observacao?: string;
};

export type Cardio = {
  atividade: 'caminhada' | 'corrida' | 'bicicleta' | 'eliptico';
  minutos: number;
  intensidade: 'leve' | 'moderada' | 'intensa';
};

export type TreinoDoDia = {
  id: string;
  dia: DiaSemana;
  /** Ex.: 'Pernas e glúteos'. Aparece dentro do dia, nunca na pílula. */
  nome: string;
  /** Na ordem de execução. */
  exercicios: ExercicioNoTreino[];
  cardio?: Cardio;
};

/** Respostas do mini-onboarding do treino com IA (etapa 5). */
export type RespostasTreinoIA = {
  experiencia: 'iniciante' | 'intermediario' | 'avancado';
  local: 'academia-completa' | 'academia-pequena' | 'casa';
  equipamentosCasa: Equipamento[];
  dias: DiaSemana[];
  tempo: '30-45' | '45-60' | '60-90' | '90+';
  foco: ('corpo-todo' | 'gluteos' | 'pernas' | 'abdomen' | 'costas' | 'peito' | 'ombros' | 'bracos')[];
  lesoes: RegiaoArticular[];
  cardio: 'ja-faco' | 'quero-comecar' | 'agora-nao';
  cardioAtividade?: Cardio['atividade'];
};

export type PlanoDeTreino = {
  id: string;
  nome: string;
  origem: 'personalizado' | 'ia';
  /** Só um plano ativo por vez. */
  ativo: boolean;
  /** Dia sem treino = descanso. */
  treinos: TreinoDoDia[];
  /** ISO. */
  criadoEm: string;
  ia?: {
    respostas: RespostasTreinoIA;
    /** YYYY-MM-DD da segunda-feira em que o bloco começou. */
    inicioBloco: string;
    /** 5 (4 normais + 1 de alívio). */
    semanasNoBloco: number;
    /** Número da fase (1 = primeiro bloco); o cardio sobe um pouco a cada fase. */
    bloco?: number;
    explicacao: string;
  };
};

export type SerieFeita = {
  exercicioNoTreinoId: string;
  exercicioId: string;
  numero: number;
  cargaKg: number;
  reps: number;
  /** ISO. */
  concluidaEm: string;
  /** Quanto durou a série (s), de quando ela pôde começar até concluir. */
  duracaoSeg?: number;
  /** Descanso antes dela (s), desde a série anterior do mesmo exercício. */
  descansoSeg?: number;
};

export type SessaoDeTreino = {
  id: string;
  planoId: string;
  treinoDoDiaId: string;
  /** De qual dia era o treino (ex.: 'seg'). */
  diaPlanejado: DiaSemana;
  /** YYYY-MM-DD em que foi FEITO, no fuso do aparelho. */
  data: string;
  /** ISO. */
  inicio: string;
  /** ISO. */
  fim: string;
  series: SerieFeita[];
  cardioMinutos?: number;
  /** Tempo total com o treino pausado (ms); fica fora da duração e das kcal. */
  pausaMs?: number;
  kcal: number;
};

/** Treino em andamento: ainda sem fim e sem kcal. */
export type SessaoEmAndamento = Omit<SessaoDeTreino, 'fim' | 'kcal'> & {
  /** ISO de quando foi pausado (ausente = rodando). */
  pausadoEm?: string;
  /** Descanso entre séries em curso: termina em (ISO) e dura (s). Some ao pular ou ao acabar. */
  descansoAte?: string;
  descansoSeg?: number;
  /** A partir de quando a próxima série pode começar (fim do descanso ou pulo dele). */
  proximaDesde?: string;
  /** Tempo de treino (ms, sem as pausas) em que a série da vez começa: fim do descanso, pulo dele ou do exercício. Ausente = 0. */
  serieDesdeMs?: number;
  /** Exercícios do treino que a pessoa pulou hoje (ids do exercício no treino). */
  pulados?: string[];
};
