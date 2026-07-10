import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';

import { connectDB } from './config/db.js';
import { ensureTTLIndex } from './models/Email.js';
import { mailRouter } from './routes/mailRoutes.js';
import { inboundRouter } from './routes/inboundRoutes.js';
import { registerSocketHandlers } from './sockets/index.js';
import { apiLimiter, inboundLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const PORT = process.env.PORT || 4000;
const corsOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const corsOptionValue = corsOrigins.includes('*') ? '*' : corsOrigins;

async function main() {
  await connectDB();
  await ensureTTLIndex();

  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: { origin: corsOptionValue, methods: ['GET', 'POST'] },
  });

  app.set('io', io);
  app.set('trust proxy', 1);
  app.use(cors({ origin: corsOptionValue }));
  app.use(express.json({ limit: '10mb' })); // emails with inline images can be sizeable

  app.get('/health', (req, res) => res.json({ ok: true }));

  app.use('/api', apiLimiter, mailRouter);
  app.use('/api', inboundLimiter, inboundRouter);

  registerSocketHandlers(io);

  app.use(notFoundHandler);
  app.use(errorHandler);

  server.listen(PORT, () => {
    console.log(`[server] Listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('[fatal] Failed to start server:', err);
  process.exit(1);
});
