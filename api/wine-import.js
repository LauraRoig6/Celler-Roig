const APPELLATIONS = [
  { name: 'Ribera del Duero', region: 'Castilla y León', country:'España', aliases: ['ribera del duero'] },
  { name: 'Rioja', region: 'La Rioja', country:'España', aliases: ['doca rioja','d.o.c.a. rioja','denominación de origen calificada rioja','rioja'] },
  { name: 'Rueda', region: 'Castilla y León', country:'España', aliases: ['do rueda','d.o. rueda','rueda'] },
  { name: 'Toro', region: 'Castilla y León', country:'España', aliases: ['do toro','d.o. toro','toro'] },
  { name: 'Priorat', region: 'Cataluña', country:'España', aliases: ['doca priorat','doq priorat','priorat'] },
  { name: 'Rías Baixas', region: 'Galicia', country:'España', aliases: ['rías baixas','rias baixas'] },
  { name: 'Ribeiro', region: 'Galicia', country:'España', aliases: ['do ribeiro','ribeiro'] },
  { name: 'Valdeorras', region: 'Galicia', country:'España', aliases: ['valdeorras'] },
  { name: 'Jumilla', region: 'Región de Murcia', country:'España', aliases: ['do jumilla','jumilla'] },
  { name: 'Alicante', region: 'Comunitat Valenciana', country:'España', aliases: ['do alicante','alicante dop','alicante d.o.'] },
  { name: 'Valencia', region: 'Comunitat Valenciana', country:'España', aliases: ['do valencia','valencia dop','d.o. valencia'] },
  { name: 'Utiel-Requena', region: 'Comunitat Valenciana', country:'España', aliases: ['utiel-requena','utiel requena'] },
  { name: 'Cava', region: 'España', country:'España', aliases: ['do cava','d.o. cava','cava'] },
  { name: 'Penedès', region: 'Cataluña', country:'España', aliases: ['penedès','penedes'] },
  { name: 'Montsant', region: 'Cataluña', country:'España', aliases: ['montsant'] },
  { name: 'Navarra', region: 'Navarra', country:'España', aliases: ['do navarra','navarra dop','d.o. navarra'] },
  { name: 'Somontano', region: 'Aragón', country:'España', aliases: ['somontano'] },
  { name: 'Bierzo', region: 'Castilla y León', country:'España', aliases: ['bierzo'] },
  { name: 'Jerez-Xérès-Sherry', region: 'Andalucía', country:'España', aliases: ['jerez-xérès-sherry','jerez xeres sherry','sherry','jerez'] },
  { name: 'Bordeaux', region: 'Bordeaux', country:'Francia', aliases: ['bordeaux','médoc','medoc','saint-émilion','saint emilion','pomerol','pauillac','margaux'] },
  { name: 'Bourgogne', region: 'Bourgogne', country:'Francia', aliases: ['bourgogne','burgundy','chablis','côte de nuits','cote de nuits','côte de beaune','cote de beaune'] },
  { name: 'Champagne', region: 'Champagne', country:'Francia', aliases: ['champagne'] },
  { name: 'Alsace', region: 'Alsace', country:'Francia', aliases: ['alsace'] },
  { name: 'Côtes du Rhône', region: 'Rhône', country:'Francia', aliases: ['côtes du rhône','cotes du rhone','châteauneuf-du-pape','chateauneuf du pape','hermitage'] },
  { name: 'Loire', region: 'Val de Loire', country:'Francia', aliases: ['loire','sancerre','pouilly-fumé','pouilly fume','muscadet'] },
  { name: 'Provence', region: 'Provence', country:'Francia', aliases: ['provence','côtes de provence','cotes de provence'] },
  { name: 'Chianti Classico', region: 'Toscana', country:'Italia', aliases: ['chianti classico'] },
  { name: 'Brunello di Montalcino', region: 'Toscana', country:'Italia', aliases: ['brunello di montalcino'] },
  { name: 'Barolo', region: 'Piemonte', country:'Italia', aliases: ['barolo'] },
  { name: 'Barbaresco', region: 'Piemonte', country:'Italia', aliases: ['barbaresco'] },
  { name: 'Prosecco', region: 'Veneto / Friuli', country:'Italia', aliases: ['prosecco'] },
  { name: 'Amarone della Valpolicella', region: 'Veneto', country:'Italia', aliases: ['amarone della valpolicella','amarone'] },
  { name: 'Douro', region: 'Douro', country:'Portugal', aliases: ['douro'] },
  { name: 'Vinho Verde', region: 'Minho', country:'Portugal', aliases: ['vinho verde'] },
  { name: 'Dão', region: 'Dão', country:'Portugal', aliases: ['dão','dao'] },
  { name: 'Porto', region: 'Douro', country:'Portugal', aliases: ['porto','port wine'] },
  { name: 'Napa Valley', region: 'California', country:'Estados Unidos', aliases: ['napa valley','napa'] },
  { name: 'Sonoma', region: 'California', country:'Estados Unidos', aliases: ['sonoma'] },
  { name: 'Mendoza', region: 'Mendoza', country:'Argentina', aliases: ['mendoza'] },
  { name: 'Valle de Uco', region: 'Mendoza', country:'Argentina', aliases: ['uco valley','valle de uco'] },
  { name: 'Maipo Valley', region: 'Valle Central', country:'Chile', aliases: ['maipo valley','valle del maipo','maipo'] },
  { name: 'Colchagua Valley', region: 'Valle Central', country:'Chile', aliases: ['colchagua valley','valle de colchagua','colchagua'] },
  { name: 'Mosel', region: 'Mosel', country:'Alemania', aliases: ['mosel'] },
  { name: 'Rheingau', region: 'Rheingau', country:'Alemania', aliases: ['rheingau'] },
  { name: 'Marlborough', region: 'Marlborough', country:'Nueva Zelanda', aliases: ['marlborough'] },
  { name: 'Barossa Valley', region: 'South Australia', country:'Australia', aliases: ['barossa valley','barossa'] },
];

