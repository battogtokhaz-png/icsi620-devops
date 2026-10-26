import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/server.js';

test('GET /healthz → 200 {status: ok}', async t => {
  const server = createApp();
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  t.after(() => new Promise(r => server.close(r)));
  const res = await fetch(`http://127.0.0.1:${server.address().port}/healthz`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });
});