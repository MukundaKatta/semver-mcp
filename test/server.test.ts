import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { parseVersion, compareVersions, satisfiesRange, incVersion } from '../src/server.js';

test('parses a full version', () => {
  const p = parseVersion('1.2.3-beta.1+build.42');
  assert.equal(p.major, 1);
  assert.equal(p.minor, 2);
  assert.equal(p.patch, 3);
  assert.deepEqual(p.prerelease, ['beta', 1]);
  // semver splits build metadata on `.`, so `+build.42` becomes ['build', '42'].
  assert.deepEqual(p.build, ['build', '42']);
});

test('compare orders versions correctly', () => {
  assert.equal(compareVersions('1.0.0', '1.0.1'), -1);
  assert.equal(compareVersions('2.0.0', '1.99.99'), 1);
  assert.equal(compareVersions('1.2.3', '1.2.3'), 0);
  // Pre-release sorts before stable.
  assert.equal(compareVersions('1.0.0-beta', '1.0.0'), -1);
});

test('satisfies caret range', () => {
  assert.equal(satisfiesRange('1.2.3', '^1.0.0'), true);
  assert.equal(satisfiesRange('2.0.0', '^1.0.0'), false);
});

test('satisfies tilde range', () => {
  assert.equal(satisfiesRange('1.2.5', '~1.2.0'), true);
  assert.equal(satisfiesRange('1.3.0', '~1.2.0'), false);
});

test('satisfies wildcard range', () => {
  assert.equal(satisfiesRange('1.5.9', '1.x'), true);
  assert.equal(satisfiesRange('2.0.0', '1.x'), false);
  assert.equal(satisfiesRange('9.9.9', '*'), true);
});

test('satisfies comparator range', () => {
  assert.equal(satisfiesRange('1.5.0', '>=1.0.0 <2.0.0'), true);
  assert.equal(satisfiesRange('2.0.0', '>=1.0.0 <2.0.0'), false);
});

test('satisfies rejects an invalid version', () => {
  assert.throws(() => satisfiesRange('not.a.version', '^1.0.0'), /not a valid semver/);
});

test('satisfies rejects an invalid range', () => {
  assert.throws(() => satisfiesRange('1.0.0', 'not-a-range'), /not a valid range/);
});

test('inc minor', () => {
  assert.equal(incVersion('1.2.3', 'minor'), '1.3.0');
});

test('inc patch', () => {
  assert.equal(incVersion('1.2.3', 'patch'), '1.2.4');
});

test('inc prerelease with identifier', () => {
  assert.equal(incVersion('1.2.3', 'premajor', 'beta'), '2.0.0-beta.0');
});

test('inc premajor without identifier', () => {
  assert.equal(incVersion('1.2.3', 'premajor'), '2.0.0-0');
});

test('inc rejects an invalid version', () => {
  assert.throws(() => incVersion('not.a.version', 'patch'));
});

test('rejects invalid versions', () => {
  assert.throws(() => parseVersion('not.a.version'));
});
