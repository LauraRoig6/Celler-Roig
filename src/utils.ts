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

async function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = .84) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('No se pudo preparar la imagen')), type, quality));
}

/**
 * Prepara una foto para Google Lens/SerpApi. SerpApi admite hasta 500 KB;
 * reducimos el archivo en el móvil antes de enviarlo para que sea rápido.
 */
export async function preparePhotoForLens(file: File): Promise<string> {
  const src = await fileToDataUrl(file);
  const img = await loadImage(src);
  let maxDimension = 1600;
  let quality = .90;
  let blob: Blob | null = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo preparar la foto');
    ctx.drawImage(img, 0, 0, w, h);
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    if (blob.size <= 485_000) break;
    maxDimension = Math.max(820, Math.round(maxDimension * .86));
    quality = Math.max(.68, quality - .06);
  }
  if (!blob) throw new Error('No se pudo preparar la foto');
  return fileToDataUrl(blob);
}

function isLightBackground(data: Uint8ClampedArray, offset: number) {
  const r = data[offset], g = data[offset + 1], b = data[offset + 2], a = data[offset + 3];
  return a > 10 && r > 230 && g > 230 && b > 230 && Math.max(r,g,b) - Math.min(r,g,b) < 32;
}

/**
 * Para fotos de catálogo (Bodeboca, Vivino, etc.) sí suele funcionar bien:
 * elimina únicamente el blanco conectado al borde y recorta márgenes. No se
 * aplica a la foto hecha con la cámara: esa foto se usa sólo para reconocer el vino.
 */
async function removeWhiteCatalogBackground(file: Blob): Promise<string> {
  const src = await fileToDataUrl(file);
  const img = await loadImage(src);
  const maxH = 760;
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
  let head = 0, tail = 0, removed = 0;
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
    data[idx*4+3] = 0; removed++;
    if (x>0) push(idx-1); if (x<w-1) push(idx+1); if (y>0) push(idx-w); if (y<h-1) push(idx+w);
  }
  // Si casi no había fondo blanco, guardamos igualmente una copia comprimida propia
  // para no depender de la URL externa y para que la estantería cargue rápido.
  if (removed < w*h*.025) {
    const compact = await canvasToBlob(canvas, 'image/webp', .82).catch(() => null);
    return compact ? fileToDataUrl(compact) : src;
  }
  ctx.putImageData(image, 0, 0);
  return cropTransparentCanvas(canvas);
}

function cropTransparentCanvas(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas.toDataURL('image/webp', .86);
  const w=canvas.width,h=canvas.height;
  const data=ctx.getImageData(0,0,w,h).data;
  let minX=w,minY=h,maxX=-1,maxY=-1;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
    if(data[(y*w+x)*4+3]>14){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  }
  if(maxX<minX||maxY<minY) return canvas.toDataURL('image/webp', .86);
  const pad=Math.max(8,Math.round(Math.min(w,h)*.018));
  minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(w-1,maxX+pad);maxY=Math.min(h-1,maxY+pad);
  const cw=maxX-minX+1,ch=maxY-minY+1;
  const out=document.createElement('canvas');out.width=cw;out.height=ch;
  out.getContext('2d')?.drawImage(canvas,minX,minY,cw,ch,0,0,cw,ch);
  return out.toDataURL('image/webp', .86);
}

export async function prepareBottleImageFromUrl(url: string): Promise<string> {
  try {
    const res = await fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error('proxy');
    const blob = await res.blob();
    return await removeWhiteCatalogBackground(blob);
  } catch {
    return url;
  }
}

export function bottleSearchUrl(name: string, winery: string) {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${name} ${winery} botella wine`)}`;
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
  const hay=normalizeSearch([wine.name,wine.winery,wine.type,displayAging(wine),wine.classification,wine.denomination,wine.region,wine.country,wine.pairing,wine.shop,...wine.grapes,String(wine.vintage||'')].join(' '));
  if(hay.includes(q)) return true;
  const hayTokens=hay.split(' ').filter(Boolean), qTokens=q.split(' ').filter(Boolean);
  return qTokens.every(token => hayTokens.some(h => {
    if(h.startsWith(token) || token.startsWith(h)) return true;
    const max = token.length >= 7 ? 2 : token.length >= 4 ? 1 : 0;
    return max > 0 && editDistance(h,token) <= max;
  }));
}
