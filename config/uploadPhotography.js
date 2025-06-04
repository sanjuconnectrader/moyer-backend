import fs from 'fs';
import path from 'path';
import multer from 'multer';

const DIR = path.resolve('uploads/photography');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DIR),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext    = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const fileFilter = (_req, file, cb) => {
  const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  cb(null, ok.includes(file.mimetype));
};

export const uploadPhotography = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter
}).single('photo');               // field name = photo
