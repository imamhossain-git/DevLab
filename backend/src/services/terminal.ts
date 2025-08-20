import { Server as SocketServer } from 'socket.io';
import { spawn, exec } from 'child_process';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'devlab-secret-key';

export function setupTerminalService(io: SocketServer) {
  io.on('connection', (socket) => {
    console.log('Terminal client connected:', socket.id);

    socket.on('start-terminal', async (data) => {
      try {
        const { attemptId, token } = data;

        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        
        // Verify attempt exists and belongs to user
        const attempt = await prisma.attempt.findFirst({
          where: {
            id: attemptId,
            userId: decoded.userId,
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

        if (!attempt.containerId) {
          socket.emit('terminal-error', { error: 'Container not ready' });
          return;
        }

        // Check if container is running
        exec(`docker ps -q -f name=${attempt.containerId}`, (error, stdout) => {
          if (error || !stdout.trim()) {
            socket.emit('terminal-error', { error: 'Container not running' });
            return;
          }

          // Start interactive shell in the container
          const shell = spawn('docker', [
            'exec', '-it', attempt.containerId, '/bin/bash'
          ], {
            env: {
              ...process.env,
              TERM: 'xterm-256color'
            }
          });

          // Handle shell output
          shell.stdout.on('data', (data) => {
            socket.emit('terminal-output', data.toString());
          });

          shell.stderr.on('data', (data) => {
            socket.emit('terminal-output', data.toString());
          });

          shell.on('error', (error) => {
            console.error('Shell error:', error);
            socket.emit('terminal-error', { error: 'Terminal connection failed' });
          });

          shell.on('close', (code) => {
            console.log(`Shell closed with code ${code}`);
            socket.emit('terminal-closed', { code });
          });

          // Handle input from client
          socket.on('terminal-input', (data) => {
            if (shell.stdin.writable) {
              shell.stdin.write(data);
            }
          });

          // Handle terminal resize
          socket.on('terminal-resize', (size) => {
            try {
              exec(`docker exec ${attempt.containerId} stty rows ${size.rows} cols ${size.cols}`);
            } catch (error) {
              console.warn('Failed to resize terminal:', error);
            }
          });

          // Cleanup on disconnect
          socket.on('disconnect', () => {
            console.log('Terminal client disconnected:', socket.id);
            if (shell && !shell.killed) {
              shell.kill('SIGTERM');
            }
          });

          // Send welcome message
          const welcomeMsg = `\x1b[32m╭─────────────────────────────────────────────────────────────╮\x1b[0m\n`;
          const labTitle = `\x1b[32m│\x1b[0m \x1b[1m\x1b[36mWelcome to ${attempt.lab.title}\x1b[0m`;
          const padding = ' '.repeat(Math.max(0, 59 - attempt.lab.title.length - 11));
          const labTitleLine = labTitle + padding + `\x1b[32m│\x1b[0m\n`;
          const instructions = `\x1b[32m│\x1b[0m \x1b[33mComplete the tasks in the left panel\x1b[0m                     \x1b[32m│\x1b[0m\n`;
          const grading = `\x1b[32m│\x1b[0m \x1b[33mUse 'Run Checks' button to validate your progress\x1b[0m        \x1b[32m│\x1b[0m\n`;
          const footer = `\x1b[32m╰─────────────────────────────────────────────────────────────╯\x1b[0m\n\n`;
          
          socket.emit('terminal-output', welcomeMsg + labTitleLine + instructions + grading + footer);
          socket.emit('terminal-output', `\x1b[1m\x1b[32m${attempt.lab.title}$\x1b[0m `);
        });

      } catch (error) {
        console.error('Terminal setup error:', error);
        socket.emit('terminal-error', { error: 'Failed to start terminal' });
      }
    });
  });
}