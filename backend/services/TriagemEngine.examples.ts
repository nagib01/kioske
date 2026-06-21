/**
 * Exemplos de Uso do Novo TriagemEngine
 * 
 * Demonstra como criar regras JSON e como o motor as processa
 */

import { TriagemEngine, RespostaTriagem, RegraTriagem, PerguntaTriagem } from './TriagemEngine.js';

// ============================================================================
// EXEMPLO 1: Triagem de Urgência por Minutos
// ============================================================================

const exemplo1_Pergunta: PerguntaTriagem & { regras: RegraTriagem[] } = {
    id: 'q-urgencia',
    texto: 'Quando é o atendimento?',
    regras: [
        {
            trigger: { equals: '0-5' },
            effects: {
                priorityLevel: 'high',
                addAlert: 'urgencia_critica'
            }
        },
        {
            trigger: { equals: '5-10' },
            effects: {
                priorityLevel: 'high',
                addAlert: 'urgencia_alta'
            }
        },
        {
            trigger: { in: ['10-30', '30-60'] },
            effects: {
                priorityLevel: 'medium'
            }
        }
    ]
};

const exemplo1_Respostas: RespostaTriagem[] = [
    { perguntaId: 'q-urgencia', resposta: '5-10' }
];

const exemplo1_Resultado = TriagemEngine.processar(exemplo1_Respostas, [exemplo1_Pergunta]);
console.log('Exemplo 1 - Urgência Alta:');
console.log(exemplo1_Resultado);
// Esperado: { priority: true, priorityLevel: 'high', alertas: ['urgencia_alta'] }

// ============================================================================
// EXEMPLO 2: Triagem de Documentação
// ============================================================================

const exemplo2_Pergunta: PerguntaTriagem & { regras: RegraTriagem[] } = {
    id: 'q-documentos',
    texto: 'Você tem todos os documentos?',
    regras: [
        {
            trigger: { equals: 'não' },
            effects: {
                addAlert: 'documento_incompleto'
            }
        },
        {
            trigger: { equals: 'sim' },
            effects: {}
        }
    ]
};

const exemplo2_Respostas: RespostaTriagem[] = [
    { perguntaId: 'q-documentos', resposta: 'não' }
];

const exemplo2_Resultado = TriagemEngine.processar(exemplo2_Respostas, [exemplo2_Pergunta]);
console.log('\nExemplo 2 - Documentos Incompletos:');
console.log(exemplo2_Resultado);
// Esperado: { priority: false, priorityLevel: 'normal', alertas: ['documento_incompleto'] }

// ============================================================================
// EXEMPLO 3: Múltiplas Perguntas com Múltiplas Regras
// ============================================================================

const exemplo3_Perguntas: Array<PerguntaTriagem & { regras: RegraTriagem[] }> = [
    {
        id: 'q-urgencia',
        texto: 'Urgência (minutos)?',
        regras: [
            {
                trigger: { equals: '0-5' },
                effects: { priorityLevel: 'high', addAlert: 'urgencia_critica' }
            }
        ]
    },
    {
        id: 'q-documentos',
        texto: 'Documentação completa?',
        regras: [
            {
                trigger: { equals: 'não' },
                effects: { addAlert: 'doc_faltando' }
            }
        ]
    },
    {
        id: 'q-exame',
        texto: 'Exame marcado?',
        regras: [
            {
                trigger: { equals: 'sim' },
                effects: { priorityLevel: 'medium', addAlert: 'exame_marcado' }
            }
        ]
    }
];

const exemplo3_Respostas: RespostaTriagem[] = [
    { perguntaId: 'q-urgencia', resposta: '0-5' },
    { perguntaId: 'q-documentos', resposta: 'não' },
    { perguntaId: 'q-exame', resposta: 'sim' }
];

const exemplo3_Resultado = TriagemEngine.processar(exemplo3_Respostas, exemplo3_Perguntas);
console.log('\nExemplo 3 - Múltiplas Perguntas Combinadas:');
console.log(exemplo3_Resultado);
// Esperado: {
//   priority: true,
//   priorityLevel: 'high',        // HIGH (de urgencia_critica)
//   alertas: ['urgencia_critica', 'doc_faltando', 'exame_marcado']
// }

// ============================================================================
// EXEMPLO 4: Sem Regras Definidas (Valores Padrão)
// ============================================================================

const exemplo4_Pergunta: PerguntaTriagem & { regras: RegraTriagem[] } = {
    id: 'q-sem-regras',
    texto: 'Pergunta sem regras definidas',
    regras: []
};

const exemplo4_Respostas: RespostaTriagem[] = [
    { perguntaId: 'q-sem-regras', resposta: 'qualquer valor' }
];

