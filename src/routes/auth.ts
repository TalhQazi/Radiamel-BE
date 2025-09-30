import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { PrismaClient } from '../../generated/prisma';
import { setAuthCookie, clearAuthCookie, readJwt } from '../utils/auth';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

router.post('/register', async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ ok: false, error: 'invalid_body' });
  const { email, password, name } = parse.data;
  const prisma: PrismaClient = (req as any).prisma;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ ok: false, error: 'email_exists' });
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { email, name, passwordHash } });
  return res.status(201).json({ ok: true });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string() });

router.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ ok: false, error: 'invalid_body' });
  const { email, password } = parse.data;
  const prisma: PrismaClient = (req as any).prisma;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ ok: false, error: 'invalid_credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ ok: false, error: 'invalid_credentials' });
  setAuthCookie(res, { userId: user.id, role: user.role });
  return res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  const auth = readJwt(req);
  if (!auth) return res.status(401).json({ ok: false, error: 'unauthorized' });
  const prisma: PrismaClient = (req as any).prisma;
  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user) return res.status(401).json({ ok: false, error: 'unauthorized' });
  return res.json({ id: user.id, email: user.email, name: user.name, role: user.role, ndaAccepted: !!user.ndaAcceptedAt });
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

export default router;


