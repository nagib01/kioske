export const formatTicket = (ticket: any) => ({
    id: ticket.id,
    token: ticket.codigo_senha,
    codigo_senha: ticket.codigo_senha,
    posicao_fila: ticket.posicao,
    prioridade: ticket.priority,
    prioridade_nivel: ticket.priority_level,
    estado: ticket.status,
    alertas: ticket.alertas || [],
    criado_em: ticket.created_at,
    servico_id: ticket.servico_id,
    servico: ticket.servico_nome ? { nome: ticket.servico_nome } : undefined,
    aluno_token: ticket.aluno_token,
    aluno_nome: ticket.aluno_nome,
    mesa_atendimento: ticket.mesa_atendimento,
    updated_at: ticket.updated_at
});
