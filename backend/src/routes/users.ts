import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user statistics
    const stats = await prisma.$transaction([
      prisma.attempt.count({
        where: { userId: req.userId! }
      }),
      prisma.attempt.count({
        where: { userId: req.userId!, status: 'passed' }
      }),
      prisma.userBadge.count({
        where: { userId: req.userId! }
      })
    ]);

    res.json({
      ...user,
      stats: {
        totalAttempts: stats[0],
        passedAttempts: stats[1],
        badges: stats[2]
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get user badges
router.get('/me/badges', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: req.userId! },
      include: {
        badge: true
      },
      orderBy: { awardedAt: 'desc' }
    });

    res.json(userBadges);
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

export default router;