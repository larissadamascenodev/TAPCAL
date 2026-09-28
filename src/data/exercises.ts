/**
 * Catálogo de exercícios do TapCal: nomes em português escolhidos a dedo sobre a
 * base gratuita free-exercise-db (domínio público), que traz duas fotos de cada
 * exercício (início e fim do movimento) — o app alterna as duas como animação.
 * https://github.com/yuhonas/free-exercise-db
 */

export type MuscleKey =
  | 'peito'
  | 'costas'
  | 'ombros'
  | 'biceps'
  | 'triceps'
  | 'antebraco'
  | 'abdomen'
  | 'lombar'
  | 'trapezio'
  | 'quadriceps'
  | 'posterior'
  | 'gluteos'
  | 'panturrilha'
  | 'adutores';

export type EquipmentKey = 'barra' | 'halteres' | 'polia' | 'maquina' | 'peso_corporal' | 'barra_w' | 'smith';

export type CatalogExercise = {
  /** Id na base free-exercise-db (também é a pasta das fotos). */
  id: string;
  name: string;
  muscle: MuscleKey;
  equipment: EquipmentKey;
  /** Básico da academia: aparece primeiro e entra nas sugestões automáticas. */
  staple?: boolean;
};

type Row = [id: string, name: string, muscle: MuscleKey, equipment: EquipmentKey, staple?: 1];

