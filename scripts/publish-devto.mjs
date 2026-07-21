import fs from 'node:fs/promises';

const [sourcePath, canonicalUrl, tagsCsv] = process.argv.slice(2);
const apiKey = process.env.DEVTO_API_KEY;

if (!sourcePath || !canonicalUrl || !tagsCsv) {
  throw new Error('Usage: DEVTO_API_KEY=… node scripts/publish-devto.mjs <source.txt> <canonical-url> <tag,tag,tag>');
}
if (!apiKey) throw new Error('DEVTO_API_KEY is required.');

const source = (await fs.readFile(sourcePath, 'utf8')).trim();
const [titleLine, ...remainder] = source.split(/\r?\n/);
const title = titleLine.trim();
const bodyMarkdown = remainder.join('\n').trim();
const description = 'A practical guide to drafting workflow automation for professional-services firms: prepare review-ready first drafts while keeping judgement and approval with a human professional.';
const tags = tagsCsv.split(',').map((tag) => tag.trim()).filter(Boolean);

const response = await fetch('https://dev.to/api/articles', {
  method: 'POST',
  headers: {
    'api-key': apiKey,
    'content-type': 'application/json'
  },
  body: JSON.stringify({
    article: {
      title,
      body_markdown: bodyMarkdown,
      description,
      tags,
      canonical_url: canonicalUrl,
      published: true
    }
  })
});

const payload = await response.json().catch(() => ({}));
if (!response.ok) throw new Error(`DEV.to API ${response.status}: ${payload.error || payload.message || JSON.stringify(payload)}`);
console.log(JSON.stringify({ id: payload.id, url: payload.url, canonical_url: payload.canonical_url, published: payload.published }, null, 2));
