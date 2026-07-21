import fs from 'node:fs/promises';
import path from 'node:path';

const deployRoot = process.argv[2];
const baseUrl = 'https://ai-automation.studio';
const today = new Date().toISOString().slice(0, 10);
if (!deployRoot) throw new Error('Usage: node scripts/i18n/render-production-sitemap.mjs <deploy-root>');

const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const cluster = (paths, priority) => paths.map((entry) => `  <url>\n    <loc>${baseUrl}${entry.route}</loc>\n${paths.map((alternate) => `    <xhtml:link rel="alternate" hreflang="${alternate.locale}" href="${baseUrl}${alternate.route}"/>`).join('\n')}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${paths[0].route}"/>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`).join('\n');
const homes = [{ locale: 'en', route: '/' }, { locale: 'ru', route: '/ru/' }, { locale: 'de', route: '/de/' }];
const hubs = [{ locale: 'en', route: '/insights/' }, { locale: 'ru', route: '/ru/insights/' }, { locale: 'de', route: '/de/insights/' }];
const staticPages = [
  ['https://ai-automation.studio/call/', 'monthly', '0.8'],
  ['https://ai-automation.studio/llm-info/', 'monthly', '0.5'],
  ['https://ai-automation.studio/insights/part-time-finance-admin-vs-ai-agent-cost-uk/', 'monthly', '0.7'],
  ['https://ai-automation.studio/privacy.html', 'yearly', '0.3']
].map(([url, changefreq, priority]) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`).join('\n');
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${cluster(homes, '1.0')}\n${cluster(hubs, '0.8')}\n${staticPages}\n</urlset>\n`;
await fs.writeFile(path.join(deployRoot, 'sitemap.xml'), xml);
console.log('Production sitemap rendered: home and Insights EN/RU/DE clusters.');
