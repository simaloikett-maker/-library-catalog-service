const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const booksRouter = require('./routes/books');
const genresRouter = require('./routes/genres');

const app = express();

async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    return;
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);
}

app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/books', booksRouter);
app.use('/genres', genresRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error && error.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${error.path || 'field'}` });
  }

  if (error && error.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join('; ');
    return res.status(400).json({ error: message || 'Validation failed' });
  }

  const statusCode = error && error.status ? error.status : 500;
  const message = error && error.message ? error.message : 'Internal server error';

  return res.status(statusCode).json({ error: message });
});

module.exports = { app, connectDatabase };
