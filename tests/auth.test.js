const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { app } = require('../app');
const User = require('../models/User');
const { requireRole } = require('../middleware/auth');

test('User defaults to patron and restricts roles to patron or librarian', () => {
  const user = new User({
    username: 'reader',
    email: 'reader@example.com',
    password: 'a-password',
  });

  assert.equal(user.role, 'patron');
  assert.deepEqual(User.schema.path('role').enumValues, ['patron', 'librarian']);
  assert.equal(User.schema.path('password').options.select, false);
});

test('requireRole rejects a patron with 403', () => {
  let statusCode;
  let responseBody;
  let nextCalled = false;
  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  requireRole('librarian')(
    { user: { role: 'patron' } },
    response,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(statusCode, 403);
  assert.deepEqual(responseBody, { error: 'Forbidden: insufficient role' });
  assert.equal(nextCalled, false);
});

test('requireRole allows a librarian', () => {
  let nextCalled = false;

  requireRole('librarian')(
    { user: { role: 'librarian' } },
    {},
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, true);
});

test('book mutations and profile reject requests without a token', async (t) => {
  const server = app.listen(0);
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const requests = [
    fetch(`${baseUrl}/books`, { method: 'POST' }),
    fetch(`${baseUrl}/books/64dbd5d4d5d7a1b2a3c4d5e6`, { method: 'PUT' }),
    fetch(`${baseUrl}/books/64dbd5d4d5d7a1b2a3c4d5e6`, { method: 'DELETE' }),
    fetch(`${baseUrl}/api/users/profile`),
  ];
  const responses = await Promise.all(requests);

  assert.deepEqual(responses.map((response) => response.status), [401, 401, 401, 401]);
});
