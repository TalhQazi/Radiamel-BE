import { Router } from 'express';
import { requireNdaAccepted } from '../utils/auth';

const router = Router();

router.get('/positioning', requireNdaAccepted, async (_req, res) => {
  // Placeholder: serve content only when NDA accepted
  res.type('text/plain').send('Investor positioning content placeholder');
});

router.get('/signed-url', requireNdaAccepted, async (_req, res) => {
  // Placeholder for S3/GCS signed URL issuance
  return res.json({ ok: true, url: null });
});

export default router;


