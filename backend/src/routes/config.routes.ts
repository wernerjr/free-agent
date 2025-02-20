import { Router } from 'express';
import { ConfigController } from '../controllers/config.controller';

const router = Router();
const controller = ConfigController.getInstance();

router.get('/api-key', controller.getApiKey);
router.post('/api-key', controller.setApiKey);
router.get('/models', controller.getModels);
router.post('/model', controller.setModel);

export default router; 