import { describe, expect, it } from '@jest/globals';

import { buscarExercicios, exercicioPorId, registrarExerciciosDoUsuario } from '@/lib/exercicios';
import {
  adicionarExercicios,
  alternarDia,
  atualizarTreino,
  copiarDia,
  editarExercicio,
  exercicioDoUsuario,
  exercicioPadrao,
  limparDia,
  moverExercicio,
  moverExercicioPara,
  planoDoRascunho,
  problemasDoRascunho,
  rascunhoDoPlano,
  rascunhoVazio,
  removerExercicio,
  tirarDaBiblioteca,
  type Rascunho,
} from '@/lib/treino/editor';
import type { TreinoDoDia } from '@/types/treino';

const agachamento = { id: 'agachamento-livre-barra', tipo: 'composto' as const };
const cadeira = { id: 'cadeira-extensora', tipo: 'isolado' as const };
const stiff = { id: 'stiff-barra', tipo: 'composto' as const };

const treino = (exs = [agachamento, cadeira, stiff]): TreinoDoDia =>
  adicionarExercicios({ id: 't', dia: 'seg', nome: 'Pernas e glúteos', exercicios: [] }, exs);

describe('editor do treino personalizado', () => {
  it('exercício entra com 3 × 10–12 e descanso 90 s (composto) ou 60 s (isolado)', () => {
    expect(exercicioPadrao(agachamento)).toMatchObject({ exercicioId: 'agachamento-livre-barra', series: 3, repsMin: 10, repsMax: 12, descansoSeg: 90 });
    expect(exercicioPadrao(cadeira).descansoSeg).toBe(60);
  });

  it('adiciona vários de uma vez, sem repetir o que já está no treino', () => {
    const t = adicionarExercicios(treino([agachamento]), [agachamento, cadeira, cadeira, stiff]);
    expect(t.exercicios.map((e) => e.exercicioId)).toEqual(['agachamento-livre-barra', 'cadeira-extensora', 'stiff-barra']);
    expect(new Set(t.exercicios.map((e) => e.id)).size).toBe(3);
  });

  it('sobe, desce, remove e desmarca', () => {
    const t = treino();
    const [a, b, c] = t.exercicios;
    expect(moverExercicio(t, c.id, -1).exercicios.map((e) => e.id)).toEqual([a.id, c.id, b.id]);
    expect(moverExercicio(t, a.id, -1)).toBe(t); // o primeiro não sobe
    expect(moverExercicio(t, c.id, 1)).toBe(t); // o último não desce
    // arrastar: leva direto para a posição, e fora dos limites vai para a ponta
    expect(moverExercicioPara(t, a.id, 2).exercicios.map((e) => e.id)).toEqual([b.id, c.id, a.id]);
    expect(moverExercicioPara(t, c.id, 0).exercicios.map((e) => e.id)).toEqual([c.id, a.id, b.id]);
    expect(moverExercicioPara(t, b.id, 9).exercicios.map((e) => e.id)).toEqual([a.id, c.id, b.id]);
    expect(moverExercicioPara(t, b.id, 1)).toBe(t);
    expect(moverExercicioPara(t, 'nao-existe', 0)).toBe(t);
    expect(removerExercicio(t, b.id).exercicios.map((e) => e.id)).toEqual([a.id, c.id]);
    expect(tirarDaBiblioteca(t, 'stiff-barra').exercicios).toHaveLength(2);
  });

  it('edição respeita os limites: faixa ou número fixo, carga opcional e observação', () => {
    const t = treino([agachamento]);
    const id = t.exercicios[0].id;
    const e1 = editarExercicio(t, id, { series: 4, repsMin: 8, repsMax: 8, descansoSeg: 120, cargaInicialKg: 42.52, observacao: '  pés afastados ' }).exercicios[0];
    expect(e1).toEqual({ id, exercicioId: 'agachamento-livre-barra', series: 4, repsMin: 8, repsMax: 8, descansoSeg: 120, cargaInicialKg: 42.5, observacao: 'pés afastados' });
    // máximo menor que o mínimo sobe junto; séries e reps não passam dos limites
    const e2 = editarExercicio(t, id, { series: 0, repsMin: 15, repsMax: 12 }).exercicios[0];
    expect(e2).toMatchObject({ series: 1, repsMin: 15, repsMax: 15 });
    expect(editarExercicio(t, id, { series: 40, repsMin: 90, repsMax: 99 }).exercicios[0]).toMatchObject({ series: 10, repsMin: 50, repsMax: 50 });
    // carga zero ou vazia e observação em branco somem
    const e3 = editarExercicio({ ...t, exercicios: [e1] }, id, { cargaInicialKg: 0, observacao: '   ' }).exercicios[0];
    expect(e3.cargaInicialKg).toBeUndefined();
    expect(e3.observacao).toBeUndefined();
  });

  it('dias: ligar e desligar, copiar de um dia para outro e limpar', () => {
    let r: Rascunho = rascunhoVazio();
    expect(r.nome).toBe('Meu treino');
    r = alternarDia(alternarDia(alternarDia(r, 'sex'), 'seg'), 'qua');
    expect(r.treinos.map((t) => t.dia)).toEqual(['seg', 'qua', 'sex']);
    expect(r.treinos[0].nome).toBe('Treino de segunda');
    r = atualizarTreino(r, 'seg', (t) => adicionarExercicios({ ...t, nome: 'Pernas e glúteos' }, [agachamento, cadeira]));

    // copiar para um dia de descanso liga o dia; ids novos
    const c = copiarDia(r, 'seg', 'sab');
    const sab = c.treinos.find((t) => t.dia === 'sab')!;
    expect(c.treinos.map((t) => t.dia)).toEqual(['seg', 'qua', 'sex', 'sab']);
    expect(sab.nome).toBe('Pernas e glúteos');
    expect(sab.exercicios.map((e) => e.exercicioId)).toEqual(['agachamento-livre-barra', 'cadeira-extensora']);
    expect(sab.exercicios.some((e) => r.treinos[0].exercicios.some((x) => x.id === e.id))).toBe(false);

    // copiar para um dia com treino substitui, mas mantém o id do dia
    const quaId = r.treinos.find((t) => t.dia === 'qua')!.id;
    const q = copiarDia(r, 'seg', 'qua').treinos.find((t) => t.dia === 'qua')!;
    expect(q.id).toBe(quaId);
    expect(q.exercicios).toHaveLength(2);

    expect(limparDia(r, 'qua').treinos.map((t) => t.dia)).toEqual(['seg', 'sex']);
    expect(alternarDia(r, 'seg').treinos.map((t) => t.dia)).toEqual(['qua', 'sex']);
  });

  it('só salva com nome, pelo menos um dia e exercícios em todos os dias', () => {
    expect(problemasDoRascunho({ nome: ' ', treinos: [] }).map((p) => p.mensagem)).toEqual([
      'Dê um nome ao plano',
      'Escolha pelo menos um dia de treino',
    ]);
    let r = alternarDia(alternarDia(rascunhoVazio(), 'seg'), 'qui');
    r = atualizarTreino(r, 'seg', (t) => adicionarExercicios(t, [agachamento]));
    expect(problemasDoRascunho(r)).toEqual([{ dia: 'qui', mensagem: 'Quinta está sem exercícios' }]);
    r = atualizarTreino(r, 'qui', (t) => adicionarExercicios(t, [stiff]));
    expect(problemasDoRascunho(r)).toEqual([]);
  });

  it('plano novo sai ativo; editar mantém id, origem e os ids dos dias', () => {
    let r = alternarDia(alternarDia(rascunhoVazio(), 'qua'), 'seg');
    r = atualizarTreino(r, 'seg', (t) => adicionarExercicios({ ...t, nome: '  ' }, [agachamento]));
    r = atualizarTreino(r, 'qua', (t) => adicionarExercicios(t, [stiff]));
    const plano = planoDoRascunho({ ...r, nome: ' Força ' }, undefined, '2026-09-29T10:00:00.000Z');
    expect(plano).toMatchObject({ nome: 'Força', origem: 'personalizado', ativo: true, criadoEm: '2026-09-29T10:00:00.000Z' });
    expect(plano.treinos.map((t) => [t.dia, t.nome])).toEqual([
      ['seg', 'Treino de segunda'],
      ['qua', 'Treino de quarta'],
    ]);

    const ia = { ...plano, origem: 'ia' as const, ativo: false };
    const editado = rascunhoDoPlano(ia);
    const salvo = planoDoRascunho(atualizarTreino(editado, 'qua', (t) => ({ ...t, nome: 'Posterior' })), ia);
    expect(salvo).toMatchObject({ id: plano.id, origem: 'ia', ativo: false, criadoEm: plano.criadoEm });
    expect(salvo.treinos.map((t) => t.id)).toEqual(plano.treinos.map((t) => t.id));
    expect(salvo.treinos[1].nome).toBe('Posterior');
  });
});

describe('exercício criado pela pessoa', () => {
  it('fica sem mídia, com origem usuário, e aparece na biblioteca', () => {
    const ex = exercicioDoUsuario({ nome: '  agachamento   no banco ', musculo: 'quadriceps', equipamento: 'peso-corporal' });
    expect(ex).toMatchObject({ nome: 'Agachamento no banco', musculoPrincipal: 'quadriceps', equipamentos: ['peso-corporal'], origem: 'usuario', instrucoes: [] });
    expect(ex.midia).toBeUndefined();
    expect(ex.id).toMatch(/^usuario-agachamento-no-banco-/);

    expect(exercicioPorId(ex.id)).toBeUndefined();
    registrarExerciciosDoUsuario([ex]);
    expect(exercicioPorId(ex.id)?.nome).toBe('Agachamento no banco');
    expect(buscarExercicios({ busca: 'banco agach' }).map((e) => e.id)).toContain(ex.id);
    registrarExerciciosDoUsuario([]);
    expect(buscarExercicios({ busca: 'agachamento no banco' }).map((e) => e.id)).not.toContain(ex.id);
  });
});
