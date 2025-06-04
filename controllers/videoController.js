import { validationResult } from 'express-validator';
import VideoLink from '../models/VideoLink.js';

/* ───────── POST /api/videos ─────────
   body: { title, videoUrl }
------------------------------------- */
export const uploadVideoLink = async (req, res, next) => {
  try {
    /* field-level validation results */
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });

    const { title, videoUrl } = req.body;

    const row = await VideoLink.create({ title, videoUrl });
    res.status(201).json(row);
  } catch (err) { next(err); }
};

/* ───────── GET /api/videos ───────── */
export const getAllVideoLinks = async (_req, res, next) => {
  try {
    const list = await VideoLink.findAll({
      attributes: ['id', 'title', 'videoUrl'],
      order: [['createdAt', 'DESC']]
    });
    res.json(list);
  } catch (err) { next(err); }
};

/* ───────── DELETE /api/videos/:id ───────── */
export const deleteVideoLink = async (req, res, next) => {
  try {
    const row = await VideoLink.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Video link not found.' });

    await row.destroy();
    res.json({ message: 'Video link deleted.' });
  } catch (err) { next(err); }
};
