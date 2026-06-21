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

export async function authInstructor(request: any, reply: any) {
  if (!(await authJwt(request, reply))) return false;
  if (request.user.role !== 'instructor' && request.user.role !== 'admin') {
    reply.status(403).send({ error: 'Acesso negado', code: 'FORBIDDEN' });
    return false;
  }
  return true;
}

export async function authBackofficeOrInstructor(request: any, reply: any) {
  if (!(await authJwt(request, reply))) return false;
  if (!['admin', 'recepcionista', 'instructor'].includes(request.user.role)) {
    reply.status(403).send({ error: 'Acesso negado', code: 'FORBIDDEN' });
    return false;
  }
  return true;
}

export async function authStudent(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ error: 'Token inválido', code: 'UNAUTHORIZED' });
    return false;
  }
  if (request.user.role !== 'student') {
    reply.status(403).send({ error: 'Acesso negado', code: 'FORBIDDEN' });
    return false;
  }
  return true;
}