const ROWS: Row[] = [
  // Peito
  ['Barbell_Bench_Press_-_Medium_Grip', 'Supino reto com barra', 'peito', 'barra', 1],
  ['Dumbbell_Bench_Press', 'Supino reto com halteres', 'peito', 'halteres', 1],
  ['Barbell_Incline_Bench_Press_-_Medium_Grip', 'Supino inclinado com barra', 'peito', 'barra'],
  ['Incline_Dumbbell_Press', 'Supino inclinado com halteres', 'peito', 'halteres', 1],
  ['Decline_Barbell_Bench_Press', 'Supino declinado com barra', 'peito', 'barra'],
  ['Smith_Machine_Bench_Press', 'Supino reto no Smith', 'peito', 'smith'],
  ['Smith_Machine_Incline_Bench_Press', 'Supino inclinado no Smith', 'peito', 'smith'],
  ['Machine_Bench_Press', 'Supino na máquina', 'peito', 'maquina'],
  ['Leverage_Chest_Press', 'Chest press articulado', 'peito', 'maquina'],
  ['Dumbbell_Flyes', 'Crucifixo reto com halteres', 'peito', 'halteres'],
  ['Incline_Dumbbell_Flyes', 'Crucifixo inclinado com halteres', 'peito', 'halteres', 1],
  ['Butterfly', 'Voador (peck deck)', 'peito', 'maquina', 1],
  ['Cable_Crossover', 'Crossover na polia alta', 'peito', 'polia', 1],
  ['Low_Cable_Crossover', 'Crossover na polia baixa', 'peito', 'polia'],
  ['Pushups', 'Flexão de braço', 'peito', 'peso_corporal'],
  ['Push-Up_Wide', 'Flexão aberta', 'peito', 'peso_corporal'],
  ['Straight-Arm_Dumbbell_Pullover', 'Pullover com halter', 'peito', 'halteres'],
  // Costas
  ['Wide-Grip_Lat_Pulldown', 'Puxada frontal aberta', 'costas', 'polia', 1],
  ['Close-Grip_Front_Lat_Pulldown', 'Puxada frontal fechada', 'costas', 'polia'],
  ['Underhand_Cable_Pulldowns', 'Puxada supinada', 'costas', 'polia'],
  ['V-Bar_Pulldown', 'Puxada com triângulo', 'costas', 'polia', 1],
  ['Pullups', 'Barra fixa pronada', 'costas', 'peso_corporal'],
  ['Chin-Up', 'Barra fixa supinada', 'costas', 'peso_corporal'],
  ['Straight-Arm_Pulldown', 'Pulldown com braços estendidos', 'costas', 'polia'],
  ['Rope_Straight-Arm_Pulldown', 'Pulldown com corda', 'costas', 'polia'],
  ['Seated_Cable_Rows', 'Remada baixa sentada', 'costas', 'polia', 1],
  ['Bent_Over_Barbell_Row', 'Remada curvada com barra', 'costas', 'barra', 1],
  ['Reverse_Grip_Bent-Over_Rows', 'Remada curvada supinada', 'costas', 'barra'],
  ['One-Arm_Dumbbell_Row', 'Remada unilateral (serrote)', 'costas', 'halteres', 1],
  ['Bent_Over_Two-Dumbbell_Row', 'Remada curvada com halteres', 'costas', 'halteres'],
  ['T-Bar_Row_with_Handle', 'Remada cavalinho (T-bar)', 'costas', 'barra'],
  ['Leverage_High_Row', 'Remada alta articulada', 'costas', 'maquina'],
  ['Leverage_Iso_Row', 'Remada articulada', 'costas', 'maquina'],
  ['Smith_Machine_Bent_Over_Row', 'Remada curvada no Smith', 'costas', 'smith'],
  // Ombros
  ['Dumbbell_Shoulder_Press', 'Desenvolvimento com halteres', 'ombros', 'halteres', 1],
  ['Seated_Barbell_Military_Press', 'Desenvolvimento com barra', 'ombros', 'barra'],
  ['Machine_Shoulder_Military_Press', 'Desenvolvimento na máquina', 'ombros', 'maquina'],
  ['Smith_Machine_Overhead_Shoulder_Press', 'Desenvolvimento no Smith', 'ombros', 'smith'],
  ['Arnold_Dumbbell_Press', 'Desenvolvimento Arnold', 'ombros', 'halteres'],
  ['Side_Lateral_Raise', 'Elevação lateral com halteres', 'ombros', 'halteres', 1],
  ['Cable_Seated_Lateral_Raise', 'Elevação lateral na polia', 'ombros', 'polia'],
  ['Front_Dumbbell_Raise', 'Elevação frontal com halteres', 'ombros', 'halteres'],
  ['Front_Cable_Raise', 'Elevação frontal na polia', 'ombros', 'polia'],
  ['Reverse_Machine_Flyes', 'Crucifixo inverso na máquina', 'ombros', 'maquina', 1],
  ['Seated_Bent-Over_Rear_Delt_Raise', 'Crucifixo inverso com halteres', 'ombros', 'halteres'],
  ['Face_Pull', 'Face pull', 'ombros', 'polia'],
  ['Upright_Barbell_Row', 'Remada alta com barra', 'ombros', 'barra'],
  // Trapézio
  ['Dumbbell_Shrug', 'Encolhimento com halteres', 'trapezio', 'halteres', 1],
  ['Barbell_Shrug', 'Encolhimento com barra', 'trapezio', 'barra'],
  // Bíceps
  ['Barbell_Curl', 'Rosca direta com barra', 'biceps', 'barra', 1],
  ['EZ-Bar_Curl', 'Rosca direta com barra W', 'biceps', 'barra_w'],
  ['Dumbbell_Alternate_Bicep_Curl', 'Rosca alternada com halteres', 'biceps', 'halteres', 1],
  ['Hammer_Curls', 'Rosca martelo', 'biceps', 'halteres', 1],
  ['Incline_Dumbbell_Curl', 'Rosca inclinada', 'biceps', 'halteres'],
  ['Concentration_Curls', 'Rosca concentrada', 'biceps', 'halteres'],
  ['Preacher_Curl', 'Rosca Scott', 'biceps', 'barra_w'],
  ['Machine_Preacher_Curls', 'Rosca Scott na máquina', 'biceps', 'maquina'],
  ['Standing_Biceps_Cable_Curl', 'Rosca na polia', 'biceps', 'polia'],
  ['Cable_Hammer_Curls_-_Rope_Attachment', 'Rosca martelo na corda', 'biceps', 'polia'],
  ['Spider_Curl', 'Rosca spider', 'biceps', 'barra_w'],
  // Tríceps
  ['Triceps_Pushdown', 'Tríceps na polia (barra)', 'triceps', 'polia', 1],
  ['Triceps_Pushdown_-_Rope_Attachment', 'Tríceps corda', 'triceps', 'polia', 1],
  ['Reverse_Grip_Triceps_Pushdown', 'Tríceps na polia inverso', 'triceps', 'polia'],
  ['Triceps_Overhead_Extension_with_Rope', 'Tríceps francês na polia', 'triceps', 'polia'],
  ['Standing_Dumbbell_Triceps_Extension', 'Tríceps francês com halter', 'triceps', 'halteres', 1],
  ['EZ-Bar_Skullcrusher', 'Tríceps testa', 'triceps', 'barra_w'],
  ['Tricep_Dumbbell_Kickback', 'Tríceps coice', 'triceps', 'halteres'],
  ['Close-Grip_Barbell_Bench_Press', 'Supino fechado', 'triceps', 'barra'],
  ['Bench_Dips', 'Mergulho no banco', 'triceps', 'peso_corporal'],
  ['Dips_-_Triceps_Version', 'Paralelas', 'triceps', 'peso_corporal'],
  ['Machine_Triceps_Extension', 'Tríceps na máquina', 'triceps', 'maquina'],
  // Antebraço
  ['Palms-Up_Barbell_Wrist_Curl_Over_A_Bench', 'Rosca de punho', 'antebraco', 'barra'],
  ['Standing_Dumbbell_Reverse_Curl', 'Rosca inversa', 'antebraco', 'halteres'],
  // Quadríceps
  ['Barbell_Squat', 'Agachamento livre', 'quadriceps', 'barra', 1],
  ['Front_Barbell_Squat', 'Agachamento frontal', 'quadriceps', 'barra'],
  ['Smith_Machine_Squat', 'Agachamento no Smith', 'quadriceps', 'smith'],
  ['Hack_Squat', 'Hack', 'quadriceps', 'maquina', 1],
  ['Leg_Press', 'Leg press 45°', 'quadriceps', 'maquina', 1],
  ['Leg_Extensions', 'Cadeira extensora', 'quadriceps', 'maquina', 1],
  ['Dumbbell_Lunges', 'Afundo com halteres', 'quadriceps', 'halteres'],
  ['Barbell_Walking_Lunge', 'Passada com barra', 'quadriceps', 'barra'],
  ['Split_Squat_with_Dumbbells', 'Agachamento búlgaro', 'quadriceps', 'halteres', 1],
  ['Dumbbell_Step_Ups', 'Subida no banco', 'quadriceps', 'halteres'],
  ['Goblet_Squat', 'Agachamento goblet', 'quadriceps', 'halteres'],
  ['Plie_Dumbbell_Squat', 'Agachamento sumô com halter', 'quadriceps', 'halteres'],
  ['Bodyweight_Squat', 'Agachamento sem peso', 'quadriceps', 'peso_corporal'],
  // Posterior
  ['Romanian_Deadlift', 'Levantamento terra romeno', 'posterior', 'barra', 1],
  ['Stiff-Legged_Barbell_Deadlift', 'Stiff com barra', 'posterior', 'barra', 1],
  ['Stiff-Legged_Dumbbell_Deadlift', 'Stiff com halteres', 'posterior', 'halteres'],
  ['Lying_Leg_Curls', 'Mesa flexora', 'posterior', 'maquina', 1],
  ['Seated_Leg_Curl', 'Cadeira flexora', 'posterior', 'maquina', 1],
  ['Standing_Leg_Curl', 'Flexora em pé', 'posterior', 'maquina'],
  ['Good_Morning', 'Bom dia (good morning)', 'posterior', 'barra'],
  ['Sumo_Deadlift', 'Levantamento terra sumô', 'posterior', 'barra'],
  // Glúteos
  ['Barbell_Hip_Thrust', 'Elevação pélvica com barra', 'gluteos', 'barra', 1],
  ['Barbell_Glute_Bridge', 'Ponte de glúteo com barra', 'gluteos', 'barra'],
  ['Single_Leg_Glute_Bridge', 'Ponte unilateral', 'gluteos', 'peso_corporal'],
  ['Glute_Kickback', 'Coice de glúteo', 'gluteos', 'peso_corporal'],
  ['One-Legged_Cable_Kickback', 'Coice na polia', 'gluteos', 'polia', 1],
  ['Pull_Through', 'Pull through na polia', 'gluteos', 'polia'],
  ['Thigh_Abductor', 'Cadeira abdutora', 'gluteos', 'maquina', 1],
  // Adutores
  ['Thigh_Adductor', 'Cadeira adutora', 'adutores', 'maquina', 1],
  // Panturrilha
  ['Standing_Calf_Raises', 'Panturrilha em pé', 'panturrilha', 'maquina', 1],
  ['Seated_Calf_Raise', 'Panturrilha sentada', 'panturrilha', 'maquina', 1],
  ['Calf_Press_On_The_Leg_Press_Machine', 'Panturrilha no leg press', 'panturrilha', 'maquina'],
  ['Smith_Machine_Calf_Raise', 'Panturrilha no Smith', 'panturrilha', 'smith'],
  ['Standing_Dumbbell_Calf_Raise', 'Panturrilha com halteres', 'panturrilha', 'halteres'],
  // Abdômen
  ['Crunches', 'Abdominal supra', 'abdomen', 'peso_corporal', 1],
  ['Reverse_Crunch', 'Abdominal infra', 'abdomen', 'peso_corporal'],
  ['Plank', 'Prancha', 'abdomen', 'peso_corporal', 1],
  ['Side_Bridge', 'Prancha lateral', 'abdomen', 'peso_corporal'],
  ['Hanging_Leg_Raise', 'Elevação de pernas na barra', 'abdomen', 'peso_corporal'],
  ['Flat_Bench_Lying_Leg_Raise', 'Elevação de pernas no banco', 'abdomen', 'peso_corporal'],
  ['Cable_Crunch', 'Abdominal na polia', 'abdomen', 'polia', 1],
  ['Ab_Crunch_Machine', 'Abdominal na máquina', 'abdomen', 'maquina'],
  ['Russian_Twist', 'Giro russo', 'abdomen', 'peso_corporal'],
  ['Oblique_Crunches_-_On_The_Floor', 'Abdominal oblíquo', 'abdomen', 'peso_corporal'],
  ['Dead_Bug', 'Dead bug', 'abdomen', 'peso_corporal'],
  ['Barbell_Ab_Rollout_-_On_Knees', 'Roda abdominal', 'abdomen', 'barra'],
  // Lombar
  ['Barbell_Deadlift', 'Levantamento terra', 'lombar', 'barra', 1],
  ['Hyperextensions_With_No_Hyperextension_Bench', 'Hiperextensão lombar', 'lombar', 'peso_corporal'],
];

export const EXERCISES: readonly CatalogExercise[] = ROWS.map(([id, name, muscle, equipment, staple]) => ({
  id,
  name,
  muscle,
  equipment,
  ...(staple ? { staple: true } : {}),
}));
