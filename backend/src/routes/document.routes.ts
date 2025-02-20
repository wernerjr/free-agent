import { Router } from 'express';
import multer from 'multer';
import { DocumentController } from '../controllers/document.controller';
import { requireApiKey } from '../middlewares/auth.middleware';

const router = Router();
const controller = DocumentController.getInstance();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    try {
      // Use the original file name from the form data if available
      const originalFileName = req.body.originalFileName;
      if (originalFileName) {
        file.originalname = originalFileName;
      }
      cb(null, true);
    } catch (error) {
      cb(null, false);
    }
  }
});

router.get('/', controller.getAllDocuments);
router.post('/upload', requireApiKey, upload.single('file'), controller.uploadDocument);
router.delete('/:id', controller.deleteDocument);

export default router; 