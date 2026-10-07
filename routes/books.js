const express = require('express');
const mongoose = require('mongoose');

const Book = require('../models/Book');
const { validateBook, validateBookUpdate, ensureGenreExists, createValidationError } = require('../middleware/validate');

const router = express.Router();

function parsePositiveInteger(value, fallback, maxValue = 100) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, maxValue);
}

router.get('/', async (req, res, next) => {
  try {
    const { genre, search = '', page = 1, limit = 10 } = req.query;
    const filter = {};

    if (genre) {
      if (!mongoose.Types.ObjectId.isValid(genre)) {
        return next(createValidationError('genre', 'must be a valid ObjectId'));
      }
      filter.genre = genre;
    }

    const trimmedSearch = String(search).trim();
    if (trimmedSearch) {
      filter.$or = [
        { title: { $regex: trimmedSearch, $options: 'i' } },
        { author: { $regex: trimmedSearch, $options: 'i' } },
      ];
    }

    const pageNumber = parsePositiveInteger(page, 1, 1000);
    const pageLimit = parsePositiveInteger(limit, 10, 100);
    const skip = (pageNumber - 1) * pageLimit;

    const [books, total] = await Promise.all([
      Book.find(filter).populate('genre', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(pageLimit),
      Book.countDocuments(filter),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageLimit);

    return res.status(200).json({
      data: books,
      pagination: {
        page: pageNumber,
        limit: pageLimit,
        total,
        totalPages,
      },
    });
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

    const book = await Book.findById(id).populate('genre', 'name slug');
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    return res.status(200).json(book);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const validationError = validateBook(req.body);
    if (validationError) {
      return next(validationError);
    }

    const genreError = await ensureGenreExists(req.body.genre);
    if (genreError) {
      return next(genreError);
    }

    const book = await Book.create(req.body);
    return res.status(201).json(book);
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

    const validationError = validateBookUpdate(req.body);
    if (validationError) {
      return next(validationError);
    }

    if (req.body.genre) {
      const genreError = await ensureGenreExists(req.body.genre);
      if (genreError) {
        return next(genreError);
      }
    }

    const book = await Book.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate('genre', 'name slug');

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    return res.status(200).json(book);
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

    const book = await Book.findByIdAndDelete(id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    return res.status(200).json({ message: 'Book deleted successfully', id: book._id });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
