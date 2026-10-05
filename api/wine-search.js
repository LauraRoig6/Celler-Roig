const STOPWORDS = new Set(['vino','wine','botella','bottle','comprar','buy','de','del','la','el','los','las','un','una','y','en','con','the','and']);
const BLOCKED_HOSTS = ['google.com','google.es','books.google.','earth.google.','support.google.','microsoft.com','bing.com','facebook.com','instagram.com','youtube.com','tiktok.com','pinterest.com','x.com','twitter.com'];
const TRUSTED_DOMAINS = ['bodeboca.com','vivino.com','petitceller.com','vinoseleccion.com','vinatis.com','decantalo.com','vinissimus.com','lavinia.com','millesima.com','idealwine.com','wine-searcher.com','decanter.com','guiapenin.wine','cellartracker.com'];

// [denominación, región, país, clasificación habitual, alias]
const APPELLATIONS = [
  ['Ribera del Duero','Castilla y León','España','DOP',['ribera del duero']],
  ['Rioja','La Rioja','España','DOCa',['doca rioja','d.o.c.a. rioja','denominación de origen calificada rioja','rioja']],
  ['Rueda','Castilla y León','España','DOP',['do rueda','d.o. rueda','rueda']], ['Toro','Castilla y León','España','DOP',['do toro','d.o. toro','toro']],
  ['Priorat','Cataluña','España','DOQ',['doca priorat','doq priorat','priorat']], ['Rías Baixas','Galicia','España','DOP',['rías baixas','rias baixas']],
  ['Ribeiro','Galicia','España','DOP',['do ribeiro','ribeiro']], ['Valdeorras','Galicia','España','DOP',['valdeorras']], ['Jumilla','Región de Murcia','España','DOP',['do jumilla','jumilla']],
  ['Alicante','Comunitat Valenciana','España','DOP',['do alicante','alicante dop']], ['Valencia','Comunitat Valenciana','España','DOP',['do valencia','valencia dop']], ['Utiel-Requena','Comunitat Valenciana','España','DOP',['utiel-requena','utiel requena']],
  ['Cava','España','España','DOP',['do cava','d.o. cava','cava']], ['Penedès','Cataluña','España','DOP',['penedès','penedes']], ['Montsant','Cataluña','España','DOP',['montsant']],
  ['Navarra','Navarra','España','DOP',['do navarra','navarra dop']], ['Somontano','Aragón','España','DOP',['somontano']], ['Bierzo','Castilla y León','España','DOP',['bierzo']], ['Jerez-Xérès-Sherry','Andalucía','España','DOP',['jerez-xérès-sherry','jerez xeres sherry','sherry','jerez']],

  ['Bordeaux','Bordeaux','Francia','AOC/AOP',['bordeaux','médoc','medoc','saint-émilion','saint emilion','pomerol','pauillac','margaux']],
  ['Bourgogne','Bourgogne','Francia','AOC/AOP',['bourgogne','burgundy','chablis','côte de nuits','cote de nuits','côte de beaune','cote de beaune']],
  ['Champagne','Champagne','Francia','AOC/AOP',['champagne']], ['Alsace','Alsace','Francia','AOC/AOP',['alsace']],
  ['Côtes du Rhône','Rhône','Francia','AOC/AOP',['côtes du rhône','cotes du rhone','châteauneuf-du-pape','chateauneuf du pape','hermitage']],
  ['Loire','Val de Loire','Francia','AOC/AOP',['loire','sancerre','pouilly-fumé','pouilly fume','muscadet']], ['Provence','Provence','Francia','AOC/AOP',['provence','côtes de provence','cotes de provence']],
  ['Beaujolais','Beaujolais','Francia','AOC/AOP',['beaujolais','morgon','fleurie']],

  ['Chianti Classico','Toscana','Italia','DOCG',['chianti classico']], ['Brunello di Montalcino','Toscana','Italia','DOCG',['brunello di montalcino']],
  ['Barolo','Piemonte','Italia','DOCG',['barolo']], ['Barbaresco','Piemonte','Italia','DOCG',['barbaresco']], ['Prosecco','Veneto / Friuli','Italia','DOC/DOCG',['prosecco']],
  ['Amarone della Valpolicella','Veneto','Italia','DOCG',['amarone della valpolicella','amarone']], ['Soave','Veneto','Italia','DOC',['soave']],

  ['Douro','Douro','Portugal','DOC',['douro']], ['Vinho Verde','Minho','Portugal','DOC',['vinho verde']], ['Dão','Dão','Portugal','DOC',['dão','dao']],
  ['Porto','Douro','Portugal','DOC',['porto','port wine']], ['Alentejo','Alentejo','Portugal','DOC',['alentejo']],

  ['Napa Valley','California','Estados Unidos','AVA',['napa valley','napa']], ['Sonoma','California','Estados Unidos','AVA',['sonoma']], ['Willamette Valley','Oregon','Estados Unidos','AVA',['willamette valley']],
  ['Mendoza','Mendoza','Argentina','IG',['mendoza']], ['Valle de Uco','Mendoza','Argentina','IG',['uco valley','valle de uco']], ['Luján de Cuyo','Mendoza','Argentina','DOC',['luján de cuyo','lujan de cuyo']],
  ['Maipo Valley','Valle Central','Chile','DO',['maipo valley','valle del maipo','maipo']], ['Colchagua Valley','Valle Central','Chile','DO',['colchagua valley','valle de colchagua','colchagua']], ['Casablanca Valley','Aconcagua','Chile','DO',['casablanca valley','valle de casablanca']],
  ['Mosel','Mosel','Alemania','Prädikatswein',['mosel']], ['Rheingau','Rheingau','Alemania','Prädikatswein',['rheingau']],
  ['Marlborough','Marlborough','Nueva Zelanda','GI',['marlborough']], ['Barossa Valley','South Australia','Australia','GI',['barossa valley','barossa']], ['McLaren Vale','South Australia','Australia','GI',['mclaren vale']],
];

