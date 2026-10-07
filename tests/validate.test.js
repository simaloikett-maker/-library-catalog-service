const test = require('node:test');
const assert = require('node:assert/strict');
const { validateBook, validateGenre } = require('../middleware/validate');

const makeBookBody = () => ({
  title: 'Dune',
  author: 'Frank Herbert',
  isbn: '9780441013593',
  description: 'A classic science fiction novel.',
  coverImage: 'https://example.com/dune.jpg',
  totalCopies: 3,
  availableCopies: 2,
  genre: '64dbd5d4d5d7a1b2a3c4d5e6',
});

test('validateBook rejects missing title', () => {
  const body = makeBookBody();
  delete body.title;

  const err = validateBook(body);
  assert.equal(err.status, 400);
  assert.match(err.message, /title/i);
});

test('validateBook rejects non-integer totalCopies', () => {
  const body = makeBookBody();
  body.totalCopies = 2.5;

  const err = validateBook(body);
  assert.equal(err.status, 400);
  assert.match(err.message, /totalCopies/i);
});

test('validateGenre rejects empty name', () => {
  const err = validateGenre({ name: '   ' });
  assert.equal(err.status, 400);
  assert.match(err.message, /name/i);
});
