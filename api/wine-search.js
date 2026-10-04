function decodeXml(s = '') {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripHtml(s = '') {
  return decodeXml(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function sourceName(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

function scoreResult(item, query) {
  const hay = `${item.title} ${item.snippet} ${item.url}`.toLowerCase();
  const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  let score = tokens.reduce((n, t) => n + (hay.includes(t) ? 3 : 0), 0);
  if (/bodega|wine|vino|vinoteca|enoteca|celler|do\b|d\.o\.|crianza|reserva|añada|vintage/.test(hay)) score += 4;
  if (/facebook|instagram|pinterest|youtube|tiktok|amazon/.test(item.url)) score -= 6;
  if (/vivino/.test(item.url)) score += 1;
  if (/bodegas|winery|cellers|celler/.test(item.url)) score += 3;
  return score;
}

async function searchBing(query) {
  const q = `${query} vino botella`;
  const url = `https://www.bing.com/search?q=${encodeURIComponent(q)}&format=rss&count=12&mkt=es-ES`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CellerRoig/1.0; +https://vercel.app)',
      'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`Bing ${res.status}`);
  const xml = await res.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((m, i) => {
    const block = m[1];
    const title = decodeXml((block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '').trim());
    const link = decodeXml((block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || '').trim());
    const description = stripHtml(block.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || '');
    return { id: `web-${i}`, title: stripHtml(title), url: link, snippet: description, source: sourceName(link), provider: 'web' };
  }).filter(x => /^https?:\/\//i.test(x.url));

  return items
    .map(x => ({ ...x, score: scoreResult(x, query) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ score, ...x }) => x);
}

async function searchOpenFoodFacts(query) {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '8',
    fields: 'code,product_name,brands,image_url,image_front_url,countries,categories,nutriments,origins,manufacturing_places,labels',
  });
  const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`, {
    headers: { 'User-Agent': 'CellerRoig/1.0 (personal wine cellar)' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`OFF ${res.status}`);
  const data = await res.json();
  const products = Array.isArray(data.products) ? data.products : [];
  return products.filter(p => p.product_name).slice(0, 6).map((p, i) => ({
    id: `off-${p.code || i}`,
    title: p.product_name,
    url: p.code ? `https://world.openfoodfacts.org/product/${p.code}` : '',
    snippet: [p.brands, p.categories].filter(Boolean).join(' · '),
    source: 'Open Food Facts',
    provider: 'catalog',
    directData: {
      name: p.product_name || '',
      winery: (p.brands || '').split(',')[0]?.trim() || '',
      imageUrl: p.image_url || p.image_front_url || '',
      country: (p.origins || p.manufacturing_places || p.countries || '').split(',')[0]?.trim() || '',
      categories: p.categories || '',
      alcohol: Number(p.nutriments?.alcohol) || undefined,
      rawText: [p.product_name,p.brands,p.categories,p.origins,p.manufacturing_places,p.labels].filter(Boolean).join(' '),
    },
  }));
}

export default async function handler(req, res) {
  const q = String(req.query?.q || '').trim();
  if (q.length < 2) return res.status(400).json({ error: 'Escribe al menos 2 caracteres.' });

  try {
    const webResults = await searchBing(q);
    if (webResults.length) return res.status(200).json({ results: webResults, provider: 'web' });
  } catch (err) {
    // Fallback below.
  }

  try {
    const catalogResults = await searchOpenFoodFacts(q);
    return res.status(200).json({ results: catalogResults, provider: 'catalog', fallback: true });
  } catch {
    return res.status(503).json({ error: 'No he podido consultar Internet ahora mismo.' });
  }
}
