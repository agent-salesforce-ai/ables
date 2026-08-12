import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function fail(message) {
  failures.push(message);
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (_) {
    return false;
  }
}

async function htmlFiles(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await htmlFiles(full));
    if (entry.isFile() && entry.name.endsWith('.html')) output.push(full);
  }
  return output;
}

function pageFileFromUrl(url) {
  const parsed = new URL(url, 'https://ables.ai');
  let relative = decodeURIComponent(parsed.pathname).replace(/^\//, '');
  if (!relative) return path.join(root, 'index.html');
  if (relative.endsWith('/')) return path.join(root, relative, 'index.html');
  if (path.extname(relative)) return path.join(root, relative);
  return path.join(root, relative, 'index.html');
}

const sitemapText = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemapText.matchAll(/<loc>(https:\/\/ables\.ai[^<]+)<\/loc>/g)].map((match) => match[1]);
if (sitemapUrls.length !== 22) fail(`Expected 22 sitemap URLs, found ${sitemapUrls.length}`);
if (new Set(sitemapUrls).size !== sitemapUrls.length) fail('Sitemap contains duplicate URLs');

const resourcesHtml = await readFile(path.join(root, 'resources', 'index.html'), 'utf8');
if (!resourcesHtml.includes('href="https://lender-list.com/"')) fail('Resources page is missing the Lender List resource link');
if (!resourcesHtml.includes('A directory match is not an approval or offer')) fail('Resources page is missing the Lender List disclaimer');

const titles = new Map();
const publicFiles = new Set();

for (const url of sitemapUrls) {
  const file = pageFileFromUrl(url);
  publicFiles.add(file);
  if (!await exists(file)) {
    fail(`${url} has no matching file: ${path.relative(root, file)}`);
    continue;
  }

  const html = await readFile(file, 'utf8');
  const relative = path.relative(root, file);
  const titlesFound = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)];
  const h1s = [...html.matchAll(/<h1(?:\s[^>]*)?>[\s\S]*?<\/h1>/gi)];
  const descriptions = [...html.matchAll(/<meta\s+name="description"\s+content="([^"]+)"\s*\/?\s*>/gi)];
  const canonicals = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?\s*>/gi)];
  const jsonLdBlocks = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];

  if (titlesFound.length !== 1) fail(`${relative}: expected one title, found ${titlesFound.length}`);
  if (h1s.length !== 1) fail(`${relative}: expected one h1, found ${h1s.length}`);
  if (descriptions.length !== 1) fail(`${relative}: expected one meta description, found ${descriptions.length}`);
  if (canonicals.length !== 1 || canonicals[0]?.[1] !== url) fail(`${relative}: canonical does not match ${url}`);
  if (!/<meta\s+name="robots"\s+content="[^"]*index,follow/i.test(html)) fail(`${relative}: missing index,follow robots directive`);
  if (!html.includes('G-NLL9GDQY8S')) fail(`${relative}: missing Ables GA4 measurement ID`);
  if (!html.includes(`page_location: '${url}'`)) fail(`${relative}: GA page_location is not fixed to its canonical path`);
  if (!/page_referrer\s*:\s*document\.referrer\s*\?\s*new URL\(document\.referrer\)\.origin\s*:\s*['"]{2}/.test(html)) fail(`${relative}: GA page_referrer is not origin-only`);
  if (!html.includes('/analytics.js?v=60102cc503b3')) fail(`${relative}: missing versioned analytics asset`);
  if (/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(html)) fail(`${relative}: still loads external Google Fonts`);
  if (jsonLdBlocks.length === 0) fail(`${relative}: missing JSON-LD`);

  for (const block of jsonLdBlocks) {
    try {
      JSON.parse(block[1]);
    } catch (error) {
      fail(`${relative}: invalid JSON-LD (${error.message})`);
    }
  }

  if (titlesFound[0]) {
    const title = titlesFound[0][1].replace(/&amp;/g, '&').trim();
    if (titles.has(title)) fail(`${relative}: duplicate title also used by ${titles.get(title)}`);
    titles.set(title, relative);
  }

  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|tel:|javascript:)/i.test(href)) continue;
    if (href === '#') continue;
    const parsed = new URL(href, url);
    if (parsed.origin !== 'https://ables.ai') continue;
    const targetFile = pageFileFromUrl(parsed.href);
    if (!await exists(targetFile)) fail(`${relative}: broken internal link ${href}`);
    if (parsed.pathname === new URL(url).pathname && parsed.hash && !ids.has(parsed.hash.slice(1))) {
      fail(`${relative}: missing same-page fragment target ${href}`);
    }
  }
}

const allHtml = await htmlFiles(root);
const legacyFiles = allHtml.filter((file) => !publicFiles.has(file));
if (legacyFiles.length !== 29) fail(`Expected 29 legacy/test HTML files, found ${legacyFiles.length}`);
for (const file of legacyFiles) {
  const html = await readFile(file, 'utf8');
  if (!/<meta[^>]+(?:name=["']robots["'][^>]+noindex|noindex[^>]+name=["']robots["'])/i.test(html)) {
    fail(`${path.relative(root, file)}: legacy page is missing noindex`);
  }
}

for (const directory of ['solutions', 'integrations', 'resources']) {
  for (const file of (await htmlFiles(path.join(root, directory)))) {
    const html = await readFile(file, 'utf8');
    const forbidden = [
      /SOC 2 Type II/i,
      /99\.97%/,
      /\$2\.41\s*B/i,
      /500\+\s*funders/i,
      /trusted by/i,
      /guaranteed?\s+(?:accuracy|result|outcome)/i,
    ];
    for (const pattern of forbidden) {
      if (pattern.test(html)) fail(`${path.relative(root, file)}: contains blocked claim pattern ${pattern}`);
    }
  }
}

const assessmentHtml = await readFile(path.join(root, 'resources/workflow-readiness-assessment/index.html'), 'utf8');
const privacyHtml = await readFile(path.join(root, 'privacy/index.html'), 'utf8');
if (!assessmentHtml.includes('/assessment.js?v=7bb889a2a9ec')) fail('Assessment page is missing versioned assessment script');
if (!assessmentHtml.includes('id="calculate-readiness" type="button"')) fail('Assessment must use a non-submitting calculate button');
if (/\bname="(?:monthly-volume|minutes-per-item|system-count|handoff-count|control-state|access-state)"/.test(assessmentHtml)) fail('Assessment inputs must not be successful GET controls');
if (!/<form[^>]+id="readiness-assessment"[^>]+method="post"/i.test(assessmentHtml)) fail('Assessment must fail closed with POST when scripts are unavailable');
if (!privacyHtml.includes('values entered into the assessment are not submitted')) fail('Privacy notice is missing assessment data-handling disclosure');

if (failures.length) {
  console.error(`Site check failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Site check passed: ${sitemapUrls.length} public URLs, ${legacyFiles.length} noindex legacy pages, ${titles.size} unique titles.`);
