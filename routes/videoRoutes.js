import { Router } from 'express';
import { body } from 'express-validator';

import {
  uploadVideoLink,
  deleteVideoLink,
  getAllVideoLinks
} from '../controllers/videoController.js';

import { authorizeAdmin } from '../middleware/auth.js';

const router = Router();

/* public */
router.get('/', getAllVideoLinks);

/* admin */
router.post(
  '/',
  authorizeAdmin,
  [
    body('title').trim().isLength({ min: 2, max: 120 }),
    body('videoUrl').isURL()
  ],
  uploadVideoLink
);

router.delete('/:id', authorizeAdmin, deleteVideoLink);

export default router;
