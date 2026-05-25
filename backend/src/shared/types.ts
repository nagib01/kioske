export interface PerguntaRow {
    id: string;
    escola_id: string;
    servico_id: string | null;
    chave: string | null;
    texto: string;
    tipo: 'yes_no' | 'single_choice';
    obrigatoria: boolean;
    ordem: number;
    regras: unknown;
    ativo: boolean;
}

export interface OpcaoRow {
    id: string;
    question_id: string;
    label: string;
    value: string;
    ordem: number;
    ativo: boolean;
}
