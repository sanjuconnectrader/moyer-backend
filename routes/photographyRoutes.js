import { Router } from 'express';
import {
  uploadPhoto,
  deletePhoto,
  getAllPhotos
} from '../controllers/photographyController.js';

import { authorizeAdmin }     from '../middleware/auth.js';
import { uploadPhotography }  from '../config/uploadPhotography.js';

const router = Router();

/* public */
router.get('/', getAllPhotos);

/* admin */
router.post('/',  authorizeAdmin, uploadPhotography, uploadPhoto);
router.delete('/:photoId', authorizeAdmin, deletePhoto);

export default router;
