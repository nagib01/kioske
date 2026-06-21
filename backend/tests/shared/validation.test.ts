import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateBody } from '../../src/shared/validation.js';

function mockReply() {
  const reply: any = { sent: false };
  reply.status = vi.fn(() => reply);
  reply.send = vi.fn(() => {
    reply.sent = true;
    return reply;
  });
  return reply;
}

const schema = z.object({ nome: z.string().min(1, 'Nome é obrigatório') });

describe('validateBody', () => {
  it('returns the parsed value on success without touching reply', () => {
    const reply = mockReply();
    const parsed = validateBody(schema, { nome: 'Ana' }, reply);
    expect(parsed).toEqual({ nome: 'Ana' });
    expect(reply.send).not.toHaveBeenCalled();
  });

  it('sends a 400 and returns undefined on failure', () => {
    const reply = mockReply();
    const parsed = validateBody(schema, { nome: '' }, reply);
    expect(parsed).toBeUndefined();
    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalled();
    expect(reply.sent).toBe(true);
  });
});