const GRAPES = [
  'Tempranillo','Tinta del País','Tinto Fino','Garnacha','Garnacha Tinta','Garnacha Blanca','Graciano','Mazuelo','Cariñena','Monastrell','Bobal','Albariño','Verdejo','Godello','Mencía','Treixadura','Loureiro','Macabeo','Viura','Xarel·lo','Xarel-lo','Parellada','Moscatel','Airén','Malvasía','Palomino','Pedro Ximénez',
  'Cabernet Sauvignon','Cabernet Franc','Merlot','Syrah','Shiraz','Pinot Noir','Chardonnay','Sauvignon Blanc','Riesling','Gewürztraminer','Chenin Blanc','Petit Verdot','Alicante Bouschet','Maturana Tinta','Malbec','Sangiovese','Nebbiolo','Barbera','Corvina','Rondinella','Pinot Grigio','Glera','Touriga Nacional','Touriga Franca','Tinta Roriz','Carmenère','Carmenere','Zinfandel','Grenache','Mourvèdre','Mourvedre','Viognier','Gamay','Sémillon','Semillon','Chasselas','Grüner Veltliner','Gruner Veltliner'
];

function decodeEntities(s = '') {
  return s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g,' ')
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));
}
function stripHtml(s = '') { return decodeEntities(s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()); }
function meta(html, key) {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["'][^>]*>`, 'i'),
  ];
  for (const p of patterns) { const m = html.match(p); if (m) return decodeEntities(m[1].trim()); }
  return '';
}
function titleTag(html) { return stripHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ''); }
function resolveUrl(value, base) { try { return new URL(Array.isArray(value) ? value[0] : value, base).toString(); } catch { return ''; } }
function flattenJsonLd(value, out = []) {
  if (Array.isArray(value)) value.forEach(v => flattenJsonLd(v, out));
  else if (value && typeof value === 'object') {
    out.push(value);
    if (Array.isArray(value['@graph'])) flattenJsonLd(value['@graph'], out);
  }
  return out;
}
function parseJsonLd(html) {
  const nodes = [];
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { flattenJsonLd(JSON.parse(decodeEntities(m[1].trim())), nodes); } catch {}
  }
  return nodes;
}
function asName(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return asName(v[0]);
  if (typeof v === 'object') return v.name || '';
  return '';
}

