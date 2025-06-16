import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import slugify from 'slugify';
import Restaurant from '../models/Restaurant.js';
import RestaurantPhoto from '../models/RestaurantPhoto.js';

// Helper function to compress image
const compressImageIfNeeded = async (inputPath, outputPath) => {
  const { size } = fs.statSync(inputPath);
  const sizeMB = size / (1024 * 1024);

  if (sizeMB > 5) {
    await sharp(inputPath)
      .jpeg({ quality: 75 }) // Adjust as needed
      .toFile(outputPath);
    fs.unlinkSync(inputPath); // remove original
  } else {
    fs.renameSync(inputPath, outputPath); // just move without compression
  }
};

/* ───────── CREATE ───────── */
export const createRestaurant = async (req, res, next) => {
  try {
    if (!req.file) return res.status(422).json({ message: 'Cover photo required.' });

    const { name } = req.body;
    if (!name) return res.status(422).json({ message: 'Name is required.' });

    const slug = slugify(name, { lower: true, strict: true });
    if (await Restaurant.findOne({ where: { slug } }))
      return res.status(409).json({ message: 'Restaurant already exists.' });

    const dir = path.resolve('uploads/restaurants');
    const compressedName = `compressed-${req.file.filename}`;
    const compressedPath = path.join(dir, compressedName);
    await compressImageIfNeeded(req.file.path, compressedPath);

    const restaurant = await Restaurant.create({
      name,
      slug,
      coverImage: `/uploads/restaurants/${compressedName}`
    });

    res.status(201).json(restaurant);
  } catch (err) { next(err); }
};

/* ───────── UPDATE ───────── */
export const updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Not found.' });

    const updates = {};
    if (req.body.name) {
      updates.name = req.body.name;
      updates.slug = slugify(req.body.name, { lower: true, strict: true });
    }

    if (req.file) {
      try { fs.unlinkSync(path.resolve('.' + restaurant.coverImage)); } catch {}

      const dir = path.resolve('uploads/restaurants');
      const compressedName = `compressed-${req.file.filename}`;
      const compressedPath = path.join(dir, compressedName);
      await compressImageIfNeeded(req.file.path, compressedPath);

      updates.coverImage = `/uploads/restaurants/${compressedName}`;
    }

    await restaurant.update(updates);
    res.json(restaurant);
  } catch (err) { next(err); }
};

/* ───────── DELETE ───────── */
export const deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id, {
      include: [{ model: RestaurantPhoto, as: 'photos' }]
    });
    if (!restaurant) return res.status(404).json({ message: 'Not found.' });

    try { fs.unlinkSync(path.resolve('.' + restaurant.coverImage)); } catch {}

    for (const p of restaurant.photos) {
      try { fs.unlinkSync(path.resolve('.' + p.imageUrl)); } catch {}
    }

    await RestaurantPhoto.destroy({ where: { restaurantId: restaurant.id } });
    await restaurant.destroy();

    res.json({ message: 'Restaurant and all images deleted.' });
  } catch (err) { next(err); }
};

/* ───────── ADD GALLERY PHOTOS ───────── */
export const addGalleryPhotos = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Not found.' });

    if (!req.files?.length)
      return res.status(422).json({ message: 'No photos uploaded.' });

    const dir = path.resolve('uploads/restaurants');
    const rows = [];

    for (const file of req.files) {
      const compressedName = `compressed-${file.filename}`;
      const compressedPath = path.join(dir, compressedName);
      await compressImageIfNeeded(file.path, compressedPath);

      rows.push({
        restaurantId: restaurant.id,
        imageUrl: `/uploads/restaurants/${compressedName}`
      });
    }

    const photos = await RestaurantPhoto.bulkCreate(rows, { returning: true });

    res.status(201).json({
      restaurant: { id: restaurant.id, name: restaurant.name, slug: restaurant.slug },
      photos
    });
  } catch (err) { next(err); }
};

/* ───────── GET ALL ───────── */
export const getAllRestaurants = async (_req, res, next) => {
  try {
    const list = await Restaurant.findAll({
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'slug', 'coverImage']
    });
    res.json(list);
  } catch (err) { next(err); }
};

/* ───────── GET ONE ───────── */
export const getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id, {
      include: [{ model: RestaurantPhoto, as: 'photos', attributes: ['id', 'imageUrl'] }]
    });
    if (!restaurant) return res.status(404).json({ message: 'Not found.' });
    res.json(restaurant);
  } catch (err) { next(err); }
};

/* ───────── GET PHOTOS BY SLUG ───────── */
export const getGalleryPhotos = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({
      where: { slug: req.params.slug },
      attributes: ['id']
    });
    if (!restaurant)
      return res.status(404).json({ message: 'Restaurant not found.' });

    const photos = await RestaurantPhoto.findAll({
      where: { restaurantId: restaurant.id },
      attributes: ['id', 'imageUrl'],
      order: [['createdAt', 'DESC']]
    });
    res.json(photos);
  } catch (err) { next(err); }
};

/* ───────── UPDATE GALLERY PHOTO ───────── */
export const updateGalleryPhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(422).json({ message: 'Photo file required.' });

    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found.' });

    const photo = await RestaurantPhoto.findByPk(req.params.photoId);
    if (!photo || photo.restaurantId !== restaurant.id)
      return res.status(404).json({ message: 'Photo not found for this restaurant.' });

    try { fs.unlinkSync(path.resolve('.' + photo.imageUrl)); } catch {}

    const dir = path.resolve('uploads/restaurants');
    const compressedName = `compressed-${req.file.filename}`;
    const compressedPath = path.join(dir, compressedName);
    await compressImageIfNeeded(req.file.path, compressedPath);

    await photo.update({ imageUrl: `/uploads/restaurants/${compressedName}` });
    res.json(photo);
  } catch (err) { next(err); }
};

/* ───────── DELETE GALLERY PHOTO ───────── */
export const deleteGalleryPhoto = async (req, res, next) => {
  try {
    const { id, photoId } = req.params;

    const photo = await RestaurantPhoto.findByPk(photoId);
    if (!photo || photo.restaurantId !== Number(id))
      return res.status(404).json({ message: 'Photo not found for this restaurant.' });

    try { fs.unlinkSync(path.resolve('.' + photo.imageUrl)); } catch {}
    await photo.destroy();

    res.json({ message: 'Photo deleted.' });
  } catch (err) { next(err); }
};
