import fs from 'node:fs/promises';
import path from 'node:path';

const siteRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const contentRoot = path.join(siteRoot, 'content', 'insights-hub');
const deployRoot = process.argv[2];
const locales = ['en', 'ru', 'de'];
const productionBaseUrl = 'https://ai-automation.studio';
const shouldNoindex = process.env.AAS_NO_INDEX !== 'false';

if (!deployRoot) throw new Error('Usage: node scripts/i18n/render-insights-hubs.mjs <deploy-root>');

const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const routeFor = (locale) => locale === 'en' ? '/insights/' : `/${locale}/insights/`;
const urlFor = (locale) => `${productionBaseUrl}${routeFor(locale)}`;
const hrefFor = (locale, route) => locale === 'en' ? route : `/${locale}${route}`;
const cardHref = (locale, route) => /^https?:\/\//.test(route) ? route : hrefFor(locale, route);

async function readJson(file) {
  return JSON.parse(await fs.readFile(path.join(contentRoot, file), 'utf8'));
}

function assertHub(hub, locale, cards) {
  for (const key of ['seo', 'nav', 'hero', 'library', 'approach', 'cardCopy', 'footer']) {
    if (!hub[key]) throw new Error(`hub.${locale}.json is missing ${key}`);
  }
  for (const key of ['title', 'description']) if (!hub.seo[key]) throw new Error(`hub.${locale}.json seo.${key} is required`);
  for (const key of ['kicker', 'title', 'description']) if (!hub.hero[key]) throw new Error(`hub.${locale}.json hero.${key} is required`);
  if (!Array.isArray(hub.approach.points) || hub.approach.points.length < 3) throw new Error(`hub.${locale}.json needs three approach points`);
  for (const card of cards) {
    const copy = hub.cardCopy[card.slug];
    if (!copy) throw new Error(`hub.${locale}.json is missing cardCopy.${card.slug}; every English card requires reviewed RU and DE card copy.`);
    for (const key of ['tag', 'metric', 'title', 'summary', 'cta', 'availableInEnglish']) {
      if (!copy[key]) throw new Error(`hub.${locale}.json cardCopy.${card.slug}.${key} is required.`);
    }
  }
}

