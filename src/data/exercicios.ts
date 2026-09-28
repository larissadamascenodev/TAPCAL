/**
 * Biblioteca de exercícios do TapCal (versionada no app).
 *
 * Dados objetivos (músculos, equipamento) conferidos com o free-exercise-db
 * (domínio público); nomes como se fala nas academias brasileiras; instruções
 * escritas por nós. Sem imagens: a mídia licenciada entra depois em `midia`.
 */

import type { Equipamento, Exercicio, Musculo, RegiaoArticular } from '@/types/treino';

type Nivel = Exercicio['nivel'];
type Tipo = Exercicio['tipo'];
type Local = Exercicio['locais'][number];

/**
 * Linha compacta: id · nome · nomes alternativos · principal · secundários ·
 * equipamentos · locais · nível · tipo · estresse articular ('joelho:a,lombar:m';
 * a = alto, m = moderado).
 */
type Linha = [string, string, string[], Musculo, Musculo[], Equipamento[], Local[], Nivel, Tipo, string?];

const A: Local[] = ['academia'];
const C: Local[] = ['casa'];
const AC: Local[] = ['academia', 'casa'];
const I: Nivel = 'iniciante';
const M: Nivel = 'intermediario';
const V: Nivel = 'avancado';
const K: Tipo = 'composto';
const S: Tipo = 'isolado';

