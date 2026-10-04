const STOPWORDS = new Set(['vino','wine','botella','bottle','comprar','buy','de','del','la','el','los','las','un','una','y','en','con']);
const BLOCKED_HOSTS = [
  'google.com','google.es','books.google.','earth.google.','support.google.','microsoft.com','bing.com',
  'facebook.com','instagram.com','youtube.com','tiktok.com','pinterest.com','x.com','twitter.com'
];
const APPELLATIONS = [
  ['Ribera del Duero','Castilla y León',['ribera del duero']],
  ['Rioja','La Rioja',['doca rioja','d.o.c.a. rioja','denominación de origen calificada rioja','rioja']],
  ['Rueda','Castilla y León',['do rueda','d.o. rueda','rueda']],
  ['Toro','Castilla y León',['do toro','d.o. toro','toro']],
  ['Priorat','Cataluña',['doca priorat','doq priorat','priorat']],
  ['Rías Baixas','Galicia',['rías baixas','rias baixas']],
  ['Ribeiro','Galicia',['do ribeiro','ribeiro']],
  ['Valdeorras','Galicia',['valdeorras']],
  ['Monterrei','Galicia',['monterrei']],
  ['Jumilla','Región de Murcia',['do jumilla','jumilla']],
  ['Yecla','Región de Murcia',['do yecla','yecla']],
  ['Bullas','Región de Murcia',['do bullas','bullas']],
  ['Alicante','Comunitat Valenciana',['do alicante','alicante dop','alicante d.o.']],
  ['Valencia','Comunitat Valenciana',['do valencia','valencia dop','d.o. valencia']],
  ['Utiel-Requena','Comunitat Valenciana',['utiel-requena','utiel requena']],
  ['Cava','España',['do cava','d.o. cava','cava']],
  ['Penedès','Cataluña',['penedès','penedes']],
  ['Montsant','Cataluña',['montsant']],
  ['Empordà','Cataluña',['empordà','emporda']],
  ['Costers del Segre','Cataluña',['costers del segre']],
  ['Terra Alta','Cataluña',['terra alta']],
  ['Pla de Bages','Cataluña',['pla de bages']],
  ['Navarra','Navarra',['do navarra','navarra dop','d.o. navarra']],
  ['Somontano','Aragón',['somontano']],
  ['Cariñena','Aragón',['cariñena','carinena']],
  ['Calatayud','Aragón',['calatayud']],
  ['Campo de Borja','Aragón',['campo de borja']],
  ['La Mancha','Castilla-La Mancha',['do la mancha','la mancha dop','d.o. la mancha']],
  ['Valdepeñas','Castilla-La Mancha',['valdepeñas','valdepenas']],
  ['Manchuela','Castilla-La Mancha',['manchuela']],
  ['Almansa','Castilla-La Mancha',['almansa']],
  ['Méntrida','Castilla-La Mancha',['méntrida','mentrida']],
  ['Vinos de Madrid','Comunidad de Madrid',['vinos de madrid']],
  ['Bierzo','Castilla y León',['bierzo']],
  ['Cigales','Castilla y León',['cigales']],
  ['Arlanza','Castilla y León',['arlanza']],
  ['Arribes','Castilla y León',['arribes']],
  ['Málaga','Andalucía',['do málaga','do malaga','málaga dop','malaga dop']],
  ['Montilla-Moriles','Andalucía',['montilla-moriles','montilla moriles']],
  ['Jerez-Xérès-Sherry','Andalucía',['jerez-xérès-sherry','jerez xeres sherry','sherry','jerez']],
];
const GRAPES = [
  'Tempranillo','Tinta del País','Tinto Fino','Garnacha','Garnacha Tinta','Garnacha Blanca','Graciano','Mazuelo','Cariñena',
  'Monastrell','Bobal','Albariño','Verdejo','Godello','Mencía','Treixadura','Loureiro','Macabeo','Viura','Xarel·lo','Xarel-lo','Parellada',
  'Moscatel','Airén','Malvasía','Palomino','Pedro Ximénez','Cabernet Sauvignon','Cabernet Franc','Merlot','Syrah','Shiraz','Pinot Noir',
  'Chardonnay','Sauvignon Blanc','Riesling','Gewürztraminer','Chenin Blanc','Petit Verdot','Alicante Bouschet','Maturana Tinta'
];

