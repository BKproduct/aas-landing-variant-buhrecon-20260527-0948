import fs from 'node:fs/promises';
import path from 'node:path';
import {
  I18N_ROOT,
  SOURCE_LOCALE,
  TARGET_LOCALES,
  TMP_ROOT,
  fileExists,
  languageName,
  loadAllInsights,
  nowIso,
  readJson,
  sha256,
  writeJson
} from './lib.mjs';

const args = new Set(process.argv.slice(2));
const write = args.has('--write');
const requestedLocale = valueAfter('--locale');
const provider = valueAfter('--provider') || process.env.AAS_TRANSLATION_PROVIDER || 'dry-run';
const targetLocales = requestedLocale ? [requestedLocale] : TARGET_LOCALES;

function valueAfter(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

async function translateSegment({ text, targetLocale }) {
  if (provider === 'dry-run') {
    return {
      translation: '',
      confidence: 0,
      changedMeaningRisk: 'unknown',
      notes: 'Dry run only. Configure --provider libretranslate or --provider ollama and pass --write.'
    };
  }

  if (provider === 'libretranslate') {
    return translateWithLibreTranslate({ text, targetLocale });
  }

  if (provider === 'ollama') {
    return translateWithOllama({ text, targetLocale });
  }

  throw new Error(`Unsupported translation provider: ${provider}`);
}

async function translateWithLibreTranslate({ text, targetLocale }) {
  const baseUrl = process.env.LIBRETRANSLATE_URL || 'http://127.0.0.1:5000';
  const apiKey = process.env.LIBRETRANSLATE_API_KEY || undefined;
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: SOURCE_LOCALE,
      target: targetLocale,
      format: 'text',
      api_key: apiKey
    })
  });

  if (!response.ok) {
    throw new Error(`LibreTranslate failed (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  return {
    translation: data.translatedText || '',
    confidence: 0.6,
    changedMeaningRisk: 'medium',
    notes: 'LibreTranslate baseline only; requires LLM post-edit or human review before publishing.'
  };
}

async function translateWithOllama({ text, targetLocale }) {
  const baseUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  const model = process.env.OLLAMA_MODEL || 'qwen3:8b';
  const prompt = [
    `Translate from English to ${languageName(targetLocale)} for AI Automation Studio.`,
    'Preserve markdown syntax, URLs, numbers, code spans, and product names exactly.',
    'Do not add claims. Do not remove caveats. Output strict JSON only.',
    'Schema: {"translation":"...","confidence":0.0,"changedMeaningRisk":"low|medium|high","notes":"..."}',
    '',
    'Source:',
    text
  ].join('\n');

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: 'json',
      options: {
        temperature: 0.1,
        top_p: 0.8
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama failed (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(data.response);
  return {
    translation: parsed.translation || '',
    confidence: Number(parsed.confidence || 0),
    changedMeaningRisk: parsed.changedMeaningRisk || 'medium',
    notes: parsed.notes || ''
  };
}

function memoryKey({ sourceHash, targetLocale }) {
  return `${sourceHash}|${SOURCE_LOCALE}|${targetLocale}`;
}

const memoryPath = path.join(I18N_ROOT, 'translation-memory.json');
const memory = await readJson(memoryPath);
const insights = await loadAllInsights();
const report = {
  generatedAt: nowIso(),
  provider,
  write,
  targetLocales,
  articles: []
};

for (const insight of insights) {
  const segmentsPath = path.join(insight.dir, `segments.${SOURCE_LOCALE}.json`);
  if (!(await fileExists(segmentsPath))) {
    throw new Error(`Missing segment manifest for ${insight.slug}. Run npm run i18n:extract first.`);
  }

  const segmentManifest = await readJson(segmentsPath);
  const articleReport = {
    slug: insight.slug,
    locales: {}
  };

  for (const targetLocale of targetLocales) {
    const translatedBlocks = [];
    const translatedSegments = {};
    let reused = 0;
    let generated = 0;

    for (const segment of segmentManifest.segments) {
      const key = memoryKey({ sourceHash: segment.sourceHash, targetLocale });
      const existing = memory.entries[key];
      if (existing?.target) {
        translatedBlocks.push(existing.target);
        translatedSegments[segment.id] = {
          sourceHash: segment.sourceHash,
          status: existing.reviewStatus || 'translated',
          memoryKey: key,
          provider: existing.provider || 'memory'
        };
        reused += 1;
        continue;
      }

      const result = await translateSegment({ text: segment.text, targetLocale });
      if (!result.translation) {
        translatedBlocks.push(segment.text);
        translatedSegments[segment.id] = {
          sourceHash: segment.sourceHash,
          status: 'missing',
          memoryKey: key,
          provider,
          notes: result.notes
        };
        continue;
      }

      generated += 1;
      translatedBlocks.push(result.translation);
      translatedSegments[segment.id] = {
        sourceHash: segment.sourceHash,
        status: result.changedMeaningRisk === 'low' ? 'translated' : 'needs_review',
        memoryKey: key,
        provider,
        confidence: result.confidence,
        changedMeaningRisk: result.changedMeaningRisk,
        notes: result.notes
      };

      if (write) {
        memory.entries[key] = {
          source: segment.text,
          target: result.translation,
          provider,
          confidence: result.confidence,
          changedMeaningRisk: result.changedMeaningRisk,
          reviewStatus: result.changedMeaningRisk === 'low' ? 'translated' : 'needs_review',
          sourceHash: segment.sourceHash,
          targetHash: `sha256:${sha256(result.translation)}`,
          updatedAt: report.generatedAt
        };
      }
    }

    if (write && generated > 0) {
      await fs.writeFile(path.join(insight.dir, `article.${targetLocale}.md`), `${translatedBlocks.join('\n\n')}\n`);
      const nextState = {
        ...insight.state,
        status: {
          ...insight.state.status,
          [targetLocale]: Object.values(translatedSegments).some((segment) => segment.status === 'needs_review')
            ? 'needs_review'
            : 'translated'
        },
        lastTranslationAt: report.generatedAt,
        translations: {
          ...(insight.state.translations || {}),
          [targetLocale]: translatedSegments
        },
        toolchain: {
          ...insight.state.toolchain,
          mtBaseline: provider
        }
      };
      await writeJson(insight.statePath, nextState);
    }

    articleReport.locales[targetLocale] = {
      reused,
      generated,
      missing: segmentManifest.segments.length - reused - generated,
      wouldWrite: write && generated > 0
    };
  }

  report.articles.push(articleReport);
}

if (write) {
  await writeJson(memoryPath, memory);
}

await writeJson(path.join(TMP_ROOT, 'reports', 'translation-report.json'), report);

console.log(`AAS i18n translation: provider=${provider}, write=${write ? 'yes' : 'no'}.`);
for (const article of report.articles) {
  for (const [locale, stats] of Object.entries(article.locales)) {
    console.log(`- ${article.slug} -> ${locale}: reused=${stats.reused}, generated=${stats.generated}, missing=${stats.missing}`);
  }
}

if (!write) {
  console.log('Dry run complete. Pass --write with a configured provider to create target article files.');
}

