export async function authJwt(request: any, reply: any) {
  try {
    await request.jwtVerify();
    return true;
  } catch {
    reply.status(401).send({ error: 'Acesso não autorizado', code: 'UNAUTHORIZED' });
    return false;
  }
}

export async function authBackoffice(request: any, reply: any) {
  if (!(await authJwt(request, reply))) return false;
  if (request.user.role !== 'recepcionista' && request.user.role !== 'admin') {
    reply.status(403).send({ error: 'Acesso negado', code: 'FORBIDDEN' });
    return false;
  }
  return true;
}

export async function authAdmin(request: any, reply: any) {
  if (!(await authJwt(request, reply))) return false;
  if (request.user.role !== 'admin') {
    reply.status(403).send({ error: 'Acesso negado', code: 'FORBIDDEN' });
    return false;
  }
  return true;
}

export async function authOrHeader(request: any, reply: any) {
  return authJwt(request, reply);
}

export async function authOrHeaderAdmin(request: any, reply: any) {
  return authJwt(request, reply);
}

export async function requireAdmin(request: any, reply: any) {
  try {
    await request.jwtVerify();
    if (request.user?.role !== 'admin') {
      return reply.status(403).send({ error: 'Acesso negado', code: 'FORBIDDEN' });
    }
  } catch {
    return reply.status(401).send({ error: 'Acesso não autorizado', code: 'UNAUTHORIZED' });
  }
}
