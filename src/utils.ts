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

export async function fileToDataUrl(file: File): Promise<string> {
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

function isLightBackground(data: Uint8ClampedArray, offset: number) {
  const r = data[offset], g = data[offset + 1], b = data[offset + 2], a = data[offset + 3];
  return a > 10 && r > 232 && g > 232 && b > 232 && Math.max(r,g,b) - Math.min(r,g,b) < 28;
}

/**
 * Prepara una foto de botella para la estantería: reduce tamaño y, si el fondo
 * es blanco o casi blanco, lo convierte en transparente únicamente desde los bordes,
 * preservando las etiquetas blancas interiores.
 */
export async function prepareBottleImageFromFile(file: File): Promise<string> {
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

  let minX=w, minY=h, maxX=-1, maxY=-1;
  for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
    if (data[(y*w+x)*4+3] > 8) { minX=Math.min(minX,x); minY=Math.min(minY,y); maxX=Math.max(maxX,x); maxY=Math.max(maxY,y); }
  }
  if (maxX >= minX && maxY >= minY) {
    const pad = Math.max(8, Math.round(Math.min(w,h)*0.025));
    minX=Math.max(0,minX-pad); minY=Math.max(0,minY-pad); maxX=Math.min(w-1,maxX+pad); maxY=Math.min(h-1,maxY+pad);
    const cw=maxX-minX+1, ch=maxY-minY+1;
    const out=document.createElement('canvas'); out.width=cw; out.height=ch;
    out.getContext('2d')?.drawImage(canvas,minX,minY,cw,ch,0,0,cw,ch);
    return out.toDataURL('image/webp', .9);
  }
  return canvas.toDataURL('image/webp', .9);
}

export async function prepareBottleImageFromUrl(url: string): Promise<string> {
  try {
    const res = await fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error('proxy');
    const blob = await res.blob();
    const file = new File([blob], 'botella', { type: blob.type || 'image/jpeg' });
    return await prepareBottleImageFromFile(file);
  } catch {
    return url;
  }
}

export async function detectPhotoClues(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const w = window as any;
    if (w.TextDetector) {
      const detector = new w.TextDetector();
      const blocks = await detector.detect(bitmap);
      const text = (blocks || []).map((x: any) => x.rawValue || x.text || '').join(' ').replace(/\s+/g,' ').trim();
      if (text.length >= 4) return text.slice(0, 120);
    }
    if (w.BarcodeDetector) {
      const detector = new w.BarcodeDetector();
      const codes = await detector.detect(bitmap);
      const value = codes?.[0]?.rawValue;
      if (value) return String(value);
    }
  } catch {}
  return '';
}

export function bottleSearchUrl(name: string, winery: string) {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${name} ${winery} botella png fondo transparente`)}`;
}
