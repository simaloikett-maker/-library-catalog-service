const mongoose = require('mongoose');
const Genre = require('../models/Genre');

function createValidationError(field, message) {
  const error = new Error(`${field} ${message}`);
  error.status = 400;
  error.field = field;
  return error;
}

function validateStringField(payload, field, { required = true } = {}) {
  if (!Object.prototype.hasOwnProperty.call(payload, field)) {
    if (required) {
      return createValidationError(field, 'is required');
    }
    return null;
  }

  const value = payload[field];
  if (typeof value !== 'string' || value.trim() === '') {
    return createValidationError(field, 'must be a non-empty string');
  }

  return null;
}

function validateBook(payload, options = {}) {
  const { partial = false } = options;

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return createValidationError('body', 'must be an object');
  }

  if (Object.keys(payload).length === 0) {
    return createValidationError('body', 'must not be empty');
  }

  const requiredStringFields = ['title', 'author', 'isbn', 'description', 'coverImage'];
  for (const field of requiredStringFields) {
    if (partial && !Object.prototype.hasOwnProperty.call(payload, field)) {
      continue;
    }

    const error = validateStringField(payload, field, { required: !partial || Object.prototype.hasOwnProperty.call(payload, field) });
    if (error) {
      return error;
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'totalCopies')) {
    const value = payload.totalCopies;
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
      return createValidationError('totalCopies', 'must be a non-negative integer');
    }
  } else if (!partial) {
    return createValidationError('totalCopies', 'is required');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'availableCopies')) {
    const value = payload.availableCopies;
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
      return createValidationError('availableCopies', 'must be a non-negative integer');
    }
  } else if (!partial) {
    return createValidationError('availableCopies', 'is required');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'totalCopies') && Object.prototype.hasOwnProperty.call(payload, 'availableCopies')) {
    if (payload.availableCopies > payload.totalCopies) {
      return createValidationError('availableCopies', 'cannot exceed totalCopies');
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'genre')) {
    if (typeof payload.genre !== 'string' || !mongoose.Types.ObjectId.isValid(payload.genre)) {
      return createValidationError('genre', 'must be a valid ObjectId');
    }
  } else if (!partial) {
    return createValidationError('genre', 'is required');
  }

  return null;
}

function validateGenre(payload, options = {}) {
  const { partial = false } = options;

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return createValidationError('body', 'must be an object');
  }

  if (Object.keys(payload).length === 0) {
    return createValidationError('body', 'must not be empty');
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'name')) {
    const error = validateStringField(payload, 'name', { required: true });
    if (error) {
      return error;
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'slug')) {
    const slugValue = payload.slug;
    if (typeof slugValue !== 'string' || slugValue.trim() === '') {
      return createValidationError('slug', 'must be a non-empty string');
    }
    const normalizedSlug = slugValue.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
      return createValidationError('slug', 'must contain only lowercase letters, numbers, and hyphens');
    }
  }

  return null;
}

async function ensureGenreExists(genreId) {
  if (!mongoose.Types.ObjectId.isValid(genreId)) {
    return createValidationError('genre', 'must be a valid ObjectId');
  }

  const genre = await Genre.findById(genreId);
  if (!genre) {
    return createValidationError('genre', 'does not exist');
  }

  return null;
}

module.exports = {
  createValidationError,
  validateBook,
  validateBookUpdate: (payload) => validateBook(payload, { partial: true }),
  validateGenre,
  validateGenreUpdate: (payload) => validateGenre(payload, { partial: true }),
  ensureGenreExists,
};
