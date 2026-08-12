import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  WORKOS_CLI_VERSION,
  getWorkosCliSpec,
  isUnclaimedEnvironment,
  parseProvisionOutput,
} from '../src/workos-client.mjs';

const PROVISION_ENVELOPE = JSON.stringify({
  status: 'ok',
  message: 'Environment provisioned',
  data: {
    name: 'unclaimed',
    type: 'unclaimed',
    active: true,
    apiKey: 'sk_test_secret_key',
    clientId: 'client_123',
    claimToken: 'claim_token_super_secret',
    authkitDomain: 'foo.authkit.app',
  },
});

test('parseProvisionOutput returns only non-secret metadata', () => {
  const result = parseProvisionOutput(PROVISION_ENVELOPE);
  assert.deepEqual(result, {
    name: 'unclaimed',
    clientId: 'client_123',
    authkitDomain: 'foo.authkit.app',
  });
  const serialized = JSON.stringify(result);
  assert.ok(!serialized.includes('sk_test_secret_key'), 'api key must not leak');
  assert.ok(!serialized.includes('claim_token_super_secret'), 'claim token must not leak');
});

test('parseProvisionOutput rejects non-JSON output without echoing it', () => {
  assert.throws(() => parseProvisionOutput('sk_leaky not json'), (error) => {
    assert.ok(!error.message.includes('sk_leaky'), 'error must not echo raw output');
    return true;
  });
});

test('parseProvisionOutput rejects a non-ok envelope', () => {
  assert.throws(() => parseProvisionOutput(JSON.stringify({ status: 'error', data: {} })));
});

test('parseProvisionOutput rejects an envelope missing credentials', () => {
  assert.throws(() => parseProvisionOutput(JSON.stringify({
    status: 'ok',
    data: { name: 'unclaimed', clientId: '' },
  })));
});

test('getWorkosCliSpec pins an exact version by default', () => {
  delete process.env.WORKOS_AUDIT_HARNESS_WORKOS_VERSION;
  assert.equal(getWorkosCliSpec(), `workos@${WORKOS_CLI_VERSION}`);
  assert.notEqual(WORKOS_CLI_VERSION, 'latest');
});

test('getWorkosCliSpec honors the version override env var', () => {
  process.env.WORKOS_AUDIT_HARNESS_WORKOS_VERSION = '0.22.1';
  try {
    assert.equal(getWorkosCliSpec(), 'workos@0.22.1');
  } finally {
    delete process.env.WORKOS_AUDIT_HARNESS_WORKOS_VERSION;
  }
});

test('isUnclaimedEnvironment detects unclaimed envs by type or claim token', () => {
  assert.equal(isUnclaimedEnvironment({ type: 'unclaimed', apiKey: 'sk' }), true);
  assert.equal(isUnclaimedEnvironment({ type: 'sandbox', claimToken: 'tok' }), true);
  assert.equal(isUnclaimedEnvironment({ type: 'production', apiKey: 'sk' }), false);
  assert.equal(isUnclaimedEnvironment(undefined), false);
});
