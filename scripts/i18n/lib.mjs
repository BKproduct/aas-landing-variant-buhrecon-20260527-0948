import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const SITE_ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
export const CONTENT_ROOT = path.join(SITE_ROOT, 'content');
export const INSIGHTS_ROOT = path.join(CONTENT_ROOT, 'insights');
export const I18N_ROOT = path.join(SITE_ROOT, 'i18n');
export const TMP_ROOT = path.join(SITE_ROOT, '.tmp', 'i18n');
export const LOCALES = ['en', 'ru', 'de'];
export const SOURCE_LOCALE = 'en';
export const TARGET_LOCALES = ['ru', 'de'];
export const BASE_URL = 'https://ai-automation.studio';

export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

export async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function nowIso() {
  return new Date().toISOString();
}

export function routeFor(locale, kind, slug = '') {
  const prefix = locale === SOURCE_LOCALE ? '' : `/${locale}`;
  if (kind === 'home') return `${prefix || ''}/`;
  if (kind === 'insights') return `${prefix}/insights/`;
  if (kind === 'article') return `${prefix}/insights/${slug}/`;
  throw new Error(`Unknown route kind: ${kind}`);
}

export function absoluteUrl(route) {
  return `${BASE_URL}${route === '/' ? '' : route}`;
}

export function languageName(locale) {
  return {
    en: 'English',
    ru: 'Russian',
    de: 'German'
  }[locale] || locale;
}

export async function listInsightDirs() {
  if (!(await fileExists(INSIGHTS_ROOT))) return [];
  const entries = await fs.readdir(INSIGHTS_ROOT, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(INSIGHTS_ROOT, entry.name))
    .sort();
}

export async function loadInsight(slugOrDir) {
  const dir = path.isAbsolute(slugOrDir) ? slugOrDir : path.join(INSIGHTS_ROOT, slugOrDir);
  const metaPath = path.join(dir, 'meta.json');
  const statePath = path.join(dir, 'translation-state.json');
  const meta = await readJson(metaPath);
  const state = await readJson(statePath);
  return {
    dir,
    slug: meta.canonicalSlug || path.basename(dir),
    meta,
    state,
    metaPath,
    statePath
  };
}

export async function loadAllInsights() {
  const dirs = await listInsightDirs();
  const insights = [];
  for (const dir of dirs) {
    if (await fileExists(path.join(dir, 'meta.json'))) {
      insights.push(await loadInsight(dir));
    }
  }
  return insights;
}

export function stripSourceHeader(markdown) {
  const lines = markdown.split(/\r?\n/);
  const firstBodyIndex = lines.findIndex((line, index) => {
    if (index === 0) return false;
    return line.trim() !== '' && !/^[A-Z][A-Za-z ]+:/.test(line);
  });
  return firstBodyIndex > 0 ? lines.slice(firstBodyIndex).join('\n').trim() : markdown.trim();
}

