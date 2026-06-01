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
  (1, 'Administrador Principal', 'admin@escola.com', '$2b$10$HGsBrznX4jq9dn.i/5vmrutNpUA0sDp1bJChpKg3J1r8s/1AGdyaS', 'admin', NULL, 1),
  (2, 'Maria Silva', 'maria.silva@escola.com', '$2b$10$qJPVKyZrJdqie0qdiAD/JuWOKAGyjXZUATowM6mijQ4Ec7mW7sI3i', 'recepcionista', NULL, 1),
  (3, 'João Santos', 'joao.santos@escola.com', '$2b$10$XvmHEgB.v16bDtyrTGKxguxKH2gDyuC286kVCQRGbcUG7KODyGxPq', 'recepcionista', NULL, 1),
   (4, 'Carlos Pereira', 'instrutor@escola.com', '$2b$10$WLHHRs6cNUru9HZou60sSeMv3qbAk.eDp7x3d5vzyIVklrxPj0yFO', 'instructor', NULL, 1),
   (5, 'Ana Martins', 'ana.martins@escola.com', '$2b$10$WLHHRs6cNUru9HZou60sSeMv3qbAk.eDp7x3d5vzyIVklrxPj0yFO', 'instructor', NULL, 1),
   (6, 'Rui Oliveira', 'rui.oliveira@escola.com', '$2b$10$WLHHRs6cNUru9HZou60sSeMv3qbAk.eDp7x3d5vzyIVklrxPj0yFO', 'instructor', NULL, 1),
   (7, 'Sofia Costa', 'sofia.costa@escola.com', '$2b$10$WLHHRs6cNUru9HZou60sSeMv3qbAk.eDp7x3d5vzyIVklrxPj0yFO', 'instructor', NULL, 1);

-- Inserir viaturas
INSERT INTO cars (id, escola_id, matricula, marca, modelo, ano, categoria, observacoes, ativo)
VALUES
  (1, 1, 'AB-01-23', 'Renault', 'Clio', 2020, 'B', 'Carro principal para aulas práticas', true),
  (2, 1, 'CD-45-67', 'Volkswagen', 'Golf', 2021, 'B', 'Carro secundário com câmbio automático', true),
  (3, 1, 'EF-89-10', 'Toyota', 'Corolla', 2022, 'B', 'Veículo de reserva', true),
  (4, 1, 'GH-11-22', 'Peugeot', '208', 2023, 'B', 'Novo veículo adquirido em 2023', true);

-- Inserir alunos
INSERT INTO students (id, escola_id, numero_estudante, nome, email, telefone, data_nascimento, categoria, estado_formacao, data_matricula, observacoes, ativo, senha_hash)
VALUES
  (1, 1, '2023001', 'Ana Oliveira', 'ana.oliveira@email.com', '912345678', '2000-05-15', 'B', 'em_formacao', '2023-09-01', 'Aluna dedicada, quase a concluir', true, '$2b$10$WLHHRs6cNUru9HZou60sSeMv3qbAk.eDp7x3d5vzyIVklrxPj0yFO'),
  (2, 1, '2023002', 'Bruno Costa', 'bruno.costa@email.com', '923456789', '1999-08-22', 'B', 'inscrito', '2023-10-15', NULL, true, '$2b$10$WLHHRs6cNUru9HZou60sSeMv3qbAk.eDp7x3d5vzyIVklrxPj0yFO'),
  (3, 1, '2023003', 'Carla Martins', 'carla.martins@email.com', '934567890', '2001-02-10', 'B', 'pratico_concluido', '2023-07-01', 'Já concluiu a parte prática', true, '$2b$10$WLHHRs6cNUru9HZou60sSeMv3qbAk.eDp7x3d5vzyIVklrxPj0yFO'),
  (4, 1, '2023004', 'Daniel Rodrigues', 'daniel.rodrigues@email.com', '945678901', '2002-11-30', 'A', 'em_formacao', '2024-01-10', 'Carta de mota categoria A', true, '$2b$10$WLHHRs6cNUru9HZou60sSeMv3qbAk.eDp7x3d5vzyIVklrxPj0yFO'),
  (5, 1, '2023005', 'Eduardo Santos', 'eduardo.santos@email.com', '956789012', '2000-07-05', 'B', 'teorico_concluido', '2023-11-20', 'A aguardar início das práticas', true, '$2b$10$WLHHRs6cNUru9HZou60sSeMv3qbAk.eDp7x3d5vzyIVklrxPj0yFO');

-- Sincronizar sequências (auto-increment) devido às inserções manuais com IDs explícitos
SELECT setval('escolas_id_seq', COALESCE((SELECT MAX(id) FROM escolas), 1));
SELECT setval('servicos_id_seq', COALESCE((SELECT MAX(id) FROM servicos), 1));
SELECT setval('triage_questions_id_seq', COALESCE((SELECT MAX(id) FROM triage_questions), 1));
SELECT setval('triage_question_options_id_seq', COALESCE((SELECT MAX(id) FROM triage_question_options), 1));
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval('students_id_seq', COALESCE((SELECT MAX(id) FROM students), 1));
SELECT setval('cars_id_seq', COALESCE((SELECT MAX(id) FROM cars), 1));