const exemplo4_Resultado = TriagemEngine.processar(exemplo4_Respostas, [exemplo4_Pergunta]);
console.log('\nExemplo 4 - Sem Regras (Valores Padrão):');
console.log(exemplo4_Resultado);
// Esperado: { priority: false, priorityLevel: 'normal', alertas: [] }

// ============================================================================
// EXEMPLO 5: Regra com Trigger `in` (Array de Valores)
// ============================================================================

const exemplo5_Pergunta: PerguntaTriagem & { regras: RegraTriagem[] } = {
    id: 'q-especialidade',
    texto: 'Qual a especialidade?',
    regras: [
        {
            trigger: { in: ['cardiologia', 'neurologia', 'oftalmologia'] },
            effects: {
                priorityLevel: 'high',
                addAlert: 'especialidade_critica'
            }
        },
        {
            trigger: { in: ['dermatologia', 'estética'] },
            effects: {
                priorityLevel: 'normal'
            }
        }
    ]
};

const exemplo5_Respostas: RespostaTriagem[] = [
    { perguntaId: 'q-especialidade', resposta: 'cardiologia' }
];

const exemplo5_Resultado = TriagemEngine.processar(exemplo5_Respostas, [exemplo5_Pergunta]);
console.log('\nExemplo 5 - Trigger com Array (in):');
console.log(exemplo5_Resultado);
// Esperado: { priority: true, priorityLevel: 'high', alertas: ['especialidade_critica'] }

// ============================================================================
// EXEMPLO 6: Múltiplas Regras da Mesma Pergunta (Sem Trigger)
// ============================================================================

const exemplo6_Pergunta: PerguntaTriagem & { regras: RegraTriagem[] } = {
    id: 'q-teste',
    texto: 'Pergunta de teste',
    regras: [
        {
            // Sem trigger: sempre ativada
            effects: {
                addAlert: 'sempre_presente'
            }
        },
        {
            trigger: { equals: 'valor-especial' },
            effects: {
                priorityLevel: 'high',
                addAlert: 'valor_especial_detectado'
            }
        }
    ]
};

const exemplo6_Respostas: RespostaTriagem[] = [
    { perguntaId: 'q-teste', resposta: 'valor-especial' }
];

const exemplo6_Resultado = TriagemEngine.processar(exemplo6_Respostas, [exemplo6_Pergunta]);
console.log('\nExemplo 6 - Múltiplas Regras (Uma sem Trigger):');
console.log(exemplo6_Resultado);
// Esperado: {
//   priority: true,
//   priorityLevel: 'high',
//   alertas: ['sempre_presente', 'valor_especial_detectado']
// }

// ============================================================================
// SQL para Inserir os Exemplos na Base de Dados
// ============================================================================

const sqlExemplos = `
-- Exemplo 1: Urgência
INSERT INTO triage_questions (escola_id, servico_id, chave, texto, tipo, obrigatoria, ordem, regras, ativo)
VALUES (
  'escola-uuid',
  'servico-uuid',
  'urgencia_minutos',
  'Quando é o atendimento? (Em quantos minutos?)',
  'single_choice',
  true,
  1,
  '[
    {"trigger": {"equals": "0-5"}, "effects": {"priorityLevel": "high", "addAlert": "urgencia_critica"}},
    {"trigger": {"equals": "5-10"}, "effects": {"priorityLevel": "high", "addAlert": "urgencia_alta"}},
    {"trigger": {"in": ["10-30", "30-60"]}, "effects": {"priorityLevel": "medium"}}
  ]'::jsonb,
  true
);

-- Exemplo 2: Documentos
INSERT INTO triage_questions (escola_id, servico_id, texto, tipo, obrigatoria, ordem, regras, ativo)
VALUES (
  'escola-uuid',
  'servico-uuid',
  'Você tem todos os documentos?',
  'yes_no',
  true,
  2,
  '[
        {"trigger": {"equals": "não"}, "effects": {"addAlert": "documento_incompleto"}},
        {"trigger": {"equals": "sim"}, "effects": {}}
  ]'::jsonb,
  true
);

-- Exemplo 5: Especialidades Críticas
INSERT INTO triage_questions (escola_id, servico_id, texto, tipo, obrigatoria, ordem, regras, ativo)
VALUES (
  'escola-uuid',
  'servico-uuid',
  'Qual a especialidade?',
  'single_choice',
  true,
  3,
  '[
    {"trigger": {"in": ["cardiologia", "neurologia", "oftalmologia"]}, "effects": {"priorityLevel": "high", "addAlert": "especialidade_critica"}},
    {"trigger": {"in": ["dermatologia", "estética"]}, "effects": {"priorityLevel": "normal"}}
  ]'::jsonb,
  true
);
`;

console.log('\n\n=== SQL para inserir exemplos ===');
console.log(sqlExemplos);