const LINHAS: Linha[] = [
  // ── Peito ──
  ['supino-reto-barra', 'Supino reto com barra', ['supino reto', 'bench press'], 'chest', ['triceps', 'deltoids'], ['barra', 'banco'], A, I, K, 'ombro:m,punho:m'],
  ['supino-reto-halteres', 'Supino reto com halteres', ['supino halter', 'dumbbell press'], 'chest', ['triceps', 'deltoids'], ['halteres', 'banco'], AC, I, K, 'ombro:m'],
  ['supino-inclinado-barra', 'Supino inclinado com barra', ['supino inclinado'], 'chest', ['deltoids', 'triceps'], ['barra', 'banco'], A, M, K, 'ombro:m'],
  ['supino-inclinado-halteres', 'Supino inclinado com halteres', ['supino inclinado halter'], 'chest', ['deltoids', 'triceps'], ['halteres', 'banco'], AC, I, K, 'ombro:m'],
  ['supino-declinado-barra', 'Supino declinado com barra', ['supino declinado'], 'chest', ['triceps'], ['barra', 'banco'], A, M, K, 'ombro:m'],
  ['supino-maquina', 'Supino na máquina', ['chest press', 'supino articulado'], 'chest', ['triceps', 'deltoids'], ['maquina'], A, I, K],
  ['supino-inclinado-smith', 'Supino inclinado no smith', ['supino smith'], 'chest', ['deltoids', 'triceps'], ['smith', 'banco'], A, I, K, 'ombro:m'],
  ['crucifixo-reto-halteres', 'Crucifixo reto com halteres', ['crucifixo', 'fly'], 'chest', ['deltoids'], ['halteres', 'banco'], AC, I, S, 'ombro:m'],
  ['crucifixo-inclinado-halteres', 'Crucifixo inclinado com halteres', ['crucifixo inclinado'], 'chest', ['deltoids'], ['halteres', 'banco'], AC, I, S, 'ombro:m'],
  ['voador', 'Voador (peck deck)', ['peck deck', 'fly na máquina', 'crucifixo máquina'], 'chest', ['deltoids'], ['maquina'], A, I, S],
  ['crossover-polia', 'Crossover na polia', ['crossover', 'crucifixo na polia'], 'chest', ['deltoids'], ['polia'], A, I, S],
  ['crossover-polia-baixa', 'Crossover na polia baixa', ['crossover de baixo para cima'], 'chest', ['deltoids'], ['polia'], A, M, S],
  ['flexao', 'Flexão de braço', ['flexão', 'apoio', 'push-up'], 'chest', ['triceps', 'deltoids', 'abs'], ['peso-corporal'], AC, I, K, 'punho:m'],
  ['flexao-joelhos', 'Flexão de braço com joelhos apoiados', ['flexão no joelho'], 'chest', ['triceps', 'deltoids'], ['peso-corporal'], AC, I, K, 'punho:m'],
  ['flexao-inclinada', 'Flexão inclinada (mãos no banco)', ['flexão inclinada'], 'chest', ['triceps', 'deltoids'], ['peso-corporal', 'banco'], AC, I, K],
  ['flexao-declinada', 'Flexão declinada (pés no banco)', ['flexão declinada'], 'chest', ['deltoids', 'triceps'], ['peso-corporal', 'banco'], AC, M, K, 'ombro:m,punho:m'],
  ['mergulho-paralelas', 'Mergulho nas paralelas', ['paralelas', 'dips'], 'chest', ['triceps', 'deltoids'], ['peso-corporal'], A, V, K, 'ombro:a,cotovelo:m'],
  ['supino-elastico', 'Supino com elástico', ['chest press elástico'], 'chest', ['triceps', 'deltoids'], ['elastico'], C, I, K],

  // ── Costas ──
  ['puxada-frontal-aberta', 'Puxada frontal aberta', ['puxada alta', 'pulldown', 'puxada frente'], 'upper-back', ['biceps', 'forearm'], ['polia'], A, I, K, 'ombro:m'],
  ['puxada-triangulo', 'Puxada com triângulo', ['puxada fechada', 'puxada neutra'], 'upper-back', ['biceps'], ['polia'], A, I, K],
  ['puxada-supinada', 'Puxada supinada', ['puxada invertida'], 'upper-back', ['biceps'], ['polia'], A, I, K, 'cotovelo:m'],
  ['barra-fixa', 'Barra fixa', ['pull-up', 'barra pronada'], 'upper-back', ['biceps', 'forearm'], ['barra-fixa'], AC, V, K, 'ombro:m,cotovelo:m'],
  ['barra-fixa-supinada', 'Barra fixa supinada', ['chin-up'], 'upper-back', ['biceps'], ['barra-fixa'], AC, V, K, 'cotovelo:m'],
  ['barra-fixa-graviton', 'Barra fixa no graviton', ['graviton', 'barra assistida'], 'upper-back', ['biceps'], ['maquina'], A, I, K],
  ['remada-curvada-barra', 'Remada curvada com barra', ['remada curvada', 'bent over row'], 'upper-back', ['biceps', 'lower-back'], ['barra'], A, M, K, 'lombar:a'],
  ['remada-curvada-supinada', 'Remada curvada supinada', ['remada supinada'], 'upper-back', ['biceps', 'lower-back'], ['barra'], A, M, K, 'lombar:a,cotovelo:m'],
  ['remada-serrote', 'Remada unilateral com halter (serrote)', ['serrote', 'remada unilateral'], 'upper-back', ['biceps'], ['halteres', 'banco'], AC, I, K],
  ['remada-curvada-halteres', 'Remada curvada com halteres', ['remada com halteres'], 'upper-back', ['biceps', 'lower-back'], ['halteres'], AC, M, K, 'lombar:m'],
  ['remada-baixa-triangulo', 'Remada baixa com triângulo', ['remada sentada', 'remada baixa'], 'upper-back', ['biceps'], ['polia'], A, I, K],
  ['remada-maquina', 'Remada na máquina', ['remada articulada'], 'upper-back', ['biceps'], ['maquina'], A, I, K],
  ['remada-cavalinho', 'Remada cavalinho', ['t-bar', 'remada t'], 'upper-back', ['biceps', 'lower-back'], ['barra'], A, M, K, 'lombar:m'],
  ['remada-apoiada-banco', 'Remada com halteres apoiada no banco', ['remada no banco inclinado'], 'upper-back', ['biceps', 'deltoids'], ['halteres', 'banco'], AC, I, K],
  ['pulldown-bracos-estendidos', 'Pulldown com braços estendidos na polia', ['pulldown', 'pullover na polia'], 'upper-back', ['triceps'], ['polia'], A, M, S],
  ['pullover-halter', 'Pullover com halter', ['pullover'], 'upper-back', ['chest', 'triceps'], ['halteres', 'banco'], AC, M, S, 'ombro:m'],
  ['remada-elastico', 'Remada com elástico', ['remada elástico'], 'upper-back', ['biceps'], ['elastico'], C, I, K],
  ['puxada-elastico', 'Puxada com elástico', ['pulldown elástico'], 'upper-back', ['biceps'], ['elastico'], C, I, K],
  ['remada-invertida', 'Remada invertida (australiana)', ['remada australiana', 'inverted row'], 'upper-back', ['biceps'], ['barra', 'peso-corporal'], AC, M, K],
  ['remada-smith', 'Remada curvada no smith', ['remada smith'], 'upper-back', ['biceps'], ['smith'], A, I, K, 'lombar:m'],

  // ── Lombar ──
  ['levantamento-terra', 'Levantamento terra', ['terra', 'deadlift'], 'lower-back', ['hamstring', 'gluteal', 'trapezius', 'forearm'], ['barra'], A, V, K, 'lombar:a,quadril:m'],
  ['levantamento-terra-halteres', 'Levantamento terra com halteres', ['terra com halteres'], 'lower-back', ['hamstring', 'gluteal'], ['halteres'], AC, M, K, 'lombar:m'],
  ['hiperextensao', 'Hiperextensão lombar no banco romano', ['hiperextensão', 'banco romano'], 'lower-back', ['gluteal', 'hamstring'], ['banco'], A, I, S, 'lombar:m'],
  ['superman', 'Superman', ['extensão lombar no chão'], 'lower-back', ['gluteal'], ['peso-corporal'], AC, I, S],
  ['perdigueiro', 'Perdigueiro', ['bird dog'], 'lower-back', ['abs', 'gluteal'], ['peso-corporal'], AC, I, S],

  // ── Ombros e trapézio ──
  ['desenvolvimento-halteres', 'Desenvolvimento com halteres', ['desenvolvimento', 'shoulder press'], 'deltoids', ['triceps'], ['halteres', 'banco'], AC, I, K, 'ombro:m'],
  ['desenvolvimento-barra', 'Desenvolvimento com barra', ['desenvolvimento militar', 'military press'], 'deltoids', ['triceps'], ['barra'], A, M, K, 'ombro:a,lombar:m'],
  ['desenvolvimento-maquina', 'Desenvolvimento na máquina', ['desenvolvimento articulado'], 'deltoids', ['triceps'], ['maquina'], A, I, K, 'ombro:m'],
  ['desenvolvimento-smith', 'Desenvolvimento no smith', ['desenvolvimento smith'], 'deltoids', ['triceps'], ['smith', 'banco'], A, I, K, 'ombro:m'],
  ['desenvolvimento-arnold', 'Desenvolvimento Arnold', ['arnold press'], 'deltoids', ['triceps'], ['halteres', 'banco'], AC, M, K, 'ombro:a'],
  ['desenvolvimento-kettlebell', 'Desenvolvimento com kettlebell', ['kettlebell press'], 'deltoids', ['triceps'], ['kettlebell'], AC, M, K, 'ombro:m'],
  ['desenvolvimento-elastico', 'Desenvolvimento com elástico', ['desenvolvimento elástico'], 'deltoids', ['triceps'], ['elastico'], C, I, K],
  ['elevacao-lateral-halteres', 'Elevação lateral com halteres', ['elevação lateral', 'lateral raise'], 'deltoids', ['trapezius'], ['halteres'], AC, I, S, 'ombro:m'],
  ['elevacao-lateral-polia', 'Elevação lateral na polia', ['lateral na polia'], 'deltoids', ['trapezius'], ['polia'], A, M, S, 'ombro:m'],
  ['elevacao-lateral-maquina', 'Elevação lateral na máquina', ['lateral máquina'], 'deltoids', [], ['maquina'], A, I, S],
  ['elevacao-lateral-elastico', 'Elevação lateral com elástico', ['lateral elástico'], 'deltoids', [], ['elastico'], C, I, S],
  ['elevacao-frontal-halteres', 'Elevação frontal com halteres', ['elevação frontal', 'front raise'], 'deltoids', ['chest'], ['halteres'], AC, I, S, 'ombro:m'],
  ['elevacao-frontal-anilha', 'Elevação frontal com anilha', ['frontal com anilha'], 'deltoids', ['chest'], ['anilha'], A, I, S, 'ombro:m'],
  ['crucifixo-invertido-halteres', 'Crucifixo invertido com halteres', ['crucifixo inverso', 'posterior de ombro'], 'deltoids', ['upper-back', 'trapezius'], ['halteres'], AC, I, S, 'lombar:m'],
  ['crucifixo-invertido-maquina', 'Crucifixo invertido na máquina', ['voador invertido', 'peck deck invertido'], 'deltoids', ['upper-back'], ['maquina'], A, I, S],
  ['face-pull', 'Face pull na polia', ['face pull'], 'deltoids', ['trapezius', 'upper-back'], ['polia'], A, M, S],
  ['remada-alta-barra', 'Remada alta com barra', ['remada alta', 'upright row'], 'deltoids', ['trapezius', 'biceps'], ['barra'], A, M, K, 'ombro:a,punho:m'],
  ['encolhimento-halteres', 'Encolhimento com halteres', ['encolhimento', 'shrug'], 'trapezius', ['forearm'], ['halteres'], AC, I, S],
  ['encolhimento-barra', 'Encolhimento com barra', ['encolhimento barra'], 'trapezius', ['forearm'], ['barra'], A, I, S],
  ['encolhimento-smith', 'Encolhimento no smith', ['encolhimento smith'], 'trapezius', [], ['smith'], A, I, S],

  // ── Bíceps e antebraço ──
  ['rosca-direta-barra', 'Rosca direta com barra', ['rosca direta', 'barbell curl'], 'biceps', ['forearm'], ['barra'], A, I, S, 'punho:m,cotovelo:m'],
  ['rosca-direta-barra-w', 'Rosca direta com barra W', ['rosca barra w'], 'biceps', ['forearm'], ['barra'], A, I, S],
  ['rosca-alternada', 'Rosca alternada com halteres', ['rosca alternada'], 'biceps', ['forearm'], ['halteres'], AC, I, S],
  ['rosca-martelo', 'Rosca martelo', ['hammer curl'], 'biceps', ['forearm'], ['halteres'], AC, I, S],
  ['rosca-concentrada', 'Rosca concentrada', ['concentrada'], 'biceps', [], ['halteres', 'banco'], AC, I, S],
  ['rosca-scott-barra-w', 'Rosca Scott com barra W', ['rosca scott', 'preacher curl'], 'biceps', [], ['barra', 'banco'], A, M, S, 'cotovelo:m'],
  ['rosca-scott-maquina', 'Rosca Scott na máquina', ['scott máquina'], 'biceps', [], ['maquina'], A, I, S],
  ['rosca-polia', 'Rosca na polia', ['rosca cabo'], 'biceps', ['forearm'], ['polia'], A, I, S],
  ['rosca-martelo-corda', 'Rosca martelo na corda', ['martelo na polia'], 'biceps', ['forearm'], ['polia'], A, I, S],
  ['rosca-inclinada', 'Rosca inclinada com halteres', ['rosca banco inclinado'], 'biceps', [], ['halteres', 'banco'], AC, M, S, 'ombro:m'],
  ['rosca-elastico', 'Rosca com elástico', ['rosca elástico'], 'biceps', ['forearm'], ['elastico'], C, I, S],
  ['rosca-kettlebell', 'Rosca com kettlebell', ['rosca kettlebell'], 'biceps', ['forearm'], ['kettlebell'], AC, I, S],
  ['rosca-inversa', 'Rosca inversa', ['rosca pronada'], 'forearm', ['biceps'], ['barra'], A, M, S, 'punho:m'],
  ['rosca-punho', 'Rosca de punho', ['flexão de punho', 'wrist curl'], 'forearm', [], ['barra', 'banco'], A, I, S, 'punho:m'],

  // ── Tríceps ──
  ['triceps-polia-barra', 'Tríceps na polia com barra', ['tríceps pulley', 'tríceps polia'], 'triceps', [], ['polia'], A, I, S],
  ['triceps-corda', 'Tríceps corda', ['tríceps na corda'], 'triceps', [], ['polia'], A, I, S],
  ['triceps-unilateral-polia', 'Tríceps unilateral na polia', ['tríceps unilateral'], 'triceps', [], ['polia'], A, I, S],
  ['triceps-frances-polia', 'Tríceps francês na polia', ['francês na corda', 'overhead na polia'], 'triceps', [], ['polia'], A, M, S, 'cotovelo:m'],
  ['triceps-testa', 'Tríceps testa com barra W', ['tríceps testa', 'skull crusher'], 'triceps', [], ['barra', 'banco'], A, M, S, 'cotovelo:a'],
  ['triceps-frances', 'Tríceps francês com halter', ['tríceps francês'], 'triceps', [], ['halteres'], AC, M, S, 'ombro:m,cotovelo:m'],
  ['triceps-coice', 'Tríceps coice com halter', ['coice', 'kickback'], 'triceps', [], ['halteres', 'banco'], AC, I, S],
  ['triceps-banco', 'Tríceps no banco', ['mergulho no banco', 'bench dips'], 'triceps', ['chest', 'deltoids'], ['banco', 'peso-corporal'], AC, I, K, 'ombro:a,punho:m'],
  ['triceps-maquina', 'Tríceps na máquina', ['tríceps articulado'], 'triceps', [], ['maquina'], A, I, S],
  ['supino-fechado', 'Supino fechado', ['supino pegada fechada'], 'triceps', ['chest', 'deltoids'], ['barra', 'banco'], A, M, K, 'ombro:m,punho:m'],
  ['flexao-diamante', 'Flexão diamante', ['flexão fechada'], 'triceps', ['chest'], ['peso-corporal'], AC, M, K, 'punho:a'],
  ['triceps-elastico', 'Tríceps com elástico', ['tríceps elástico'], 'triceps', [], ['elastico'], C, I, S],

  // ── Quadríceps ──
  ['agachamento-livre-barra', 'Agachamento livre com barra', ['agachamento com barra', 'back squat', 'agachamento livre'], 'quadriceps', ['gluteal', 'hamstring', 'lower-back'], ['barra'], A, M, K, 'joelho:a,lombar:a'],
  ['agachamento-frontal', 'Agachamento frontal', ['front squat'], 'quadriceps', ['gluteal', 'abs'], ['barra'], A, V, K, 'joelho:a,punho:m'],
  ['agachamento-smith', 'Agachamento no smith', ['agachamento smith'], 'quadriceps', ['gluteal'], ['smith'], A, I, K, 'joelho:a'],
  ['agachamento-goblet', 'Agachamento goblet', ['goblet squat', 'agachamento com halter'], 'quadriceps', ['gluteal', 'abs'], ['halteres'], AC, I, K, 'joelho:m'],
  ['agachamento-peso-corporal', 'Agachamento livre (peso do corpo)', ['agachamento sem peso', 'air squat'], 'quadriceps', ['gluteal'], ['peso-corporal'], AC, I, K, 'joelho:m'],
  ['agachamento-elastico', 'Agachamento com elástico', ['agachamento elástico'], 'quadriceps', ['gluteal'], ['elastico'], C, I, K, 'joelho:m'],
  ['agachamento-bulgaro', 'Agachamento búlgaro', ['búlgaro', 'split squat'], 'quadriceps', ['gluteal'], ['halteres', 'banco'], AC, M, K, 'joelho:a'],
  ['afundo', 'Afundo', ['avanço', 'lunge'], 'quadriceps', ['gluteal'], ['halteres'], AC, I, K, 'joelho:a'],
  ['afundo-peso-corporal', 'Afundo sem peso', ['avanço sem peso'], 'quadriceps', ['gluteal'], ['peso-corporal'], AC, I, K, 'joelho:m'],
  ['afundo-smith', 'Afundo no smith', ['afundo smith'], 'quadriceps', ['gluteal'], ['smith'], A, I, K, 'joelho:a'],
  ['passada-andando', 'Passada andando', ['passada', 'walking lunge'], 'quadriceps', ['gluteal', 'hamstring'], ['halteres'], A, M, K, 'joelho:a'],
  ['leg-press-45', 'Leg press 45°', ['leg press', 'leg 45'], 'quadriceps', ['gluteal'], ['maquina'], A, I, K, 'joelho:m'],
  ['leg-press-horizontal', 'Leg press horizontal', ['leg horizontal'], 'quadriceps', ['gluteal'], ['maquina'], A, I, K, 'joelho:m'],
  ['hack', 'Hack', ['hack squat', 'agachamento hack'], 'quadriceps', ['gluteal'], ['maquina'], A, M, K, 'joelho:a'],
  ['cadeira-extensora', 'Cadeira extensora', ['extensora', 'leg extension'], 'quadriceps', [], ['maquina'], A, I, S, 'joelho:a'],
  ['subida-banco', 'Subida no banco', ['step up'], 'quadriceps', ['gluteal'], ['halteres', 'banco'], AC, I, K, 'joelho:m'],
  ['agachamento-parede', 'Agachamento na parede (isometria)', ['wall sit', 'cadeirinha'], 'quadriceps', ['gluteal'], ['peso-corporal'], AC, I, S, 'joelho:m'],
  ['agachamento-sissy', 'Agachamento sissy', ['sissy squat'], 'quadriceps', [], ['peso-corporal'], AC, V, S, 'joelho:a'],

  // ── Posteriores de coxa ──
  ['mesa-flexora', 'Mesa flexora', ['flexora deitada', 'leg curl'], 'hamstring', ['calves'], ['maquina'], A, I, S],
  ['cadeira-flexora', 'Cadeira flexora', ['flexora sentada'], 'hamstring', [], ['maquina'], A, I, S],
  ['flexora-em-pe', 'Flexora em pé', ['flexora unilateral'], 'hamstring', [], ['maquina'], A, I, S],
  ['flexora-elastico', 'Flexora com elástico', ['flexora elástico'], 'hamstring', [], ['elastico'], C, I, S],
  ['stiff-barra', 'Stiff com barra', ['stiff'], 'hamstring', ['gluteal', 'lower-back'], ['barra'], A, M, K, 'lombar:a'],
  ['stiff-halteres', 'Stiff com halteres', ['stiff halter'], 'hamstring', ['gluteal', 'lower-back'], ['halteres'], AC, I, K, 'lombar:m'],
  ['stiff-unilateral', 'Stiff unilateral com halter', ['stiff uma perna'], 'hamstring', ['gluteal'], ['halteres'], AC, M, K, 'lombar:m'],
  ['terra-romeno', 'Levantamento terra romeno', ['terra romeno', 'rdl'], 'hamstring', ['gluteal', 'lower-back'], ['barra'], A, M, K, 'lombar:a'],
  ['bom-dia', 'Bom dia', ['good morning'], 'hamstring', ['lower-back', 'gluteal'], ['barra'], A, V, K, 'lombar:a'],
  ['flexao-nordica', 'Flexão nórdica', ['nordic curl'], 'hamstring', [], ['peso-corporal'], AC, V, S, 'joelho:a'],

  // ── Glúteos, adutores e abdutores ──
  ['elevacao-pelvica-barra', 'Elevação pélvica com barra', ['hip thrust', 'elevação pélvica'], 'gluteal', ['hamstring'], ['barra', 'banco'], A, I, K, 'quadril:m'],
  ['elevacao-pelvica-maquina', 'Elevação pélvica na máquina', ['hip thrust máquina'], 'gluteal', ['hamstring'], ['maquina'], A, I, K],
  ['elevacao-pelvica-smith', 'Elevação pélvica no smith', ['hip thrust smith'], 'gluteal', ['hamstring'], ['smith', 'banco'], A, I, K, 'quadril:m'],
  ['ponte-gluteo', 'Ponte de glúteo', ['ponte', 'glute bridge'], 'gluteal', ['hamstring'], ['peso-corporal'], AC, I, S],
  ['ponte-gluteo-unilateral', 'Ponte de glúteo unilateral', ['ponte uma perna'], 'gluteal', ['hamstring'], ['peso-corporal'], AC, M, S],
  ['ponte-gluteo-elastico', 'Ponte de glúteo com elástico', ['ponte com mini band'], 'gluteal', ['abductors'], ['elastico'], C, I, S],
  ['gluteo-polia', 'Glúteo na polia (coice)', ['coice na polia', 'kickback polia'], 'gluteal', ['hamstring'], ['polia'], A, I, S],
  ['gluteo-quatro-apoios', 'Glúteo quatro apoios', ['quatro apoios', 'coice no chão'], 'gluteal', ['hamstring'], ['peso-corporal'], AC, I, S],
  ['gluteo-coice-elastico', 'Coice com elástico', ['glúteo com elástico'], 'gluteal', [], ['elastico'], C, I, S],
  ['gluteo-maquina', 'Glúteo na máquina', ['glúteo máquina'], 'gluteal', ['hamstring'], ['maquina'], A, I, S],
  ['agachamento-sumo', 'Agachamento sumô', ['sumô', 'agachamento sumo com halter'], 'gluteal', ['adductors', 'quadriceps'], ['halteres'], AC, I, K, 'joelho:m,quadril:m'],
  ['swing-kettlebell', 'Swing com kettlebell', ['kettlebell swing'], 'gluteal', ['hamstring', 'lower-back'], ['kettlebell'], AC, M, K, 'lombar:m'],
  ['cadeira-abdutora', 'Cadeira abdutora', ['abdutora'], 'abductors', ['gluteal'], ['maquina'], A, I, S],
  ['abducao-elastico', 'Abdução com elástico', ['abdução mini band'], 'abductors', ['gluteal'], ['elastico'], AC, I, S],
  ['abducao-deitada', 'Abdução lateral deitada', ['abdução no chão'], 'abductors', ['gluteal'], ['peso-corporal'], AC, I, S],
  ['passada-lateral-elastico', 'Passada lateral com elástico', ['monster walk', 'caminhada lateral'], 'abductors', ['gluteal'], ['elastico'], AC, I, S],
  ['cadeira-adutora', 'Cadeira adutora', ['adutora'], 'adductors', [], ['maquina'], A, I, S],
  ['aducao-polia', 'Adução na polia', ['adutor na polia'], 'adductors', [], ['polia'], A, M, S],

  // ── Panturrilhas ──
  ['panturrilha-em-pe-maquina', 'Panturrilha em pé na máquina', ['gêmeos em pé', 'panturrilha em pé'], 'calves', [], ['maquina'], A, I, S],
  ['panturrilha-sentada', 'Panturrilha sentada', ['sóleo', 'gêmeos sentado'], 'calves', [], ['maquina'], A, I, S],
  ['panturrilha-leg-press', 'Panturrilha no leg press', ['gêmeos no leg'], 'calves', [], ['maquina'], A, I, S],
  ['panturrilha-smith', 'Panturrilha no smith', ['gêmeos smith'], 'calves', [], ['smith'], A, I, S],
  ['panturrilha-degrau', 'Panturrilha no degrau', ['panturrilha sem peso'], 'calves', [], ['peso-corporal'], AC, I, S],
  ['panturrilha-halteres', 'Panturrilha em pé com halteres', ['panturrilha halter'], 'calves', [], ['halteres'], AC, I, S],

  // ── Abdômen e core ──
  ['abdominal-supra', 'Abdominal supra', ['abdominal', 'crunch'], 'abs', [], ['peso-corporal'], AC, I, S],
  ['abdominal-infra', 'Abdominal infra', ['infra', 'reverse crunch'], 'abs', [], ['peso-corporal'], AC, I, S, 'lombar:m'],
  ['elevacao-pernas-barra', 'Elevação de pernas na barra', ['abdominal na barra', 'hanging leg raise'], 'abs', ['obliques', 'forearm'], ['barra-fixa'], A, V, S, 'ombro:m'],
  ['elevacao-pernas-paralela', 'Elevação de pernas na paralela', ['abdominal no apoio'], 'abs', ['obliques'], ['peso-corporal'], A, M, S],
  ['abdominal-polia', 'Abdominal na polia', ['abdominal ajoelhado na polia'], 'abs', [], ['polia'], A, M, S],
  ['abdominal-maquina', 'Abdominal na máquina', ['abdominal máquina'], 'abs', [], ['maquina'], A, I, S],
  ['prancha', 'Prancha', ['prancha frontal', 'plank'], 'abs', ['obliques', 'deltoids'], ['peso-corporal'], AC, I, S],
  ['prancha-lateral', 'Prancha lateral', ['side plank'], 'obliques', ['abs'], ['peso-corporal'], AC, I, S, 'ombro:m'],
  ['abdominal-bicicleta', 'Abdominal bicicleta', ['bicicleta'], 'abs', ['obliques'], ['peso-corporal'], AC, I, S],
  ['abdominal-remador', 'Abdominal remador', ['remador'], 'abs', [], ['peso-corporal'], AC, I, S, 'lombar:m'],
  ['abdominal-obliquo', 'Abdominal oblíquo', ['oblíquo'], 'obliques', ['abs'], ['peso-corporal'], AC, I, S],
  ['rotacao-russa', 'Rotação russa', ['russian twist', 'giro russo'], 'obliques', ['abs'], ['peso-corporal'], AC, I, S, 'lombar:m'],
  ['pallof-press', 'Pallof press na polia', ['pallof', 'antirrotação'], 'obliques', ['abs'], ['polia'], A, M, S],
  ['roda-abdominal', 'Roda abdominal', ['ab wheel', 'rolinho'], 'abs', ['lower-back', 'deltoids'], ['peso-corporal'], AC, V, S, 'lombar:a,ombro:m'],
  ['dead-bug', 'Dead bug', ['inseto morto'], 'abs', [], ['peso-corporal'], AC, I, S],
  ['escalador', 'Escalador (mountain climber)', ['mountain climber'], 'abs', ['quadriceps', 'deltoids'], ['peso-corporal'], AC, I, K, 'punho:m'],
];

function estresse(texto?: string): Exercicio['estresseArticular'] {
  const out: Exercicio['estresseArticular'] = {};
  for (const par of texto ? texto.split(',') : []) {
    const [regiao, nivel] = par.split(':') as [RegiaoArticular, 'a' | 'm'];
    out[regiao] = nivel === 'a' ? 'alto' : 'moderado';
  }
  return out;
}

export const EXERCICIOS: readonly Exercicio[] = LINHAS.map(
  ([id, nome, nomesAlternativos, musculoPrincipal, musculosSecundarios, equipamentos, locais, nivel, tipo, est]) => ({
    id,
    nome,
    nomesAlternativos,
    musculoPrincipal,
    musculosSecundarios,
    equipamentos,
    locais,
    nivel,
    tipo,
    estresseArticular: estresse(est),
    // Escritas depois da revisão da tabela.
    instrucoes: [],
    origem: 'tapcal',
  }),
);