function normalizedLabel(s = '') {
  return stripHtml(String(s)).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9%]+/g,' ').replace(/\s+/g,' ').trim();
}
function extractPairs(html) {
  const pairs = [];
  for (const m of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...m[1].matchAll(/<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi)].map(x => stripHtml(x[1]));
    if (cells.length >= 2 && cells[0] && cells[1]) pairs.push([cells[0], cells.slice(1).join(' · ')]);
  }
  for (const m of html.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi)) {
    const a = stripHtml(m[1]), b = stripHtml(m[2]); if (a && b) pairs.push([a,b]);
  }
  for (const m of html.matchAll(/<(?:li|p|div)[^>]*>[\s\S]{0,120}?<(?:strong|b)[^>]*>([^<]{2,50})<\/(?:strong|b)>\s*:?\s*([^<]{2,120})/gi)) {
    const a = stripHtml(m[1]), b = stripHtml(m[2]); if (a && b) pairs.push([a,b]);
  }
  return pairs.slice(0, 400);
}
function pairValue(pairs, aliases) {
  const wanted = aliases.map(normalizedLabel);
  for (const [label, value] of pairs) {
    const n = normalizedLabel(label);
    if (wanted.some(a => n === a || n.includes(a) || a.includes(n))) return String(value || '').trim();
  }
  return '';
}
function bodyField(text='', labels='', stops='') {
  const safeStops = stops || 'Alcohol|Variedades|Uvas|Bodega|Denominación|Denominacion|Zona de elaboración|Zona de elaboracion|Maridaje|Servicio|Volumen|Precio|Añada|Anada|Envejecimiento|Notas de cata|Sobre';
  const re = new RegExp(`(?:${labels})\\s*[:\\-]?\\s*(.{2,220}?)(?=\\s(?:${safeStops})\\b|$)`, 'i');
  const m = String(text).match(re);
  return m ? String(m[1]).replace(/\\s+/g,' ').trim() : '';
}
function additionalPropertyMap(product) {
  const out = [];
  const values = Array.isArray(product?.additionalProperty) ? product.additionalProperty : product?.additionalProperty ? [product.additionalProperty] : [];
  for (const item of values) {
    if (!item || typeof item !== 'object') continue;
    const name = asName(item.name) || asName(item.propertyID);
    const value = asName(item.value) || asName(item.valueReference);
    if (name && value) out.push([name, value]);
  }
  return out;
}
function inferType(text) {
  const t = text.toLowerCase();
  if (/espumoso|sparkling|champagne|\bcava\b/.test(t)) return 'Espumoso';
  if (/rosado|rosé|rose wine/.test(t)) return 'Rosado';
  if (/vino blanco|white wine|\bblanco\b/.test(t)) return 'Blanco';
  if (/vino tinto|red wine|\btinto\b/.test(t)) return 'Tinto';
  return undefined;
}
function inferAging(text) {
  const t = text.toLowerCase();
  if (/gran reserva/.test(t)) return 'Gran Reserva';
  if (/\breserva\b/.test(t)) return 'Reserva';
  if (/\bcrianza\b/.test(t)) return 'Crianza';
  if (/\broble\b|oak aged|barrica/.test(t)) return 'Roble';
  if (/\bjoven\b|young wine/.test(t)) return 'Joven';
  return 'Sin indicar';
}
function inferAppellation(text) {
  const t = text.toLowerCase();
  for (const item of APPELLATIONS) {
    if (item.aliases.some(a => t.includes(a.toLowerCase()))) return { denomination: item.name, region: item.region, country:item.country, protection: item.country==='España' ? 'DOP' : 'Sin indicación' };
  }
  const igp = t.match(/(?:igp|i\.g\.p\.|vino de la tierra)\s*(?:de\s*)?([a-záéíóúüñ\- ]{3,50})/i);
  if (igp) return { denomination: igp[1].trim().replace(/\s{2,}/g,' '), region: '', country:'España', protection: 'IGP' };
  if (/\bigp\b|i\.g\.p\.|vino de la tierra/.test(t)) return { denomination: '', region: '', country:'España', protection: 'IGP' };
  if (/denominación de origen|denominacion de origen|\bd\.o\.\b|\bdo\b|\bdop\b/.test(t)) return { denomination: '', region: '', country:'España', protection: 'DOP' };
  return { denomination: '', region: '', country:'', protection: 'Sin indicación' };
}
const GRAPE_ALIASES={grenache:'Garnacha',garnatxa:'Garnacha','garnacha tinta':'Garnacha',shiraz:'Syrah','pinot grigio':'Pinot Gris',mourvedre:'Monastrell','mourvèdre':'Monastrell',mataro:'Monastrell','tinto fino':'Tempranillo','tinta del pais':'Tempranillo','tinta del país':'Tempranillo',cencibel:'Tempranillo','tinta roriz':'Tempranillo',viura:'Macabeo',carmenere:'Carmenère',semillon:'Sémillon','gruner veltliner':'Grüner Veltliner'};
function canonicalGrape(value=''){const clean=String(value).trim().replace(/\s+/g,' ');return GRAPE_ALIASES[normalizedLabel(clean)]||clean;}
function inferGrapes(text) {
  const t = normalizedLabel(text);
  const found = [];
  const seen = new Set();
  for (const grape of GRAPES) {
    if (!t.includes(normalizedLabel(grape))) continue;
    const canonical = canonicalGrape(grape);
    const key = normalizedLabel(canonical);
    if (seen.has(key)) continue;
    seen.add(key);
    found.push(canonical);
  }
  return found.slice(0, 6);
}
function inferAlcohol(text) {
  const matches = [...text.matchAll(/(\d{1,2}(?:[.,]\d)?)\s*%\s*(?:vol\.?|alc\.?|alcohol)?/gi)].map(m => Number(m[1].replace(',','.'))).filter(n => n >= 5 && n <= 25);
  return matches[0];
}
function pairingPreset(type, grapes = [], aging = '') {
  const all = grapes.join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if (type === 'Espumoso') return 'Aperitivos, marisco, sushi, arroces y frituras';
  if (type === 'Rosado') return 'Aperitivos, ensaladas, pasta, arroces y cocina mediterránea';
  if (type === 'Blanco') {
    if (/albarino|godello|verdejo|sauvignon|riesling/.test(all)) return 'Marisco, pescado, arroces y quesos suaves';
    if (/chardonnay|viognier/.test(all) && /roble|crianza|reserva/i.test(aging || '')) return 'Pescado, aves, pasta cremosa y quesos semicurados';
    return 'Pescado, marisco, aperitivos y platos ligeros';
  }
  if (type === 'Tinto') {
    if (/tempranillo|tinto fino|tinta del pais/.test(all)) return 'Carnes rojas, asados, embutidos y quesos curados';
    if (/cabernet|syrah|shiraz|malbec|monastrell|bobal/.test(all)) return 'Carnes rojas, guisos, barbacoa y quesos intensos';
    if (/pinot noir|gamay/.test(all)) return 'Aves, setas, carnes blancas y quesos suaves';
    if (/garnacha|grenache/.test(all)) return 'Carnes rojas, arroces, embutidos y quesos';
    return 'Carnes, guisos, embutidos y quesos';
  }
  return '';
}
function inferVintage(text) {
  const years = [...text.matchAll(/\b(19\d{2}|20\d{2})\b/g)].map(m => Number(m[1])).filter(y => y >= 1900 && y <= new Date().getFullYear()+1);
  return years[0];
}
function cleanProductName(name, siteTitle = '') {
  if (!name) return '';
  let s = stripHtml(name).replace(/\s*[|–—-]\s*(comprar|bodega|tienda|shop|vinoteca|wine).*/i,'').trim();
  if (siteTitle && s === siteTitle) s = s.split(/\s*[|–—]\s*/)[0].trim();
  return s;
}
function getOfferPrice(product) {
  const offers = Array.isArray(product?.offers) ? product.offers[0] : product?.offers;
  const p = offers?.price ?? offers?.lowPrice ?? offers?.highPrice;
  const n = Number(String(p || '').replace(',','.'));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
function isUnsafeHost(hostname) {
  const h = hostname.toLowerCase();
  return h === 'localhost' || h.endsWith('.local') || h === '0.0.0.0' || h === '::1' || /^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(h);
}

export default async function handler(req, res) {
  const urlRaw = String(req.query?.url || '').trim();
  const hint = String(req.query?.hint || '').trim();
  let url;
  try { url = new URL(urlRaw); } catch { return res.status(400).json({ error: 'El enlace no es válido.' }); }
  if (!/^https?:$/.test(url.protocol) || isUnsafeHost(url.hostname)) return res.status(400).json({ error: 'Ese enlace no se puede importar.' });

  try {
    const response = await fetch(url.toString(), {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1 CellerRoig/1.0',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) throw new Error('No es una página web');
    let html = await response.text();
    if (html.length > 2_500_000) html = html.slice(0, 2_500_000);

    const nodes = parseJsonLd(html);
    const product = nodes.find(n => {
      const t = n?.['@type'];
      return Array.isArray(t) ? t.some(x => String(x).toLowerCase() === 'product') : String(t || '').toLowerCase() === 'product';
    }) || {};

    const pageTitle = meta(html,'og:title') || titleTag(html);
    const description = asName(product.description) || meta(html,'og:description') || meta(html,'description');
    const bodyText = stripHtml(html);
    const pairs = [...additionalPropertyMap(product), ...extractPairs(html)];
    const grapePair = pairValue(pairs, ['uva','uvas','variedad','variedades','variedad de uva','variedades de uva','grape','grapes']) || bodyField(bodyText,'Variedades?|Uvas?|Grapes?','Alcohol|Bodega|Denominación|Denominacion|Zona de elaboración|Zona de elaboracion|Servicio|Volumen|Maridaje|Notas de cata|Sobre');
    const denominationPair = pairValue(pairs, ['denominacion de origen','denominación de origen','dop','d.o.','do','igp','indicacion geografica','indicación geográfica']) || bodyField(bodyText,'Denominación de origen|Denominacion de origen|Appellation','Bodega|Variedades|Uvas|Alcohol|Zona de elaboración|Zona de elaboracion|Servicio|Volumen|Maridaje|Notas de cata|Sobre');
    const wineryPair = pairValue(pairs, ['bodega','productor','elaborador','winery','producer','marca']) || bodyField(bodyText,'Bodega|Productor|Producer|Winery','Variedades|Uvas|Alcohol|Denominación|Denominacion|Zona de elaboración|Zona de elaboracion|Servicio|Volumen|Maridaje|Notas de cata|Sobre');
    const agingPair = pairValue(pairs, ['envejecimiento','crianza','maduracion','maduración','aging','barrica']);
    const typePair = pairValue(pairs, ['tipo de vino','tipo','wine type']);
    const alcoholPair = pairValue(pairs, ['graduacion','graduación','alcohol','grado alcoholico','grado alcohólico','% vol']) || bodyField(bodyText,'Alcohol|Graduación|Graduacion','Zona de elaboración|Zona de elaboracion|Denominación|Denominacion|Bodega|Variedades|Uvas|Servicio|Volumen|Maridaje|Notas de cata|Sobre');
    const countryPair = pairValue(pairs, ['pais','país','country']);
    const regionPair = pairValue(pairs, ['region','región','zona','comunidad autonoma','comunidad autónoma']);
    const classificationPair = pairValue(pairs, ['clasificacion','clasificación','classification','appellation','categoria','categoría']);
    const pairingPair = pairValue(pairs, ['maridaje','maridajes','food pairing','pairing','gastronomia','gastronomía','acompañamiento','acompanamiento','ideal con']) || bodyField(bodyText,'Maridaje|Food pairing|Pairing|Ideal con','Notas de cata|Sobre|Viñedo|Vinedo|Elaboración|Elaboracion|Opinión|Opinion|Temperatura|Envejecimiento');
    const combined = `${hint} ${product.name || ''} ${pageTitle} ${description} ${denominationPair} ${grapePair} ${agingPair} ${typePair} ${bodyText.slice(0, 180000)}`;
    const app = inferAppellation(`${denominationPair} ${combined}`);

    const productImage = Array.isArray(product.image) ? product.image[0] : (typeof product.image === 'object' ? product.image?.url : product.image);
    const imageUrl = resolveUrl(productImage || meta(html,'og:image') || meta(html,'twitter:image'), response.url || url.toString());
    const brand = asName(product.brand) || asName(product.manufacturer) || wineryPair;
    const name = cleanProductName(asName(product.name) || pageTitle, pageTitle);
    const vintage = inferVintage(`${hint} ${name} ${description}`) || inferVintage(combined);
    const grapes = inferGrapes(`${grapePair} ${combined}`);
    const type = inferType(`${typePair} ${name} ${description} ${combined.slice(0,50000)}`);
    const aging = inferAging(`${agingPair} ${name} ${description} ${combined.slice(0,50000)}`);
    const alcohol = inferAlcohol(`${alcoholPair} ${description} ${bodyText.slice(0,120000)}`);
    const price = getOfferPrice(product);
    const country = countryPair || app.country || (/\bespaña\b|\bspain\b/i.test(combined) ? 'España' : /\bfrance|francia\b/i.test(combined)?'Francia':/\bitaly|italia\b/i.test(combined)?'Italia':/\bportugal\b/i.test(combined)?'Portugal':'');
    const region = app.region || regionPair;
    const classification = classificationPair || (String(denominationPair).match(/\b(AOC|AOP|DOCG|DOCa|DOQ|DOC|AVA|IGP|DOP|IG|GI)\b/i)?.[1] || '');
    const pairing = String(pairingPair || '').replace(/\s+/g,' ').trim().slice(0,180) || pairingPreset(type, grapes, aging);
    const pairingSource = pairingPair ? 'web' : (pairing ? 'sugerencia' : '');

    const fieldsFound = [name, brand, vintage, type, aging !== 'Sin indicar' ? aging : '', app.denomination, grapes.length, alcohol, imageUrl, region].filter(Boolean).length;

    return res.status(200).json({
      wine: {
        name,
        winery: brand,
        vintage,
        type,
        grapes,
        aging,
        protection: app.protection,
        classification,
        denomination: app.denomination,
        region,
        country,
        alcohol,
        price,
        pairing,
        pairingSource,
        imageUrl,
        sourceUrl: response.url || url.toString(),
        sourceTitle: pageTitle,
        fieldsFound,
      }
    });
  } catch (err) {
    return res.status(502).json({ error: 'No he podido leer esa ficha. Prueba con otro resultado o pega la URL de la web oficial del vino.' });
  }
}
