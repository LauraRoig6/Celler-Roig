const TRUSTED_DOMAINS = [
  'decantalo.com','bodeboca.com','vinissimus.com','vinatis.com','petitceller.com','vilaviniteca.es',
  'vivino.com','wine-searcher.com','verema.com','vinoseleccion.com','lavinia.com','millesima.com',
  'idealwine.com','decanter.com','guiapenin.wine','cellartracker.com'
];
const IMAGE_DOMAINS = ['decantalo.com','bodeboca.com','vinissimus.com','vinatis.com','petitceller.com','vilaviniteca.es','vivino.com'];

function json(res,status,body){res.setHeader('Cache-Control','no-store, max-age=0');res.status(status).setHeader('Content-Type','application/json; charset=utf-8').end(JSON.stringify(body));}
function parseBody(req){if(!req.body)return{};if(typeof req.body==='string'){try{return JSON.parse(req.body)}catch{return{}}}return req.body;}
function cleanText(v=''){return String(v||'').replace(/\s+/g,' ').trim();}
function norm(v=''){return cleanText(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function hostOf(url=''){try{return new URL(url).hostname.replace(/^www\./,'').toLowerCase()}catch{return''}}
function isTrusted(host=''){return TRUSTED_DOMAINS.some(d=>host===d||host.endsWith(`.${d}`));}
function safeYear(v){const m=String(v||'').match(/\b(19|20)\d{2}\b/);return m?Number(m[0]):undefined;}
function safeNumber(v){const m=String(v??'').replace(',', '.').match(/\d{1,4}(?:\.\d+)?/);if(!m)return undefined;const n=Number(m[0]);return Number.isFinite(n)?n:undefined;}
function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
function normalizeType(v=''){const s=norm(v);if(/espumoso|sparkling|champagne|cava|prosecco|frizzante|corpinnat/.test(s))return'Espumoso';if(/rosado|rose|rosé|rosat/.test(s))return'Rosado';if(/blanco|white|bianco|blanc/.test(s))return'Blanco';if(/tinto|red|rouge|rosso/.test(s))return'Tinto';return'Sin indicar';}
function normalizeAging(v=''){const s=norm(v);if(s.includes('gran reserva'))return'Gran Reserva';if(/\breserva\b/.test(s))return'Reserva';if(/\bcrianza\b/.test(s))return'Crianza';if(/\broble\b|barrica|oak/.test(s))return'Roble';if(/\bjoven\b|young/.test(s))return'Joven';return'Sin indicar';}
function normalizeProtection(v=''){const s=norm(v);if(/igp|indicacion geografica|vino de la tierra/.test(s))return'IGP';if(/dop|d\.o\.|\bdo\b|doca|doq|aoc|aop|docg|\bdoc\b|ava|\bgi\b/.test(s))return'DOP';return'Sin indicación';}
const GRAPE_ALIASES={grenache:'Garnacha',garnatxa:'Garnacha','garnacha tinta':'Garnacha',shiraz:'Syrah','pinot grigio':'Pinot Gris',mourvedre:'Monastrell','mourvèdre':'Monastrell',mataro:'Monastrell','tinto fino':'Tempranillo','tinta del pais':'Tempranillo','tinta del país':'Tempranillo',cencibel:'Tempranillo','tinta roriz':'Tempranillo',viura:'Macabeo',carmenere:'Carmenère',semillon:'Sémillon','gruner veltliner':'Grüner Veltliner'};
function normalizeGrapes(values){const list=Array.isArray(values)?values:String(values||'').split(/[,;·\n]/g);const out=[];const seen=new Set();for(const raw of list){const c=cleanText(raw);if(!c)continue;const canon=GRAPE_ALIASES[norm(c)]||c;const k=norm(canon);if(!k||seen.has(k))continue;seen.add(k);out.push(canon)}return out.slice(0,8);}
function responseText(data){if(typeof data?.output_text==='string')return data.output_text;const parts=[];for(const item of data?.output||[]){for(const c of item?.content||[]){if(c?.type==='output_text'&&c?.text)parts.push(c.text)}}return parts.join('\n');}
function parseJsonLoose(text=''){const raw=String(text).trim().replace(/^```(?:json)?\s*/i,'').replace(/```$/,'').trim();try{return JSON.parse(raw)}catch{const s=raw.indexOf('{'),e=raw.lastIndexOf('}');if(s>=0&&e>s)return JSON.parse(raw.slice(s,e+1));throw new Error('La IA no devolvió JSON válido.')}}

async function openAIJson(prompt,images=[]){
  const apiKey=process.env.OPENAI_API_KEY;if(!apiKey)throw new Error('OPENAI_NOT_CONFIGURED');
  const content=[{type:'input_text',text:prompt},...images.filter(Boolean).map(image_url=>({type:'input_image',image_url,detail:'high'}))];
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-6-sol',input:[{role:'user',content}],reasoning:{effort:'low'},max_output_tokens:1800}),signal:AbortSignal.timeout(55000)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data?.error?.message||`OpenAI ${response.status}`);
  return parseJsonLoose(responseText(data));
}

async function serper(endpoint,body){const key=process.env.SERPER_API_KEY;if(!key)throw new Error('SERPER_NOT_CONFIGURED');const r=await fetch(`https://google.serper.dev/${endpoint}`,{method:'POST',headers:{'X-API-KEY':key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error(`Serper ${r.status}`);return r.json();}
function stripHtml(html=''){return String(html).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<svg[\s\S]*?<\/svg>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/\s+/g,' ').trim();}
function unsafeHost(host=''){return host==='localhost'||host.endsWith('.local')||/^127\.|^10\.|^192\.168\.|^169\.254\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(host);}
async function fetchPageText(url){try{const u=new URL(url);if(!/^https?:$/.test(u.protocol)||unsafeHost(u.hostname))return'';const r=await fetch(url,{redirect:'follow',headers:{'User-Agent':'Mozilla/5.0 CellerRoig/2.0','Accept-Language':'es-ES,es;q=0.9,en;q=0.7'},signal:AbortSignal.timeout(7500)});if(!r.ok)return'';const ct=r.headers.get('content-type')||'';if(!ct.includes('text/html'))return'';let html=await r.text();if(html.length>900000)html=html.slice(0,900000);return stripHtml(html).slice(0,9500)}catch{return''}}

function identityTokens(label){return norm(`${label.name||''} ${label.winery||''}`).split(/[^a-z0-9]+/).filter(t=>t.length>=3&&!['vino','wine','bodega','bodegas','celler','cellers','the','del','de','la','las','los'].includes(t));}
function resultRelevance(item,label){const hay=norm(`${item.title||''} ${item.snippet||''}`);const toks=identityTokens(label);let hits=toks.filter(t=>hay.includes(t)).length;let score=hits*8;const year=label.vintage?String(label.vintage):'';if(year&&hay.includes(year))score+=10;else if(year&&/\b(19|20)\d{2}\b/.test(hay))score-=10;if(isTrusted(hostOf(item.link||'')))score+=18;return score;}
function exactEnough(item,label){const hay=norm(`${item.title||''} ${item.snippet||''}`);const toks=identityTokens(label);if(!toks.length)return true;const ratio=toks.filter(t=>hay.includes(t)).length/toks.length;if(ratio<Math.min(.67,toks.length===1?1:.67))return false;const year=label.vintage?String(label.vintage):'';if(year){const years=[...hay.matchAll(/\b(19|20)\d{2}\b/g)].map(m=>m[0]);if(years.length&&!years.includes(year))return false;}return true;}

function extractPricesFromText(text=''){const out=[];const s=String(text);for(const m of s.matchAll(/(?:€\s*|EUR\s*)(\d{1,4}(?:[.,]\d{1,2})?)/gi)){const n=Number(m[1].replace(',','.'));if(n>=2&&n<=1500)out.push(n)}for(const m of s.matchAll(/(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|EUR)\b/gi)){const n=Number(m[1].replace(',','.'));if(n>=2&&n<=1500)out.push(n)}return out;}
function extractStructuredPrice(html=''){const patterns=[/<meta[^>]+(?:property|itemprop)=["'](?:product:price:amount|price)["'][^>]+content=["']([0-9.,]+)["']/i,/"price"\s*:\s*"?([0-9]+(?:[.,][0-9]+)?)/i,/"lowPrice"\s*:\s*"?([0-9]+(?:[.,][0-9]+)?)/i];for(const p of patterns){const m=html.match(p);if(m){const n=Number(m[1].replace(',','.'));if(n>=2&&n<=1500)return n}}return undefined;}
async function fetchPrice(url){try{const u=new URL(url);if(unsafeHost(u.hostname))return undefined;const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 CellerRoig/2.0','Accept-Language':'es-ES,es;q=0.9'},signal:AbortSignal.timeout(6500)});if(!r.ok)return undefined;let html=await r.text();if(html.length>1200000)html=html.slice(0,1200000);return extractStructuredPrice(html)}catch{return undefined}}
function summarizePrices(offers){const dedup=[];const domains=new Set();for(const o of offers.sort((a,b)=>a.price-b.price)){const d=hostOf(o.url)||o.shop;if(domains.has(d))continue;domains.add(d);dedup.push(o)}if(!dedup.length)return{average:undefined,min:undefined,max:undefined,count:0,offers:[]};let vals=dedup.map(o=>o.price).sort((a,b)=>a-b);const med=vals[Math.floor(vals.length/2)];if(vals.length>=3){const low=med*.55,high=med*1.8;const allowed=new Set(vals.filter(v=>v>=low&&v<=high).map(v=>v.toFixed(2)));offers=dedup.filter(o=>allowed.has(o.price.toFixed(2)));vals=offers.map(o=>o.price)}else offers=dedup;const avg=vals.reduce((a,b)=>a+b,0)/vals.length;return{average:Number(avg.toFixed(2)),min:Number(Math.min(...vals).toFixed(2)),max:Number(Math.max(...vals).toFixed(2)),count:vals.length,offers:offers.slice(0,6)};}

function pairingPreset(type,grapes=[],aging=''){const all=norm(grapes.join(' '));if(type==='Espumoso')return'Aperitivos, marisco, pescado, arroces y frituras';if(type==='Rosado')return'Aperitivos, ensaladas, pasta, arroces y cocina mediterránea';if(type==='Blanco'){if(/albarino|godello|verdejo|sauvignon|riesling/.test(all))return'Marisco, pescado, arroces y quesos suaves';if(/chardonnay|viognier/.test(all)&&/roble|crianza|reserva/i.test(aging))return'Pescado, aves, pasta cremosa y quesos semicurados';return'Pescado, marisco, aperitivos y platos ligeros'}if(type==='Tinto'){if(/tempranillo/.test(all))return'Carnes rojas, asados, embutidos y quesos curados';if(/cabernet|syrah|malbec|monastrell|bobal/.test(all))return'Carnes rojas, guisos, barbacoa y quesos intensos';if(/pinot noir|gamay/.test(all))return'Aves, setas, carnes blancas y quesos suaves';if(/garnacha/.test(all))return'Carnes rojas, arroces, embutidos y quesos';return'Carnes, guisos, embutidos y quesos'}return'';}

function sanitizeWine(raw,label,priceInfo){
  let labelType=normalizeType(label.type);const webType=normalizeType(raw.type);
  const labelTypeEvidence=norm(`${label.typeEvidence||''} ${label.rawText||''} ${label.name||''} ${label.denomination||''}`);
  if(labelType==='Espumoso'&&!/(espumoso|sparkling|champagne|\bcava\b|prosecco|frizzante|brut|corpinnat|ancestral)/.test(labelTypeEvidence)) labelType='Sin indicar';
  let type=labelType!=='Sin indicar'?labelType:webType;
  // Barrera anti-falsos espumosos: exige evidencia explícita también en la web.
  if(type==='Espumoso'&&labelType==='Sin indicar'){
    const ev=norm(`${raw.typeEvidence||''} ${raw.rawEvidence||''} ${raw.name||''} ${raw.denomination||''}`);
    if(!/(espumoso|sparkling|champagne|\bcava\b|prosecco|frizzante|brut|corpinnat|ancestral)/.test(ev)) type='Sin indicar';
  }
  const grapes=normalizeGrapes((label.grapes&&label.grapes.length)?label.grapes:raw.grapes);
  const aging=label.aging&&label.aging!=='Sin indicar'?normalizeAging(label.aging):normalizeAging(raw.aging);
  const pairing=cleanText(raw.pairing)||pairingPreset(type,grapes,aging);
  return {
    name:cleanText(label.name)||cleanText(raw.name), winery:cleanText(label.winery)||cleanText(raw.winery), vintage:safeYear(label.vintage)||safeYear(raw.vintage),
    type, typeConfidence:type==='Sin indicar'?0:0.95, grapes, aging,
    protection:normalizeProtection(label.protection||raw.protection||raw.classification), classification:'',
    denomination:cleanText(label.denomination)||cleanText(raw.denomination), region:cleanText(label.region)||cleanText(raw.region), country:cleanText(label.country)||cleanText(raw.country),
    alcohol:safeNumber(label.alcohol)||safeNumber(raw.alcohol), price:priceInfo.average,
    pairing, pairingSource:cleanText(raw.pairing)?'web':(pairing?'sugerencia':''), rawText:cleanText(label.rawText),
    sourceTitle:'IA + Internet', sourceUrl:'', fieldsFound:0,
    priceSource:priceInfo.count?'media-internet':'', priceMin:priceInfo.min, priceMax:priceInfo.max, priceCount:priceInfo.count,
  };
}

export default async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{error:'Método no permitido.'});
  try{
    const body=parseBody(req);const front=String(body.frontImageDataUrl||'');const back=String(body.backImageDataUrl||'');
    if(!/^data:image\//.test(front))return json(res,400,{error:'Falta la foto de la etiqueta delantera.'});

    const labelPrompt=`Analiza las fotos de la etiqueta DELANTERA y TRASERA de la MISMA botella de vino. Identifica con máxima precisión el producto y transcribe/extrae lo que realmente aparezca. NO cambies el vino por otro de nombre parecido. Si una palabra es dudosa, no la autocorrijas a una marca conocida: conserva la lectura más literal posible. Devuelve SOLO JSON válido con: {"name":"","winery":"","vintage":null,"type":"Sin indicar","typeConfidence":0,"typeEvidence":"","grapes":[],"aging":"Sin indicar","protection":"Sin indicación","denomination":"","region":"","country":"","alcohol":null,"pairing":"","rawText":"","query":""}. type solo puede ser Tinto, Blanco, Rosado, Espumoso o Sin indicar. Marca Espumoso SOLO si hay evidencia explícita como cava/champagne/prosecco/sparkling/espumoso/brut. Si pone Crianza/Reserva/Tempranillo, eso NO significa espumoso. No inventes uvas ni bodega si no salen en la etiqueta. rawText debe contener las palabras clave que has leído; query debe ser nombre exacto + bodega + añada cuando sea posible.`;
    const label=await openAIJson(labelPrompt,[front,back]);
    label.name=cleanText(label.name);label.winery=cleanText(label.winery);label.vintage=safeYear(label.vintage);label.type=normalizeType(label.type);label.grapes=normalizeGrapes(label.grapes);label.aging=normalizeAging(label.aging);label.alcohol=safeNumber(label.alcohol);
    const query=cleanText(label.query)||[label.name,label.winery,label.vintage].filter(Boolean).join(' ');
    if(!query)throw new Error('No he podido identificar el vino con suficiente seguridad.');

    const sites=TRUSTED_DOMAINS.map(d=>`site:${d}`).join(' OR ');
    const exact=`"${label.name||query}" ${label.vintage||''} ${label.winery||''}`.replace(/\s+/g,' ').trim();
    const [trusted,generic,priceSearch,imageSearch]=await Promise.all([
      serper('search',{q:`${exact} (${sites}) ficha técnica uvas variedades bodega denominación alcohol maridaje`,hl:'es',num:14}).catch(()=>({organic:[]})),
      serper('search',{q:`${exact} vino ficha técnica productor variedades maridaje`,hl:'es',num:10}).catch(()=>({organic:[]})),
      serper('search',{q:`${exact} precio EUR € 75 cl`,hl:'es',num:16}).catch(()=>({organic:[]})),
      serper('images',{q:`${exact} botella`,hl:'es',num:16}).catch(()=>({images:[]})),
    ]);

    const combined=[...(trusted.organic||[]),...(generic.organic||[])].map(x=>({...x,score:resultRelevance(x,label)})).filter(x=>x.link&&x.title&&exactEnough(x,label)).sort((a,b)=>b.score-a.score);
    const seen=new Set();const sources=[];for(const r of combined){if(seen.has(r.link))continue;seen.add(r.link);sources.push(r);if(sources.length>=7)break;}
    const pageTexts=await Promise.all(sources.slice(0,4).map(async s=>({title:s.title,url:s.link,source:hostOf(s.link),text:await fetchPageText(s.link)})));
    const evidence=sources.map((s,i)=>`FUENTE ${i+1}: ${s.title}\n${s.snippet||''}`).join('\n\n')+'\n\n'+pageTexts.filter(p=>p.text).map((p,i)=>`PÁGINA ${i+1} (${p.source}): ${p.text}`).join('\n\n');

    const priceRows=(priceSearch.organic||[]).filter(x=>x.link&&x.title&&exactEnough(x,label)).slice(0,10);
    const fetchedPrices=await Promise.all(priceRows.slice(0,6).map(async r=>({r,price:await fetchPrice(r.link)})));
    const offers=[];for(const {r,price} of fetchedPrices){if(price)offers.push({shop:hostOf(r.link),price,url:r.link});else{const ps=extractPricesFromText(`${r.title} ${r.snippet||''}`);if(ps[0])offers.push({shop:hostOf(r.link),price:ps[0],url:r.link});}}
    for(const r of priceRows.slice(6)){const p=extractPricesFromText(`${r.title} ${r.snippet||''}`)[0];if(p)offers.push({shop:hostOf(r.link),price:p,url:r.link});}
    const priceInfo=summarizePrices(offers);

    const enrichPrompt=`Eres un experto catalogador de vinos. Debes completar una ficha a partir de (1) datos leídos de las etiquetas y (2) evidencia web del vino EXACTO. La identidad de la etiqueta manda: no sustituyas el vino por uno de nombre parecido. Usa la web SOLO para rellenar huecos o confirmar datos. Puedes completar uvas/variedades, bodega, denominación, región, país, tipo, envejecimiento y graduación si la evidencia corresponde claramente al mismo vino. Para maridaje: si una fuente lo da, resume en categorías generales y breves; si no aparece, genera una recomendación prudente a partir de tipo+uvas+envejecimiento. No incluyas datos personales, notas de cata subjetivas ni precio. Nunca marques Espumoso salvo evidencia explícita. Devuelve SOLO JSON válido: {"name":"","winery":"","vintage":null,"type":"Sin indicar","typeEvidence":"","grapes":[],"aging":"Sin indicar","protection":"Sin indicación","denomination":"","region":"","country":"","alcohol":null,"pairing":"","rawEvidence":""}.\n\nDATOS DE ETIQUETA:\n${JSON.stringify(label)}\n\nEVIDENCIA WEB:\n${evidence.slice(0,32000)}`;
    const enriched=await openAIJson(enrichPrompt,[]);
    const wine=sanitizeWine(enriched,label,priceInfo);
    wine.fieldsFound=[wine.name,wine.winery,wine.vintage,wine.type!=='Sin indicar',wine.grapes.length,wine.aging!=='Sin indicar',wine.denomination,wine.region,wine.country,wine.alcohol,wine.pairing,wine.price].filter(Boolean).length;

    const imgs=(imageSearch.images||[]).map((im,i)=>({id:`web-${i}`,title:cleanText(im.title),imageUrl:cleanText(im.imageUrl),thumbnailUrl:cleanText(im.thumbnailUrl||im.imageUrl),pageUrl:cleanText(im.link),source:cleanText(im.source||im.domain||hostOf(im.link))})).filter(im=>/^https?:\/\//i.test(im.imageUrl));
    const trustedImgs=imgs.filter(im=>IMAGE_DOMAINS.some(d=>norm(`${im.source} ${im.pageUrl}`).includes(norm(d.split('.')[0]))));
    const webImage=(trustedImgs[0]||imgs[0])?.imageUrl||'';

    return json(res,200,{wine,query,priceInfo,sources:sources.slice(0,6).map(s=>({title:s.title,url:s.link,source:hostOf(s.link)})),webImageUrl:webImage,imageCandidates:(trustedImgs.length?trustedImgs:imgs).slice(0,6),labelFacts:label});
  }catch(err){
    console.error('wine-autofill v20 error',err);const m=String(err?.message||err||'');
    if(m==='OPENAI_NOT_CONFIGURED')return json(res,503,{code:'OPENAI_NOT_CONFIGURED',error:'Falta OPENAI_API_KEY en Vercel.'});
    if(m==='SERPER_NOT_CONFIGURED')return json(res,503,{code:'SEARCH_NOT_CONFIGURED',error:'Falta SERPER_API_KEY en Vercel.'});
    return json(res,500,{error:m&&m.length<180?m:'No he podido completar la ficha con IA e Internet. Inténtalo de nuevo.'});
  }
}
