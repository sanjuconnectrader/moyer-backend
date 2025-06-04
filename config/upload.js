import fs from 'fs';
import path from 'path';
import multer from 'multer';

const ROOT = path.resolve('uploads/restaurants');
if (!fs.existsSync(ROOT)) fs.mkdirSync(ROOT, { recursive: true });

/* Same storage logic for cover + gallery photos */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ROOT),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (_req, file, cb) => {
  const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  cb(null, ok.includes(file.mimetype));
};

export const uploadCover = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter
}).single('cover');                // field name for cover image

export const uploadGallery = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter
}).array('photos', 10);            // up to 10 photos at once
