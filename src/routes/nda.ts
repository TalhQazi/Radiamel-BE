import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../utils/auth';
import { PrismaClient } from '../../generated/prisma';

const router = Router();

const acceptSchema = z.object({ accepted: z.boolean() });

router.post('/accept', requireAuth, async (req, res) => {
  const parse = acceptSchema.safeParse(req.body);
  if (!parse.success || !parse.data.accepted) return res.status(400).json({ ok: false, error: 'invalid_body' });
  const prisma: PrismaClient = (req as any).prisma;
  await prisma.user.update({ where: { id: req.userId! }, data: { ndaAcceptedAt: new Date() } });
  return res.json({ ok: true });
});

export default router;


