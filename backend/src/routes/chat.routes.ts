import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { requireApiKey } from '../middlewares/auth.middleware';

const router = Router();
const controller = ChatController.getInstance();

router.get('/chat', requireApiKey, controller.processMessage);
router.get('/', controller.getAllChats);
router.post('/', controller.createChat);
router.get('/:id', controller.getChatById);
router.put('/:id/title', controller.updateChatTitle);
router.delete('/:id', controller.deleteChat);

export default router; 