import type { SortMode, Wine } from './types';

export const agingRank: Record<string, number> = {
  'Joven': 1, 'Roble': 2, 'Crianza': 3, 'Reserva': 4, 'Gran Reserva': 5, 'Otro': 6, 'Sin indicar': 7,
};

export function displayAging(wine: Wine) {
  return wine.aging === 'Otro' && wine.customAging ? wine.customAging : wine.aging;
}

export function groupLabel(wine: Wine, mode: SortMode) {
  switch (mode) {
    case 'type': return wine.type;
    case 'grape': return wine.grapes[0] || 'Sin uva';
    case 'vintage': return wine.vintage ? String(wine.vintage) : 'Sin añada';
    case 'aging': return displayAging(wine);
    case 'denomination': return wine.denomination || 'Sin denominación';
    case 'score': return wine.score ? `${Math.floor(wine.score)}–${Math.floor(wine.score) + 0.9}` : 'Sin nota';
    case 'name': return wine.name.charAt(0).toUpperCase();
    default: return 'Mi estantería';
  }
}

export function sortWines(wines: Wine[], mode: SortMode) {
  const list = [...wines];
  switch (mode) {
    case 'manual': return list.sort((a, b) => a.manualOrder - b.manualOrder);
    case 'type': return list.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
    case 'grape': return list.sort((a, b) => (a.grapes[0] || '').localeCompare(b.grapes[0] || '') || a.name.localeCompare(b.name));
    case 'vintage': return list.sort((a, b) => (b.vintage || 0) - (a.vintage || 0));
    case 'aging': return list.sort((a, b) => (agingRank[a.aging] || 99) - (agingRank[b.aging] || 99));
    case 'denomination': return list.sort((a, b) => a.denomination.localeCompare(b.denomination));
    case 'score': return list.sort((a, b) => (b.score || 0) - (a.score || 0));
    case 'name': return list.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export async function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function resizeImageBlob(file: Blob, maxDimension = 1050, type = 'image/webp', quality = .92): Promise<Blob> {
  const src = await fileToDataUrl(file);
  const img = await loadImage(src);
  const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, w, h);
  return await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b || file), type, quality));
}

function isLightBackground(data: Uint8ClampedArray, offset: number) {
  const r = data[offset], g = data[offset + 1], b = data[offset + 2], a = data[offset + 3];
  return a > 10 && r > 228 && g > 228 && b > 228 && Math.max(r,g,b) - Math.min(r,g,b) < 34;
}

/** Respaldo rápido: quita únicamente fondos blancos conectados a los bordes. */
async function removeLightBackgroundFallback(file: Blob): Promise<string> {
  const src = await fileToDataUrl(file);
  const img = await loadImage(src);
  const maxH = 900;
  const scale = Math.min(1, maxH / img.naturalHeight);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return src;
  ctx.drawImage(img, 0, 0, w, h);
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0, tail = 0;
  const push = (idx: number) => {
    if (idx < 0 || idx >= w*h || visited[idx]) return;
    const off = idx * 4;
    if (!isLightBackground(data, off)) return;
    visited[idx] = 1;
    queue[tail++] = idx;
  };
  for (let x=0;x<w;x++) { push(x); push((h-1)*w+x); }
  for (let y=0;y<h;y++) { push(y*w); push(y*w+w-1); }
  while (head < tail) {
    const idx = queue[head++];
    const x = idx % w, y = Math.floor(idx / w);
    data[idx*4+3] = 0;
    if (x>0) push(idx-1); if (x<w-1) push(idx+1); if (y>0) push(idx-w); if (y<h-1) push(idx+w);
  }
  ctx.putImageData(image, 0, 0);
  return cropTransparentCanvas(canvas);
}

async function cropTransparentBlob(blob: Blob): Promise<string> {
  const src = URL.createObjectURL(blob);
  try {
    const img = await loadImage(src);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return fileToDataUrl(blob);
    ctx.drawImage(img,0,0);
    return cropTransparentCanvas(canvas);
  } finally {
    URL.revokeObjectURL(src);
  }
}

