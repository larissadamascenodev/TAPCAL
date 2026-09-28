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
