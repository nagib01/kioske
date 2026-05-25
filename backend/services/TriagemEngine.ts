// backend/services/TriagemEngine.ts
/**
 * Motor de Triagem 100% baseado em regras JSON
 * 
 * Toda a lógica de prioridades, alertas e validações é governada
 * pelas regras armazenadas na coluna `regras` da tabela `triage_questions`.
 * 
 * Nenhuma condição hardcoded baseada em nomes de campos ou IDs de pergunta.
 */

/**
 * Representa uma resposta do aluno a uma pergunta de triagem
 */
export type RespostaTriagem = {
    perguntaId: string;
    resposta: string | boolean;
    respostaLabel?: string;
};

/**
 * Define quando e como uma regra deve ser aplicada
 * 
 * trigger: condição que deve ser cumprida para ativar a regra
 *   - equals: valor exato que a resposta deve ter
 *   - in: array de valores possíveis que ativam a regra
 * 
 * effects: efeitos que ocorrem quando a regra é ativada
 *   - priorityLevel: altera o nível de prioridade (high/medium/normal)
 *   - addAlert: adiciona um alerta ao resultado
 */
export type RegraTriagem = {
    trigger?: {
        equals?: string | boolean;
        in?: Array<string | boolean>;
    };
    effects?: {
        priorityLevel?: 'high' | 'medium' | 'normal';
        addAlert?: string;
    };
};

/**
 * Pergunta de triagem com suas regras associadas
 */
export type PerguntaTriagem = {
    id: string;
    texto?: string;
};

/**
 * Resultado da triagem após processar todas as respostas e aplicar regras
 */
export type ResultadoTriagem = {
    priority: boolean; // true se prioridade = high
    priorityLevel: 'high' | 'medium' | 'normal';
    alertas: string[];
};

export class TriagemEngine {
    /**
     * Calcula o peso numérico de um nível de prioridade
     * (usado para comparações ao elevar prioridades)
     */
    private static prioridadePeso(level: 'high' | 'medium' | 'normal'): number {
        if (level === 'high') return 3;
        if (level === 'medium') return 2;
        return 1;
    }

    /**
     * Retorna o nível de prioridade mais alto entre dois
     */
    private static elevarPrioridade(
        atual: 'high' | 'medium' | 'normal',
        nova: 'high' | 'medium' | 'normal'
    ): 'high' | 'medium' | 'normal' {
        return this.prioridadePeso(nova) > this.prioridadePeso(atual) ? nova : atual;
    }

    /**
     * Verifica se o valor da resposta ativa a regra
     * 
     * Se não há trigger, a regra é sempre ativada.
     * Se há trigger.equals, compara valor === valor esperado.
     * Se há trigger.in, verifica se valor está no array.
     */
    private static regraAtiva(valor: string | boolean, regra?: RegraTriagem): boolean {
        if (!regra?.trigger) {
            return true;
        }

        if (typeof regra.trigger.equals !== 'undefined') {
            return String(valor) === String(regra.trigger.equals);
        }

        if (Array.isArray(regra.trigger.in) && regra.trigger.in.length > 0) {
            return regra.trigger.in.some((v) => String(v) === String(valor));
        }

        return true;
    }

    /**
     * Processa respostas de triagem aplicando EXCLUSIVAMENTE as regras JSON
     * armazenadas no campo `regras` de cada pergunta.
     * 
     * Fluxo:
     * 1. Para cada resposta recebida, localiza a pergunta correspondente
     * 2. Percorre o array de regras da pergunta
     * 3. Para cada regra, verifica se o trigger corresponde ao valor da resposta
     * 4. Se sim, aplica todos os effects:
     *    - priorityLevel: mantém o nível mais alto
     *    - addAlert: adiciona ao conjunto de alertas (sem duplicatas)
     * 5. Retorna o resultado final combinado
     * 
     * @param respostas Respostas do aluno (perguntaId + valor)
     * @param perguntas Perguntas com suas regras (carregadas da BD)
     * @returns Resultado da triagem com prioridade e alertas
     */
    static processar(
        respostas: RespostaTriagem[],
        perguntas: Array<PerguntaTriagem & { regras?: RegraTriagem[] }>
    ): ResultadoTriagem {
        // Inicializar valores padrão
        let priorityLevel: 'high' | 'medium' | 'normal' = 'normal';
        const alertas: Set<string> = new Set();

        // Mapear perguntas por ID para lookup rápido
        const perguntasMap = new Map<string, PerguntaTriagem & { regras?: RegraTriagem[] }>();
        for (const pergunta of perguntas) {
            perguntasMap.set(pergunta.id, pergunta);
        }

        // Processar cada resposta
        for (const resposta of respostas) {
            const pergunta = perguntasMap.get(resposta.perguntaId);
            if (!pergunta) {
                continue;
            }

            const regras = pergunta.regras || [];

            // Aplicar todas as regras da pergunta
            for (const regra of regras) {
                // Verificar se o trigger da regra corresponde ao valor da resposta
                if (!this.regraAtiva(resposta.resposta, regra)) {
                    continue;
                }

                // Aplicar efeitos se a regra foi ativada
                if (regra.effects?.priorityLevel) {
                    priorityLevel = this.elevarPrioridade(priorityLevel, regra.effects.priorityLevel);
                }

                if (regra.effects?.addAlert) {
                    alertas.add(regra.effects.addAlert);
                }
            }
        }

        return {
            priority: priorityLevel === 'high',
            priorityLevel,
            alertas: Array.from(alertas)
        };
    }
}