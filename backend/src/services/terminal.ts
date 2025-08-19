import { Server as SocketServer } from 'socket.io';
import { spawn } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function setupTerminalService(io: SocketServer) {
  io.on('connection', (socket) => {
    console.log('Terminal client connected:', socket.id);

    socket.on('start-terminal', async (data) => {
      try {
        const { attemptId, token } = data;

        // Verify attempt exists and belongs to user
        const attempt = await prisma.attempt.findFirst({
          where: {
            id: attemptId,
            status: 'in_progress'
          },
          include: {
            lab: true
          }
        });

        if (!attempt) {
          socket.emit('terminal-error', { error: 'Invalid attempt' });
          return;
        }

        // For demo purposes, we'll use a simple shell process
        // In production, this would connect to the Docker container
        const shell = spawn('/bin/bash', [], {
          env: {
            ...process.env,
            TERM: 'xterm-256color',
            LAB_ID: attempt.labId,
            ATTEMPT_ID: attemptId
          }
        });

        shell.stdout.on('data', (data) => {
          socket.emit('terminal-output', data.toString());
        });

        shell.stderr.on('data', (data) => {
          socket.emit('terminal-output', data.toString());
        });

        socket.on('terminal-input', (data) => {
          shell.stdin.write(data);
        });

        socket.on('terminal-resize', (size) => {
          // Handle terminal resize if needed
        });

        socket.on('disconnect', () => {
          shell.kill();
        });

        // Send initial prompt
        socket.emit('terminal-output', `\x1b[32m[DevLab]\x1b[0m Welcome to ${attempt.lab.title}\n$ `);

      } catch (error) {
        console.error('Terminal setup error:', error);
        socket.emit('terminal-error', { error: 'Failed to start terminal' });
      }
    });
  });
}