const STOPWORDS = new Set(['vino','wine','botella','bottle','comprar','buy','de','del','la','el','los','las','un','una','y','en']);
const BLOCKED_HOSTS = [
  'google.com','google.es','books.google.','earth.google.','support.google.','microsoft.com','bing.com',
  'facebook.com','instagram.com','youtube.com','tiktok.com','pinterest.com','x.com','twitter.com'
];

function normalize(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}
function tokens(query = '') {
  return normalize(query).split(/[^a-z0-9]+/).filter(t => t.length > 1 && !STOPWORDS.has(t));
}
function hostOf(url = '') { try { return new URL(url).hostname.replace(/^www\./,''); } catch { return ''; } }
function isBlocked(host = '') { return BLOCKED_HOSTS.some(x => host === x || host.endsWith(`.${x}`) || host.includes(x)); }
function looksWineRelated(text = '') {
  return /\b(vino|wine|bodega|winery|celler|cellar|crianza|reserva|gran reserva|tinto|blanco|rosado|cava|rioja|ribera|denominacion|d\.o\.|dop|igp|uva|tempranillo|garnacha|verdejo|albarino)\b/i.test(normalize(text));
}
function relevance(item, query) {
  const hay = normalize(`${item.title || ''} ${item.snippet || ''} ${item.link || ''}`);
  const qTokens = tokens(query);
  if (!qTokens.length) return 0;
  const year = qTokens.find(t => /^(19|20)\d{2}$/.test(t));
  const nonYear = qTokens.filter(t => t !== year);
  const hits = qTokens.filter(t => hay.includes(t));
  const coreHits = nonYear.filter(t => hay.includes(t));
  const coverage = hits.length / qTokens.length;
  let score = coverage * 20 + coreHits.length * 3;
  if (nonYear[0] && normalize(item.title).includes(nonYear[0])) score += 8;
  if (looksWineRelated(hay)) score += 6;
  if (/bodega|winery|celler|cellers|bodegas/.test(normalize(item.link))) score += 4;
  if (year && !hay.includes(year)) score -= 18;
  if (coverage < 0.5 || (nonYear[0] && !hay.includes(nonYear[0]))) score -= 20;
  return score;
}
function imageRelevance(item, query) {
  const hay = normalize(`${item.title || ''} ${item.source || ''} ${item.domain || ''} ${item.link || ''}`);
  const qTokens = tokens(query);
  const brand = qTokens.find(t => !/^(19|20)\d{2}$/.test(t));
  let score = qTokens.filter(t => hay.includes(t)).length * 4;
  if (brand && hay.includes(brand)) score += 8;
  if (/vino|wine|bodega|tienda|vinoteca|celler/.test(hay)) score += 2;
  return score;
}

async function serper(endpoint, body, apiKey) {
  const response = await fetch(`https://google.serper.dev/${endpoint}`, {
    method: 'POST',
    headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Serper ${response.status}${detail ? `: ${detail.slice(0,180)}` : ''}`);
  }
  return response.json();
}

export default async function handler(req, res) {
  const q = String(req.query?.q || '').trim();
  if (q.length < 2) return res.status(400).json({ error: 'Escribe al menos 2 caracteres.' });

  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      code: 'SEARCH_NOT_CONFIGURED',
      error: 'La búsqueda fiable aún no está configurada. Añade SERPER_API_KEY en Vercel para activar Google Search dentro de Celler Roig.'
    });
  }

  try {
    const searchQuery = `${q} vino`;
    const imageQuery = `${q} vino botella`;
    const [webData, imageData] = await Promise.all([
      serper('search', { q: searchQuery, gl: 'es', hl: 'es', num: 12 }, apiKey),
      serper('images', { q: imageQuery, gl: 'es', hl: 'es', num: 12 }, apiKey).catch(() => ({ images: [] })),
    ]);

    const organic = Array.isArray(webData.organic) ? webData.organic : [];
    const results = organic
      .map((item, i) => ({
        id: `web-${i}`,
        title: String(item.title || '').trim(),
        url: String(item.link || '').trim(),
        snippet: String(item.snippet || '').trim(),
        source: hostOf(item.link || ''),
        provider: 'web',
        score: relevance(item, q),
      }))
      .filter(x => /^https?:\/\//i.test(x.url) && x.title && !isBlocked(x.source) && x.score > 2)
      .sort((a,b) => b.score - a.score)
      .slice(0, 7)
      .map(({score, ...rest}) => rest);

    const rawImages = Array.isArray(imageData.images) ? imageData.images : [];
    const images = rawImages
      .map((item, i) => ({
        id: `img-${i}`,
        title: String(item.title || '').trim(),
        imageUrl: String(item.imageUrl || '').trim(),
        thumbnailUrl: String(item.thumbnailUrl || item.imageUrl || '').trim(),
        pageUrl: String(item.link || '').trim(),
        source: String(item.source || item.domain || hostOf(item.link || '')).trim(),
        score: imageRelevance(item, q),
      }))
      .filter(x => /^https?:\/\//i.test(x.imageUrl) && x.score > 3)
      .sort((a,b) => b.score - a.score)
      .slice(0, 8)
      .map(({score, ...rest}) => rest);

    return res.status(200).json({ results, images, provider: 'serper' });
  } catch (err) {
    return res.status(502).json({
      error: 'La búsqueda de Internet ha fallado. Revisa la clave SERPER_API_KEY en Vercel o prueba de nuevo en unos segundos.'
    });
  }
}