function normalize(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}
function tokens(query = '') {
  return normalize(query).split(/[^a-z0-9]+/).filter(t => t.length > 1 && !STOPWORDS.has(t));
}
function hostOf(url = '') { try { return new URL(url).hostname.replace(/^www\./,''); } catch { return ''; } }
function isBlocked(host = '') { return BLOCKED_HOSTS.some(x => host === x || host.endsWith(`.${x}`) || host.includes(x)); }
function titleCase(text='') { return text.replace(/\b([a-záéíóúüñ])/gi, m => m.toUpperCase()); }
function cleanQueryName(q='') {
  return titleCase(q.replace(/\b(19|20)\d{2}\b/g,'').replace(/\s+/g,' ').trim());
}
function inferType(text='') {
  const t = normalize(text);
  if (/espumoso|sparkling|champagne|\bcava\b/.test(t)) return 'Espumoso';
  if (/rosado|rose wine|rose\b/.test(t)) return 'Rosado';
  if (/vino blanco|white wine|\bblanco\b/.test(t)) return 'Blanco';
  if (/generoso|sherry|jerez|oloroso|amontillado/.test(t)) return 'Generoso';
  if (/vino tinto|red wine|\btinto\b/.test(t)) return 'Tinto';
  return undefined;
}
function inferAging(text='') {
  const t = normalize(text);
  if (/gran reserva/.test(t)) return 'Gran Reserva';
  if (/\breserva\b/.test(t)) return 'Reserva';
  if (/\bcrianza\b/.test(t)) return 'Crianza';
  if (/\broble\b|barrica|oak aged/.test(t)) return 'Roble';
  if (/\bjoven\b|young wine/.test(t)) return 'Joven';
  return undefined;
}
function inferAppellation(text='') {
  const t = normalize(text);
  for (const [name, region, aliases] of APPELLATIONS) {
    if (aliases.some(a => t.includes(normalize(a)))) return { denomination:name, region, protection:'DOP' };
  }
  const raw = String(text);
  const igp = raw.match(/(?:IGP|I\.G\.P\.|vino de la tierra)\s*(?:de\s*)?([A-ZÁÉÍÓÚÜÑa-záéíóúüñ\- ]{3,50})/i);
  if (igp) return { denomination: igp[1].trim(), region:'', protection:'IGP' };
  if (/\bigp\b|i\.g\.p\.|vino de la tierra/i.test(raw)) return { denomination:'', region:'', protection:'IGP' };
  if (/denominaci[oó]n de origen|\bd\.o\.|\bdop\b/i.test(raw)) return { denomination:'', region:'', protection:'DOP' };
  return { denomination:'', region:'', protection:undefined };
}
function inferGrapes(text='') {
  const t = normalize(text);
  const found = [];
  for (const grape of GRAPES) {
    if (t.includes(normalize(grape)) && !found.some(x => normalize(x) === normalize(grape))) found.push(grape);
  }
  return found.slice(0,6);
}
function inferAlcohol(text='') {
  const found = [...String(text).matchAll(/(\d{1,2}(?:[.,]\d)?)\s*%\s*(?:vol\.?|alc\.?|alcohol)?/gi)]
    .map(m => Number(m[1].replace(',','.'))).filter(n => n >= 5 && n <= 25);
  return found[0];
}
function inferVintage(text='') {
  const years = [...String(text).matchAll(/\b(19\d{2}|20\d{2})\b/g)].map(m => Number(m[1]));
  return years.find(y => y >= 1900 && y <= new Date().getFullYear()+1);
}
function inferWinery(text='') {
  const raw = String(text);
  const m = raw.match(/\b(Bodegas?\s+[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9&'.-]*(?:\s+[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9&'.-]*){0,3})\b/);
  if (m) return m[1].replace(/[|–—].*$/,'').trim();
  return '';
}
function relevance(item, query) {
  const hay = normalize(`${item.title || ''} ${item.snippet || ''} ${item.link || ''}`);
  const qTokens = tokens(query);
  const hits = qTokens.filter(t => hay.includes(t));
  const year = qTokens.find(t => /^(19|20)\d{2}$/.test(t));
  let score = hits.length * 7;
  if (qTokens[0] && normalize(item.title || '').includes(qTokens[0])) score += 10;
  if (/vino|wine|bodega|winery|celler|crianza|reserva|tinto|blanco|rosado|ribera|rioja/.test(hay)) score += 5;
  if (year && hay.includes(year)) score += 7;
  if (year && !hay.includes(year)) score -= 6;
  return score;
}
function imageRelevance(item, query) {
  const hay = normalize(`${item.title || ''} ${item.source || ''} ${item.domain || ''} ${item.link || ''} ${item.imageUrl || ''}`);
  const qTokens = tokens(query);
  const nonYear = qTokens.filter(t => !/^(19|20)\d{2}$/.test(t));
  let score = qTokens.filter(t => hay.includes(t)).length * 7;
  if (nonYear[0] && hay.includes(nonYear[0])) score += 12;
  if (/botella|bottle|vino|wine|bodega|vinoteca|tienda/.test(hay)) score += 3;
  if (/\.png(?:\?|$)/i.test(item.imageUrl || '')) score += 2;
  return score;
}
async function serper(endpoint, body, apiKey) {
  const response = await fetch(`https://google.serper.dev/${endpoint}`, {
    method:'POST', headers:{'X-API-KEY':apiKey,'Content-Type':'application/json'}, body:JSON.stringify(body), signal:AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`Serper ${response.status}`);
  return response.json();
}

export default async function handler(req,res) {
  const q = String(req.query?.q || '').trim();
  if (q.length < 2) return res.status(400).json({error:'Escribe al menos 2 caracteres.'});
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return res.status(503).json({code:'SEARCH_NOT_CONFIGURED',error:'Falta SERPER_API_KEY en Vercel.'});

  try {
    const [webData, imageData] = await Promise.all([
      serper('search',{q:`${q} vino ficha técnica uva denominación graduación`,gl:'es',hl:'es',num:14},apiKey),
      serper('images',{q:`${q} botella vino`,gl:'es',hl:'es',num:18},apiKey).catch(()=>({images:[]})),
    ]);

    const organic = (Array.isArray(webData.organic)?webData.organic:[])
      .map((item,i)=>({
        id:`web-${i}`, title:String(item.title||'').trim(), url:String(item.link||'').trim(), snippet:String(item.snippet||'').trim(), source:hostOf(item.link||''), score:relevance(item,q)
      }))
      .filter(x=>/^https?:\/\//i.test(x.url)&&x.title&&!isBlocked(x.source)&&x.score>4)
      .sort((a,b)=>b.score-a.score)
      .slice(0,9);

    const combined = `${q} ${organic.map(x=>`${x.title}. ${x.snippet}`).join(' ')}`;
    const app = inferAppellation(combined);
    const wine = {
      name: cleanQueryName(q),
      winery: inferWinery(combined),
      vintage: inferVintage(q) || inferVintage(combined),
      type: inferType(combined),
      grapes: inferGrapes(combined),
      aging: inferAging(combined),
      protection: app.protection,
      denomination: app.denomination,
      region: app.region,
      country: app.denomination || /\bespaña\b|\bspain\b/i.test(combined) ? 'España' : '',
      alcohol: inferAlcohol(combined),
      rawText: combined.slice(0,12000),
    };
    wine.fieldsFound = [wine.name,wine.winery,wine.vintage,wine.type,wine.grapes.length,wine.aging,wine.denomination,wine.region,wine.country,wine.alcohol].filter(Boolean).length;

    const rawImages = Array.isArray(imageData.images)?imageData.images:[];
    const images = rawImages
      .map((item,i)=>({
        id:`img-${i}`,
        title:String(item.title||'').trim(),
        imageUrl:String(item.imageUrl||'').trim(),
        thumbnailUrl:String(item.thumbnailUrl||item.imageUrl||'').trim(),
        pageUrl:String(item.link||'').trim(),
        source:String(item.source||item.domain||hostOf(item.link||'')).trim(),
        score:imageRelevance(item,q),
      }))
      .filter(x=>/^https?:\/\//i.test(x.imageUrl)&&x.score>5)
      .sort((a,b)=>b.score-a.score)
      .slice(0,10)
      .map(({score,...rest})=>rest);

    return res.status(200).json({wine,images,provider:'serper',sources:organic.slice(0,5).map(({score,...x})=>x)});
  } catch {
    return res.status(502).json({error:'No se ha podido buscar el vino ahora mismo. Prueba de nuevo en unos segundos.'});
  }
}
