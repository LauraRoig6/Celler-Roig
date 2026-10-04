const TRUSTED = [
  'bodeboca.com','vivino.com','petitceller.com','vinoseleccion.com','vinatis.com',
  'decantalo.com','vinissimus.com','lavinia.com','millesima.com','idealwine.com'
];

function hostOf(url='') { try { return new URL(url).hostname.replace(/^www\./,'').toLowerCase(); } catch { return ''; } }
function isTrusted(host='') { return TRUSTED.some(d => host===d || host.endsWith(`.${d}`)); }
function norm(s='') { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function looksLikeWine(text='') {
  return /wine|vino|vin\b|bodega|winery|chateau|château|domaine|celler|crianza|reserva|rioja|ribera|bordeaux|bourgogne|champagne|chianti|barolo|brunello|prosecco|tempranillo|cabernet|merlot|pinot|chardonnay|sauvignon|garnacha|albari|verdejo|malbec/i.test(text);
}
function cleanTitle(title='') {
  return String(title).replace(/\s*[|–—]\s*(Bodeboca|Vivino|Vinatis|Vinoselecci[oó]n|Petit Celler|Dec[aá]ntalo|Vinissimus|Lavinia).*$/i,'').replace(/\s+/g,' ').trim();
}
function candidateScore(item) {
  const title = String(item.title || item.name || '');
  const link = String(item.link || item.url || item.product_link || '');
  const source = String(item.source || item.domain || item.merchant || hostOf(link));
  const host = hostOf(link) || source.toLowerCase();
  let score = 0;
  if (isTrusted(host) || TRUSTED.some(d => host.includes(d) || source.toLowerCase().includes(d.split('.')[0]))) score += 40;
  if (looksLikeWine(`${title} ${source}`)) score += 18;
  if (/\b(19|20)\d{2}\b/.test(title)) score += 4;
  if (/botella|bottle|75\s?cl/i.test(`${title} ${item.snippet||''}`)) score += 3;
  if (/glass|copa|pack|caja|case|magnum.*6|set/i.test(title)) score -= 6;
  return score;
}
function normalizeCandidate(item, i) {
  const link = String(item.link || item.url || item.product_link || item.product_page || '').trim();
  const source = String(item.source || item.domain || item.merchant || hostOf(link) || '').trim();
  const imageUrl = String(item.image || item.image_url || item.thumbnail || item.thumbnail_url || item.original || '').trim();
  return {
    id: `lens-${i}`,
    title: cleanTitle(item.title || item.name || item.product_title || ''),
    imageUrl,
    thumbnailUrl: String(item.thumbnail || item.thumbnail_url || imageUrl).trim(),
    pageUrl: link,
    source,
    score: candidateScore(item),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return res.status(503).json({ code: 'LENS_NOT_CONFIGURED', error: 'Falta SERPAPI_API_KEY en Vercel.' });
  const dataUrl = String(req.body?.imageDataUrl || '');
  const m = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i);
  if (!m) return res.status(400).json({ error: 'La foto no tiene un formato válido.' });
  const buffer = Buffer.from(m[2], 'base64');
  if (buffer.length > 500_000) return res.status(413).json({ error: 'La foto pesa demasiado. Inténtalo de nuevo.' });
  try {
    const form = new FormData();
    form.append('image', new Blob([buffer], { type: m[1] }), 'botella.jpg');
    form.append('api_key', apiKey);
    const upload = await fetch('https://serpapi.com/image', { method: 'POST', body: form, signal: AbortSignal.timeout(15000) });
    const uploaded = await upload.json();
    if (!upload.ok || uploaded.error || !uploaded.image_id) throw new Error(uploaded.error || `Image API ${upload.status}`);

    const params = new URLSearchParams({
      engine: 'google_lens', image_id: uploaded.image_id, type: 'all', hl: 'es', country: 'es',
      auto_crop: 'true', q: 'wine bottle vino botella', api_key: apiKey,
    });
    const lensRes = await fetch(`https://serpapi.com/search.json?${params}`, { signal: AbortSignal.timeout(25000) });
    const data = await lensRes.json();
    if (!lensRes.ok || data.error) throw new Error(data.error || `Lens ${lensRes.status}`);

    const raw = [
      ...(Array.isArray(data.visual_matches) ? data.visual_matches : []),
      ...(Array.isArray(data.products) ? data.products : []),
      ...(Array.isArray(data.exact_matches) ? data.exact_matches : []),
    ];
    const seen = new Set();
    const matches = raw.map(normalizeCandidate)
      .filter(x => x.title && x.imageUrl && /^https?:\/\//i.test(x.imageUrl))
      .filter(x => { const k = `${norm(x.title)}|${x.imageUrl}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .filter(x => x.score >= 12)
      .sort((a,b) => b.score-a.score)
      .slice(0, 12)
      .map(({score, ...x}) => x);

    // La consulta textual que usaremos después para rellenar la ficha.
    const trusted = matches.find(x => isTrusted(hostOf(x.pageUrl)));
    const first = trusted || matches[0];
    const query = first?.title || String(data.search_information?.query_displayed || data.search_parameters?.q || '').trim();
    return res.status(200).json({ query, matches, provider: 'google-lens' });
  } catch (error) {
    console.error('lens error', error);
    return res.status(502).json({ error: 'Google Lens no ha podido reconocer esta botella. Prueba con la etiqueta de frente y buena luz.' });
  }
}
