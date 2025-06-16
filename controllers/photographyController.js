import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import PhotographyPhoto from '../models/PhotographyPhoto.js';

/* ───────── POST /api/photography ─────────
   body: photo (single file)
------------------------------------------ */
export const uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file)
      return res.status(422).json({ message: 'Photo file required.' });

    const originalPath = req.file.path;
    const compressedDir = path.resolve('uploads/photography');
    const compressedFilename = 'compressed-' + req.file.filename;
    const compressedPath = path.join(compressedDir, compressedFilename);

    const fileSizeInMB = req.file.size / (1024 * 1024);

    // Compress if file is larger than 5MB
    if (fileSizeInMB > 5) {
      await sharp(originalPath)
        .jpeg({ quality: 75 }) // adjust quality to compress
        .toFile(compressedPath);

      // Remove the original uncompressed file
      fs.unlinkSync(originalPath);
    } else {
      // Move original to compressed path without changing
      fs.renameSync(originalPath, compressedPath);
    }

    const row = await PhotographyPhoto.create({
      imageUrl: `/uploads/photography/${compressedFilename}`
    });

    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
};

/* ───────── GET /api/photography ───────── */
export const getAllPhotos = async (_req, res, next) => {
  try {
    const list = await PhotographyPhoto.findAll({
      attributes: ['id', 'imageUrl'],
      order: [['createdAt', 'DESC']]
    });
    res.json(list);
  } catch (err) {
    next(err);
  }
};

/* ───────── DELETE /api/photography/:photoId ───────── */
export const deletePhoto = async (req, res, next) => {
  try {
    const photo = await PhotographyPhoto.findByPk(req.params.photoId);
    if (!photo)
      return res.status(404).json({ message: 'Photo not found.' });

    // delete file from disk
    fs.unlinkSync(path.resolve('.' + photo.imageUrl));

    // delete DB row
    await photo.destroy();

    res.json({ message: 'Photo deleted.' });
  } catch (err) {
    next(err);
  }
};