function stylesheet() {
  return `<style>
    :root{--paper:#fafaf7;--ink:#0a0a0a;--body:#1f1f1d;--muted:#66645f;--rule:#e5e4de;--accent:#0d9488;--red:#ff3d2e;--soft:#f0fdfa}*{box-sizing:border-box}body{margin:0;font-family:Geist,Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--body);background:var(--paper);line-height:1.6}a{color:inherit}.container{width:min(100% - 40px,1120px);margin:auto}.nav{position:sticky;top:0;z-index:10;border-bottom:1px solid var(--rule);background:rgba(250,250,247,.94);backdrop-filter:blur(14px)}.nav-inner{min-height:70px;display:flex;align-items:center;gap:24px;justify-content:space-between}.brand{display:flex;align-items:center;gap:10px;color:var(--ink);font-weight:800;text-decoration:none;white-space:nowrap}.brand-mark{width:34px;height:34px;border-radius:9px;background:#0a0a0a;object-fit:contain}.nav-links{display:flex;gap:24px;font:500 11px/1 "Geist Mono",monospace;letter-spacing:.14em;text-transform:uppercase}.nav-links a,.language a{text-decoration:none;color:var(--muted)}.nav-links a:hover,.language a:hover{color:var(--ink)}.right{display:flex;align-items:center;gap:14px}.language{display:flex;border:1px solid var(--rule);border-radius:7px;overflow:hidden}.language a{padding:7px 8px;font:700 11px/1 Geist,sans-serif}.language a[aria-current="page"]{background:var(--accent);color:#fff}.cta{display:inline-flex;min-height:42px;padding:9px 15px;align-items:center;justify-content:center;background:var(--accent);color:#fff;text-decoration:none;font-weight:700;border-radius:7px}.hero{padding:78px 0 56px;background:#fff;border-bottom:1px solid var(--rule)}.kicker,.tag{font:500 11px/1.3 "Geist Mono",monospace;letter-spacing:.15em;text-transform:uppercase;color:var(--accent)}h1,h2,h3{color:var(--ink);line-height:1.08}h1{max-width:920px;margin:15px 0 20px;font-size:clamp(42px,7vw,76px)}.hero p{max-width:750px;margin:0;color:var(--muted);font-size:clamp(18px,2vw,22px);line-height:1.45}main{padding:64px 0 80px}.section-head{display:flex;justify-content:space-between;gap:32px;align-items:end;margin-bottom:26px}h2{margin:0;font-size:clamp(28px,4vw,42px)}.section-note{max-width:470px;margin:0;color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.card,.approach{background:#fff;border:1px solid var(--rule);border-radius:5px}.card{min-height:330px;padding:27px;border-top:3px solid var(--red);display:flex;flex-direction:column}.metric{margin:17px 0 11px;color:var(--red);font-size:35px;font-weight:800;line-height:1}.card h3{font-size:22px;margin:0 0 12px}.card p{margin:0;color:var(--muted)}.card .availability{margin-top:auto;padding-top:18px;color:var(--muted);font-size:13px;line-height:1.35}.card a{display:inline-block;margin-top:8px;color:var(--red);font-weight:800;text-decoration:none}.approach{margin-top:60px;padding:clamp(25px,5vw,48px);background:var(--soft);border-color:#ccefe7}.approach-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(240px,.8fr);gap:44px}.approach p{color:var(--muted);font-size:18px}.approach ul{margin:0;padding-left:20px}.approach li{margin:0 0 13px}footer{border-top:1px solid var(--rule);padding:35px 0;background:#fff;color:var(--muted);font-size:14px}@media(max-width:850px){.nav-links{display:none}.grid,.approach-grid{grid-template-columns:1fr}.section-head{display:block}.section-note{margin-top:12px}.hero{padding:52px 0 44px}.brand span:last-child{display:none}}@media(max-width:460px){.container{width:min(100% - 28px,1120px)}.cta{display:none}.nav-inner{gap:12px}}
  </style>`;
}

