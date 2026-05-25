-- ====================
-- SEED DE TRIAGEM
-- ====================
-- Este script popula as tabelas de triagem_questions e triage_question_options
-- com dados de exemplo para testar o sistema.

-- Nota: Se já existem perguntas, apaga-as primeiro (CUIDADO em produção!)
-- DELETE FROM triage_question_options;
-- DELETE FROM triage_questions;

-- ==================== AULA PRÁTICA ====================
-- Pergunta 1: Tem atividade em menos de 10 minutos?
INSERT INTO triage_questions (id, escola_id, servico_id, chave, texto, tipo, obrigatoria, ordem, regras, ativo, created_at, updated_at)
SELECT 
  1,
  escolas.id,
  servicos.id,
  'atividade_em_minutos',
  'Tem alguma aula ou exame marcado nos próximos 10 minutos?',
  'yes_no',
  true,
   1,
  '[]'::jsonb,
  true,
  NOW(),
  NOW()
FROM escolas, servicos
WHERE escolas.nome = 'Escola de Condução Universal'
  AND servicos.nome = 'Aula Prática'
LIMIT 1;

INSERT INTO triage_question_options (id, question_id, label, value, ordem, regra, ativo)
VALUES 
  (1, 1, 'Sim', 'sim', 1, '{"priority_level": 2, "alerta": "urgencia_menos_10min"}'::jsonb, true),
  (2, 1, 'Não', 'nao', 2, '{"priority_level": 0}'::jsonb, true);

-- Pergunta 2: Tem toda a documentação?
INSERT INTO triage_questions (id, escola_id, servico_id, chave, texto, tipo, obrigatoria, ordem, regras, ativo, created_at, updated_at)
SELECT 
  2,
  escolas.id,
  servicos.id,
  'documentacao_completa',
  'Tem toda a documentação consigo?',
  'yes_no',
  true,
   2,
  '[]'::jsonb,
  true,
  NOW(),
  NOW()
FROM escolas, servicos
WHERE escolas.nome = 'Escola de Condução Universal'
  AND servicos.nome = 'Aula Prática'
LIMIT 1;

INSERT INTO triage_question_options (id, question_id, label, value, ordem, regra, ativo)
VALUES 
  (3, 2, 'Sim, tenho tudo', 'sim', 1, '{"priority_level": 0}'::jsonb, true),
  (4, 2, 'Não, falta documentação', 'nao', 2, '{"priority_level": 1, "alerta": "documento_faltando"}'::jsonb, true);

-- ==================== EXAME TEÓRICO ====================
-- Pergunta 1: Tem hora marcada para este exame?
INSERT INTO triage_questions (id, escola_id, servico_id, chave, texto, tipo, obrigatoria, ordem, regras, ativo, created_at, updated_at)
SELECT 
  3,
  escolas.id,
  servicos.id,
  'exame_hora_marcada',
  'Tem hora marcada para este exame?',
  'multipla_escolha',
  true,
   1,
  '[]'::jsonb,
  true,
  NOW(),
  NOW()
FROM escolas, servicos
WHERE escolas.nome = 'Escola de Condução Universal'
  AND servicos.nome = 'Exame Teórico'
LIMIT 1;

INSERT INTO triage_question_options (id, question_id, label, value, ordem, regra, ativo)
VALUES 
  (5, 3, 'Sim, com hora marcada', 'com_hora_marcada', 1, '{"priority_level": 1, "alerta": "hora_marcada"}'::jsonb, true),
  (6, 3, 'Não, vim sem marcação', 'sem_marcacao', 2, '{"priority_level": 0}'::jsonb, true);

-- Pergunta 2: Tem documentação em falta?
INSERT INTO triage_questions (id, escola_id, servico_id, chave, texto, tipo, obrigatoria, ordem, regras, ativo, created_at, updated_at)
SELECT 
  4,
  escolas.id,
  servicos.id,
  'documentacao_exame',
  'Tem toda a documentação necessária para o exame?',
  'yes_no',
  true,
   2,
  '[]'::jsonb,
  true,
  NOW(),
  NOW()
FROM escolas, servicos
WHERE escolas.nome = 'Escola de Condução Universal'
  AND servicos.nome = 'Exame Teórico'
LIMIT 1;

INSERT INTO triage_question_options (id, question_id, label, value, ordem, regra, ativo)
VALUES 
  (7, 4, 'Sim', 'sim', 1, '{"priority_level": 0}'::jsonb, true),
  (8, 4, 'Não', 'nao', 2, '{"alerta": "documento_faltando"}'::jsonb, true);

-- ==================== SECRETARIA ====================
-- Pergunta 1: Qual é o motivo da visita?
INSERT INTO triage_questions (id, escola_id, servico_id, chave, texto, tipo, obrigatoria, ordem, regras, ativo, created_at, updated_at)
SELECT 
  5,
  escolas.id,
  servicos.id,
  'motivo_visita',
  'Qual é o motivo da sua visita à secretaria?',
  'multipla_escolha',
  true,
   1,
  '[]'::jsonb,
  true,
  NOW(),
  NOW()
FROM escolas, servicos
WHERE escolas.nome = 'Escola de Condução Universal'
  AND servicos.nome = 'Secretaria'
LIMIT 1;

INSERT INTO triage_question_options (id, question_id, label, value, ordem, regra, ativo)
VALUES 
  (9, 5, 'Documentação', 'documentacao', 1, '{"priority_level": 0}'::jsonb, true),
  (10, 5, 'Inscrição', 'inscricao', 2, '{"priority_level": 0}'::jsonb, true),
  (11, 5, 'Certificados', 'certificados', 3, '{"priority_level": 0}'::jsonb, true),
  (12, 5, 'Dúvidas Gerais', 'duvidas', 4, '{"priority_level": 0}'::jsonb, true);

-- ==================== CANCELAMENTO ====================
-- Pergunta 1: Está a cancelar que tipo de serviço?
INSERT INTO triage_questions (id, escola_id, servico_id, chave, texto, tipo, obrigatoria, ordem, regras, ativo, created_at, updated_at)
SELECT 
  6,
  escolas.id,
  servicos.id,
  'tipo_cancelamento',
  'Qual o tipo de serviço que deseja cancelar?',
  'multipla_escolha',
  true,
   1,
  '[]'::jsonb,
  true,
  NOW(),
  NOW()
FROM escolas, servicos
WHERE escolas.nome = 'Escola de Condução Universal'
  AND servicos.nome = 'Cancelamento/Reagendamento'
LIMIT 1;

INSERT INTO triage_question_options (id, question_id, label, value, ordem, regra, ativo)
VALUES 
  (13, 6, 'Cancelar Aula', 'aula', 1, '{"priority_level": 0}'::jsonb, true),
  (14, 6, 'Cancelar Exame', 'exame', 2, '{"priority_level": 1}'::jsonb, true),
  (15, 6, 'Cancelar Inscrição', 'inscricao', 3, '{"priority_level": 1}'::jsonb, true);

