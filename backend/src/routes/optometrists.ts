import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { z } from 'zod';

const router = express.Router();

const optometristSchema = z.object({
  name: z.string().min(1),
  licenseNumber: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

// Get all optometrists
router.get('/', async (req: Request, res: Response) => {
  try {
    const optometrists = await prisma.optometrist.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ optometrists });
  } catch (error) {
    console.error('Get optometrists error:', error);
    res.status(500).json({ error: 'Failed to get optometrists' });
  }
});

// Get optometrist by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid optometrist ID' });
    }

    const optometrist = await prisma.optometrist.findUnique({
      where: { id },
    });

    if (!optometrist) {
      return res.status(404).json({ error: 'Optometrist not found' });
    }

    res.json({ optometrist });
  } catch (error) {
    console.error('Get optometrist error:', error);
    res.status(500).json({ error: 'Failed to get optometrist' });
  }
});

// Create optometrist
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = optometristSchema.parse(req.body);
    const optometrist = await prisma.optometrist.create({ data });
    res.status(201).json({ optometrist });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create optometrist error:', error);
    res.status(500).json({ error: 'Failed to create optometrist' });
  }
});

// Update optometrist
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid optometrist ID' });
    }

    const data = optometristSchema.partial().parse(req.body);
    const optometrist = await prisma.optometrist.update({
      where: { id },
      data,
    });
    res.json({ optometrist });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update optometrist error:', error);
    res.status(500).json({ error: 'Failed to update optometrist' });
  }
});

// Delete optometrist
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid optometrist ID' });
    }

    await prisma.optometrist.delete({ where: { id } });
    res.json({ message: 'Optometrist deleted successfully' });
  } catch (error) {
    console.error('Delete optometrist error:', error);
    res.status(500).json({ error: 'Failed to delete optometrist' });
  }
});

export default router;

