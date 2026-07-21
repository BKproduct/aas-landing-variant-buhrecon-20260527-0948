import fs from 'node:fs/promises';
import path from 'node:path';
import {
  LOCALES,
  SOURCE_LOCALE,
  TMP_ROOT,
  fileExists,
  loadAllInsights,
  nowIso,
  writeJson
} from './lib.mjs';

const strict = process.argv.includes('--strict');
const insights = await loadAllInsights();
const report = {
  generatedAt: nowIso(),
  strict,
  valid: true,
  errors: [],
  warnings: [],
  articles: []
};

for (const insight of insights) {
  const articleReport = {
    slug: insight.slug,
    status: insight.meta.status || 'unknown',
    locales: {},
    warnings: [],
    errors: []
  };

  if (!insight.meta.canonicalSlug) {
    articleReport.errors.push('meta.canonicalSlug is required.');
  }
  if (!insight.meta.sourceLocale || insight.meta.sourceLocale !== SOURCE_LOCALE) {
    articleReport.errors.push(`meta.sourceLocale must be "${SOURCE_LOCALE}".`);
  }
  if (!Array.isArray(insight.meta.locales)) {
    articleReport.errors.push('meta.locales must be an array.');
  }
  for (const locale of LOCALES) {
    if (!insight.meta.locales?.includes(locale)) {
      articleReport.errors.push(`meta.locales is missing "${locale}".`);
    }

    const filePath = path.join(insight.dir, `article.${locale}.md`);
    const exists = await fileExists(filePath);
    articleReport.locales[locale] = { exists };

    if (!exists) {
      const message = `article.${locale}.md is missing.`;
      if (strict || insight.meta.status === 'published') {
        articleReport.errors.push(message);
      } else {
        articleReport.warnings.push(message);
      }
      continue;
    }

    const content = await fs.readFile(filePath, 'utf8');
    articleReport.locales[locale].bytes = Buffer.byteLength(content);
    articleReport.locales[locale].hasH1 = /^#\s+\S+/m.test(content);
    if (!articleReport.locales[locale].hasH1) {
      articleReport.errors.push(`article.${locale}.md must contain an H1 heading.`);
    }
  }

  for (const locale of LOCALES) {
    const meta = insight.meta.meta?.[locale];
    if (!meta) {
      articleReport.errors.push(`meta.meta.${locale} is required.`);
      continue;
    }
    if (!meta.title) {
      const message = `meta.meta.${locale}.title is empty.`;
      if (locale === SOURCE_LOCALE || strict || insight.meta.status === 'published') {
        articleReport.errors.push(message);
      } else {
        articleReport.warnings.push(message);
      }
    }
    if (!meta.description) {
      const message = `meta.meta.${locale}.description is empty.`;
      if (locale === SOURCE_LOCALE || strict || insight.meta.status === 'published') {
        articleReport.errors.push(message);
      } else {
        articleReport.warnings.push(message);
      }
    }
  }

  const segmentsPath = path.join(insight.dir, `segments.${SOURCE_LOCALE}.json`);
  if (!(await fileExists(segmentsPath))) {
    articleReport.warnings.push(`segments.${SOURCE_LOCALE}.json has not been generated yet.`);
  }

  report.articles.push(articleReport);
  report.errors.push(...articleReport.errors.map((error) => `${insight.slug}: ${error}`));
  report.warnings.push(...articleReport.warnings.map((warning) => `${insight.slug}: ${warning}`));
}

report.valid = report.errors.length === 0;
await writeJson(path.join(TMP_ROOT, 'reports', 'validation-report.json'), report);

console.log(`AAS i18n validation: ${report.valid ? 'valid' : 'invalid'} (${report.errors.length} error(s), ${report.warnings.length} warning(s)).`);
for (const warning of report.warnings) console.log(`warning: ${warning}`);
for (const error of report.errors) console.error(`error: ${error}`);

if (!report.valid) process.exit(1);

