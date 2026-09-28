import { describe, expect, it } from '@jest/globals';

import { EXERCICIOS } from '@/data/exercicios';

/** Lista mínima do SPEC-TREINOS, com os nomes exatos do app. */
const MINIMOS = [
  'Supino reto com barra', 'Supino reto com halteres', 'Supino inclinado com barra', 'Supino inclinado com halteres',
  'Supino declinado com barra', 'Supino na máquina', 'Crucifixo reto com halteres', 'Crucifixo inclinado com halteres',
  'Voador (peck deck)', 'Crossover na polia', 'Flexão de braço', 'Flexão de braço com joelhos apoiados', 'Mergulho nas paralelas',
  'Puxada frontal aberta', 'Puxada com triângulo', 'Puxada supinada', 'Barra fixa', 'Barra fixa no graviton',
  'Remada curvada com barra', 'Remada curvada supinada', 'Remada unilateral com halter (serrote)', 'Remada baixa com triângulo',
  'Remada na máquina', 'Remada cavalinho', 'Pulldown com braços estendidos na polia', 'Pullover com halter', 'Remada com elástico',
  'Levantamento terra', 'Hiperextensão lombar no banco romano', 'Superman', 'Perdigueiro',
  'Desenvolvimento com halteres', 'Desenvolvimento com barra', 'Desenvolvimento na máquina', 'Desenvolvimento Arnold',
  'Elevação lateral com halteres', 'Elevação lateral na polia', 'Elevação frontal com halteres', 'Elevação frontal com anilha',
  'Crucifixo invertido com halteres', 'Crucifixo invertido na máquina', 'Face pull na polia', 'Remada alta com barra',
  'Encolhimento com halteres', 'Encolhimento com barra', 'Desenvolvimento com elástico', 'Elevação lateral com elástico',
  'Rosca direta com barra', 'Rosca direta com barra W', 'Rosca alternada com halteres', 'Rosca martelo', 'Rosca concentrada',
  'Rosca Scott com barra W', 'Rosca Scott na máquina', 'Rosca na polia', 'Rosca inclinada com halteres', 'Rosca com elástico',
  'Rosca inversa', 'Rosca de punho',
  'Tríceps na polia com barra', 'Tríceps corda', 'Tríceps testa com barra W', 'Tríceps francês com halter', 'Tríceps coice com halter',
  'Tríceps no banco', 'Tríceps unilateral na polia', 'Supino fechado', 'Tríceps com elástico',
  'Agachamento livre com barra', 'Agachamento frontal', 'Agachamento no smith', 'Agachamento goblet', 'Agachamento livre (peso do corpo)',
  'Agachamento búlgaro', 'Afundo', 'Passada andando', 'Leg press 45°', 'Leg press horizontal', 'Hack', 'Cadeira extensora', 'Subida no banco',
  'Mesa flexora', 'Cadeira flexora', 'Flexora em pé', 'Stiff com barra', 'Stiff com halteres', 'Levantamento terra romeno', 'Bom dia', 'Flexão nórdica',
  'Elevação pélvica com barra', 'Elevação pélvica na máquina', 'Ponte de glúteo', 'Ponte de glúteo unilateral', 'Glúteo na polia (coice)',
  'Glúteo quatro apoios', 'Glúteo na máquina', 'Cadeira abdutora', 'Cadeira adutora', 'Abdução com elástico', 'Abdução lateral deitada',
  'Agachamento sumô', 'Passada lateral com elástico', 'Swing com kettlebell',
  'Panturrilha em pé na máquina', 'Panturrilha sentada', 'Panturrilha no leg press', 'Panturrilha no degrau',
  'Abdominal supra', 'Abdominal infra', 'Elevação de pernas na barra', 'Abdominal na polia', 'Abdominal na máquina', 'Prancha',
  'Prancha lateral', 'Abdominal bicicleta', 'Abdominal remador', 'Roda abdominal', 'Dead bug', 'Rotação russa',
];

describe('biblioteca de exercícios (SPEC)', () => {
  it('150 a 200 exercícios, ids e nomes únicos', () => {
    expect(EXERCICIOS.length).toBeGreaterThanOrEqual(150);
    expect(EXERCICIOS.length).toBeLessThanOrEqual(200);
    expect(new Set(EXERCICIOS.map((e) => e.id)).size).toBe(EXERCICIOS.length);
    expect(new Set(EXERCICIOS.map((e) => e.nome)).size).toBe(EXERCICIOS.length);
  });

  it('tem todos os exercícios da lista mínima', () => {
    const nomes = new Set(EXERCICIOS.map((e) => e.nome));
    expect(MINIMOS.filter((n) => !nomes.has(n))).toEqual([]);
  });

  it('ids em slug, sem mídia nesta fase, todos com nomes alternativos', () => {
    for (const e of EXERCICIOS) {
      expect(e.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(e.midia).toBeUndefined();
      expect(e.nomesAlternativos.length).toBeGreaterThan(0);
      expect(e.musculosSecundarios).not.toContain(e.musculoPrincipal);
    }
  });
});
