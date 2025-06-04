import fs from 'fs';
import path from 'path';
import slugify from 'slugify';
import Restaurant from '../models/Restaurant.js';
import RestaurantPhoto from '../models/RestaurantPhoto.js';

/* ─────────────────────────────────────────
   POST /api/restaurants      (create)
───────────────────────────────────────── */
export const createRestaurant = async (req, res, next) => {
  try {
    if (!req.file) return res.status(422).json({ message: 'Cover photo required.' });
    const { name } = req.body;
    if (!name) return res.status(422).json({ message: 'Name is required.' });

    const slug = slugify(name, { lower: true, strict: true });
    if (await Restaurant.findOne({ where: { slug } }))
      return res.status(409).json({ message: 'Restaurant already exists.' });

    const restaurant = await Restaurant.create({
      name,
      slug,
      coverImage: `/uploads/restaurants/${req.file.filename}`
    });

    res.status(201).json(restaurant);
  } catch (err) { next(err); }
};

/* ─────────────────────────────────────────
   PUT /api/restaurants/:id    (update)
───────────────────────────────────────── */
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
      fs.unlinkSync(path.resolve('.' + restaurant.coverImage));
      updates.coverImage = `/uploads/restaurants/${req.file.filename}`;
    }

    await restaurant.update(updates);
    res.json(restaurant);
  } catch (err) { next(err); }
};

/* ─────────────────────────────────────────
   DELETE /api/restaurants/:id   (full delete)
───────────────────────────────────────── */
export const deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id, {
      include: [{ model: RestaurantPhoto, as: 'photos' }]
    });
    if (!restaurant) return res.status(404).json({ message: 'Not found.' });

    /* 1️⃣  Remove cover image */
    try { fs.unlinkSync(path.resolve('.' + restaurant.coverImage)); } catch {}

    /* 2️⃣  Remove gallery files */
    for (const p of restaurant.photos) {
      try { fs.unlinkSync(path.resolve('.' + p.imageUrl)); } catch {}
    }

    /* 3️⃣  Delete DB rows (cascade not guaranteed on MySQL) */
    await RestaurantPhoto.destroy({ where: { restaurantId: restaurant.id } });
    await restaurant.destroy();

    res.json({ message: 'Restaurant and all images deleted.' });
  } catch (err) { next(err); }
};

/* ─────────────────────────────────────────
   POST /api/restaurants/:id/photos   (bulk add)
───────────────────────────────────────── */
export const addGalleryPhotos = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Not found.' });

    if (!req.files?.length)
      return res.status(422).json({ message: 'No photos uploaded.' });

    const rows = req.files.map((f) => ({
      restaurantId: restaurant.id,
      imageUrl: `/uploads/restaurants/${f.filename}`
    }));

    const photos = await RestaurantPhoto.bulkCreate(rows, { returning: true });

    res.status(201).json({
      restaurant: { id: restaurant.id, name: restaurant.name, slug: restaurant.slug },
      photos
    });
  } catch (err) { next(err); }
};

/* ─────────────────────────────────────────
   GET /api/restaurants           (list)
───────────────────────────────────────── */
export const getAllRestaurants = async (_req, res, next) => {
  try {
    const list = await Restaurant.findAll({
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'slug', 'coverImage']
    });
    res.json(list);
  } catch (err) { next(err); }
};

/* ─────────────────────────────────────────
   GET /api/restaurants/:id        (single)
───────────────────────────────────────── */
export const getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id, {
      include: [{ model: RestaurantPhoto, as: 'photos', attributes: ['id', 'imageUrl'] }]
    });
    if (!restaurant) return res.status(404).json({ message: 'Not found.' });
    res.json(restaurant);
  } catch (err) { next(err); }
};

/* ─────────────────────────────────────────
   GET /api/restaurants/:slug/photos
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   PUT /api/restaurants/:id/photos/:photoId
───────────────────────────────────────── */
export const updateGalleryPhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(422).json({ message: 'Photo file required.' });

    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found.' });

    const photo = await RestaurantPhoto.findByPk(req.params.photoId);
    if (!photo || photo.restaurantId !== restaurant.id)
      return res.status(404).json({ message: 'Photo not found for this restaurant.' });

    fs.unlinkSync(path.resolve('.' + photo.imageUrl));
    await photo.update({ imageUrl: `/uploads/restaurants/${req.file.filename}` });

    res.json(photo);
  } catch (err) { next(err); }
};

/* ─────────────────────────────────────────
   DELETE /api/restaurants/:id/photos/:photoId
───────────────────────────────────────── */
export const deleteGalleryPhoto = async (req, res, next) => {
  try {
    const { id, photoId } = req.params;

    const photo = await RestaurantPhoto.findByPk(photoId);
    if (!photo || photo.restaurantId !== Number(id))
      return res.status(404).json({ message: 'Photo not found for this restaurant.' });

    fs.unlinkSync(path.resolve('.' + photo.imageUrl));
    await photo.destroy();

    res.json({ message: 'Photo deleted.' });
  } catch (err) { next(err); }
};
