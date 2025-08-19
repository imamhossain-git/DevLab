import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import yaml from 'js-yaml';

const router = Router();
const prisma = new PrismaClient();

// Get all labs with filtering
router.get('/', async (req, res) => {
  try {
    const { topic, level, search } = req.query;
    
    const where: any = { isPublished: true };
    
    if (topic) where.topic = topic;
    if (level) where.level = level;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { summary: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const labs = await prisma.lab.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        topic: true,
        level: true,
        durationMins: true,
        summary: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(labs);
  } catch (error) {
    console.error('Get labs error:', error);
    res.status(500).json({ error: 'Failed to fetch labs' });
  }
});

// Get lab by slug
router.get('/:slug', async (req, res) => {
  try {
    const lab = await prisma.lab.findUnique({
      where: { slug: req.params.slug },
      include: {
        createdBy: {
          select: { email: true }
        }
      }
    });

    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    // Parse YAML spec
    try {
      const yamlData = yaml.load(lab.yamlSpec) as any;
      res.json({
        ...lab,
        yamlData
      });
    } catch (yamlError) {
      res.json(lab);
    }
  } catch (error) {
    console.error('Get lab error:', error);
    res.status(500).json({ error: 'Failed to fetch lab' });
  }
});

// Create lab (admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { slug, title, topic, level, durationMins, summary, markdownIntro, yamlSpec } = req.body;

    // Validate YAML
    try {
      yaml.load(yamlSpec);
    } catch (yamlError) {
      return res.status(400).json({ error: 'Invalid YAML format' });
    }

    const existingLab = await prisma.lab.findUnique({ where: { slug } });
    if (existingLab) {
      return res.status(400).json({ error: 'Lab with this slug already exists' });
    }

    const lab = await prisma.lab.create({
      data: {
        slug,
        title,
        topic,
        level,
        durationMins,
        summary,
        markdownIntro,
        yamlSpec,
        createdById: req.userId!
      }
    });

    res.status(201).json(lab);
  } catch (error) {
    console.error('Create lab error:', error);
    res.status(500).json({ error: 'Failed to create lab' });
  }
});

// Update lab (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { title, topic, level, durationMins, summary, markdownIntro, yamlSpec, isPublished } = req.body;

    // Validate YAML if provided
    if (yamlSpec) {
      try {
        yaml.load(yamlSpec);
      } catch (yamlError) {
        return res.status(400).json({ error: 'Invalid YAML format' });
      }
    }

    const lab = await prisma.lab.update({
      where: { id: req.params.id },
      data: {
        title,
        topic,
        level,
        durationMins,
        summary,
        markdownIntro,
        yamlSpec,
        isPublished
      }
    });

    res.json(lab);
  } catch (error) {
    console.error('Update lab error:', error);
    res.status(500).json({ error: 'Failed to update lab' });
  }
});

export default router;