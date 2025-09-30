import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../../generated/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

export function setAuthCookie(res: Response, payload: { userId: string; role: string }) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie('auth');
}

export function readJwt(req: Request): { userId: string; role: string } | null {
  const token = req.cookies?.auth;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { userId: decoded.userId, role: decoded.role };
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = readJwt(req);
  if (!auth) return res.status(401).json({ ok: false, error: 'unauthorized' });
  req.userId = auth.userId;
  req.role = auth.role;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = readJwt(req);
  if (!auth) return res.status(401).json({ ok: false, error: 'unauthorized' });
  const prisma: PrismaClient = (req as any).prisma;
  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user || user.role !== 'admin') return res.status(403).json({ ok: false, error: 'forbidden' });
  req.userId = auth.userId;
  req.role = user.role;
  next();
}

export async function requireNdaAccepted(req: Request, res: Response, next: NextFunction) {
  const auth = readJwt(req);
  if (!auth) return res.status(401).json({ ok: false, error: 'unauthorized' });
  const prisma: PrismaClient = (req as any).prisma;
  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user || !user.ndaAcceptedAt) return res.status(403).json({ ok: false, error: 'nda_required' });
  req.userId = auth.userId;
  req.role = user.role;
  next();
}


