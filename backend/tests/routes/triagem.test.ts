import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp, type TestApp } from '../setup.js';
import { triagemRoutes } from '../../services/api/triagem.js';
import { TicketModel } from '../../src/models/Ticket.js';

vi.mock('../../src/models/Ticket.js', () => ({
  TicketModel: {
    criar: vi.fn(),
    guardarRespostasTriagem: vi.fn().mockResolvedValue(undefined),
    buscarFilaPorServico: vi.fn(),
    buscarFilaPorEscola: vi.fn(),
  },
}));
vi.mock('../../src/shared/escola.js', () => ({
  getDefaultEscolaId: vi.fn().mockResolvedValue('1'),
}));

describe('Kiosk / Triage API', () => {
  let test: TestApp;

  beforeAll(async () => {
    test = await buildApp();
    await test.app.register(triagemRoutes);
    await test.app.ready();
  });

  afterAll(async () => {
    await test.app.close();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    test.mockPoolQuery.mockReset();
    test.mockPoolQuery.mockImplementation(() => Promise.resolve({ rows: [], rowCount: 0 }));
  });

  describe('GET /api/servicos', () => {
    it('returns active services list', async () => {
      test.mockPoolQuery.mockResolvedValue({
        rows: [
          { id: '1', nome: 'Aula Prática', codigo_prefixo: 'AP', ativo: true },
          { id: '2', nome: 'Secretaria', codigo_prefixo: 'SE', ativo: true },
        ],
        rowCount: 2,
      });

      const res = await test.app.inject({
        method: 'GET',
        url: '/api/servicos',
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveLength(2);
      expect(res.json()[0].nome).toBe('Aula Prática');
    });
  });

  describe('GET /api/triagem/perguntas/:servicoId', () => {
    it('returns triage questions for a service', async () => {
      test.mockPoolQuery
        .mockResolvedValueOnce({ rows: [{ id: '1' }], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'q1', servico_id: '1', texto: 'Tem documentação?', tipo: 'yes_no',
              obrigatoria: true, ordem: 1, opcoes: null, regras: null,
            },
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const res = await test.app.inject({
        method: 'GET',
        url: '/api/triagem/perguntas/1',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.perguntas).toBeDefined();
      expect(body.perguntas).toHaveLength(1);
    });
  });

  describe('POST /api/triagem/finalizar', () => {
    it('creates a ticket with triage answers', async () => {
      const queue = [
        { rows: [{ id: '1', nome: 'Aula Prática' }], rowCount: 1 },
        { rows: [{ id: 'q1', servico_id: '1', texto: 'Tem documentação?', tipo: 'yes_no', obrigatoria: true, ordem: 1, regras: null }], rowCount: 1 },
        { rows: [], rowCount: 0 },
        { rows: [], rowCount: 0 },
      ];
      let idx = 0;
      test.mockPoolQuery.mockImplementation(() => {
        const result = idx < queue.length ? queue[idx] : { rows: [], rowCount: 0 };
        idx++;
        return Promise.resolve(result);
      });

      (TicketModel.criar as any).mockResolvedValue({
        id: '42', servico_id: '1', codigo_senha: 'AP001', posicao: 1,
        status: 'waiting', aluno_token: 'uuid-xyz', escola_id: '1',
      });

      const tokenRes = await test.app.inject({
        method: 'GET',
        url: '/api/kiosk/token',
      });
      expect(tokenRes.statusCode).toBe(200);
      const { token } = tokenRes.json();

      const res = await test.app.inject({
        method: 'POST',
        url: '/api/triagem/finalizar',
        headers: { 'content-type': 'application/json' },
        payload: {
          servicoId: '1',
          respostas: [{ perguntaId: 'q1', resposta: 'sim' }],
          escolaId: '1',
          kioskToken: token,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.ticket.codigo_senha).toBe('AP001');
      expect(body.ticket.posicao_fila).toBe(1);
    });
  });

  describe('GET /api/fila/:servicoId', () => {
    it('returns queue for a service', async () => {
      (TicketModel.buscarFilaPorServico as any).mockResolvedValue([
        { id: '1', codigo_senha: 'AP001', posicao: 1, status: 'waiting', aluno_nome: 'João', mesa_atendimento: null, escola_id: '1' },
      ]);

      const res = await test.app.inject({
        method: 'GET',
        url: '/api/fila/1',
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().fila).toBeDefined();
      expect(res.json().fila).toHaveLength(1);
    });
  });
});
