export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export function apiError(statusCode: number, message: string, code?: string, details?: unknown) {
  const body: ApiError = { error: message };
  if (code) body.code = code;
  if (details !== undefined) body.details = details;
  return { statusCode, body };
}

export const ERR = {
  MISSING_FIELD: (field: string) => apiError(400, `${field} é obrigatório`, 'MISSING_FIELD', { field }),
  NOT_FOUND: (entity: string) => apiError(404, `${entity} não encontrado(a)`, 'NOT_FOUND'),
  UNAUTHORIZED: apiError(401, 'Acesso não autorizado', 'UNAUTHORIZED'),
  FORBIDDEN: apiError(403, 'Acesso negado', 'FORBIDDEN'),
  DB_ERROR: apiError(500, 'Erro interno do servidor', 'DB_ERROR'),
  INVALID_ID: (field: string) => apiError(400, `${field} inválido`, 'INVALID_ID'),
};

/**
 * Throwable application error. Caught by the global Fastify error handler
 * (see server.ts) and serialized to a consistent JSON body.
 */
export class AppError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;

  constructor(statusCode: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
