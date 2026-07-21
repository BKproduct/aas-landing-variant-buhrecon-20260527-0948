import fs from 'node:fs/promises';
import path from 'node:path';
import {
  SOURCE_LOCALE,
  TMP_ROOT,
  loadAllInsights,
  nowIso,
  sha256,
  stripSourceHeader,
  writeJson
} from './lib.mjs';

function segmentMarkdown(markdown, slug) {
  const body = stripSourceHeader(markdown);
  const blocks = [];
  let buffer = [];
  let inFence = false;

  const flush = () => {
    const text = buffer.join('\n').trim();
    if (text) blocks.push(text);
    buffer = [];
  };

  for (const line of body.split(/\r?\n/)) {
    if (line.trim().startsWith('```')) {
      inFence = !inFence;
      buffer.push(line);
      continue;
    }

    if (!inFence && line.trim() === '') {
      flush();
      continue;
    }

    buffer.push(line);
  }
  flush();

  return blocks.map((text, index) => {
    const type = inferType(text);
    return {
      id: `insights.${slug}.${String(index + 1).padStart(4, '0')}`,
      type,
      sourceLocale: SOURCE_LOCALE,
      sourceHash: `sha256:${sha256(text)}`,
      text,
      protected: extractProtectedTokens(text),
      risk: inferRisk(text)
    };
  });
}

function inferType(text) {
  if (/^#{1,6}\s/.test(text)) return 'heading';
  if (/^\|.+\|$/m.test(text)) return 'table';
  if (/^[-*]\s/m.test(text)) return 'list';
  if (/^\d+\.\s/m.test(text)) return 'ordered-list';
  if (/^```/.test(text)) return 'code';
  return 'paragraph';
}

function extractProtectedTokens(text) {
  const tokens = new Set();
  for (const match of text.matchAll(/`[^`]+`/g)) tokens.add(match[0]);
  for (const match of text.matchAll(/\[[^\]]+\]\([^)]+\)/g)) tokens.add(match[0]);
  for (const match of text.matchAll(/https?:\/\/[^\s)]+/g)) tokens.add(match[0]);
  for (const match of text.matchAll(/\b\d+(?:[,.]\d+)?%?\b/g)) tokens.add(match[0]);
  return [...tokens];
}

function inferRisk(text) {
  const lower = text.toLowerCase();
  const riskTerms = [
    'legal advice',
    'law',
    'legal',
    'finance',
    'roi',
    'cost',
    'compliance',
    'accept or reject',
    'should stay with a human',
    'human review',
    'needs source'
  ];
  return riskTerms.some((term) => lower.includes(term)) ? 'review' : 'normal';
}

const insights = await loadAllInsights();
const manifest = {
  generatedAt: nowIso(),
  sourceLocale: SOURCE_LOCALE,
  articles: []
};

for (const insight of insights) {
  const articlePath = path.join(insight.dir, `article.${SOURCE_LOCALE}.md`);
  const markdown = await fs.readFile(articlePath, 'utf8');
  const segments = segmentMarkdown(markdown, insight.slug);

  const segmentManifest = {
    slug: insight.slug,
    generatedAt: manifest.generatedAt,
    sourceLocale: SOURCE_LOCALE,
    sourceFile: path.relative(process.cwd(), articlePath),
    sourceHash: `sha256:${sha256(markdown)}`,
    segmentCount: segments.length,
    segments
  };

  await writeJson(path.join(insight.dir, 'segments.en.json'), segmentManifest);

  const nextState = {
    ...insight.state,
    lastExtractionAt: manifest.generatedAt,
    sourceHash: segmentManifest.sourceHash,
    segmentCount: segments.length,
    segments: Object.fromEntries(
      segments.map((segment) => [
        segment.id,
        {
          sourceHash: segment.sourceHash,
          type: segment.type,
          risk: segment.risk,
          status: 'source'
        }
      ])
    )
  };
  await writeJson(insight.statePath, nextState);

  manifest.articles.push({
    slug: insight.slug,
    sourceFile: segmentManifest.sourceFile,
    sourceHash: segmentManifest.sourceHash,
    segmentCount: segments.length,
    reviewSegmentCount: segments.filter((segment) => segment.risk === 'review').length
  });
}

await writeJson(path.join(TMP_ROOT, 'segment-manifest.json'), manifest);

console.log(`AAS i18n extraction: ${manifest.articles.length} article(s).`);
for (const article of manifest.articles) {
  console.log(`- ${article.slug}: ${article.segmentCount} segment(s), ${article.reviewSegmentCount} review-risk segment(s).`);
}

