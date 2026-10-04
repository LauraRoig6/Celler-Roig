const TRUSTED = [
  'bodeboca.com','vivino.com','petitceller.com','vinoseleccion.com','vinatis.com',
  'decantalo.com','vinissimus.com','lavinia.com','millesima.com','idealwine.com'
];

function hostOf(url='') { try { return new URL(url).hostname.replace(/^www\./,'').toLowerCase(); } catch { return ''; } }
function isTrusted(host='') { return TRUSTED.some(d => host===d || host.endsWith(`.${d}`)); }
function norm(s='') { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function looksLikeWine(text='') {
  return /wine|vino|vin\b|bodega|winery|chateau|château|domaine|celler|crianza|reserva|rioja|ribera|bordeaux|bourgogne|champagne|chianti|barolo|brunello|prosecco|tempranillo|cabernet|merlot|pinot|chardonnay|sauvignon|garnacha|albari|verdejo|malbec|syrah|shiraz|riesling|verdejo|mencia|mencía/i.test(text);
}
function cleanTitle(title='') {
  return String(title)
    .replace(/\s*[|–—]\s*(Bodeboca|Vivino|Vinatis|Vinoselecci[oó]n|Petit Celler|Dec[aá]ntalo|Vinissimus|Lavinia|Millesima|iDealwine).*$/i,'')
    .replace(/\s+/g,' ').trim();
}
function normalizeCandidate(item, i) {
  const link = String(item.link || item.url || item.product_link || item.product_page || '').trim();
  const source = String(item.source || item.domain || item.merchant || hostOf(link) || '').trim();
  const imageUrl = String(item.image || item.image_url || item.thumbnail || item.thumbnail_url || item.original || '').trim();
  const title = cleanTitle(item.title || item.name || item.product_title || '');
  let score = 0;
  const host = hostOf(link) || source.toLowerCase();
  if (isTrusted(host) || TRUSTED.some(d => source.toLowerCase().includes(d.split('.')[0]))) score += 50;
  if (looksLikeWine(`${title} ${source}`)) score += 20;
  if (/\b(19|20)\d{2}\b/.test(title)) score += 5;
  if (/botella|bottle|75\s?cl/i.test(`${title} ${item.snippet||''}`)) score += 3;
  return { id:`lens-${i}`, title, imageUrl, thumbnailUrl:String(item.thumbnail || item.thumbnail_url || imageUrl).trim(), pageUrl:link, source, score };
}
function compactTextResults(data) {
  const rows = Array.isArray(data?.text_results) ? data.text_results : [];
  const raw = rows.map(x => String(x?.text || '').replace(/["“”]/g,'').trim()).filter(Boolean);
  const seen = new Set();
  const useful = [];
  for (const piece of raw) {
    const key = norm(piece);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (/^(75\s?cl|750\s?ml|13[.,]?\d\s?%|14[.,]?\d\s?%|alc\.?|vol\.?)$/i.test(piece)) continue;
    if (piece.length === 1 && !/\d/.test(piece)) continue;
    useful.push(piece);
  }
  return useful;
}
function queryFromLens(data, candidates=[]) {
  const kg = Array.isArray(data?.knowledge_graph) ? data.knowledge_graph : (data?.knowledge_graph ? [data.knowledge_graph] : []);
  const kgWine = kg.find(x => looksLikeWine(`${x?.title||''} ${x?.subtitle||''}`));
  if (kgWine?.title) return cleanTitle(kgWine.title);

  const textBits = compactTextResults(data);
  if (textBits.length) {
    // La pestaña Texto de Lens suele devolver nombre, gama y añada en piezas separadas.
    const joined = textBits.join(' ').replace(/\s+/g,' ').trim();
    const words = joined.split(/\s+/).filter(Boolean);
    const alpha = words.filter(w => /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}/.test(w));
    if (alpha.length >= 1 && joined.length >= 3) return words.slice(0,14).join(' ').slice(0,140);
  }

  const trusted = candidates.find(x => isTrusted(hostOf(x.pageUrl)) && x.title);
  if (trusted?.title) return trusted.title;
  const winey = candidates.find(x => looksLikeWine(`${x.title} ${x.source}`));
  return winey?.title || candidates[0]?.title || '';
}
async function runLens(imageId, apiKey, {type='all', autoCrop=false, q=''}={}) {
  const params = new URLSearchParams({ engine:'google_lens', image_id:imageId, type, hl:'es', country:'es', api_key:apiKey });
  if (autoCrop) params.set('auto_crop','true');
  if (q) params.set('q',q);
  const response = await fetch(`https://serpapi.com/search.json?${params}`, { signal: AbortSignal.timeout(28000) });
  const data = await response.json().catch(()=>({}));
  if (!response.ok || data.error) throw new Error(data.error || `Lens ${response.status}`);
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error:'Método no permitido.' });
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return res.status(503).json({ code:'LENS_NOT_CONFIGURED', error:'Falta SERPAPI_API_KEY en Vercel.' });

  const dataUrl = String(req.body?.imageDataUrl || '');
  const m = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i);
  if (!m) return res.status(400).json({ error:'La foto no tiene un formato válido.' });
  const buffer = Buffer.from(m[2], 'base64');
  if (buffer.length > 500_000) return res.status(413).json({ error:'La foto pesa demasiado. Inténtalo de nuevo.' });

  try {
    const form = new FormData();
    form.append('image', new Blob([buffer], { type:m[1] }), 'botella.jpg');
    form.append('api_key', apiKey);
    const upload = await fetch('https://serpapi.com/image', { method:'POST', body:form, signal:AbortSignal.timeout(18000) });
    const uploaded = await upload.json().catch(()=>({}));
    if (!upload.ok || uploaded.error || !uploaded.image_id) throw new Error(uploaded.error || `Image API ${upload.status}`);

    // Primera pasada: Lens puro, sin imponer "vino". Esto permite que lea la etiqueta y
    // evita que el texto de refinado distorsione el reconocimiento.
    let data = await runLens(uploaded.image_id, apiKey, { type:'all', autoCrop:false });
    let raw = [
      ...(Array.isArray(data.visual_matches) ? data.visual_matches : []),
      ...(Array.isArray(data.products) ? data.products : []),
      ...(Array.isArray(data.exact_matches) ? data.exact_matches : []),
    ];
    let candidates = raw.map(normalizeCandidate).filter(x => x.title || x.imageUrl).sort((a,b)=>b.score-a.score);
    let query = queryFromLens(data, candidates);

    // Segunda pasada sólo si la primera no da texto ni coincidencias útiles.
    if ((!query || query.length < 3) && candidates.length < 2) {
      const second = await runLens(uploaded.image_id, apiKey, { type:'visual_matches', autoCrop:true, q:'vino wine botella bottle' }).catch(()=>null);
      if (second) {
        data = second;
        raw = [
          ...(Array.isArray(second.visual_matches) ? second.visual_matches : []),
          ...(Array.isArray(second.products) ? second.products : []),
          ...(Array.isArray(second.exact_matches) ? second.exact_matches : []),
        ];
        candidates = raw.map(normalizeCandidate).filter(x => x.title || x.imageUrl).sort((a,b)=>b.score-a.score);
        query = queryFromLens(second, candidates);
      }
    }

    // Lens es sólo el identificador. Las imágenes finales se buscarán después en
    // Bodeboca/Vivino/Petit Celler/etc. con /api/wine-search.
    const matches = candidates
      .filter(x => /^https?:\/\//i.test(x.imageUrl || x.thumbnailUrl || ''))
      .filter((x, idx, arr) => arr.findIndex(y => `${norm(y.title)}|${y.imageUrl||y.thumbnailUrl}` === `${norm(x.title)}|${x.imageUrl||x.thumbnailUrl}`) === idx)
      .slice(0,8)
      .map(({score,...x})=>x);

    return res.status(200).json({
      query: String(query || '').trim(),
      recognizedText: compactTextResults(data).join(' · '),
      matches,
      provider:'google-lens',
    });
  } catch (error) {
    console.error('lens error', error);
    return res.status(502).json({
      error:'No he podido analizar la foto con Google Lens. Puedes seguir buscando por nombre sin perder la ficha.',
      detail: process.env.NODE_ENV === 'development' ? String(error?.message || error) : undefined,
    });
  }
}
