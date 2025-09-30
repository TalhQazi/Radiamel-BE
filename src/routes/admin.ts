import { Router } from 'express';
import { requireAdmin } from '../utils/auth';
import { Prisma, PrismaClient } from '../../generated/prisma';

const router = Router();

router.get('/users', requireAdmin, async (req, res) => {
  const prisma: PrismaClient = (req as any).prisma;
  const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 100);
  const cursor = (req.query.cursor as string) || undefined;

  const items = await prisma.user.findMany({
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      ndaAcceptedAt: true,
      isAccredited: true,
    },
  });

  let nextCursor: string | undefined = undefined;
  if (items.length > limit) {
    const next = items.pop()!;
    nextCursor = next.id;
  }

  const mapped = items.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    createdAt: u.createdAt,
    ndaAccepted: !!u.ndaAcceptedAt,
    isAccredited: u.isAccredited,
  }));

  res.json({ items: mapped, nextCursor });
});

router.get('/export/users.csv', requireAdmin, async (req, res) => {
  const prisma: PrismaClient = (req as any).prisma;
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      ndaAcceptedAt: true,
      isAccredited: true,
    },
  });
  res.type('text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
  res.write('id,email,name,createdAt,ndaAccepted,isAccredited\n');
  for (const u of users) {
    const line = `${u.id},${u.email},${u.name ?? ''},${u.createdAt.toISOString()},${u.ndaAcceptedAt ? 'true' : 'false'},${u.isAccredited ? 'true' : 'false'}\n`;
    res.write(line);
  }
  res.end();
});

export default router;


