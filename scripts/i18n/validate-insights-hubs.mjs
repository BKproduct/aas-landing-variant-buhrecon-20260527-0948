import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const siteRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const renderer = path.join(siteRoot, 'scripts', 'i18n', 'render-insights-hubs.mjs');
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'aas-insights-validation-'));
const locales = ['en', 'ru', 'de'];
const forbidden = [/Canonical AAS/i, /SEO\/?GEO/i, /Syndicated copies/i, /Next article cluster/i, /search engines/i, /answer engines/i, /source of truth/i];
const errors = [];

try {
  process.argv[2] = tempRoot;
  await import(`${renderer}?validation=${Date.now()}`);
  for (const locale of locales) {
    const route = locale === 'en' ? '/insights/' : `/${locale}/insights/`;
    const file = path.join(tempRoot, route.slice(1), 'index.html');
    const html = await fs.readFile(file, 'utf8');
    if (!new RegExp(`<html lang="${locale}">`).test(html)) errors.push(`${route}: incorrect html lang`);
    if (!html.includes(`<link rel="canonical" href="https://ai-automation.studio${route}">`)) errors.push(`${route}: missing self canonical`);
    for (const alternate of locales) {
      const alternateRoute = alternate === 'en' ? '/insights/' : `/${alternate}/insights/`;
      if (!html.includes(`hreflang="${alternate}" href="https://ai-automation.studio${alternateRoute}"`)) errors.push(`${route}: missing ${alternate} hreflang`);
    }
    if (!html.includes('hreflang="x-default" href="https://ai-automation.studio/insights/"')) errors.push(`${route}: missing x-default hreflang`);
    if (!html.includes('"@type":"CollectionPage"') || !html.includes('"@type":"ItemList"')) errors.push(`${route}: CollectionPage ItemList JSON-LD missing`);
    if (!html.includes('name="robots" content="noindex, nofollow"')) errors.push(`${route}: missing dev noindex`);
    for (const phrase of forbidden) if (phrase.test(html)) errors.push(`${route}: forbidden phrase ${phrase}`);
    if (locale !== 'en') {
      const englishArticleLinks = html.match(/href="\/insights\/[^"/]+\//g) || [];
      if (englishArticleLinks.length !== 2) errors.push(`${route}: expected two English internal article fallbacks, found ${englishArticleLinks.length}`);
      if (!html.includes('availableInEnglish') && !/Статья доступна на английском|Artikel auf Englisch verfügbar/.test(html)) errors.push(`${route}: English fallback cards need a visible localized availability label`);
    }
  }
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
}

if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`);
  process.exit(1);
}
console.log('AAS insights hub validation: valid (3 localized hubs, canonicals, hreflang, JSON-LD, noindex, and card availability).');
