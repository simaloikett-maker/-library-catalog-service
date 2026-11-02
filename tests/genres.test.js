const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { app } = require('../app');

test('POST /genres returns a field-specific 400 for an empty body', async (t) => {
  const server = app.listen(0);
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/genres`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'name is required' });
});
