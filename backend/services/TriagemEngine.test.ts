import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TriagemEngine, type RespostaTriagem, type PerguntaTriagem, type RegraTriagem } from './TriagemEngine.js';

function q(id: string, regras?: RegraTriagem[]): PerguntaTriagem & { regras?: RegraTriagem[] } {
  return { id, regras };
}

function r(perguntaId: string, resposta: string | boolean): RespostaTriagem {
  return { perguntaId, resposta };
}

describe('TriagemEngine', () => {
  it('retorna normal quando não há regras', () => {
    const result = TriagemEngine.processar([r('p1', 'sim')], [q('p1')]);
    assert.equal(result.priority, false);
    assert.equal(result.priorityLevel, 'normal');
    assert.deepEqual(result.alertas, []);
  });

  it('aplica priorityLevel via trigger.equals', () => {
    const perguntas = [q('p1', [{ trigger: { equals: 'urgente' }, effects: { priorityLevel: 'high' } }])];
    const result = TriagemEngine.processar([r('p1', 'urgente')], perguntas);
    assert.equal(result.priorityLevel, 'high');
    assert.equal(result.priority, true);
  });

  it('não ativa regra quando valores não batem', () => {
    const perguntas = [q('p1', [{ trigger: { equals: 'urgente' }, effects: { priorityLevel: 'high' } }])];
    const result = TriagemEngine.processar([r('p1', 'normal')], perguntas);
    assert.equal(result.priorityLevel, 'normal');
  });

  it('aplica regra via trigger.in', () => {
    const perguntas = [q('p1', [{ trigger: { in: ['alto', 'urgente'] }, effects: { priorityLevel: 'high' } }])];
    const result = TriagemEngine.processar([r('p1', 'alto')], perguntas);
    assert.equal(result.priorityLevel, 'high');
  });

  it('eleva para o nível mais alto entre múltiplas regras', () => {
    const perguntas = [q('p1', [
      { trigger: { equals: 'medio' }, effects: { priorityLevel: 'medium' } },
      { trigger: { equals: 'alto' }, effects: { priorityLevel: 'high' } },
    ])];
    const result = TriagemEngine.processar([r('p1', 'medio')], perguntas);
    assert.equal(result.priorityLevel, 'medium');

    const result2 = TriagemEngine.processar([r('p1', 'alto')], perguntas);
    assert.equal(result2.priorityLevel, 'high');
  });

  it('acumula alertas sem duplicar', () => {
    const perguntas = [q('p1', [
      { trigger: { equals: 'x' }, effects: { addAlert: 'documento_faltando' } },
      { trigger: { equals: 'x' }, effects: { addAlert: 'documento_faltando' } },
    ])];
    const result = TriagemEngine.processar([r('p1', 'x')], perguntas);
    assert.deepEqual(result.alertas, ['documento_faltando']);
  });

  it('aplica regra sem trigger (sempre ativa)', () => {
    const perguntas = [q('p1', [{ effects: { addAlert: 'sempre_alerta', priorityLevel: 'high' } }])];
    const result = TriagemEngine.processar([r('p1', 'qualquer')], perguntas);
    assert.equal(result.priorityLevel, 'high');
    assert.deepEqual(result.alertas, ['sempre_alerta']);
  });

  it('processa múltiplas perguntas independentemente', () => {
    const perguntas = [
      q('p1', [{ trigger: { equals: 'sim' }, effects: { priorityLevel: 'high' } }]),
      q('p2', [{ trigger: { equals: 'nao' }, effects: { addAlert: 'alerta_2' } }]),
    ];
    const result = TriagemEngine.processar([r('p1', 'sim'), r('p2', 'nao')], perguntas);
    assert.equal(result.priorityLevel, 'high');
    assert.deepEqual(result.alertas, ['alerta_2']);
  });

  it('ignora perguntas sem correspondência nas respostas', () => {
    const perguntas = [q('p1', [{ trigger: { equals: 'sim' }, effects: { priorityLevel: 'high' } }])];
    const result = TriagemEngine.processar([r('p_inexistente', 'sim')], perguntas);
    assert.equal(result.priorityLevel, 'normal');
  });
});