const GRAPES = [
  'Tempranillo','Tinta del País','Tinto Fino','Garnacha','Garnacha Tinta','Garnacha Blanca','Graciano','Mazuelo','Cariñena','Monastrell','Bobal','Albariño','Verdejo','Godello','Mencía','Treixadura','Loureiro','Macabeo','Viura','Xarel·lo','Parellada','Moscatel','Airén','Malvasía','Palomino','Pedro Ximénez',
  'Cabernet Sauvignon','Cabernet Franc','Merlot','Syrah','Shiraz','Pinot Noir','Chardonnay','Sauvignon Blanc','Riesling','Gewürztraminer','Chenin Blanc','Petit Verdot','Alicante Bouschet','Maturana Tinta',
  'Malbec','Sangiovese','Nebbiolo','Barbera','Corvina','Rondinella','Pinot Grigio','Glera','Touriga Nacional','Touriga Franca','Tinta Roriz','Carmenère','Carmenere','Zinfandel','Grenache','Mourvèdre','Mourvedre','Viognier','Gamay','Sémillon','Semillon','Chasselas','Grüner Veltliner','Gruner Veltliner'
];
function normalize(value=''){return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
const GRAPE_ALIASES={grenache:'Garnacha',garnatxa:'Garnacha','garnacha tinta':'Garnacha',shiraz:'Syrah','pinot grigio':'Pinot Gris',mourvedre:'Monastrell','mourvèvre':'Monastrell','mourvèdre':'Monastrell',mataro:'Monastrell','tinto fino':'Tempranillo','tinta del pais':'Tempranillo','tinta del país':'Tempranillo',cencibel:'Tempranillo','tinta roriz':'Tempranillo',viura:'Macabeo',carmenere:'Carmenère',semillon:'Sémillon','gruner veltliner':'Grüner Veltliner'};
function canonicalGrape(value=''){const clean=String(value).trim().replace(/\s+/g,' ');return GRAPE_ALIASES[normalize(clean)]||clean;}

function tokens(query=''){return normalize(query).split(/[^a-z0-9]+/).filter(t=>t.length>1&&!STOPWORDS.has(t));}
function hostOf(url=''){try{return new URL(url).hostname.replace(/^www\./,'');}catch{return'';}}
function isBlocked(host=''){return BLOCKED_HOSTS.some(x=>host===x||host.endsWith(`.${x}`)||host.includes(x));}
function isTrusted(host=''){return TRUSTED_DOMAINS.some(x=>host===x||host.endsWith(`.${x}`));}
function titleCase(text=''){return text.replace(/\b([a-záéíóúüñ])/gi,m=>m.toUpperCase());}
function cleanQueryName(q=''){return titleCase(q.replace(/\b(19|20)\d{2}\b/g,'').replace(/\s+/g,' ').trim());}
function explicitType(text=''){
  const t=normalize(text);
  if(/espumoso|sparkling|champagne|\bcava\b|prosecco/.test(t))return'Espumoso';
  if(/rosado|rose wine|vin rose|vino rosato|\brosato\b/.test(t))return'Rosado';
  if(/vino blanco|white wine|vin blanc|bianco|\bblanco\b/.test(t))return'Blanco';
  if(/vino tinto|red wine|vin rouge|rosso|\btinto\b/.test(t))return'Tinto';
  return undefined;
}
function inferTypeSafe(query='',items=[]){
  const direct=explicitType(query); if(direct)return{type:direct,confidence:1};
  const qTokens=tokens(query).filter(t=>!/^(19|20)\d{2}$/.test(t));
  const scores={Tinto:0,Blanco:0,Rosado:0,Espumoso:0};
  const support={Tinto:0,Blanco:0,Rosado:0,Espumoso:0};
  for(const item of items.slice(0,7)){
    const title=normalize(item.title||''), snippet=normalize(item.snippet||'');
    const ratio=qTokens.length?qTokens.filter(t=>title.includes(t)||snippet.includes(t)).length/qTokens.length:0;
    if(ratio<0.65)continue;
    const titleType=explicitType(item.title||''), snippetType=explicitType(item.snippet||'');
    const seen=new Set();
    if(titleType){scores[titleType]+=5+(ratio>=0.9?2:0);seen.add(titleType);}
    if(snippetType){scores[snippetType]+=2;seen.add(snippetType);}
    for(const type of seen)support[type]++;
  }
  const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  const [best,second]=ranked;
  if(!best||support[best[0]]<2||best[1]<8||best[1]-(second?.[1]||0)<4)return{type:undefined,confidence:0};
  return{type:best[0],confidence:support[best[0]]>=3?0.95:0.85};
}
function inferAging(text=''){const t=normalize(text);if(/gran reserva/.test(t))return'Gran Reserva';if(/\breserva\b/.test(t))return'Reserva';if(/\bcrianza\b/.test(t))return'Crianza';if(/\broble\b|barrica|oak aged|barrel aged|fut de chene/.test(t))return'Roble';if(/\bjoven\b|young wine|vin jeune/.test(t))return'Joven';return undefined;}
function inferAppellation(text=''){const t=normalize(text);for(const [name,region,country,classification,aliases] of APPELLATIONS){if(aliases.some(a=>t.includes(normalize(a))))return{denomination:name,region,country,classification,protection:country==='España'?(classification==='IGP'?'IGP':'DOP'):'Sin indicación'};}const raw=String(text);const igp=raw.match(/(?:IGP|I\.G\.P\.|vino de la tierra)\s*(?:de\s*)?([A-ZÁÉÍÓÚÜÑa-záéíóúüñ\- ]{3,50})/i);if(igp)return{denomination:igp[1].trim(),region:'',country:'España',classification:'IGP',protection:'IGP'};const intl=raw.match(/\b(AOC|AOP|DOCG|DOC|AVA|IG|GI|DOQ|DOCa)\b/i);return{denomination:'',region:'',country:'',classification:intl?.[1]||'',protection:'Sin indicación'};}
function inferGrapes(text=''){const t=normalize(text);const found=[];const seen=new Set();for(const grape of GRAPES){if(!t.includes(normalize(grape)))continue;const canonical=canonicalGrape(grape);const key=normalize(canonical);if(seen.has(key))continue;seen.add(key);found.push(canonical);}return found.slice(0,8);}
function inferAlcohol(text=''){const found=[...String(text).matchAll(/(\d{1,2}(?:[.,]\d)?)\s*%\s*(?:vol\.?|alc\.?|alcohol)?/gi)].map(m=>Number(m[1].replace(',','.'))).filter(n=>n>=5&&n<=25);return found[0];}
function pairingPreset(type,grapes=[],aging=''){
  const all=normalize(grapes.join(' '));
  if(type==='Espumoso')return'Aperitivos, marisco, sushi, arroces y frituras';
  if(type==='Rosado')return'Aperitivos, ensaladas, pasta, arroces y cocina mediterránea';
  if(type==='Blanco'){
    if(/albarino|godello|verdejo|sauvignon|riesling/.test(all))return'Marisco, pescado, arroces y quesos suaves';
    if(/chardonnay|viognier/.test(all)&&/roble|crianza|reserva/i.test(aging||''))return'Pescado, aves, pasta cremosa y quesos semicurados';
    return'Pescado, marisco, aperitivos y platos ligeros';
  }
  if(type==='Tinto'){
    if(/tempranillo|tinto fino|tinta del pais/.test(all))return'Carnes rojas, asados, embutidos y quesos curados';
    if(/cabernet|syrah|shiraz|malbec|monastrell|bobal/.test(all))return'Carnes rojas, guisos, barbacoa y quesos intensos';
    if(/pinot noir|gamay/.test(all))return'Aves, setas, carnes blancas y quesos suaves';
    if(/garnacha|grenache/.test(all))return'Carnes rojas, arroces, embutidos y quesos';
    return'Carnes, guisos, embutidos y quesos';
  }
  return'';
}
function cleanPairingText(value=''){
  return String(value).replace(/\s+/g,' ').replace(/^(maridaje|food pairing|pairing|acompa(?:ñ|n)a(?:r)? con|ideal con)\s*[:\-]?\s*/i,'').trim().slice(0,180);
}
function inferPairingFromItems(items=[]){
  for(const item of items){
    const text=`${item.title||''}. ${item.snippet||''}`.replace(/\s+/g,' ');
    const m=text.match(/(?:maridaje|food pairing|pairing|ideal con|acompa(?:ñ|n)a(?:r)? con)\s*[:\-]?\s*([^.;]{8,180})/i);
    if(m){const val=cleanPairingText(m[1]);if(val.length>=8)return val;}
  }
  return'';
}
function inferVintage(text=''){const years=[...String(text).matchAll(/\b(19\d{2}|20\d{2})\b/g)].map(m=>Number(m[1]));return years.find(y=>y>=1900&&y<=new Date().getFullYear()+1);}
function inferWinery(text=''){const raw=String(text);const m=raw.match(/\b(Bodegas?\s+[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9&'.-]*(?:\s+[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9&'.-]*){0,3})\b/);if(m)return m[1].replace(/[|–—].*$/,'').trim();return'';}
function inferCountry(text=''){const t=normalize(text);const map=[['Francia',['france','francia','french','vin français']],['Italia',['italy','italia','italian']],['Portugal',['portugal','portuguese']],['Estados Unidos',['united states','usa','california','oregon']],['Argentina',['argentina','mendoza']],['Chile',['chile','chileno']],['Alemania',['germany','alemania','deutschland']],['Nueva Zelanda',['new zealand','nueva zelanda']],['Australia',['australia']],['España',['spain','españa','spanish','rioja','ribera del duero']]];for(const[country,aliases]of map)if(aliases.some(a=>t.includes(normalize(a))))return country;return'';}
function relevance(item,query){const hay=normalize(`${item.title||''} ${item.snippet||''} ${item.link||''}`),qTokens=tokens(query),hits=qTokens.filter(t=>hay.includes(t)),year=qTokens.find(t=>/^(19|20)\d{2}$/.test(t));let score=hits.length*7;const host=hostOf(item.link||item.url||'');if(isTrusted(host))score+=34;if(qTokens[0]&&normalize(item.title||'').includes(qTokens[0]))score+=10;if(/vino|wine|vin |bodega|winery|celler|chateau|château|crianza|reserva|tinto|blanco|rouge|blanc|docg|aoc|ava/.test(hay))score+=5;if(year&&hay.includes(year))score+=7;if(year&&!hay.includes(year))score-=6;return score;}
function imageRelevance(item,query){const hay=normalize(`${item.title||''} ${item.source||''} ${item.domain||''} ${item.link||''} ${item.imageUrl||''}`),qTokens=tokens(query),nonYear=qTokens.filter(t=>!/^(19|20)\d{2}$/.test(t));const host=hostOf(item.link||'');let score=qTokens.filter(t=>hay.includes(t)).length*7;if(isTrusted(host)||TRUSTED_DOMAINS.some(d=>hay.includes(normalize(d.split('.')[0]))))score+=40;if(nonYear[0]&&hay.includes(nonYear[0]))score+=12;if(/botella|bottle|vino|wine|vin|bodega|winery|chateau|shop/.test(hay))score+=3;if(/\.png(?:\?|$)/i.test(item.imageUrl||''))score+=2;return score;}
async function serper(endpoint,body,apiKey){const response=await fetch(`https://google.serper.dev/${endpoint}`,{method:'POST',headers:{'X-API-KEY':apiKey,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error(`Serper ${response.status}`);return response.json();}

async function lookupBarcode(barcode=''){
  try{
    const fields='product_name,brands,image_url,categories,countries,origins,labels';
    const response=await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${fields}`,{headers:{'User-Agent':'Celler-Roig/1.17'},signal:AbortSignal.timeout(5500)});
    if(!response.ok)return null;
    const data=await response.json();
    if(data?.status!==1||!data.product)return null;
    const product=data.product;
    const query=[product.product_name,product.brands].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
    return query?{query,imageUrl:String(product.image_url||''),text:[product.categories,product.countries,product.origins,product.labels].filter(Boolean).join(' ')}:null;
  }catch{return null;}
}
function cleanResultTitle(title=''){
  return String(title).replace(/\s*[|–—]\s*(Vivino|Bodeboca|Vinatis|Decántalo|Decantalo|Vinissimus|Wine-Searcher|CellarTracker|Decanter).*$/i,'').replace(/\s*[|–—]\s*[^|–—]{0,28}$/,'').replace(/\bcomprar\b.*$/i,'').trim();
}

export default async function handler(req,res){
  const rawQ=String(req.query?.q||'').trim();
  if(rawQ.length<2)return res.status(400).json({error:'Escribe al menos 2 caracteres.'});
  const apiKey=process.env.SERPER_API_KEY;
  if(!apiKey)return res.status(503).json({code:'SEARCH_NOT_CONFIGURED',error:'Falta SERPER_API_KEY en Vercel.'});
  const barcode=rawQ.replace(/\D/g,'');
  const barcodeMode=/^\d{8,14}$/.test(barcode)&&barcode===rawQ.replace(/\s/g,'');
  const barcodeInfo=barcodeMode?await lookupBarcode(barcode):null;
  let q=barcodeInfo?.query||rawQ;
  const siteClause=TRUSTED_DOMAINS.map(d=>`site:${d}`).join(' OR ');
  try{
    const barcodeHint=barcodeMode?` "${barcode}" EAN GTIN`:'';
    const trustedText=`${q}${barcodeHint} (${siteClause})`;
    const genericText=`${q}${barcodeHint} vino wine ficha técnica technical sheet cépage grape appellation winery`;
    const [trustedWeb,genericWeb]=await Promise.all([
      serper('search',{q:trustedText,hl:'es',num:16},apiKey).catch(()=>({organic:[]})),
      serper('search',{q:genericText,hl:'es',num:12},apiKey).catch(()=>({organic:[]}))
    ]);
    const rawOrganic=[...(Array.isArray(trustedWeb.organic)?trustedWeb.organic:[]),...(Array.isArray(genericWeb.organic)?genericWeb.organic:[])];
    const seenUrls=new Set();
    let organic=rawOrganic.map((item,i)=>({id:`web-${i}`,title:String(item.title||'').trim(),url:String(item.link||'').trim(),snippet:String(item.snippet||'').trim(),source:hostOf(item.link||''),score:relevance(item,q)+(barcodeMode&&`${item.title||''} ${item.snippet||''}`.includes(barcode)?18:0)}))
      .filter(x=>/^https?:\/\//i.test(x.url)&&x.title&&!isBlocked(x.source)&&x.score>4)
      .filter(x=>{if(seenUrls.has(x.url))return false;seenUrls.add(x.url);return true;})
      .sort((a,b)=>b.score-a.score).slice(0,12);

    // Si el código no estaba en Open Food Facts, usamos el mejor resultado web para
    // convertir el EAN en un nombre de vino antes de buscar fotos y ficha técnica.
    if(barcodeMode&&!barcodeInfo&&organic[0]?.title){const candidate=cleanResultTitle(organic[0].title);if(candidate.length>3)q=candidate;}
    if(barcodeMode&&!barcodeInfo&&q===rawQ&&!organic.length)return res.status(404).json({error:'No he encontrado un vino asociado a este código. Puedes buscarlo por nombre.'});

    const [trustedImages,pairingData]=await Promise.all([
      serper('images',{q:`${q} botella bottle (${siteClause})`,hl:'es',num:24},apiKey).catch(()=>({images:[]})),
      serper('search',{q:`${q} (${siteClause}) maridaje food pairing ideal con`,hl:'es',num:10},apiKey).catch(()=>({organic:[]}))
    ]);
    // Recalculamos relevancia con el nombre resuelto cuando veníamos de un código.
    organic=organic.map(x=>({...x,score:relevance(x,q)+(isTrusted(x.source)?10:0)})).sort((a,b)=>b.score-a.score);
    const pairingOrganic=(Array.isArray(pairingData.organic)?pairingData.organic:[]).map((item,i)=>({id:`pair-${i}`,title:String(item.title||'').trim(),url:String(item.link||'').trim(),snippet:String(item.snippet||'').trim(),source:hostOf(item.link||''),score:relevance(item,q)})).filter(x=>/^https?:\/\//i.test(x.url)&&x.title&&!isBlocked(x.source)&&x.score>4).sort((a,b)=>b.score-a.score).slice(0,8);
    const trustedOrganic=organic.filter(x=>isTrusted(x.source));
    const inferenceItems=trustedOrganic.length?trustedOrganic.slice(0,8):organic.slice(0,8);
    const combined=`${q} ${barcodeInfo?.text||''} ${inferenceItems.map(x=>`${x.title}. ${x.snippet}`).join(' ')}`;
    const app=inferAppellation(combined);
    const typeInfo=inferTypeSafe(q,inferenceItems);
    const vintage=inferVintage(q)||inferVintage(combined);
    const grapes=inferGrapes(combined);
    const aging=inferAging(combined);
    const webPairing=inferPairingFromItems(pairingOrganic);
    const pairing=webPairing||pairingPreset(typeInfo.type,grapes,aging);
    const source=inferenceItems[0];
    const wine={name:cleanQueryName(q),winery:inferWinery(combined),vintage,type:typeInfo.type,typeConfidence:typeInfo.confidence,grapes,aging,protection:app.protection,classification:app.classification,denomination:app.denomination,region:app.region,country:app.country||inferCountry(combined),alcohol:inferAlcohol(combined),pairing,pairingSource:webPairing?'web':(pairing?'sugerencia':''),rawText:combined.slice(0,12000),sourceUrl:source?.url||'',sourceTitle:source?.source||source?.title||'',barcode:barcodeMode?barcode:undefined};
    wine.fieldsFound=[wine.name,wine.winery,wine.vintage,wine.type,wine.grapes.length,wine.aging,wine.denomination,wine.region,wine.country,wine.alcohol,wine.pairing].filter(Boolean).length;
    const rawImages=Array.isArray(trustedImages.images)?trustedImages.images:[];
    let images=rawImages.map((item,i)=>({id:`img-${i}`,title:String(item.title||'').trim(),imageUrl:String(item.imageUrl||'').trim(),thumbnailUrl:String(item.thumbnailUrl||item.imageUrl||'').trim(),pageUrl:String(item.link||'').trim(),source:String(item.source||item.domain||hostOf(item.link||'')).trim(),score:imageRelevance(item,q)})).filter(x=>/^https?:\/\//i.test(x.imageUrl)&&x.score>10).sort((a,b)=>b.score-a.score).slice(0,12).map(({score,...rest})=>rest);
    if(images.length<4){
      const fallback=await serper('images',{q:`${q} botella bottle wine`,hl:'es',num:16},apiKey).catch(()=>({images:[]}));
      const extra=(Array.isArray(fallback.images)?fallback.images:[]).map((item,i)=>({id:`fallback-${i}`,title:String(item.title||'').trim(),imageUrl:String(item.imageUrl||'').trim(),thumbnailUrl:String(item.thumbnailUrl||item.imageUrl||'').trim(),pageUrl:String(item.link||'').trim(),source:String(item.source||item.domain||hostOf(item.link||'')).trim(),score:imageRelevance(item,q)})).filter(x=>/^https?:\/\//i.test(x.imageUrl)&&x.score>5).sort((a,b)=>b.score-a.score).map(({score,...rest})=>rest);
      const keys=new Set(images.map(x=>x.imageUrl));
      images=[...images,...extra.filter(x=>!keys.has(x.imageUrl))].slice(0,12);
    }
    if(barcodeInfo?.imageUrl&&!images.some(x=>x.imageUrl===barcodeInfo.imageUrl))images.push({id:'barcode-image',title:q,imageUrl:barcodeInfo.imageUrl,thumbnailUrl:barcodeInfo.imageUrl,pageUrl:'',source:'Open Food Facts'});
    return res.status(200).json({wine,images:images.slice(0,12),provider:barcodeMode?'barcode+serper':'serper-trusted',resolvedQuery:q,sources:organic.slice(0,7).map(({score,...x})=>x),preferredDomains:TRUSTED_DOMAINS});
  }catch(error){
    console.error('wine-search error',error);
    return res.status(502).json({error:'No se ha podido buscar el vino ahora mismo. Prueba de nuevo en unos segundos.'});
  }
}
