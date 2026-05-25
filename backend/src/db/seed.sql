-- Limpar e inserir dados de exemplo
TRUNCATE TABLE ticket_triage_answers, triage_question_options, triage_questions, tickets, servicos, users, escolas CASCADE;

-- Inserir escola padrão
INSERT INTO escolas (id, nome) 
VALUES (1, 'Escola de Condução Universal');

-- Inserir serviços dinâmicos
INSERT INTO servicos (id, escola_id, nome, codigo_prefixo, tempo_medio_atendimento, prioridade_base, ativo, mesa_padrao)
VALUES 
  (1, 1, 'Aula Prática', 'A', 25, 0, true, '02'),
  (2, 1, 'Exame Teórico', 'E', 40, 0, true, '03'),
  (3, 1, 'Secretaria', 'S', 15, 0, true, '01'),
  (4, 1, 'Cancelamento/Reagendamento', 'C', 10, 0, true, '02');

-- Inserir perguntas de triagem globais (para todos os serviços)
INSERT INTO triage_questions (id, escola_id, servico_id, chave, texto, tipo, obrigatoria, ordem, regras, ativo)
VALUES
  (1, 1, NULL, 'atividade_em_minutos', 'Tem uma atividade agendada nos próximos minutos?', 'single_choice', true, 0, '[]', true),
  (2, 1, NULL, 'documentacao_completa', 'Tem toda a documentação necessária?', 'yes_no', true, 1, '[]', true),
  (3, 1, 2, 'exame_hora_marcada', 'É um exame com hora marcada?', 'yes_no', true, 0, '[]', true);

-- Inserir opções para as perguntas
INSERT INTO triage_question_options (id, question_id, label, value, ordem, ativo)
VALUES
  (1, 1, 'Menos de 10 minutos', '5', 0, true),
  (2, 1, 'Entre 10 e 30 minutos', '20', 1, true),
  (3, 1, 'Mais de 30 minutos', '60', 2, true);

-- Inserir utilizadores (admin e recepcionistas)
INSERT INTO users (id, nome, email, senha_hash, role, avatar_url, escola_id)
VALUES
  (1, 'Administrador Principal', 'admin@escola.com', '$2b$10$2YZZL3RZCvL8Qw8LxM3bHeGuOMEBV9YPcN9zYq2JhvKvKvKvKvKvK', 'admin', NULL, 1),
  (2, 'Maria Silva', 'maria.silva@escola.com', '$2b$10$2YZZL3RZCvL8Qw8LxM3bHeGuOMEBV9YPcN9zYq2JhvKvKvKvKvKvK', 'recepcionista', NULL, 1),
  (3, 'João Santos', 'joao.santos@escola.com', '$2b$10$2YZZL3RZCvL8Qw8LxM3bHeGuOMEBV9YPcN9zYq2JhvKvKvKvKvKvK', 'recepcionista', NULL, 1);

-- Sincronizar sequências (auto-increment) devido às inserções manuais com IDs explícitos
SELECT setval('escolas_id_seq', COALESCE((SELECT MAX(id) FROM escolas), 1));
SELECT setval('servicos_id_seq', COALESCE((SELECT MAX(id) FROM servicos), 1));
SELECT setval('triage_questions_id_seq', COALESCE((SELECT MAX(id) FROM triage_questions), 1));
SELECT setval('triage_question_options_id_seq', COALESCE((SELECT MAX(id) FROM triage_question_options), 1));
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
