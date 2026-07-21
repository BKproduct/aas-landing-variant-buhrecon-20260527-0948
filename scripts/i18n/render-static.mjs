import fs from 'node:fs/promises';
import path from 'node:path';
import {
  BASE_URL,
  LOCALES,
  SOURCE_LOCALE,
  TMP_ROOT,
  absoluteUrl,
  fileExists,
  loadAllInsights,
  routeFor,
  stripSourceHeader,
  writeJson
} from './lib.mjs';

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function inlineMarkdown(value) {
  let output = escapeHtml(value);
  output = output.replace(/`([^`]+)`/g, '<code>$1</code>');
  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return output;
}

function markdownToHtml(markdown) {
  const blocks = stripSourceHeader(markdown).split(/\n{2,}/);
  const html = [];

  for (const rawBlock of blocks) {
    const block = rawBlock.trim();
    if (!block) continue;

    const heading = /^(#{1,6})\s+(.+)$/.exec(block);
    if (heading) {
      const level = Math.min(heading[1].length, 6);
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    if (/^\|.+\|$/m.test(block)) {
      const rows = block.split('\n').filter((line) => line.trim());
      const tableRows = rows
        .filter((line) => !/^\|\s*-+/.test(line))
        .map((line, index) => {
          const cells = line
            .replace(/^\||\|$/g, '')
            .split('|')
            .map((cell) => `<${index === 0 ? 'th' : 'td'}>${inlineMarkdown(cell.trim())}</${index === 0 ? 'th' : 'td'}>`)
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');
      html.push(`<table>${tableRows}</table>`);
      continue;
    }

    if (/^[-*]\s/m.test(block)) {
      const items = block
        .split('\n')
        .filter((line) => /^[-*]\s/.test(line.trim()))
        .map((line) => `<li>${inlineMarkdown(line.replace(/^[-*]\s+/, '').trim())}</li>`)
        .join('');
      html.push(`<ul>${items}</ul>`);
      continue;
    }

    if (/^\d+\.\s/m.test(block)) {
      const items = block
        .split('\n')
        .filter((line) => /^\d+\.\s/.test(line.trim()))
        .map((line) => `<li>${inlineMarkdown(line.replace(/^\d+\.\s+/, '').trim())}</li>`)
        .join('');
      html.push(`<ol>${items}</ol>`);
      continue;
    }

    html.push(`<p>${inlineMarkdown(block.replace(/\n/g, ' '))}</p>`);
  }

  return html.join('\n');
}

function hreflangLinks(locale, slug) {
  const links = LOCALES.map((alternateLocale) => {
    const route = routeFor(alternateLocale, 'article', slug);
    return `<link rel="alternate" hreflang="${alternateLocale}" href="${absoluteUrl(route)}">`;
  });
  links.push(`<link rel="alternate" hreflang="x-default" href="${absoluteUrl(routeFor(SOURCE_LOCALE, 'article', slug))}">`);
  return links.join('\n  ');
}

function renderArticle({ markdown, insight, locale }) {
  const route = routeFor(locale, 'article', insight.slug);
  const meta = insight.meta.meta?.[locale] || insight.meta.meta?.[SOURCE_LOCALE] || {};
  const title = meta.title || insight.meta.meta?.[SOURCE_LOCALE]?.title || insight.slug;
  const description = meta.description || insight.meta.meta?.[SOURCE_LOCALE]?.description || '';
  const body = markdownToHtml(markdown);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    author: {
      '@type': 'Person',
      name: insight.meta.author
    },
    publisher: {
      '@type': 'Organization',
      name: insight.meta.brand,
      url: BASE_URL
    },
    datePublished: insight.meta.publishedAt,
    dateModified: insight.meta.updatedAt,
    inLanguage: locale,
    mainEntityOfPage: absoluteUrl(route)
  };

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${absoluteUrl(route)}">
  ${hreflangLinks(locale, insight.slug)}
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1f1f1d; background: #fafaf7; line-height: 1.65; }
    main { width: min(100% - 40px, 840px); margin: 0 auto; padding: 64px 0 96px; }
    a { color: #0d9488; }
    h1, h2, h3 { color: #0a0a0a; line-height: 1.15; }
    h1 { font-size: clamp(38px, 7vw, 68px); }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; background: #fff; }
    th, td { border: 1px solid #e5e4de; padding: 10px 12px; text-align: left; vertical-align: top; }
    code { background: #f0fdfa; padding: 0.1em 0.35em; border-radius: 4px; }
  </style>
</head>
<body>
  <main>
${body}
  </main>
</body>
</html>
`;
}

const insights = await loadAllInsights();
const outputRoot = path.join(TMP_ROOT, 'render');
const generated = [];

for (const insight of insights) {
  for (const locale of LOCALES) {
    const sourcePath = path.join(insight.dir, `article.${locale}.md`);
    if (!(await fileExists(sourcePath))) continue;

    const markdown = await fs.readFile(sourcePath, 'utf8');
    const html = renderArticle({ markdown, insight, locale });
    const route = routeFor(locale, 'article', insight.slug);
    const routePath = route.replace(/^\/+/, '');
    const outputPath = path.join(outputRoot, routePath, 'index.html');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, html);
    generated.push({
      locale,
      slug: insight.slug,
      route,
      outputPath: path.relative(process.cwd(), outputPath)
    });
  }
}

await writeJson(path.join(TMP_ROOT, 'reports', 'render-report.json'), {
  generatedAt: new Date().toISOString(),
  generated
});

console.log(`AAS i18n render: generated ${generated.length} file(s) in ${path.relative(process.cwd(), outputRoot)}.`);
for (const item of generated) console.log(`- ${item.route} -> ${item.outputPath}`);
