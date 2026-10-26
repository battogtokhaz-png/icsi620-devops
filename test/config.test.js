import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';

test('config: анхдагч 127.0.0.1:3000, орчны хувьсагчаар солигдоно', () => {
  assert.deepEqual(loadConfig({}), { host: '127.0.0.1', port: 3000, version: 'dev' });
  assert.deepEqual(loadConfig({ HOST: '0.0.0.0', PORT: '8080', APP_VERSION: '1.1' }),
    { host: '0.0.0.0', port: 8080, version: '1.1' });
});