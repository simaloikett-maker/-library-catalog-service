const express = require('express');
const mongoose = require('mongoose');

const Book = require('../models/Book');
const Genre = require('../models/Genre');
const {
  createValidationError,
  validateGenre,
  validateGenreUpdate,
} = require('../middleware/validate');

const router = express.Router();

function buildSlug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureUniqueGenre(payload, currentId = null) {
  const fields = [];

  if (payload.name) {
    fields.push({ name: payload.name.trim() });
  }

  if (payload.slug) {
    fields.push({ slug: payload.slug.trim().toLowerCase() });
  }

  if (fields.length === 0) {
    return null;
  }

  const existing = await Genre.findOne({
    $and: [
      { $or: fields },
      ...(currentId ? [{ _id: { $ne: currentId } }] : []),
    ],
  });

  if (!existing) {
    return null;
  }

  const field = existing.name && existing.name === payload.name?.trim() ? 'name' : 'slug';
  return createValidationError(field, 'must be unique');
}

router.get('/', async (req, res, next) => {
  try {
    const genres = await Genre.find({}).sort({ createdAt: -1 });
    return res.status(200).json(genres);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createValidationError('id', 'must be a valid ObjectId'));
    }

    const genre = await Genre.findById(id);
    if (!genre) {
      return res.status(404).json({ error: 'Genre not found' });
    }

    return res.status(200).json(genre);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      name: req.body.name,
      slug: req.body.slug || buildSlug(req.body.name),
    };

    const validationError = validateGenre(payload);
    if (validationError) {
      return next(validationError);
    }

    const duplicateError = await ensureUniqueGenre(payload);
    if (duplicateError) {
      return next(duplicateError);
    }

    const genre = await Genre.create(payload);
    return res.status(201).json(genre);
  } catch (error) {
    if (error && error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({ error: `${field} must be unique` });
    }
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createValidationError('id', 'must be a valid ObjectId'));
    }

    const validationError = validateGenreUpdate(req.body);
    if (validationError) {
      return next(validationError);
    }

    const payload = { ...req.body };
    if (payload.name) {
      payload.name = payload.name.trim();
      if (!payload.slug) {
        payload.slug = buildSlug(payload.name);
      }
    }

    if (payload.slug) {
      payload.slug = payload.slug.trim().toLowerCase();
    }

    const duplicateError = await ensureUniqueGenre(payload, id);
    if (duplicateError) {
      return next(duplicateError);
    }

    const genre = await Genre.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!genre) {
      return res.status(404).json({ error: 'Genre not found' });
    }

    return res.status(200).json(genre);
  } catch (error) {
    if (error && error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({ error: `${field} must be unique` });
    }
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createValidationError('id', 'must be a valid ObjectId'));
    }

    const relatedBooks = await Book.countDocuments({ genre: id });
    if (relatedBooks > 0) {
      return res.status(400).json({
        error: 'Genre cannot be deleted because it is referenced by existing books.',
      });
    }

    const genre = await Genre.findByIdAndDelete(id);
    if (!genre) {
      return res.status(404).json({ error: 'Genre not found' });
    }

    return res.status(200).json({ message: 'Genre deleted successfully', id: genre._id });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
