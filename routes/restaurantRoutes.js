// routes/restaurantRoutes.js
import { Router } from 'express';
import multer from 'multer';

/* ─── Controllers ─── */
import {
  /* public */
  getAllRestaurants,
  getRestaurant,
  getGalleryPhotos,

  /* create / update */
  createRestaurant,
  updateRestaurant,

  /* gallery ops */
  addGalleryPhotos,
  updateGalleryPhoto,
  deleteGalleryPhoto,
  deleteRestaurant
} from '../controllers/restaurantController.js';

/* ─── Middleware ─── */
import { authorizeAdmin }            from '../middleware/auth.js';
import { uploadCover, uploadGallery } from '../config/upload.js';

/* -----------------------------------------------------------
   Need a single-file uploader for PUT /:id/photos/:photoId
   (field name “photo”).  If your config already exports one,
   delete the block below and `import { uploadSinglePhoto }`
------------------------------------------------------------ */
const uploadSinglePhoto = multer({
  storage: uploadGallery.storage,        // re-use gallery settings
  limits: uploadGallery.limits,
  fileFilter: uploadGallery.fileFilter
}).single('photo');

const router = Router();

/* ───────────────────────────────
   Public endpoints
──────────────────────────────── */
router.get('/getall-restaurant', getAllRestaurants);      // list all
router.get('/:id',                 getRestaurant);        // one + photos
router.get('/:slug/photos',          getGalleryPhotos);     // gallery only

/* ───────────────────────────────
   Admin-only endpoints
──────────────────────────────── */
router.post(                       // create restaurant
  '/',
  authorizeAdmin,
  uploadCover,                     // field “cover”
  createRestaurant
);

router.put(                        // update name / cover
  '/:id',
  authorizeAdmin,
  uploadCover,                     // field “cover”
  updateRestaurant
);

router.post(                       // add many gallery photos
  '/:id/photos',
  authorizeAdmin,
  uploadGallery,                   // field “photos[]”
  addGalleryPhotos
);

router.put(                        // replace one gallery image
  '/:id/photos/:photoId',
  authorizeAdmin,
  uploadSinglePhoto,               // field “photo”
  updateGalleryPhoto
);

router.delete(                     // delete one gallery image
  '/:id/photos/:photoId',
  authorizeAdmin,
  deleteGalleryPhoto
);

router.delete(                     // ⬅ new route
  '/:id',                          // delete restaurant + all images
  authorizeAdmin,
  deleteRestaurant
);

export default router;
