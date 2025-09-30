import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '../generated/prisma';
import authRouter from './routes/auth';
import ndaRouter from './routes/nda';
import investorRouter from './routes/investor';
import adminRouter from './routes/admin';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      role?: string;
    }
  }
}

const app = express();
const prisma = new PrismaClient();

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

app.set('trust proxy', 1);

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

const limiter = rateLimit({ windowMs: 60_000, max: 100 });
app.use('/auth', limiter);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use((req, _res, next) => {
  (req as any).prisma = prisma;
  next();
});

app.use('/auth', authRouter);
app.use('/nda', ndaRouter);
app.use('/investor', investorRouter);
app.use('/admin', adminRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on :${port}`);
});