function cropTransparentCanvas(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas.toDataURL('image/webp', .9);
  const w=canvas.width,h=canvas.height;
  const data=ctx.getImageData(0,0,w,h).data;
  let minX=w,minY=h,maxX=-1,maxY=-1;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
    if(data[(y*w+x)*4+3]>12){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  }
  if(maxX<minX||maxY<minY) return canvas.toDataURL('image/webp',.9);
  const pad=Math.max(10,Math.round(Math.min(w,h)*.025));
  minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(w-1,maxX+pad);maxY=Math.min(h-1,maxY+pad);
  const cw=maxX-minX+1,ch=maxY-minY+1;
  const out=document.createElement('canvas');out.width=cw;out.height=ch;
  out.getContext('2d')?.drawImage(canvas,minX,minY,cw,ch,0,0,cw,ch);
  return out.toDataURL('image/webp',.9);
}

type ProgressFn = (message: string) => void;

/**
 * Elimina el fondo con segmentación de IA en el propio móvil. En el primer uso
 * se descarga el modelo; después el navegador lo reutiliza desde caché.
 */
export async function prepareBottleImageFromFile(file: File, onProgress?: ProgressFn): Promise<string> {
  const compact = await resizeImageBlob(file, 1000, 'image/webp', .92);
  try {
    onProgress?.('Quitando el fondo de la botella… La primera vez puede tardar un poco.');
    const mod = await import('@imgly/background-removal');
    const removeBackground = mod.default;
    const result = await removeBackground(compact, {
      model: 'isnet_quint8',
      output: { format: 'image/png', quality: 1 },
      progress: (key: string, current: number, total: number) => {
        if (!total) return;
        const pct = Math.max(0, Math.min(100, Math.round(current / total * 100)));
        if (/fetch|download|model|onnx|wasm/i.test(key)) onProgress?.(`Preparando el recorte inteligente… ${pct}%`);
      },
    } as any);
    onProgress?.('Fondo eliminado. Ajustando la botella…');
    return await cropTransparentBlob(result);
  } catch (err) {
    console.warn('AI background removal failed; using light-background fallback', err);
    onProgress?.('No he podido usar el recorte inteligente. Probando con el fondo claro…');
    return await removeLightBackgroundFallback(compact);
  }
}

export async function prepareBottleImageFromUrl(url: string, onProgress?: ProgressFn): Promise<string> {
  try {
    const res = await fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error('proxy');
    const blob = await res.blob();
    const file = new File([blob], 'botella', { type: blob.type || 'image/jpeg' });
    return await prepareBottleImageFromFile(file, onProgress);
  } catch {
    return url;
  }
}

let currentOcrProgress: ProgressFn | undefined;
let ocrWorkerPromise: Promise<any> | null = null;

async function getOcrWorker() {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = (async () => {
      const { createWorker } = await import('tesseract.js');
      return createWorker('eng', 1 as any, {
        logger: (m: any) => {
          if (!currentOcrProgress || typeof m?.progress !== 'number') return;
          if (m.status === 'recognizing text') currentOcrProgress(`Leyendo la etiqueta… ${Math.round(m.progress * 100)}%`);
          else if (/loading|initializing/i.test(m.status || '')) currentOcrProgress('Preparando el lector de etiquetas…');
        },
      });
    })().catch(err => { ocrWorkerPromise = null; throw err; });
  }
  return ocrWorkerPromise;
}

async function makeOcrCanvas(file: File): Promise<HTMLCanvasElement> {
  const src=await fileToDataUrl(file);
  const img=await loadImage(src);
  // Centramos el análisis en la zona donde normalmente está la etiqueta, pero
  // conservamos suficiente botella para que nombres altos/bajos sigan entrando.
  const sx=Math.round(img.naturalWidth*.08), sy=Math.round(img.naturalHeight*.10);
  const sw=Math.round(img.naturalWidth*.84), sh=Math.round(img.naturalHeight*.82);
  const targetW=Math.min(1800,Math.max(900,sw*1.7));
  const targetH=Math.round(targetW*sh/sw);
  const canvas=document.createElement('canvas'); canvas.width=targetW; canvas.height=targetH;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx) return canvas;
  ctx.drawImage(img,sx,sy,sw,sh,0,0,targetW,targetH);
  const im=ctx.getImageData(0,0,targetW,targetH); const d=im.data;
  // Contraste suave para etiquetas con reflejos; evitamos binarizar para no perder letras finas.
  for(let i=0;i<d.length;i+=4){
    const gray=.299*d[i]+.587*d[i+1]+.114*d[i+2];
    const v=Math.max(0,Math.min(255,(gray-128)*1.28+128));
    d[i]=d[i+1]=d[i+2]=v;
  }
  ctx.putImageData(im,0,0);
  return canvas;
}

