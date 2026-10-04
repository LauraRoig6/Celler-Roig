import type { SortMode, Wine } from './types';

export const agingRank: Record<string, number> = {
  'Joven': 1, 'Roble': 2, 'Crianza': 3, 'Reserva': 4, 'Gran Reserva': 5, 'Sin indicar': 6,
};

export function groupLabel(wine: Wine, mode: SortMode) {
  switch (mode) {
    case 'type': return wine.type;
    case 'grape': return wine.grapes[0] || 'Sin uva';
    case 'vintage': return wine.vintage ? String(wine.vintage) : 'Sin añada';
    case 'aging': return wine.aging;
    case 'protection': return wine.protection === 'Sin indicación' ? 'Sin DOP / IGP' : wine.protection;
    case 'denomination': return wine.denomination ? `${wine.protection !== 'Sin indicación' ? wine.protection + ' · ' : ''}${wine.denomination}` : 'Sin denominación';
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
    case 'protection': return list.sort((a, b) => a.protection.localeCompare(b.protection) || a.denomination.localeCompare(b.denomination));
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

export function bottleSearchUrl(name: string, winery: string) {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${name} ${winery} botella png fondo transparente`)}`;
}
