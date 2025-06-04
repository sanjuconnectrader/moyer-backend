import fs from 'fs';
import path from 'path';
import PhotographyPhoto from '../models/PhotographyPhoto.js';

/* ───────── POST /api/photography ─────────
   body: photo (single file)
------------------------------------------ */
export const uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file)
      return res.status(422).json({ message: 'Photo file required.' });

    const row = await PhotographyPhoto.create({
      imageUrl: `/uploads/photography/${req.file.filename}`
    });

    res.status(201).json(row);
  } catch (err) { next(err); }
};

/* ───────── GET /api/photography ───────── */
export const getAllPhotos = async (_req, res, next) => {
  try {
    const list = await PhotographyPhoto.findAll({
      attributes: ['id', 'imageUrl'],
      order: [['createdAt', 'DESC']]
    });
    res.json(list);
  } catch (err) { next(err); }
};

/* ───────── DELETE /api/photography/:photoId ───────── */
export const deletePhoto = async (req, res, next) => {
  try {
    const photo = await PhotographyPhoto.findByPk(req.params.photoId);
    if (!photo)
      return res.status(404).json({ message: 'Photo not found.' });

    /* delete file from disk */
    fs.unlinkSync(path.resolve('.' + photo.imageUrl));

    /* delete DB row */
    await photo.destroy();

    res.json({ message: 'Photo deleted.' });
  } catch (err) { next(err); }
};
