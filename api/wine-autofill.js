function json(res, status, body) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').end(JSON.stringify(body));
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

function cleanText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalize(value = '') {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function normalizeType(value = '') {
  const v = normalize(value);
  if (!v) return 'Sin indicar';
  if (/espumoso|sparkling|champagne|cava|prosecco|frizzante/.test(v)) return 'Espumoso';
  if (/rosado|rose|rosé|rosat/.test(v)) return 'Rosado';
  if (/blanco|white|bianco|blanc/.test(v)) return 'Blanco';
  if (/tinto|red|rouge|rosso/.test(v)) return 'Tinto';
  return 'Sin indicar';
}

function normalizeAging(value = '') {
  const v = normalize(value);
  if (!v) return 'Sin indicar';
  if (v.includes('gran reserva')) return 'Gran Reserva';
  if (/\breserva\b/.test(v)) return 'Reserva';
  if (/\bcrianza\b/.test(v)) return 'Crianza';
  if (/\broble\b|barrica|oak/.test(v)) return 'Roble';
  if (/\bjoven\b|young/.test(v)) return 'Joven';
  return 'Sin indicar';
}

function normalizeProtection(value = '') {
  const v = normalize(value);
  if (!v) return 'Sin indicación';
  if (/igp|indicacion geografica|indicación geográfica|vino de la tierra/.test(v)) return 'IGP';
  if (/doq|doca|dop|do\b|aoc|aop|docg|doc\b|ava|gi\b/.test(v)) return 'DOP';
  return 'Sin indicación';
}

function normalizeGrapes(values) {
  const list = Array.isArray(values)
    ? values
    : String(values || '').split(/[,;·\n]/g);
  const aliases = {
    'grenache': 'Garnacha', 'garnatxa': 'Garnacha', 'garnacha tinta': 'Garnacha',
    'shiraz': 'Syrah', 'pinot grigio': 'Pinot Gris', 'mourvedre': 'Monastrell',
    'mourvèdre': 'Monastrell', 'mataro': 'Monastrell', 'tinto fino': 'Tempranillo',
    'tinta del pais': 'Tempranillo', 'tinta del país': 'Tempranillo', 'cencibel': 'Tempranillo',
    'tinta roriz': 'Tempranillo', 'viura': 'Macabeo', 'carmenere': 'Carmenère',
    'semillon': 'Sémillon', 'gruner veltliner': 'Grüner Veltliner'
  };
  const out = [];
  const seen = new Set();
  for (const raw of list) {
    const clean = cleanText(raw);
    if (!clean) continue;
    const key = normalize(clean);
    const canonical = aliases[key] || clean;
    const dedupe = normalize(canonical);
    if (!dedupe || seen.has(dedupe)) continue;
    seen.add(dedupe);
    out.push(canonical);
  }
  return out;
}

function clampConfidence(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.min(1, n));
}

function safeNumber(value) {
  const n = Number(String(value ?? '').replace(',', '.').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function safeYear(value) {
  const m = String(value || '').match(/\b(19|20)\d{2}\b/);
  return m ? Number(m[0]) : undefined;
}

function buildQuery(data) {
  return [data.name, data.winery, data.vintage].filter(Boolean).join(' ').trim();
}

async function callOpenAI(frontImageDataUrl, backImageDataUrl) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_NOT_CONFIGURED');

  const content = [
    {
      type: 'text',
      text: [
        'Analiza estas fotos de etiquetas de vino (delantera y opcionalmente trasera).',
        'Extrae solo datos claramente visibles o muy razonables a partir de la etiqueta.',
        'Si no estás seguro, deja el campo vacío o con valor neutral.',
        'Es MUY importante no confundir un tinto con un espumoso. Solo marca "Espumoso" si la etiqueta o el texto sugieren claramente cava, champagne, prosecco, sparkling, brut, etc.',
        'Si ves palabras como crianza, reserva, tempranillo, rioja, ribera, etc., eso NO implica espumoso.',
        'Devuelve únicamente JSON válido con esta estructura exacta:',
        '{"name":"","winery":"","vintage":null,"type":"Sin indicar","typeConfidence":0,"grapes":[],"aging":"Sin indicar","protection":"Sin indicación","classification":"","denomination":"","region":"","country":"","alcohol":null,"pairing":"","rawText":"","query":""}',
        'En "rawText" resume brevemente el texto clave reconocido de las etiquetas.',
        'En "query" pon una búsqueda breve útil para encontrar la botella en webs de vino.'
      ].join(' ')
    },
    { type: 'image_url', image_url: { url: frontImageDataUrl } },
  ];
  if (backImageDataUrl) content.push({ type: 'image_url', image_url: { url: backImageDataUrl } });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Eres un extractor preciso de fichas de vino. No inventes información. Si dudas, deja el campo vacío o sin indicar.'
        },
        { role: 'user', content }
      ]
    }),
    signal: AbortSignal.timeout(60000),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `OpenAI ${response.status}`;
    throw new Error(message);
  }

  const contentText = data?.choices?.[0]?.message?.content;
  if (!contentText) throw new Error('La IA no ha devuelto contenido.');
  let parsed;
  try {
    parsed = JSON.parse(contentText);
  } catch {
    throw new Error('La respuesta de la IA no se pudo leer.');
  }
  return parsed;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método no permitido.' });

  try {
    const body = parseBody(req);
    const frontImageDataUrl = String(body.frontImageDataUrl || '');
    const backImageDataUrl = String(body.backImageDataUrl || '');

    if (!/^data:image\//.test(frontImageDataUrl)) {
      return json(res, 400, { error: 'Falta la foto delantera de la etiqueta.' });
    }

    const raw = await callOpenAI(frontImageDataUrl, backImageDataUrl);
    const wine = {
      name: cleanText(raw.name),
      winery: cleanText(raw.winery),
      vintage: safeYear(raw.vintage),
      type: normalizeType(raw.type),
      typeConfidence: clampConfidence(raw.typeConfidence) ?? 0.9,
      grapes: normalizeGrapes(raw.grapes),
      aging: normalizeAging(raw.aging),
      protection: normalizeProtection(raw.protection || raw.classification),
      classification: cleanText(raw.classification),
      denomination: cleanText(raw.denomination),
      region: cleanText(raw.region),
      country: cleanText(raw.country),
      alcohol: safeNumber(raw.alcohol),
      pairing: cleanText(raw.pairing),
      pairingSource: cleanText(raw.pairing) ? 'label' : '',
      rawText: cleanText(raw.rawText),
      sourceTitle: 'IA desde etiquetas',
      sourceUrl: '',
    };

    const query = cleanText(raw.query) || buildQuery(wine);
    const fieldsFound = [
      wine.name, wine.winery, wine.vintage, wine.type !== 'Sin indicar', wine.grapes.length,
      wine.aging !== 'Sin indicar', wine.denomination, wine.region, wine.country, wine.alcohol,
    ].filter(Boolean).length;

    return json(res, 200, {
      wine: { ...wine, fieldsFound },
      query,
      source: 'IA desde etiquetas',
    });
  } catch (error) {
    console.error('wine-autofill error', error);
    const message = String(error?.message || error || '');
    if (message === 'OPENAI_NOT_CONFIGURED') {
      return json(res, 503, { code: 'OPENAI_NOT_CONFIGURED', error: 'Falta OPENAI_API_KEY en Vercel.' });
    }
    return json(res, 500, { error: 'No he podido leer las etiquetas con IA. Revisa que OPENAI_API_KEY esté bien configurada e inténtalo de nuevo.' });
  }
}
