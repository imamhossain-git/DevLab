import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { createLabContainer, runGraderChecks, cleanupContainer } from '../services/grader.js';
import yaml from 'js-yaml';

const router = Router();
const prisma = new PrismaClient();

// Start new attempt
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { labId } = req.body;

    const lab = await prisma.lab.findUnique({ where: { id: labId } });
    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    // Check for existing in-progress attempt
    const existingAttempt = await prisma.attempt.findFirst({
      where: {
        userId: req.userId!,
        labId,
        status: 'in_progress'
      }
    });

    if (existingAttempt) {
      return res.json(existingAttempt);
    }

    // Calculate max score from YAML
    let maxScore = 100;
    try {
      const yamlData = yaml.load(lab.yamlSpec) as any;
      if (yamlData.tasks) {
        maxScore = yamlData.tasks.reduce((sum: number, task: any) => sum + (task.points || 0), 0);
      }
    } catch (error) {
      console.warn('Failed to parse YAML for max score calculation');
    }

    // Create container for this attempt
    const containerId = await createLabContainer(lab.yamlSpec);

    const attempt = await prisma.attempt.create({
      data: {
        userId: req.userId!,
        labId,
        containerId,
        maxScore
      },
      include: {
        lab: {
          select: {
            title: true,
            slug: true,
            yamlSpec: true
          }
        }
      }
    });

    res.status(201).json(attempt);
  } catch (error) {
    console.error('Start attempt error:', error);
    res.status(500).json({ error: 'Failed to start attempt' });
  }
});

// Get user attempts
router.get('/mine', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const attempts = await prisma.attempt.findMany({
      where: { userId: req.userId! },
      include: {
        lab: {
          select: {
            title: true,
            slug: true,
            topic: true,
            level: true
          }
        }
      },
      orderBy: { startedAt: 'desc' }
    });

    res.json(attempts);
  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

// Run checks for attempt
router.post('/:id/check', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const attempt = await prisma.attempt.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!
      },
      include: {
        lab: true
      }
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ error: 'Attempt is not in progress' });
    }

    const results = await runGraderChecks(attempt);
    res.json(results);
  } catch (error) {
    console.error('Run checks error:', error);
    res.status(500).json({ error: 'Failed to run checks' });
  }
});

// Reset attempt
router.post('/:id/reset', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const attempt = await prisma.attempt.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!
      },
      include: { lab: true }
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    // Clean up old container
    if (attempt.containerId) {
      await cleanupContainer(attempt.containerId);
    }

    // Create new container
    const containerId = await createLabContainer(attempt.lab.yamlSpec);

    await prisma.attempt.update({
      where: { id: req.params.id },
      data: {
        status: 'in_progress',
        score: 0,
        containerId,
        startedAt: new Date(),
        finishedAt: null
      }
    });

    // Clear task results
    await prisma.taskResult.deleteMany({
      where: { attemptId: req.params.id }
    });

    res.json({ message: 'Attempt reset successfully' });
  } catch (error) {
    console.error('Reset attempt error:', error);
    res.status(500).json({ error: 'Failed to reset attempt' });
  }
});

// Finish attempt and cleanup
router.post('/:id/finish', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const attempt = await prisma.attempt.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!
      }
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    // Clean up container
    if (attempt.containerId) {
      await cleanupContainer(attempt.containerId);
    }

    // Update attempt status
    await prisma.attempt.update({
      where: { id: req.params.id },
      data: {
        status: attempt.score >= attempt.maxScore * 0.7 ? 'passed' : 'failed',
        finishedAt: new Date(),
        containerId: null
      }
    });

    res.json({ message: 'Attempt finished successfully' });
  } catch (error) {
    console.error('Finish attempt error:', error);
    res.status(500).json({ error: 'Failed to finish attempt' });
  }
});

export default router;