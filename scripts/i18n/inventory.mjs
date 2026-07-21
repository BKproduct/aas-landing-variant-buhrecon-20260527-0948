import fs from 'node:fs/promises';
import path from 'node:path';
import {
  BASE_URL,
  LOCALES,
  SOURCE_LOCALE,
  TARGET_LOCALES,
  TMP_ROOT,
  absoluteUrl,
  fileExists,
  loadAllInsights,
  nowIso,
  routeFor,
  writeJson
} from './lib.mjs';

const insights = await loadAllInsights();

const routes = [];

for (const locale of LOCALES) {
  routes.push({
    kind: 'home',
    locale,
    route: routeFor(locale, 'home'),
    url: absoluteUrl(routeFor(locale, 'home')),
    source: locale === SOURCE_LOCALE ? 'index.html' : null,
    status: locale === SOURCE_LOCALE ? 'existing-static' : 'expected'
  });
  routes.push({
    kind: 'insights',
    locale,
    route: routeFor(locale, 'insights'),
    url: absoluteUrl(routeFor(locale, 'insights')),
    source: locale === SOURCE_LOCALE ? 'insights/index.html' : null,
    status: locale === SOURCE_LOCALE ? 'existing-static' : 'expected'
  });
}

const articles = [];

for (const insight of insights) {
  const localeFiles = {};
  const missingLocales = [];
  for (const locale of LOCALES) {
    const fileName = `article.${locale}.md`;
    const filePath = path.join(insight.dir, fileName);
    const exists = await fileExists(filePath);
    localeFiles[locale] = exists ? path.relative(process.cwd(), filePath) : null;
    if (!exists) missingLocales.push(locale);
    routes.push({
      kind: 'article',
      locale,
      slug: insight.slug,
      route: routeFor(locale, 'article', insight.slug),
      url: absoluteUrl(routeFor(locale, 'article', insight.slug)),
      source: localeFiles[locale],
      status: exists ? (locale === SOURCE_LOCALE ? 'source' : 'translated') : 'missing'
    });
  }
  articles.push({
    slug: insight.slug,
    status: insight.meta.status || 'unknown',
    sourceLocale: insight.meta.sourceLocale,
    targetLocales: TARGET_LOCALES,
    localeFiles,
    missingLocales,
    canonicalUrl: insight.meta.canonicalUrl || `${BASE_URL}/insights/${insight.slug}/`
  });
}

const manifest = {
  generatedAt: nowIso(),
  baseUrl: BASE_URL,
  sourceLocale: SOURCE_LOCALE,
  locales: LOCALES,
  articles,
  routes
};

await writeJson(path.join(TMP_ROOT, 'route-manifest.json'), manifest);
await fs.mkdir(path.join(TMP_ROOT, 'reports'), { recursive: true });
await writeJson(path.join(TMP_ROOT, 'reports', 'inventory-report.json'), {
  generatedAt: manifest.generatedAt,
  articleCount: articles.length,
  routeCount: routes.length,
  missingLocaleCount: articles.reduce((sum, article) => sum + article.missingLocales.length, 0),
  missing: articles.map((article) => ({
    slug: article.slug,
    missingLocales: article.missingLocales
  }))
});

console.log(`AAS i18n inventory: ${articles.length} article(s), ${routes.length} route(s).`);
for (const article of articles) {
  const missing = article.missingLocales.length ? article.missingLocales.join(', ') : 'none';
  console.log(`- ${article.slug}: missing locales: ${missing}`);
}