function page({ locale, hub, cards }) {
  const alternates = locales.map((alternate) => `<link rel="alternate" hreflang="${alternate}" href="${urlFor(alternate)}">`).join('\n  ');
  const publishedCards = cards.filter((card) => hub.cardCopy[card.slug]);
  const destinationFor = (card) => card.articleLocales.includes(locale) ? cardHref(locale, card.route) : card.route;
  const itemList = publishedCards.map((card, index) => { const destination = destinationFor(card); return { '@type': 'ListItem', position: index + 1, url: /^https?:\/\//.test(destination) ? destination : `${productionBaseUrl}${destination}`, name: hub.cardCopy[card.slug].title }; });
  const jsonLd = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: hub.seo.title, description: hub.seo.description, url: urlFor(locale), inLanguage: locale, publisher: { '@type': 'Organization', name: 'AI Automation Studio', url: productionBaseUrl }, mainEntity: { '@type': 'ItemList', itemListElement: itemList } };
  const cardsHtml = publishedCards.length ? `<section aria-labelledby="library"><div class="section-head"><h2 id="library">${escapeHtml(hub.library.title)}</h2><p class="section-note">${escapeHtml(hub.library.description)}</p></div><div class="grid">${publishedCards.map((card) => { const copy = hub.cardCopy[card.slug]; const isLocalized = card.articleLocales.includes(locale); const href = destinationFor(card); const external = /^https?:\/\//.test(href); return `<article class="card"><div class="tag">${escapeHtml(copy.tag)}</div><div class="metric">${escapeHtml(copy.metric)}</div><h3>${escapeHtml(copy.title)}</h3><p>${escapeHtml(copy.summary)}</p>${isLocalized ? '' : `<div class="availability">${escapeHtml(copy.availableInEnglish)}</div>`}<a href="${escapeHtml(href)}"${external ? ' rel="noopener"' : ''}>${escapeHtml(copy.cta)}</a></article>`; }).join('')}</div></section>` : `<section aria-labelledby="library"><div class="section-head"><h2 id="library">${escapeHtml(hub.library.title)}</h2><p class="section-note">${escapeHtml(hub.library.description)}</p></div></section>`;
  const robotsMeta = shouldNoindex ? '<meta name="robots" content="noindex, nofollow">' : '';
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${robotsMeta}<title>${escapeHtml(hub.seo.title)}</title><meta name="description" content="${escapeHtml(hub.seo.description)}"><link rel="canonical" href="${urlFor(locale)}">${alternates}\n  <link rel="alternate" hreflang="x-default" href="${urlFor('en')}"><meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(hub.seo.title)}"><meta property="og:description" content="${escapeHtml(hub.seo.description)}"><meta property="og:url" content="${urlFor(locale)}"><meta name="twitter:card" content="summary"><link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any"><link rel="alternate icon" href="/favicon.ico" type="image/x-icon"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">${stylesheet()}<script type="application/ld+json">${JSON.stringify(jsonLd)}</script></head><body><nav class="nav"><div class="container nav-inner"><a class="brand" href="${locale === 'en' ? '/' : `/${locale}/`}"><img class="brand-mark" src="/favicon.svg" alt="AI Automation Studio logo" width="34" height="34"><span>AI Automation Studio</span></a><div class="nav-links"><a href="${locale === 'en' ? '/#services' : `/${locale}/#services`}">${escapeHtml(hub.nav.services)}</a><a href="${locale === 'en' ? '/cases/' : `/${locale}/cases/`}">${escapeHtml(hub.nav.cases)}</a><a href="${routeFor(locale)}">${escapeHtml(hub.nav.insights)}</a><a href="${locale === 'en' ? '/call/' : '/call/'}">${escapeHtml(hub.nav.contact)}</a></div><div class="right"><div class="language" aria-label="Language versions">${locales.map((alternate) => `<a href="${routeFor(alternate)}" hreflang="${alternate}" lang="${alternate}"${alternate === locale ? ' aria-current="page"' : ''}>${alternate.toUpperCase()}</a>`).join('')}</div><a class="cta" href="https://cal.com/boris-korol-fpkpqk/discovery-call">${escapeHtml(hub.nav.cta)}</a></div></div></nav><header class="hero"><div class="container"><div class="kicker">${escapeHtml(hub.hero.kicker)}</div><h1>${escapeHtml(hub.hero.title)}</h1><p>${escapeHtml(hub.hero.description)}</p></div></header><main class="container">${cardsHtml}<section class="approach" aria-labelledby="approach"><div class="approach-grid"><div><h2 id="approach">${escapeHtml(hub.approach.title)}</h2><p>${escapeHtml(hub.approach.description)}</p></div><ul>${hub.approach.points.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ul></div></section></main><footer><div class="container"><strong>AI Automation Studio</strong><br>${escapeHtml(hub.footer)}</div></footer></body></html>`;
}

const cards = (await readJson('cards.json')).cards;
for (const card of cards) if (!card.slug || !card.route || !Array.isArray(card.articleLocales) || !card.articleLocales.includes('en')) throw new Error('Each shared insight card needs slug, route, and an English articleLocales entry.');
for (const locale of locales) {
  const hub = await readJson(`hub.${locale}.json`);
  assertHub(hub, locale, cards);
  const outputPath = path.join(deployRoot, routeFor(locale).replace(/^\//, ''), 'index.html');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, page({ locale, hub, cards }));
}
console.log('Insights hubs rendered: /insights/, /ru/insights/, /de/insights/');
