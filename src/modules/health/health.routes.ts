import { Router } from 'express';
import { HealthController } from './health.controller';

const router = Router();
const healthController = new HealthController();

router.get('/health', (req, res) => healthController.check(req, res));
router.get('/health/readiness', (req, res) => healthController.readiness(req, res));

export default router;
