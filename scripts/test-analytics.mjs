import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(path.join(root, 'analytics.js'), 'utf8');
const storageKey = 'ables-demo-attribution-v1';

function runAnalytics({
  search = '',
  pathname = '/',
  referrer = '',
  stored,
} = {}) {
  const storage = new Map();
  if (stored !== undefined) storage.set(storageKey, JSON.stringify(stored));
  const calls = [];
  const window = {
    location: { pathname, search },
    gtag: (...args) => calls.push(args),
  };
  const context = {
    URL,
    URLSearchParams,
    clearTimeout,
    console,
    document: { referrer },
    setTimeout,
    sessionStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
    },
    window,
  };

  vm.runInNewContext(source, context, { filename: 'analytics.js' });
  return {
    analytics: window.AblesAnalytics,
    attributes: JSON.parse(JSON.stringify(window.AblesAnalytics.getAttribution())),
    calls,
    stored: JSON.parse(storage.get(storageKey)),
  };
}

function assertSafeShape(value) {
  assert.deepEqual(
    Object.keys(value).sort(),
    Object.keys(value).filter((key) => ['landing_page', 'referrer', 'utm_source', 'utm_medium'].includes(key)).sort(),
  );
}

{
  const rawSecrets = ['zak@example.com', '212-555-1212', '123-45-6789', 'private-campaign'];
  const result = runAnalytics({
    pathname: '/solutions/lending-workflow-automation/',
    search: '?utm_source=zak%40example.com&utm_medium=212-555-1212&utm_campaign=private-campaign&utm_content=123-45-6789&utm_term=zak%40example.com&utm_id=2125551212',
    referrer: 'https://search.example/results?email=zak%40example.com',
  });

  assert.deepEqual(result.attributes, {
    landing_page: '/solutions/lending-workflow-automation/',
    referrer: 'https://search.example',
  });
  assert.deepEqual(result.stored, result.attributes);
  assertSafeShape(result.stored);
  rawSecrets.forEach((secret) => assert.doesNotMatch(JSON.stringify(result), new RegExp(secret.replaceAll('-', '\\-'), 'i')));
}

{
  const result = runAnalytics({
    pathname: '/resources/workflow-readiness-assessment/',
    search: '?utm_source=Google&utm_medium=CPC&utm_campaign=customer%40example.com&utm_content=2125551212&utm_term=123-45-6789&utm_id=private',
    referrer: 'https://www.google.com/search?q=customer%40example.com',
  });

  assert.deepEqual(result.attributes, {
    landing_page: '/resources/workflow-readiness-assessment/',
    referrer: 'https://www.google.com',
    utm_source: 'google',
    utm_medium: 'cpc',
  });
  assert.deepEqual(result.stored, result.attributes);
  assert.doesNotMatch(JSON.stringify(result.stored), /utm_(?:campaign|content|term|id)|customer@example\.com|2125551212|123-45-6789/i);
}

{
  const result = runAnalytics({
    pathname: '/about/',
    stored: {
      landing_page: '/private/zak@example.com',
      referrer: 'https://partner.example/2125551212?ssn=123-45-6789',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'zak@example.com',
      utm_content: '2125551212',
      utm_term: '123-45-6789',
      utm_id: 'private',
    },
  });

  assert.deepEqual(result.attributes, {
    landing_page: '/',
    referrer: 'https://partner.example',
    utm_source: 'google',
    utm_medium: 'cpc',
  });
  assert.deepEqual(result.stored, result.attributes);
  assert.doesNotMatch(JSON.stringify(result.stored), /utm_(?:campaign|content|term|id)|zak@example\.com|2125551212|123-45-6789/i);

  result.analytics.track('demo_open', {
    cta_name: 'zak@example.com',
    cta_location: 'hero',
    page_path: '/private/2125551212',
    utm_campaign: '123-45-6789',
  });
  assert.equal(result.calls.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(result.calls[0])), [
    'event',
    'demo_open',
    { page_path: '/', cta_location: 'hero' },
  ]);
  assert.doesNotMatch(JSON.stringify(result.calls), /zak@example\.com|2125551212|123-45-6789|utm_campaign/i);
}

{
  const result = runAnalytics({
    pathname: '/private/Jane-Doe',
    referrer: 'https://partner.example/leads/Jane-Doe?campaign=private',
  });

  assert.deepEqual(result.attributes, {
    landing_page: '/',
    referrer: 'https://partner.example',
  });
  assert.deepEqual(result.stored, result.attributes);
  assert.doesNotMatch(JSON.stringify(result), /Jane-Doe|\/leads\//i);
}

console.log('Analytics privacy tests passed: canonical landing paths enforced, referrers reduced to origins, unsafe query/stale storage/event PII blocked.');
