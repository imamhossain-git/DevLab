import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import labRoutes from './routes/labs.js';
import attemptRoutes from './routes/attempts.js';
import userRoutes from './routes/users.js';
import { setupTerminalService } from './services/terminal.js';
import { setupGraderService } from './services/grader.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

export const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/users', userRoutes);

// Services
setupTerminalService(io);
setupGraderService();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 DevLab server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  server.close();
});