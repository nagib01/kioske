import { FastifyInstance } from 'fastify';

import { authRoutes } from '../../services/api/auth.js';
import { adminRoutes } from '../../services/api/admin.js';
import { adminTriageRoutes } from '../../services/api/admin_triage.js';
import { triagemRoutes } from '../../services/api/triagem.js';
import { recepcionistaRoutes } from '../../services/api/recepcionista.js';
import { kioskRoutes } from '../../services/api/kiosk.js';
import { studentRoutes } from '../../services/api/students.js';
import { studentAuthRoutes } from '../../services/api/student_auth.js';
import { carRoutes } from '../../services/api/cars.js';
import { instructorLessonRoutes } from '../../services/api/instructor_lessons.js';
import { adminLessonRoutes } from '../../services/api/admin_lessons.js';
import { configureWebSocket } from '../../websocket/index.js';

export async function registerRoutes(fastify: FastifyInstance) {
    await fastify.register(authRoutes);
    await fastify.register(adminRoutes);
    await fastify.register(adminTriageRoutes);
    await fastify.register(triagemRoutes);
    await fastify.register(recepcionistaRoutes);
    await fastify.register(kioskRoutes);
    await fastify.register(studentRoutes);
    await fastify.register(studentAuthRoutes);
    await fastify.register(carRoutes);
    await fastify.register(instructorLessonRoutes);
    await fastify.register(adminLessonRoutes);
    await configureWebSocket(fastify);
}