function usefulLabelQuery(raw: string): string {
  const year=raw.match(/\b(?:19|20)\d{2}\b/)?.[0] || '';
  const noise=/\b(?:ml|cl|litre|liter|vol|alc|alcohol|contains|contiene|embotellado|bottled|product of|producto de|appellation|denominacion|mis en bouteille|sulfites|sulfitos)\b/i;
  const seen=new Set<string>();
  const lines=raw.split(/\n+/).map(x=>x.replace(/[^\p{L}\p{N}&'’.-]+/gu,' ').replace(/\s+/g,' ').trim())
    .filter(x=>x.length>=3 && x.length<=52 && !noise.test(x))
    .filter(x=>{const k=x.toLowerCase();if(seen.has(k))return false;seen.add(k);return true;});
  const scored=lines.map((line,index)=>{
    const letters=(line.match(/\p{L}/gu)||[]).length;
    const digits=(line.match(/\d/g)||[]).length;
    let score=letters*1.3-Math.max(0,digits-4)*2-index*.2;
    if(/\b(?:crianza|reserva|gran reserva|chateau|château|domaine|bodega|celler|cellar|rioja|ribera|bordeaux|bourgogne|chianti|barolo|brunello|champagne)\b/i.test(line))score+=10;
    if(/^[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÄËÏÖÜÑÇ0-9 &'’.\-]+$/.test(line))score+=3;
    return {line,score};
  }).sort((a,b)=>b.score-a.score);
  const chosen=scored.slice(0,3).map(x=>x.line);
  if(year && !chosen.some(x=>x.includes(year))) chosen.push(year);
  const query=chosen.join(' ').replace(/\s+/g,' ').trim();
  const letters=(query.match(/\p{L}/gu)||[]).length;
  return letters>=4 ? query.slice(0,110) : '';
}

/** Lee la etiqueta. Usa APIs nativas cuando existen y Tesseract.js como respaldo real en Safari/iPhone. */
export async function detectPhotoClues(file: File, onProgress?: ProgressFn): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const w = window as any;
    if (w.BarcodeDetector) {
      try {
        const detector = new w.BarcodeDetector();
        const codes = await detector.detect(bitmap);
        const value = codes?.[0]?.rawValue;
        if (value && String(value).length >= 6) return String(value);
      } catch {}
    }
    if (w.TextDetector) {
      try {
        const detector = new w.TextDetector();
        const blocks = await detector.detect(bitmap);
        const text = (blocks || []).map((x: any) => x.rawValue || x.text || '').join('\n');
        const clue=usefulLabelQuery(text);
        if(clue) return clue;
      } catch {}
    }
  } catch {}

  try {
    onProgress?.('Leyendo la etiqueta…');
    currentOcrProgress=onProgress;
    const worker=await getOcrWorker();
    const canvas=await makeOcrCanvas(file);
    const result=await worker.recognize(canvas, { rotateAuto: true } as any);
    const clue=usefulLabelQuery(result?.data?.text || '');
    return clue;
  } catch(err) {
    console.warn('OCR failed',err);
    return '';
  } finally {
    currentOcrProgress=undefined;
  }
}

export function bottleSearchUrl(name: string, winery: string) {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${name} ${winery} botella png fondo transparente`)}`;
}

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function editDistance(a: string, b: string) {
  const m=a.length,n=b.length; const row=Array.from({length:n+1},(_,i)=>i);
  for(let i=1;i<=m;i++){
    let prev=row[0]; row[0]=i;
    for(let j=1;j<=n;j++){
      const temp=row[j];
      row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));
      prev=temp;
    }
  }
  return row[n];
}

export function wineMatchesQuery(wine: Wine, query: string) {
  const q=normalizeSearch(query); if(!q) return true;
  const hay=normalizeSearch([wine.name,wine.winery,wine.type,displayAging(wine),wine.classification,wine.denomination,wine.region,wine.country,wine.location,...wine.grapes,String(wine.vintage||'')].join(' '));
  if(hay.includes(q)) return true;
  const hayTokens=hay.split(' ').filter(Boolean), qTokens=q.split(' ').filter(Boolean);
  return qTokens.every(token => hayTokens.some(h => {
    if(h.startsWith(token) || token.startsWith(h)) return true;
    const max = token.length >= 7 ? 2 : token.length >= 4 ? 1 : 0;
    return max > 0 && editDistance(h,token) <= max;
  }));
}
