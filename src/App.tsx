import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive, Camera, ChevronDown, CirclePlus, Clock3, Gift, Heart, Home, ImagePlus,
  List, Mic, Minus, Pencil, Plus, Search, Settings, SlidersHorizontal, Sparkles,
  Star, Trash2, Undo2, Wine as WineIcon, X, Check, ShoppingBag, GlassWater, GripVertical,
  ExternalLink, RotateCcw, CheckCircle2, Download, Upload, BarChart3, Utensils,
} from 'lucide-react';
import {
  DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, rectSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Aging, Protection, SortMode, Tasting, Wine, WineStatus, WineType } from './types';
import { seedWines } from './seed';
import { displayAging, groupLabel, prepareBottleImageFromUrl, preparePhotoForLens, sortWines, wineMatchesQuery } from './utils';

type Tab = 'home' | 'cellar' | 'tried' | 'add' | 'wishlist' | 'settings';
type ViewMode = 'shelf' | 'list';
type CellarFilter = 'Todos' | WineType | 'Favoritos' | 'Regalos' | 'Abrir pronto';
type CloudStatus = 'connecting' | 'synced' | 'saving' | 'local' | 'error';

type EditableWine = Omit<Wine, 'id' | 'createdAt' | 'manualOrder'>;

const STORAGE_KEY = 'celler-roig:wines:v1';
const DIRTY_KEY = 'celler-roig:pending-sync:v1';
const typeOptions: WineType[] = ['Tinto','Blanco','Rosado','Espumoso','Sin indicar'];
const agingOptions: Aging[] = ['Joven','Roble','Crianza','Reserva','Gran Reserva','Otro','Sin indicar'];
const sortOptions: {value: SortMode; label: string}[] = [
  { value: 'manual', label: 'Mi orden' },
  { value: 'type', label: 'Tipo de vino' },
  { value: 'grape', label: 'Tipo de uva' },
  { value: 'vintage', label: 'Añada' },
  { value: 'aging', label: 'Envejecimiento' },
  { value: 'denomination', label: 'Denominación' },
  { value: 'score', label: 'Puntuación' },
  { value: 'name', label: 'Nombre' },
];

const emptyForm = (): EditableWine => ({
  name: '', winery: '', vintage: undefined, type: 'Sin indicar', grapes: [], aging: 'Sin indicar', customAging: '',
  protection: 'Sin indicación', classification: '', denomination: '', region: '', country: '', alcohol: undefined,
  price: undefined, shop: '', shopContext: 'cellar', quantity: 1, status: 'cellar', tried: false, wishlist: false, favorite: false,
  score: undefined, notes: '', rebuy: '', imageUrl: '', gifted: false, openSoon: false, pairing: '', pairingSource: '', giftedBy: '', giftDate: '',
  tastings: [], lastTastedAt: undefined,
});

const LEGACY_DEMO_NAMES = new Set(['Viña Ardanza','Muga Crianza','Protos 27','Mar de Frades','Les Alcusses','Finca Terrerazo']);
function migrateLegacyDemos(list: Wine[]) {
  const demoIds = new Set(seedWines.map(w => w.id));
  if (!list.some(w => LEGACY_DEMO_NAMES.has(w.name) || demoIds.has(w.id))) return { changed: false, wines: list };
  const kept = list.filter(w => !LEGACY_DEMO_NAMES.has(w.name) && !demoIds.has(w.id));
  const baseOrder = Math.max(-1, ...kept.map(w => w.manualOrder));
  const demos = normalizeCollection(seedWines).map((w,i) => ({ ...w, manualOrder: baseOrder + i + 1 }));
  return { changed: true, wines: [...kept, ...demos] };
}

const GRAPE_ALIASES: Record<string,string> = {
  'grenache': 'Garnacha', 'garnatxa': 'Garnacha', 'garnacha tinta': 'Garnacha',
  'shiraz': 'Syrah',
  'pinot grigio': 'Pinot Gris',
  'mourvedre': 'Monastrell', 'mourvèdre': 'Monastrell', 'mataro': 'Monastrell',
  'tinto fino': 'Tempranillo', 'tinta del pais': 'Tempranillo', 'tinta del país': 'Tempranillo', 'cencibel': 'Tempranillo', 'tinta roriz': 'Tempranillo',
  'viura': 'Macabeo',
  'carmenere': 'Carmenère',
  'semillon': 'Sémillon',
  'gruner veltliner': 'Grüner Veltliner',
};
function grapeLookupKey(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
function canonicalGrape(value:string){const clean=value.trim().replace(/\s+/g,' ');return GRAPE_ALIASES[grapeLookupKey(clean)] || clean;}
function normalizeGrapeList(values:string[]){
  const out:string[]=[]; const seen=new Set<string>();
  for(const value of values){const grape=canonicalGrape(value);const key=grapeLookupKey(grape);if(!grape||seen.has(key))continue;seen.add(key);out.push(grape);}
  return out;
}

function normalizeWine(raw: Partial<Wine>): Wine {
  const legacyWishlist = raw.wishlist ?? raw.status === 'wishlist';
  const legacyTried = raw.tried ?? (raw.status === 'tried' || Boolean(raw.score || raw.notes || raw.rebuy));
  const quantity = Math.max(0, Number(raw.quantity || 0));
  const protection: Protection = raw.protection || 'Sin indicación';
  const status: WineStatus = legacyWishlist ? 'wishlist' : quantity > 0 ? 'cellar' : 'tried';
  return {
    id: raw.id || crypto.randomUUID(), name: raw.name || '', winery: raw.winery || '', vintage: raw.vintage,
    type: ['Tinto','Blanco','Rosado','Espumoso','Sin indicar'].includes(String(raw.type)) ? raw.type as WineType : 'Sin indicar', grapes: normalizeGrapeList(Array.isArray(raw.grapes) ? raw.grapes : []), aging: raw.aging || 'Sin indicar',
    customAging: raw.customAging || '', protection, classification: raw.classification || (protection === 'Sin indicación' ? '' : protection),
    denomination: raw.denomination || '', region: raw.region || '', country: raw.country || '', alcohol: raw.alcohol,
    price: raw.price, shop: raw.shop || '', shopContext: raw.shopContext || (legacyWishlist ? 'wishlist' : quantity > 0 ? 'cellar' : 'tried'), quantity, status, tried: Boolean(legacyTried), wishlist: Boolean(legacyWishlist),
    favorite: Boolean(raw.favorite), score: raw.score, notes: raw.notes || '', rebuy: raw.rebuy || '', imageUrl: raw.imageUrl || '',
    gifted: Boolean(raw.gifted), openSoon: Boolean(raw.openSoon), pairing: raw.pairing || '', pairingSource: raw.pairingSource || '', giftedBy: raw.giftedBy || '', giftDate: raw.giftDate || '',
    tastings: Array.isArray(raw.tastings) ? raw.tastings : [], lastTastedAt: raw.lastTastedAt,
    createdAt: raw.createdAt || new Date().toISOString(), manualOrder: Number.isFinite(Number(raw.manualOrder)) ? Number(raw.manualOrder) : 0,
  };
}

function normalizeCollection(list: unknown): Wine[] {
  return Array.isArray(list) ? list.map(w => normalizeWine(w as Partial<Wine>)) : [];
}

function shopLabelForStatus(status: WineStatus) {
  if (status === 'tried') return 'Dónde lo probé';
  if (status === 'wishlist') return 'Dónde lo vi';
  return 'Dónde lo compré';
}

function pairingSuggestion(type: WineType, grapes: string[], aging: Aging = 'Sin indicar') {
  const all = normalizeGrapeList(grapes).map(g => grapeLookupKey(g)).join(' ');
  if (type === 'Espumoso') return 'Aperitivos, marisco, pescado, arroces y frituras';
  if (type === 'Rosado') return 'Aperitivos, ensaladas, pasta, arroces y cocina mediterránea';
  if (type === 'Blanco') {
    if (/albarino|godello|verdejo|sauvignon|riesling/.test(all)) return 'Marisco, pescado, arroces y quesos suaves';
    if (/chardonnay|viognier/.test(all) && ['Roble','Crianza','Reserva'].includes(aging)) return 'Pescado, aves, pasta cremosa y quesos semicurados';
    return 'Pescado, marisco, aperitivos y platos ligeros';
  }
  if (type === 'Tinto') {
    if (/tempranillo/.test(all)) return 'Carnes rojas, asados, embutidos y quesos curados';
    if (/cabernet|syrah|malbec|monastrell|bobal/.test(all)) return 'Carnes rojas, guisos, barbacoa y quesos intensos';
    if (/pinot noir|gamay/.test(all)) return 'Aves, setas, carnes blancas y quesos suaves';
    if (/garnacha/.test(all)) return 'Carnes rojas, arroces, embutidos y quesos';
    return 'Carnes, guisos, embutidos y quesos';
  }
  return '';
}


function normalizeFood(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}

function dishHints(dish: string) {
  const q = normalizeFood(dish);
  const hints = new Set<string>(q.split(' ').filter(x => x.length > 2));
  const add = (...values:string[]) => values.forEach(v => hints.add(v));
  if (/paella|arroz|risotto/.test(q)) add('arroz','arroces','mediterranea');
  if (/cordero|lechazo|cabrito|ternera|buey|vaca|chuleton|entrecot|solomillo/.test(q)) add('carnes','rojas','asados');
  if (/cerdo|secreto|presa|costilla/.test(q)) add('carnes','asados','barbacoa');
  if (/pollo|pavo|ave|aves/.test(q)) add('aves','carnes','blancas');
  if (/pescado|merluza|lubina|dorada|bacalao|salmon|atun/.test(q)) add('pescado');
  if (/marisco|gamba|langostino|mejillon|ostra|vieira/.test(q)) add('marisco','pescado');
  if (/sushi|sashimi/.test(q)) add('sushi','pescado');
  if (/pasta|lasana|lasaña|pizza/.test(q)) add('pasta','mediterranea');
  if (/queso|tabla/.test(q)) add('quesos');
  if (/seta|setas|hongo|hongos/.test(q)) add('setas');
  if (/aperitivo|tapa|tapas|entrante/.test(q)) add('aperitivos');
  if (/ensalada|verdura|verduras|vegetal|vegetales/.test(q)) add('ensaladas','platos','ligeros');
  if (/guiso|estofado/.test(q)) add('guisos','carnes');
  if (/brasa|parrilla|barbacoa/.test(q)) add('barbacoa','asados');
  return { q, hints: [...hints] };
}

function scoreWineForDish(wine: Wine, dish: string) {
  const { q, hints } = dishHints(dish);
  const hintSet = new Set(hints);
  const fallbackPairing = wine.pairing || pairingSuggestion(wine.type, wine.grapes, wine.aging);
  const hay = normalizeFood([fallbackPairing, wine.type, ...wine.grapes, displayAging(wine), wine.denomination].join(' '));
  let score = 0;
  if (q && hay.includes(q)) score += 16;
  for (const hint of hints) if (hint.length > 2 && hay.includes(hint)) score += hint.length > 5 ? 3.2 : 2.2;
  // Solo usamos familias amplias de comida como desempate. El plato concreto lo escribe la persona.
  if ((hintSet.has('rojas') || hintSet.has('guisos') || hintSet.has('asados') || hintSet.has('barbacoa')) && wine.type === 'Tinto') score += 4;
  if ((hintSet.has('pescado') || hintSet.has('marisco') || hintSet.has('sushi')) && ['Blanco','Rosado','Espumoso'].includes(wine.type)) score += 4;
  if (hintSet.has('arroces')) {
    if (/arroces|arroz|mediterranea/.test(hay)) score += 4;
    if (['Blanco','Rosado'].includes(wine.type)) score += 1.5;
  }
  if (hintSet.has('quesos') && ['Tinto','Espumoso'].includes(wine.type)) score += 1.5;
  if (wine.favorite) score += .7;
  if (wine.score != null) score += Math.max(0, wine.score - 7) * .35;
  return { score, pairing: fallbackPairing };
}

function recommendWineForDish(cellar: Wine[], dish: string) {
  if (!cellar.length || !dish.trim()) return null;
  const ranked = cellar.map(w => ({ wine: w, ...scoreWineForDish(w,dish) })).sort((a,b) => b.score-a.score || (b.wine.score||0)-(a.wine.score||0));
  const best = ranked[0];
  if (!best) return null;
  return { wine: best.wine, reason: best.pairing ? `Encaja con su maridaje: ${best.pairing}` : `Es la opción que mejor encaja con “${dish.trim()}”.` };
}

function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [wines, setWines] = useState<Wine[]>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      const local = parsed ? normalizeCollection(parsed) : normalizeCollection(seedWines);
      return migrateLegacyDemos(local).wines;
    } catch { return normalizeCollection(seedWines); }
  });
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [editingWine, setEditingWine] = useState<Wine | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('manual');
  const [viewMode, setViewMode] = useState<ViewMode>('shelf');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CellarFilter>('Todos');
  const [sortOpen, setSortOpen] = useState(false);
  const [form, setForm] = useState<EditableWine>(emptyForm());
  const [moreInfo, setMoreInfo] = useState(false);
  const [editingShelf, setEditingShelf] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('connecting');
  const [undoDrink, setUndoDrink] = useState<Wine | null>(null);
  const undoTimer = useRef<number | null>(null);
  const winesRef = useRef<Wine[]>(wines);

  useEffect(() => { winesRef.current = wines; localStorage.setItem(STORAGE_KEY, JSON.stringify(wines)); }, [wines]);
  useEffect(() => { if (selectedWine) setSelectedWine(wines.find(w => w.id === selectedWine.id) || null); }, [wines]);


  async function pullFromCloud() {
    if (!navigator.onLine || localStorage.getItem(DIRTY_KEY) === '1') return;
    try {
      const res = await fetch('/api/wines', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCloudStatus(data.code === 'DATABASE_NOT_CONFIGURED' ? 'local' : 'error');
        return;
      }
      const remoteWines = normalizeCollection(data.wines);
      // Sustituye únicamente los ejemplos antiguos por los nuevos, conservando
      // cualquier vino real que ya hubiera añadido Pedro.
      const migrated = migrateLegacyDemos(remoteWines);
      if (migrated.changed) {
        setWines(migrated.wines);
        await fetch('/api/wines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wines: migrated.wines, replace: true }) });
        setCloudStatus('synced');
        return;
      }
      // Neon es la fuente común entre móvil y PC. Incluso una colección vacía
      // debe sustituir la copia local para que los borrados se propaguen.
      setWines(remoteWines);
      setCloudStatus('synced');
    } catch { setCloudStatus('error'); }
  }

  async function pushPendingCollection() {
    if (!navigator.onLine || localStorage.getItem(DIRTY_KEY) !== '1') return false;
    try {
      setCloudStatus('saving');
      const res = await fetch('/api/wines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wines: winesRef.current, replace: true }) });
      if (!res.ok) throw new Error('sync');
      localStorage.removeItem(DIRTY_KEY);
      setCloudStatus('synced');
      return true;
    } catch { setCloudStatus('error'); return false; }
  }

  useEffect(() => {
    let cancelled = false;
    async function initialSync() {
      if (localStorage.getItem(DIRTY_KEY) === '1') {
        const pushed = await pushPendingCollection();
        if (pushed || cancelled) return;
      }
      if (!cancelled) await pullFromCloud();
    }
    void initialSync();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible' && localStorage.getItem(DIRTY_KEY) !== '1') void pullFromCloud();
    };
    const online = async () => {
      const pushed = await pushPendingCollection();
      if (!pushed) await pullFromCloud();
    };
    const timer = window.setInterval(refresh, 8000);
    window.addEventListener('focus', refresh);
    window.addEventListener('online', online);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', online);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  async function persistWine(wine: Wine) {
    localStorage.setItem(DIRTY_KEY, '1');
    if (cloudStatus === 'local') return;
    setCloudStatus('saving');
    try {
      const res = await fetch('/api/wines', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wine }) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.code !== 'DATABASE_NOT_CONFIGURED') localStorage.setItem(DIRTY_KEY, '1');
        setCloudStatus(data.code === 'DATABASE_NOT_CONFIGURED' ? 'local' : 'error');
        return;
      }
      localStorage.removeItem(DIRTY_KEY); setCloudStatus('synced');
    } catch { localStorage.setItem(DIRTY_KEY, '1'); setCloudStatus('error'); }
  }

  async function persistOrder(list: Wine[]) {
    localStorage.setItem(DIRTY_KEY, '1');
    if (cloudStatus === 'local') return;
    setCloudStatus('saving');
    try {
      const order = list.map(w => ({ id: w.id, manualOrder: w.manualOrder }));
      const res = await fetch('/api/wines', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order }) });
      if (!res.ok) throw new Error('order');
      localStorage.removeItem(DIRTY_KEY); setCloudStatus('synced');
    } catch { localStorage.setItem(DIRTY_KEY, '1'); setCloudStatus('error'); }
  }

  async function deleteRemoteWine(id: string) {
    localStorage.setItem(DIRTY_KEY, '1');
    if (cloudStatus === 'local') return;
    setCloudStatus('saving');
    try {
      const res = await fetch('/api/wines', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error('delete');
      localStorage.removeItem(DIRTY_KEY); setCloudStatus('synced');
    } catch { localStorage.setItem(DIRTY_KEY, '1'); setCloudStatus('error'); }
  }

  async function replaceCloud(list: Wine[]) {
    localStorage.setItem(DIRTY_KEY, '1');
    if (cloudStatus === 'local') return;
    setCloudStatus('saving');
    try {
      const res = await fetch('/api/wines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wines: list, replace: true }) });
      if (!res.ok) throw new Error('replace');
      localStorage.removeItem(DIRTY_KEY); setCloudStatus('synced');
    } catch { localStorage.setItem(DIRTY_KEY, '1'); setCloudStatus('error'); }
  }


  function importBackup(data: unknown) {
    const next = normalizeCollection(data);
    if (!next.length) { alert('No he encontrado vinos válidos en esa copia.'); return; }
    if (!confirm(`¿Restaurar ${next.length} vinos? Sustituirá la colección actual.`)) return;
    setWines(next); setSelectedWine(null); setTab('home'); localStorage.setItem(DIRTY_KEY, '1'); void replaceCloud(next);
  }

  const cellarWines = useMemo(() => wines.filter(w => w.quantity > 0 && !w.wishlist), [wines]);
  const triedWines = useMemo(() => wines.filter(w => w.tried), [wines]);
  const wishlist = useMemo(() => wines.filter(w => w.wishlist), [wines]);
  const bottleCount = cellarWines.reduce((n, w) => n + w.quantity, 0);
  const favorites = wines.filter(w => w.favorite);

  const filtered = useMemo(() => {
    const q = search.trim();
    return cellarWines.filter(w => {
      const filterOk = typeFilter === 'Todos' || (typeOptions.includes(typeFilter as WineType) && w.type === typeFilter) || (typeFilter === 'Favoritos' && w.favorite) || (typeFilter === 'Regalos' && w.gifted) || (typeFilter === 'Abrir pronto' && w.openSoon);
      return wineMatchesQuery(w, q) && filterOk;
    });
  }, [cellarWines, search, typeFilter]);

  const sorted = useMemo(() => sortWines(filtered, sortMode), [filtered, sortMode]);
  const groups = useMemo(() => {
    const map = new Map<string, Wine[]>();
    sorted.forEach(w => { const label = groupLabel(w, sortMode); if (!map.has(label)) map.set(label, []); map.get(label)!.push(w); });
    return [...map.entries()];
  }, [sorted, sortMode]);

  function duplicateOf(candidate: EditableWine) {
    const key = (s:string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
    return wines.find(w => key(w.name) === key(candidate.name) && (!candidate.vintage || !w.vintage || w.vintage === candidate.vintage));
  }

  function formToWine(base?: Wine): Wine {
    const isWish = form.status === 'wishlist';
    const isTriedOnly = form.status === 'tried';
    const quantity = isWish || isTriedOnly ? 0 : Math.max(1, form.quantity);
    const tried = isTriedOnly ? true : Boolean(form.tried);
    return normalizeWine({
      ...(base || {}), ...form, quantity, wishlist: isWish, tried,
      status: isWish ? 'wishlist' : quantity > 0 ? 'cellar' : 'tried',
      id: base?.id || crypto.randomUUID(), createdAt: base?.createdAt || new Date().toISOString(),
      manualOrder: base?.manualOrder ?? Math.max(-1, ...wines.map(w => w.manualOrder)) + 1,
    });
  }

  function saveForm() {
    if (!form.name.trim()) return;
    if (!editingWine) {
      const duplicate = duplicateOf(form);
      if (duplicate) {
        if (form.status === 'wishlist' && duplicate.quantity > 0) {
          alert(`“${duplicate.name}${duplicate.vintage ? ` ${duplicate.vintage}` : ''}” ya está en tu Vinoteca.`);
          setSelectedWine(duplicate); setTab('cellar'); return;
        }
        if (confirm(`Ya tienes “${duplicate.name}${duplicate.vintage ? ` ${duplicate.vintage}` : ''}” registrado.\n\n¿Quieres actualizar esa ficha en vez de crear otra?`)) {
          const updated = normalizeWine({
            ...duplicate,
            quantity: form.status === 'cellar' ? Math.max(1, duplicate.quantity + Math.max(1, form.quantity)) : duplicate.quantity,
            wishlist: form.status === 'wishlist' ? true : false,
            tried: duplicate.tried || form.status === 'tried' || form.tried,
            status: form.status === 'wishlist' ? 'wishlist' : Math.max(duplicate.quantity, form.quantity) > 0 ? 'cellar' : 'tried',
          });
          setWines(prev => prev.map(w => w.id === duplicate.id ? updated : w));
          void persistWine(updated);
          setSelectedWine(updated);
          setForm(emptyForm()); setMoreInfo(false);
          setTab(form.status === 'wishlist' ? 'wishlist' : form.status === 'tried' ? 'tried' : 'cellar');
          return;
        }
      }
    }

    const wine = formToWine(editingWine || undefined);
    if (editingWine) setWines(prev => prev.map(w => w.id === editingWine.id ? wine : w));
    else setWines(prev => [...prev, wine]);
    setSelectedWine(wine); void persistWine(wine);
    const nextTab: Tab = wine.wishlist ? 'wishlist' : wine.quantity > 0 ? 'cellar' : 'tried';
    setForm(emptyForm()); setEditingWine(null); setMoreInfo(false); setTab(nextTab);
  }

  function startEdit(wine: Wine) {
    const { id: _id, createdAt: _created, manualOrder: _order, ...editable } = wine;
    setForm({ ...editable, status: wine.wishlist ? 'wishlist' : wine.quantity > 0 ? 'cellar' : 'tried' });
    setEditingWine(wine); setSelectedWine(null); setMoreInfo(true); setTab('add');
  }

  function resetAdd(status: WineStatus = 'cellar') {
    setEditingWine(null);
    setForm({ ...emptyForm(), status, shopContext: status, wishlist: status === 'wishlist', tried: status === 'tried', quantity: status === 'cellar' ? 1 : 0 });
    setMoreInfo(false); setTab('add');
  }

  function patchWine(id: string, patch: Partial<Wine>) {
    const current = wines.find(w => w.id === id); if (!current) return;
    const updated = normalizeWine({ ...current, ...patch });
    setWines(prev => prev.map(w => w.id === id ? updated : w));
    setSelectedWine(prev => prev?.id === id ? updated : prev);
    void persistWine(updated);
  }

  function removeWine(id: string) {
    setWines(prev => prev.filter(w => w.id !== id)); setSelectedWine(null); void deleteRemoteWine(id);
  }

  function moveWishlistToCellar(wine: Wine) {
    patchWine(wine.id, { wishlist: false, status: 'cellar', quantity: Math.max(1, wine.quantity) });
    setSelectedWine(null); setTab('cellar');
  }

  function consumeWine(wine: Wine) {
    if (wine.quantity <= 0) return;
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    setUndoDrink(wine);
    const nextQty = Math.max(0, wine.quantity - 1);
    patchWine(wine.id, { quantity: nextQty, tried: true, wishlist: false, status: nextQty > 0 ? 'cellar' : 'tried', lastTastedAt: new Date().toISOString() });
    undoTimer.current = window.setTimeout(() => setUndoDrink(null), 6500);
  }

  function undoConsume() {
    if (!undoDrink) return;
    setWines(prev => prev.map(w => w.id === undoDrink.id ? undoDrink : w));
    setSelectedWine(prev => prev?.id === undoDrink.id ? undoDrink : prev);
    void persistWine(undoDrink); setUndoDrink(null);
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
  }

  return (
    <div className="app-shell">
      <main className="screen">
        {tab === 'home' && <HomeScreen wines={wines} cellar={cellarWines} tried={triedWines} wishlist={wishlist} favorites={favorites} bottleCount={bottleCount} onOpen={setSelectedWine} onGo={setTab} onAdd={() => resetAdd('cellar')} />}
        {tab === 'cellar' && <CellarScreen wines={sorted} groups={groups} sortMode={sortMode} setSortMode={setSortMode} sortOpen={sortOpen} setSortOpen={setSortOpen} viewMode={viewMode} setViewMode={setViewMode} search={search} setSearch={setSearch} typeFilter={typeFilter} setTypeFilter={setTypeFilter} onOpen={setSelectedWine} editingShelf={editingShelf} setEditingShelf={setEditingShelf} onReorder={(ids) => { const orderMap = new Map(ids.map((id,i)=>[id,i])); const updated = wines.map(w => orderMap.has(w.id) ? { ...w, manualOrder: orderMap.get(w.id)! } : w); setWines(updated); void persistOrder(updated); }} />}
        {tab === 'tried' && <TriedScreen wines={triedWines} onOpen={setSelectedWine} onAdd={() => resetAdd('tried')} />}
        {tab === 'wishlist' && <WishlistScreen wines={wishlist} onOpen={setSelectedWine} onAdd={() => resetAdd('wishlist')} />}
        {tab === 'add' && <AddScreen form={form} setForm={setForm} save={saveForm} editing={!!editingWine} moreInfo={moreInfo} setMoreInfo={setMoreInfo} onCancel={() => { setEditingWine(null); setForm(emptyForm()); setTab('cellar'); }} />}
        {tab === 'settings' && <SettingsScreen wines={wines} cloudStatus={cloudStatus} onBack={()=>setTab('home')} onImport={importBackup} onReset={() => { if (confirm('¿Restaurar los vinos de ejemplo?')) { const demo = normalizeCollection(seedWines); setWines(demo); void replaceCloud(demo); } }} />}
      </main>

      {tab !== 'add' && tab !== 'settings' && <BottomNav tab={tab} setTab={setTab} onAdd={() => resetAdd('cellar')} />}
      {selectedWine && <WineModal wine={selectedWine} allWines={wines} onOpenWine={setSelectedWine} onClose={() => setSelectedWine(null)} onPatch={patchWine} onEdit={startEdit} onDelete={removeWine} onMoveToCellar={moveWishlistToCellar} onConsume={consumeWine} />}
      {undoDrink && <div className="undo-toast"><div><CheckCircle2 size={18}/><span>Botella descontada</span></div><button onClick={undoConsume}><Undo2 size={17}/> Deshacer</button></div>}
    </div>
  );
}

function Header({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: React.ReactNode }) {
  return <header className="page-header"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1></div>{right}</header>;
}

function HomeScreen({ wines, cellar, tried, wishlist, favorites, bottleCount, onOpen, onGo, onAdd }: {
  wines: Wine[]; cellar: Wine[]; tried: Wine[]; wishlist: Wine[]; favorites: Wine[]; bottleCount: number; onOpen:(w:Wine)=>void; onGo:(t:Tab)=>void; onAdd:()=>void;
}) {
  const [globalSearch, setGlobalSearch] = useState('');
  const [dish, setDish] = useState('');
  const [suggested, setSuggested] = useState<{wine:Wine;reason:string}|null>(null);
  const recent = [...wines].sort((a,b) => (b.lastTastedAt || b.createdAt).localeCompare(a.lastTastedAt || a.createdAt)).slice(0, 4);
  const q = globalSearch.trim();
  const results = q ? wines.filter(w => wineMatchesQuery(w,q)).slice(0,5) : [];
  const openSoon = cellar.filter(w => w.openSoon).slice(0,4);

  function recommendDish() {
    const result = recommendWineForDish(cellar,dish);
    setSuggested(result);
  }
  function surprise() {
    if (!cellar.length) return setSuggested(null);
    const pool = [...cellar].sort((a,b)=>(b.favorite?1:0)-(a.favorite?1:0)||(b.score||0)-(a.score||0)).slice(0,Math.min(6,cellar.length));
    const wine = pool[Math.floor(Math.random()*pool.length)];
    setSuggested({wine,reason:'Hoy dejamos que Celler Roig elija por ti.'});
  }

  return <div className="page home-page">
    <div className="sticky-head home-sticky">
      <section className="brand-hero">
        <div className="brand-mark"><WineIcon size={28}/></div>
        <div className="brand-copy"><div className="brand-name">CELLER ROIG</div><div className="brand-sub">La vinoteca de Pedro</div></div>
        <button className="hero-settings" onClick={()=>onGo('settings')} aria-label="Ajustes"><Settings/></button>
      </section>
      <div className="searchbox global-search"><Search size={20}/><input value={globalSearch} onChange={e=>setGlobalSearch(e.target.value)} placeholder="Buscar en Celler Roig…"/></div>
    </div>
    {q && <div className="global-results sticky-follow-results">{results.length ? results.map(w=><button key={w.id} onClick={()=>onOpen(w)}><BottleVisual wine={w} compact/><div><strong>{w.name}</strong><span>{w.denomination || w.winery}{w.vintage?` · ${w.vintage}`:''}</span></div></button>) : <span>No encuentro ese vino.</span>}</div>}

    <section className="stats-grid">
      <button className="stat-card" onClick={() => onGo('cellar')}><strong>{bottleCount}</strong><span>botellas en casa</span></button>
      <button className="stat-card" onClick={() => onGo('tried')}><strong>{tried.length}</strong><span>vinos probados</span></button>
      <button className="stat-card" onClick={() => onGo('wishlist')}><strong>{wishlist.length}</strong><span>por probar</span></button>
    </section>

    <button className="primary big-action" onClick={onAdd}><CirclePlus size={23}/> Añadir un vino</button>

    {cellar.length > 0 && <section className="open-tonight-card food-card">
      <div className="food-card-head"><div className="open-title"><Utensils/><div><strong>¿Qué abrimos hoy?</strong><span>Dime qué vais a comer y busco la botella que mejor encaja.</span></div></div><div className="food-modes"><button className="food-mode active" onClick={recommendDish}><Utensils size={15}/> Comida</button><button className="food-mode sparkle" onClick={surprise} aria-label="Sorpréndeme" title="Sorpréndeme"><Sparkles size={18}/></button></div></div>
      <div className="dish-input"><input value={dish} onChange={e=>setDish(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')recommendDish()}} placeholder="Ej. arroz, pasta, carne, pescado…"/><button onClick={recommendDish} disabled={!dish.trim()}>Recomendar</button></div>
      {suggested&&<button className="suggested-wine" onClick={()=>onOpen(suggested.wine)}><BottleVisual wine={suggested.wine} compact/><div><small>Mi propuesta</small><strong>{suggested.wine.name}</strong><span>{suggested.wine.vintage || 'Sin añada'} · {suggested.wine.quantity} en casa</span><em>{suggested.reason}</em></div></button>}
    </section>}

    {openSoon.length>0&&<section className="attention-card"><div className="open-title"><Clock3/><div><strong>Para abrir pronto</strong><span>Botellas que has marcado para tenerlas a mano.</span></div></div><div className="mini-list">{openSoon.map(w=><button key={w.id} className="mini-row" onClick={()=>onOpen(w)}><BottleVisual wine={w} compact/><div className="mini-copy"><strong>{w.name}</strong><span>Marcado para abrir pronto</span></div><Clock3 size={17}/></button>)}</div></section>}

    <SectionTitle title="Últimos vinos" />
    <div className="horizontal-cards">{recent.map(w => <WineCard key={w.id} wine={w} onClick={() => onOpen(w)} />)}</div>

    {favorites.length > 0 && <><SectionTitle title="Favoritos"/><div className="mini-list">{favorites.slice(0,4).map(w => <button key={w.id} className="mini-row" onClick={() => onOpen(w)}><BottleVisual wine={w} compact/><div className="mini-copy"><strong>{w.name}</strong><span>{w.denomination || w.winery}</span></div><span className="score-pill"><Star size={14} fill="currentColor"/> {w.score ?? '—'}</span></button>)}</div></>}
  </div>;
}

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <div className="section-title"><h2>{title}</h2>{action && <button onClick={onAction}>{action}</button>}</div>;
}

function CellarScreen(props: {
  wines: Wine[]; groups: [string,Wine[]][]; sortMode:SortMode; setSortMode:(m:SortMode)=>void; sortOpen:boolean; setSortOpen:(v:boolean)=>void;
  viewMode:ViewMode; setViewMode:(m:ViewMode)=>void; search:string; setSearch:(s:string)=>void; typeFilter:CellarFilter; setTypeFilter:(t:CellarFilter)=>void;
  onOpen:(w:Wine)=>void; editingShelf:boolean; setEditingShelf:(v:boolean)=>void; onReorder:(ids:string[])=>void;
}) {
  const sensors = useSensors(useSensor(PointerSensor,{activationConstraint:{distance:8}}),useSensor(TouchSensor,{activationConstraint:{delay:220,tolerance:8}}));
  const bottleCount = props.wines.reduce((sum,w)=>sum+w.quantity,0);
  function dragEnd(event: DragEndEvent) {
    if (props.sortMode !== 'manual') return;
    const { active, over } = event; if (!over || active.id===over.id) return;
    const ids=props.wines.map(w=>w.id), oldIndex=ids.indexOf(String(active.id)), newIndex=ids.indexOf(String(over.id));
    props.onReorder(arrayMove(ids,oldIndex,newIndex));
  }
  return <div className="page cellar-page">
    <div className="sticky-head cellar-sticky">
      <Header eyebrow="EN CASA" title="Vinoteca" right={<div className="view-toggle"><button className={props.viewMode==='shelf'?'active':''} onClick={()=>props.setViewMode('shelf')}><Archive size={18}/></button><button className={props.viewMode==='list'?'active':''} onClick={()=>props.setViewMode('list')}><List size={18}/></button></div>} />
      <p className="page-intro compact-intro">Aquí aparecen solo las botellas que tienes ahora mismo en casa.</p>
      <div className="searchbox"><Search size={20}/><input value={props.search} onChange={e=>props.setSearch(e.target.value)} placeholder="Buscar vino, uva, denominación…"/></div>
      <div className="filter-scroll">{(['Todos','Tinto','Blanco','Rosado','Espumoso','Favoritos','Regalos','Abrir pronto'] as const).map(x=><button key={x} className={props.typeFilter===x?'chip active':'chip'} onClick={()=>props.setTypeFilter(x)}>{x}</button>)}</div>
      <div className="filter-row"><div className="sort-wrap"><div className="sort-control"><button className="sort-button" onClick={()=>props.setSortOpen(!props.sortOpen)}><SlidersHorizontal size={18}/>{sortOptions.find(x=>x.value===props.sortMode)?.label}<ChevronDown size={17}/></button>{props.sortMode==='manual'&&props.viewMode==='shelf'&&<button className={props.editingShelf?'manual-order-btn active':'manual-order-btn'} onClick={()=>props.setEditingShelf(!props.editingShelf)} title={props.editingShelf?'Terminar de ordenar':'Ordenar estantería'} aria-label={props.editingShelf?'Terminar de ordenar':'Ordenar estantería'}><GripVertical size={19}/></button>}</div>{props.sortOpen&&<div className="sort-menu">{sortOptions.map(o=><button key={o.value} onClick={()=>{props.setSortMode(o.value);props.setSortOpen(false);props.setEditingShelf(false)}} className={props.sortMode===o.value?'chosen':''}>{o.label}{props.sortMode===o.value&&<Check size={17}/>}</button>)}</div>}</div></div>
      <div className="cellar-shelf-bar"><h2>Mi estantería</h2><span>{bottleCount} {bottleCount===1?'botella':'botellas'}</span></div>
    </div>
    {props.wines.length===0?<EmptyState title="Tu vinoteca está vacía" text="Cuando registres una botella que tengas en casa aparecerá aquí."/>:props.viewMode==='shelf'?<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}><div className="shelf-groups">{props.groups.map(([label,ws])=><ShelfGroup key={label} label={label} wines={ws} onOpen={props.onOpen} draggable={props.sortMode==='manual'&&props.editingShelf} hideHeading={props.sortMode==='manual'}/>)}</div></DndContext>:<div className="wine-list">{props.wines.map(w=><WineListRow key={w.id} wine={w} onClick={()=>props.onOpen(w)}/>)}</div>}
  </div>;
}

const SHELF_CAPACITY=3;
function ShelfGroup({label,wines,onOpen,draggable,hideHeading=false}:{label:string;wines:Wine[];onOpen:(w:Wine)=>void;draggable:boolean;hideHeading?:boolean}) {
  const shelves:Wine[][]=[]; for(let i=0;i<wines.length;i+=SHELF_CAPACITY)shelves.push(wines.slice(i,i+SHELF_CAPACITY));
  const bottles=wines.reduce((sum,w)=>sum+w.quantity,0);
  return <section className="shelf-section">{!hideHeading&&<div className="shelf-heading"><h2>{label}</h2><span>{bottles} {bottles===1?'botella':'botellas'}</span></div>}<SortableContext items={wines.map(w=>w.id)} strategy={rectSortingStrategy}><div className="shelf-stack">{shelves.map((row,index)=><div className="shelf-row" key={`${label}-${index}`}><div className="shelf-grid">{row.map(w=><SortableBottle key={w.id} wine={w} onOpen={onOpen} enabled={draggable}/>)}</div><div className="wood-shelf" aria-hidden="true"><div/></div></div>)}</div></SortableContext></section>;
}

function SortableBottle({wine,onOpen,enabled}:{wine:Wine;onOpen:(w:Wine)=>void;enabled:boolean}) {
  const {attributes,listeners,setNodeRef,transform,transition,isDragging}=useSortable({id:wine.id,disabled:!enabled});
  const style={transform:CSS.Transform.toString(transform),transition,zIndex:isDragging?20:1};
  return <button ref={setNodeRef} style={style} {...(enabled?attributes:{})} {...(enabled?listeners:{})} className={`shelf-bottle ${isDragging?'dragging':''} ${enabled?'reorder':''}`} onClick={()=>!enabled&&onOpen(wine)}>{enabled&&<span className="drag-dot"><GripVertical size={18}/></span>}<BottleVisual wine={wine}/><span className="bottle-name">{wine.name}</span><span className="bottle-meta">{wine.vintage||'s/a'} · {wine.quantity} ud.</span>{wine.gifted&&<span className="shelf-badge"><Gift size={11}/></span>}</button>;
}

function BottleVisual({wine,compact=false}:{wine:Wine;compact?:boolean}) {
  if(wine.imageUrl)return <div className={compact?'bottle-image compact':'bottle-image'}><img src={wine.imageUrl} alt={wine.name}/></div>;
  return <div className={compact?'bottle-placeholder compact':'bottle-placeholder'} aria-label="Botella sin imagen"><div className="bottle-neck"/><div className="bottle-body"><div className="fake-label"><span>{wine.name.split(' ')[0]}</span><small>{wine.vintage||''}</small></div></div></div>;
}

function WineCard({wine,onClick}:{wine:Wine;onClick:()=>void}) {
  return <button className="wine-card" onClick={onClick}><div className="wine-card-image"><BottleVisual wine={wine}/>{wine.favorite&&<span className="heart-float"><Heart size={15} fill="currentColor"/></span>}{wine.gifted&&<span className="gift-float"><Gift size={14}/></span>}</div><strong>{wine.name}</strong><span>{wine.denomination||wine.winery}{wine.vintage?` · ${wine.vintage}`:''}</span><div className="card-bottom"><span>{wine.quantity>0?`${wine.quantity} ${wine.quantity===1?'botella':'botellas'}`:wine.tried?'Probado':'Por probar'}</span>{wine.score&&<b><Star size={13} fill="currentColor"/>{wine.score}</b>}</div></button>;
}

function WineListRow({wine,onClick}:{wine:Wine;onClick:()=>void}) {
  return <button className="wine-list-row" onClick={onClick}><BottleVisual wine={wine} compact/><div className="wine-list-copy"><strong>{wine.name}{wine.gifted&&<Gift size={13}/>}</strong><span>{wine.denomination||wine.winery}</span><small>{wine.vintage||'Sin añada'} · {displayAging(wine)}</small></div><div className="wine-list-side">{wine.score&&<span><Star size={13} fill="currentColor"/>{wine.score}</span>}<b>{wine.quantity}</b></div></button>;
}

function TriedScreen({wines,onOpen,onAdd}:{wines:Wine[];onOpen:(w:Wine)=>void;onAdd:()=>void}) {
  const [q,setQ]=useState('');
  const filtered=useMemo(()=>[...wines].filter(w=>wineMatchesQuery(w,q)).sort((a,b)=>(b.lastTastedAt||b.createdAt).localeCompare(a.lastTastedAt||a.createdAt)),[wines,q]);
  return <div className="page tried-page"><div className="sticky-head tried-sticky"><Header eyebrow="TU MEMORIA" title="Probados" right={<button className="circle-action" onClick={onAdd}><Plus/></button>}/><p className="page-intro">Aquí quedan los vinos que ya has probado, aunque ya no tengas ninguna botella.</p><div className="searchbox"><Search size={20}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar entre los probados…"/></div></div>{filtered.length===0?<EmptyState title="Aún no hay vinos probados" text="Cuando marques un vino como probado quedará guardado aquí." action="Añadir un probado" onAction={onAdd}/>:<div className="tried-list">{filtered.map(w=><button key={w.id} className="tried-card" onClick={()=>onOpen(w)}><div className="tried-photo"><BottleVisual wine={w}/></div><div className="tried-copy"><div><strong>{w.name}</strong>{w.score!=null&&<span className="score-pill"><Star size={13} fill="currentColor"/>{w.score}</span>}</div><span>{w.denomination||w.winery}{w.vintage?` · ${w.vintage}`:''}</span><small>{w.lastTastedAt?`Última vez: ${formatDate(w.lastTastedAt)}`:'Probado'}{w.quantity>0?` · ${w.quantity} en casa`:''}</small>{w.rebuy&&<em>{w.rebuy==='Sí'?'✓ Lo compraría otra vez':`Volver a comprar: ${w.rebuy}`}</em>}</div></button>)}</div>}</div>;
}

function WishlistScreen({wines,onOpen,onAdd}:{wines:Wine[];onOpen:(w:Wine)=>void;onAdd:()=>void}) {
  return <div className="page wishlist-page"><div className="sticky-head wishlist-sticky"><Header eyebrow="LISTA DE DESEOS" title="Por probar" right={<button className="circle-action" onClick={onAdd}><Plus/></button>}/><p className="page-intro">Vinos que has visto, te han recomendado o quieres comprar algún día.</p></div>{wines.length===0?<EmptyState title="Tu lista está vacía" text="Añade vinos que quieras probar más adelante." action="Añadir vino" onAction={onAdd}/>:<div className="wishlist-grid">{wines.map(w=><button className="wish-card" key={w.id} onClick={()=>onOpen(w)}><div className="wish-image"><BottleVisual wine={w}/></div><div><strong>{w.name}</strong><span>{w.winery}</span>{w.denomination&&<small>{w.denomination}</small>}</div></button>)}</div>}</div>;
}

type ImportedWineData={name?:string;winery?:string;vintage?:number;type?:WineType;typeConfidence?:number;grapes?:string[];aging?:Aging;protection?:Protection;classification?:string;denomination?:string;region?:string;country?:string;alcohol?:number;price?:number;imageUrl?:string;sourceUrl?:string;sourceTitle?:string;fieldsFound?:number;categories?:string;rawText?:string;pairing?:string;pairingSource?:string;};
type WineImageResult={id:string;title:string;imageUrl:string;thumbnailUrl?:string;pageUrl?:string;source?:string;};

function inferWineType(categories=''):WineType|undefined{const value=categories.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();if(/espumoso|sparkling|champagne|\bcava\b|prosecco/.test(value))return'Espumoso';if(/rosado|rose wine|vin rose|vino rosato|\brosato\b/.test(value))return'Rosado';if(/vino blanco|white wine|vin blanc|bianco|\bblanco\b/.test(value))return'Blanco';if(/vino tinto|red wine|vin rouge|rosso|\btinto\b/.test(value))return'Tinto';return undefined;}
function inferAgingText(text=''):Aging|undefined{const value=text.toLowerCase();if(value.includes('gran reserva'))return'Gran Reserva';if(/\breserva\b/.test(value))return'Reserva';if(/\bcrianza\b/.test(value))return'Crianza';if(/\broble\b|barrica/.test(value))return'Roble';if(/\bjoven\b/.test(value))return'Joven';return undefined;}

function AddScreen({form,setForm,save,editing,moreInfo,setMoreInfo,onCancel}:{form:EditableWine;setForm:React.Dispatch<React.SetStateAction<EditableWine>>;save:()=>void;editing:boolean;moreInfo:boolean;setMoreInfo:(v:boolean)=>void;onCancel:()=>void;}) {
  const [catalogOpen,setCatalogOpen]=useState(false); const [catalogInitial,setCatalogInitial]=useState(''); const [catalogSeedImages,setCatalogSeedImages]=useState<WineImageResult[]>([]); const [catalogFromPhoto,setCatalogFromPhoto]=useState(false); const [photoMessage,setPhotoMessage]=useState(''); const [photoBusy,setPhotoBusy]=useState(false); const [dictating,setDictating]=useState(false);
  async function pickImage(file?:File){
    if(!file)return;
    setPhotoBusy(true);
    setPhotoMessage('Buscando esta botella con Google Lens…');
    try{
      const imageDataUrl=await preparePhotoForLens(file);
      const res=await fetch('/api/lens',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({imageDataUrl})});
      const data=await res.json();
      if(!res.ok){
        if(data.code==='LENS_NOT_CONFIGURED') throw new Error('LENS_NOT_CONFIGURED');
        throw new Error(data.error||'No he podido reconocer la botella.');
      }
      const matches=Array.isArray(data.matches)?data.matches:[];
      const recognized=String(data.query||'').trim();
      if(!recognized&&!matches.length) throw new Error('No he podido leer suficiente información de la etiqueta. Puedes buscar el vino por nombre.');
      // La foto sirve para identificar. En cuanto Lens extrae un nombre/texto útil,
      // dejamos que el buscador de Celler Roig encuentre fotos y fichas en vinotecas especializadas.
      setCatalogSeedImages(recognized?[]:matches);
      setCatalogFromPhoto(true);
      setCatalogInitial(recognized||String(matches[0]?.title||''));
      setPhotoMessage(recognized?`He leído “${recognized}”. Buscando la ficha y una foto limpia…`:'He encontrado posibles coincidencias. Toca la botella correcta.');
      setCatalogOpen(true);
    }catch(e){
      const message=e instanceof Error?e.message:'';
      if(message==='LENS_NOT_CONFIGURED') setPhotoMessage('Para reconocer botellas por foto falta conectar Google Lens. Puedes seguir usando “Buscar botella y datos”.');
      else setPhotoMessage(message||'No he podido reconocer esta botella. Prueba con la etiqueta de frente y buena luz.');
    }finally{setPhotoBusy(false);}
  }
  function openCatalog(){setCatalogSeedImages([]);setCatalogFromPhoto(false);setCatalogInitial([form.name,form.winery,form.vintage].filter(Boolean).join(' '));setCatalogOpen(true);}
  function useImportedWine(product:ImportedWineData){
    const raw=`${product.name||''} ${product.categories||''}`;
    const inferredVintage=product.vintage||Number(product.name?.match(/\b(19|20)\d{2}\b/)?.[0])||undefined;
    const explicitType=inferWineType(raw);
    const confidentType=(product.type&&((product.typeConfidence??0)>=0.8))?product.type:explicitType;
    const inferredAging=product.aging&&product.aging!=='Sin indicar'?product.aging:inferAgingText(`${product.name||''} ${product.rawText||''}`);
    const importedGrapes=normalizeGrapeList(product.grapes||[]);
    setForm(f=>({...f,
      name:product.name?.trim()||f.name, winery:product.winery?.trim()||f.winery, vintage:inferredVintage||f.vintage,
      type:confidentType||f.type, grapes:importedGrapes.length?importedGrapes:f.grapes, aging:inferredAging||f.aging,
      protection:product.protection||f.protection, classification:product.classification?.trim()||f.classification,
      denomination:product.denomination?.trim()||f.denomination, region:product.region?.trim()||f.region,
      country:product.country?.trim()||f.country, alcohol:product.alcohol||f.alcohol, price:product.price||f.price,
      imageUrl:product.imageUrl||f.imageUrl,
      pairing:product.pairing?.trim() || f.pairing || pairingSuggestion(confidentType||f.type, importedGrapes.length?importedGrapes:f.grapes, inferredAging||f.aging),
      pairingSource:product.pairing?.trim() ? (product.pairingSource||'web') : (f.pairingSource || (pairingSuggestion(confidentType||f.type, importedGrapes.length?importedGrapes:f.grapes, inferredAging||f.aging)?'sugerencia':'')),
    }));
    setMoreInfo(true);setCatalogOpen(false);
  }
  function dictate(){const w=window as any;const Speech=w.SpeechRecognition||w.webkitSpeechRecognition;if(!Speech){alert('El dictado no está disponible en este navegador. Puedes usar el micrófono del teclado del móvil.');return;}const r=new Speech();r.lang='es-ES';r.interimResults=false;r.maxAlternatives=1;setDictating(true);r.onresult=(e:any)=>{const text=e.results?.[0]?.[0]?.transcript||'';setForm(f=>({...f,notes:[f.notes,text].filter(Boolean).join(f.notes?' ':'')}));};r.onerror=()=>setDictating(false);r.onend=()=>setDictating(false);r.start();}
  return <div className="page add-page"><div className="add-top"><button className="icon-button" onClick={onCancel}><X/></button><div><div className="eyebrow">{editing?'EDITAR':'NUEVO VINO'}</div><h1>{editing?'Editar vino':'Añadir vino'}</h1></div><button className="save-top" onClick={save}>Guardar</button></div>
    <div className="image-picker"><BottleVisual wine={{...form,id:'preview',createdAt:'',manualOrder:0}}/><div className="image-actions"><label className="secondary photo-primary"><Camera size={18}/>{photoBusy?'Buscando…':'Escanear botella'}<input type="file" accept="image/*" capture="environment" onChange={e=>pickImage(e.target.files?.[0])}/></label><label className="ghost-button gallery-button"><ImagePlus size={18}/> Elegir foto<input type="file" accept="image/*" onChange={e=>pickImage(e.target.files?.[0])}/></label><button type="button" className="ghost-button" onClick={openCatalog}><Search size={18}/> Buscar botella y datos</button></div><p>{photoMessage||'Haz una foto nítida de la etiqueta. La usamos sólo para identificar el vino; después Celler Roig busca la foto y la ficha en vinotecas especializadas.'}</p></div>

    <div className="form-card essentials-card">
      <Field label="Nombre del vino *"><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ej. Muga Reserva"/></Field>
      <div className="two-cols"><Field label="Añada"><input type="number" inputMode="numeric" value={form.vintage||''} onChange={e=>setForm(f=>({...f,vintage:e.target.value?Number(e.target.value):undefined}))}/></Field><Field label="Bodega / productor"><input value={form.winery} onChange={e=>setForm(f=>({...f,winery:e.target.value}))} placeholder="Bodegas Muga"/></Field></div>
      <Field label="Tipo"><div className="choice-grid">{(['Tinto','Blanco','Rosado','Espumoso'] as const).map(t=><button type="button" key={t} className={form.type===t?'choice active':'choice'} onClick={()=>setForm(f=>({...f,type:t,pairing:f.pairing||pairingSuggestion(t,f.grapes,f.aging),pairingSource:f.pairingSource||(pairingSuggestion(t,f.grapes,f.aging)?'sugerencia':'')}))}>{t}</button>)}</div>{form.type==='Sin indicar'&&<small className="field-hint">Si la búsqueda no está segura, lo dejamos sin indicar para que lo elijas tú.</small>}</Field>

      <Field label="Uva / variedades"><input value={form.grapes.join(', ')} onChange={e=>{const grapes=normalizeGrapeList(e.target.value.split(',').map(x=>x.trim()).filter(Boolean));setForm(f=>({...f,grapes,pairing:f.pairingSource==='web'?f.pairing:pairingSuggestion(f.type,grapes,f.aging),pairingSource:f.pairingSource==='web'?'web':(pairingSuggestion(f.type,grapes,f.aging)?'sugerencia':'')}));}} placeholder="Tempranillo, Garnacha, Pinot Noir…"/><small className="field-hint">Unificamos sinónimos de la misma uva (por ejemplo, Grenache → Garnacha).</small></Field>
      <Field label="Envejecimiento"><select value={form.aging} onChange={e=>{const aging=e.target.value as Aging;setForm(f=>({...f,aging,pairing:f.pairingSource==='web'?f.pairing:pairingSuggestion(f.type,f.grapes,aging),pairingSource:f.pairingSource==='web'?'web':(pairingSuggestion(f.type,f.grapes,aging)?'sugerencia':'')}));}}>{agingOptions.map(x=><option key={x}>{x}</option>)}</select></Field>
      {form.aging==='Otro'&&<Field label="Envejecimiento / mención"><input value={form.customAging} onChange={e=>setForm(f=>({...f,customAging:e.target.value}))} placeholder="Ej. 18 meses en roble francés"/></Field>}
      <Field label="Denominación / Appellation"><input value={form.denomination} onChange={e=>setForm(f=>({...f,denomination:e.target.value}))} placeholder="Rioja, Bordeaux, Chianti Classico, Napa Valley…"/></Field>
      <div className="two-cols"><Field label="Región"><input value={form.region} onChange={e=>setForm(f=>({...f,region:e.target.value}))} placeholder="Bourgogne, Mendoza…"/></Field><Field label="País"><input value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))} placeholder="España, Francia, Italia…"/></Field></div>
      <Field label="Maridaje"><div className="pairing-field"><textarea rows={2} value={form.pairing} onChange={e=>setForm(f=>({...f,pairing:e.target.value,pairingSource:e.target.value?'manual':''}))} placeholder="Ej. carnes rojas, arroces y quesos curados"/>{form.pairingSource&&<small className="pairing-source">{form.pairingSource==='web'?'✓ Encontrado en la ficha del vino':'✨ Sugerencia automática según tipo y uva'}</small>}</div></Field>

      <div className="compact-section">
        <span className="compact-label">Dónde va</span>
        <div className="choice-grid three compact-choices"><button type="button" className={form.status==='cellar'?'choice active':'choice'} onClick={()=>setForm(f=>({...f,status:'cellar',shopContext:'cellar',wishlist:false,quantity:Math.max(1,f.quantity)}))}>Vinoteca</button><button type="button" className={form.status==='tried'?'choice active':'choice'} onClick={()=>setForm(f=>({...f,status:'tried',shopContext:'tried',wishlist:false,tried:true,quantity:0}))}>Probados</button><button type="button" className={form.status==='wishlist'?'choice active':'choice'} onClick={()=>setForm(f=>({...f,status:'wishlist',shopContext:'wishlist',wishlist:true,quantity:0}))}>Por probar</button></div>
      </div>

      {form.status==='cellar'&&<>
        <div className="stock-row"><div><strong>Botellas en casa</strong><span>Las que tienes ahora mismo</span></div><div className="qty-control qty-compact"><button type="button" onClick={()=>setForm(f=>({...f,quantity:Math.max(1,f.quantity-1)}))}><Minus/></button><strong>{form.quantity}</strong><button type="button" onClick={()=>setForm(f=>({...f,quantity:f.quantity+1}))}><Plus/></button></div></div>
        <ToggleRow checked={form.tried} icon={<Check size={18}/>} title="Ya lo he probado" subtitle="También aparecerá en Probados" onChange={checked=>setForm(f=>({...f,tried:checked}))}/>
      </>}

      <ToggleRow checked={form.gifted} icon={<Gift size={18}/>} title="Me lo regalaron" subtitle="Opcional: quién y cuándo" tone="gold" onChange={checked=>setForm(f=>({...f,gifted:checked,giftedBy:checked?f.giftedBy:'',giftDate:checked?f.giftDate:''}))}/>
      {form.gifted&&<div className="gift-details compact-subpanel"><div className="two-cols"><Field label="Quién"><input value={form.giftedBy} onChange={e=>setForm(f=>({...f,giftedBy:e.target.value}))} placeholder="Nombre"/></Field><Field label="Fecha"><input type="date" value={form.giftDate} onChange={e=>setForm(f=>({...f,giftDate:e.target.value}))}/></Field></div></div>}
    </div>

    <button className="more-toggle" onClick={()=>setMoreInfo(!moreInfo)}><span><SlidersHorizontal size={19}/> Más información</span><ChevronDown className={moreInfo?'rotated':''}/></button>
    {moreInfo&&<div className="form-card advanced compact-advanced">
      <div className="two-cols"><Field label="Precio (€)"><input type="number" inputMode="decimal" step="0.01" value={form.price??''} onChange={e=>setForm(f=>({...f,price:e.target.value?Number(e.target.value):undefined}))}/></Field><Field label={shopLabelForStatus(form.shopContext || form.status)}><input value={form.shop} onChange={e=>setForm(f=>({...f,shop:e.target.value}))} placeholder={(form.shopContext||form.status)==='cellar'?'Ej. Bodeboca':(form.shopContext||form.status)==='tried'?'Ej. Restaurante / casa de…':'Ej. Vinatis / restaurante / Instagram'}/></Field></div>
      <Field label="Graduación (% vol.)"><input type="number" inputMode="decimal" step="0.1" value={form.alcohol??''} onChange={e=>setForm(f=>({...f,alcohol:e.target.value?Number(e.target.value):undefined}))}/></Field>

      <div className="two-cols rating-row"><Field label="Puntuación (0–10)"><input type="number" inputMode="decimal" min="0" max="10" step="0.1" value={form.score??''} onChange={e=>setForm(f=>({...f,score:e.target.value?Math.min(10,Math.max(0,Number(e.target.value))):undefined}))}/></Field><Field label="¿Lo comprarías otra vez?"><div className="choice-grid three rebuy-choices">{(['Sí','Quizá','No'] as const).map(x=><button type="button" key={x} className={form.rebuy===x?'choice active':'choice'} onClick={()=>setForm(f=>({...f,rebuy:x}))}>{x}</button>)}</div></Field></div>
      <Field label="Notas"><div className="notes-input-head"><span>Tu opinión</span><button type="button" className={dictating?'dictate active':'dictate'} onClick={dictate}><Mic size={16}/>{dictating?'Escuchando…':'Dictar'}</button></div><textarea rows={4} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Qué te pareció, con qué lo tomaste…"/></Field>
    </div>}
    <button className="primary save-bottom" onClick={save}>{editing?'Guardar cambios':'Guardar vino'}</button>
    {catalogOpen&&<CatalogSearchModal initialQuery={catalogInitial} seedImages={catalogSeedImages} fromPhoto={catalogFromPhoto} onClose={()=>setCatalogOpen(false)} onSelect={useImportedWine}/>}  
  </div>;
}

function CatalogSearchModal({initialQuery,seedImages=[],fromPhoto=false,onClose,onSelect}:{initialQuery:string;seedImages?:WineImageResult[];fromPhoto?:boolean;onClose:()=>void;onSelect:(p:ImportedWineData)=>void}) {
  const [query,setQuery]=useState(initialQuery);const [images,setImages]=useState<WineImageResult[]>(seedImages);const [foundWine,setFoundWine]=useState<ImportedWineData|null>(null);const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [notConfigured,setNotConfigured]=useState(false);const [processing,setProcessing]=useState('');
  async function searchCatalog(keepImages=false,override?:string){const q=(override??query).trim();if(!q)return;setLoading(true);setError('');setNotConfigured(false);if(!keepImages)setImages([]);setFoundWine(null);try{const res=await fetch(`/api/wine-search?q=${encodeURIComponent(q)}`);const data=await res.json();if(!res.ok){if(data.code==='SEARCH_NOT_CONFIGURED')setNotConfigured(true);throw new Error(data.error||'No se pudo buscar');}const foundImages=Array.isArray(data.images)?data.images:[];if(!keepImages||images.length===0)setImages(foundImages);setFoundWine(data.wine||null);if(!keepImages&&!foundImages.length)setError('He encontrado información, pero no una foto clara. Prueba con el nombre completo y la añada.');}catch(e){setError(e instanceof Error?e.message:'La búsqueda no está disponible ahora mismo.');}finally{setLoading(false);}}
  async function chooseImage(result:WineImageResult){setProcessing(result.id);let wineData=foundWine;try{
    // Si la imagen viene de una ficha real, intentamos leer esa página: suele contener
    // uvas, denominación/appellation, alcohol, envejecimiento y precio con más precisión
    // que el resumen del buscador.
    if(result.pageUrl){
      try{
        const res=await fetch(`/api/wine-import?url=${encodeURIComponent(result.pageUrl)}&hint=${encodeURIComponent(query||result.title||'')}`);
        const data=await res.json().catch(()=>({}));
        if(res.ok&&data.wine){
          const imported=data.wine;
          const cleaned=Object.fromEntries(Object.entries(imported).filter(([,v])=>v!==undefined&&v!==null&&v!==''&&!(Array.isArray(v)&&v.length===0))) as ImportedWineData;
          // El tipo detectado por la búsqueda global tiene voto de confianza. Evitamos que
          // una recomendación "rosado" perdida en el HTML de una tienda pise un tinto fiable.
          if(wineData?.type&&((wineData.typeConfidence??0)>=0.8)) delete cleaned.type;
          wineData={...(wineData||{}),...cleaned} as ImportedWineData;
        }
      }catch{}
    }
    if(!wineData&&result.title){const res=await fetch(`/api/wine-search?q=${encodeURIComponent(result.title)}`);const data=await res.json().catch(()=>({}));if(res.ok)wineData=data.wine||null;}
    let imageUrl=result.imageUrl;try{imageUrl=await prepareBottleImageFromUrl(result.imageUrl);}catch{}
    onSelect({...(wineData||{}),imageUrl,sourceUrl:result.pageUrl||wineData?.sourceUrl,sourceTitle:result.title||wineData?.sourceTitle});
  }finally{setProcessing('');}}
  function useDataWithoutPhoto(){if(foundWine)onSelect(foundWine);}
  useEffect(()=>{if(seedImages.length){setImages(seedImages);if(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/.test(initialQuery))void searchCatalog(true,initialQuery);}else if(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/.test(initialQuery))void searchCatalog(false,initialQuery);},[]);
  const summary=foundWine?[foundWine.vintage?String(foundWine.vintage):'',foundWine.type&&((foundWine.typeConfidence??0)>=0.8)?foundWine.type:'Tipo: revisar',foundWine.aging&&foundWine.aging!=='Sin indicar'?foundWine.aging:'',foundWine.denomination||'',foundWine.country||'',foundWine.grapes?.length?foundWine.grapes.join(', '):'',foundWine.alcohol?`${foundWine.alcohol}% vol.`:'',foundWine.pairing?`Maridaje: ${foundWine.pairing}`:''].filter(Boolean):[];
  return <div className="modal-backdrop catalog-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}><article className="catalog-modal image-first-modal"><div className="modal-handle"/><div className="catalog-head"><div><div className="eyebrow">{fromPhoto?'BÚSQUEDA POR FOTO':'BUSCAR EN INTERNET'}</div><h2>{fromPhoto?'¿Es una de estas?':'¿Cuál es tu vino?'}</h2></div><button className="icon-button" onClick={onClose}><X/></button></div><p className="catalog-help">{fromPhoto?'Hemos usado la foto para identificar el vino. Ahora buscamos sus fotos y ficha en Bodeboca, Vivino, Petit Celler, Vinoselección, Vinatis y otras vinotecas especializadas.':'Buscamos primero en Bodeboca, Vivino, Petit Celler, Vinoselección, Vinatis y otras vinotecas especializadas.'}</p><div className="catalog-search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void searchCatalog(false)}} placeholder="Ej. Château Margaux 2019"/><button onClick={()=>void searchCatalog(false)} disabled={loading}>{loading?'Buscando…':'Buscar'}</button></div>{error&&<div className="catalog-error">{error}</div>}{notConfigured&&<div className="catalog-setup"><strong>Falta conectar el buscador</strong><span>En Vercel añade <code>SERPER_API_KEY</code> en Environment Variables.</span></div>}{foundWine&&summary.length>0&&<div className="found-data-card"><div><Check size={18}/><strong>Datos encontrados</strong></div><p>{summary.join(' · ')}</p><small>Los podrás corregir antes de guardar.</small></div>}{loading&&<div className="catalog-loading"><div className="search-loader"/><strong>Buscando fichas de vino…</strong><span>Un momento.</span></div>}{!loading&&images.length>0&&<><div className="catalog-section-title image-title"><strong>{fromPhoto?'Coincidencias de la foto':'Elige la botella correcta'}</strong><span>{fromPhoto?'Toca la que coincida con tu botella.':'Las fuentes especializadas aparecen primero.'}</span></div><div className="catalog-image-grid bottle-search-grid">{images.map(img=><button key={img.id} disabled={!!processing} className="catalog-image-choice bottle-choice" onClick={()=>void chooseImage(img)}><div><img src={img.thumbnailUrl||img.imageUrl} alt={img.title||query}/></div><strong>{img.title||query}</strong><span>{img.source||'Internet'}</span><small>{processing===img.id?'Preparando ficha…':'Elegir esta botella'}</small></button>)}</div></>}{!loading&&foundWine&&images.length===0&&<button className="secondary use-data-only" onClick={useDataWithoutPhoto}><Check size={18}/> Usar los datos sin foto</button>}<div className="catalog-tip"><Search size={18}/><div><strong>¿No sale la correcta?</strong><span>Edita el nombre arriba. La búsqueda escrita sigue priorizando las vinotecas especializadas.</span></div></div></article></div>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="field"><span>{label}</span>{children}</label>;}
function ToggleRow({checked,icon,title,subtitle,onChange,tone='wine'}:{checked:boolean;icon:React.ReactNode;title:string;subtitle:string;onChange:(checked:boolean)=>void;tone?:'wine'|'gold'}){return <button type="button" role="switch" aria-checked={checked} className={`toggle-row ${checked?'active':''} ${tone==='gold'?'gold':''}`} onClick={()=>onChange(!checked)}><span className="toggle-icon">{icon}</span><span className="toggle-copy"><strong>{title}</strong><small>{subtitle}</small></span><span className="switch-track"><i/></span></button>;}


function WineModal({wine,allWines,onOpenWine,onClose,onPatch,onEdit,onDelete,onMoveToCellar,onConsume}:{wine:Wine;allWines:Wine[];onOpenWine:(w:Wine)=>void;onClose:()=>void;onPatch:(id:string,p:Partial<Wine>)=>void;onEdit:(w:Wine)=>void;onDelete:(id:string)=>void;onMoveToCellar:(w:Wine)=>void;onConsume:(w:Wine)=>void;}) {
  const [showTasting,setShowTasting]=useState(false); const [tasteScore,setTasteScore]=useState<string>(wine.score!=null?String(wine.score):''); const [tasteNotes,setTasteNotes]=useState('');
  const similar=allWines.filter(w=>w.id!==wine.id).map(w=>{let score=0;if(w.denomination&&wine.denomination&&w.denomination.toLowerCase()===wine.denomination.toLowerCase())score+=5;if(w.type===wine.type&&wine.type!=='Sin indicar')score+=2;if(w.country&&wine.country&&w.country.toLowerCase()===wine.country.toLowerCase())score+=1;if(w.aging===wine.aging&&wine.aging!=='Sin indicar')score+=1;const shared=w.grapes.some(g=>wine.grapes.some(x=>x.toLowerCase()===g.toLowerCase()));if(shared)score+=4;return{w,score};}).filter(x=>x.score>=4).sort((a,b)=>b.score-a.score).slice(0,3).map(x=>x.w);
  function addTasting(){const tasting:Tasting={id:crypto.randomUUID(),date:new Date().toISOString(),score:tasteScore?Math.min(10,Math.max(0,Number(tasteScore))):undefined,notes:tasteNotes.trim()};const list=[...(wine.tastings||[]),tasting];onPatch(wine.id,{tried:true,wishlist:false,status:wine.quantity>0?'cellar':'tried',score:tasting.score??wine.score,notes:tasting.notes||wine.notes,tastings:list,lastTastedAt:tasting.date});setShowTasting(false);setTasteNotes('');}
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}><article className="wine-modal"><div className="modal-handle"/><div className="modal-top"><button className="icon-button" onClick={onClose}><X/></button><button className="icon-button" onClick={()=>onEdit(wine)}><Pencil/></button></div><div className="modal-hero"><div className="modal-bottle"><BottleVisual wine={wine}/></div><div className="modal-title"><span>{wine.denomination||wine.country||wine.type}</span><h2>{wine.name}</h2><p>{wine.winery}{wine.vintage?` · ${wine.vintage}`:''}</p><div className="modal-badges">{wine.gifted&&<span><Gift size={14}/> Regalo</span>}{wine.tried&&<span><Check size={14}/> Probado</span>}</div><div className="quick-flags"><button className={wine.favorite?'flag-icon-button active':'flag-icon-button'} onClick={()=>onPatch(wine.id,{favorite:!wine.favorite})} aria-label={wine.favorite?'Quitar de favoritos':'Marcar como favorito'} title="Favorito"><Heart size={20} fill={wine.favorite?'currentColor':'none'}/></button><button className={wine.openSoon?'flag-icon-button active':'flag-icon-button'} onClick={()=>onPatch(wine.id,{openSoon:!wine.openSoon})} aria-label={wine.openSoon?'Quitar de abrir pronto':'Marcar para abrir pronto'} title="Abrir pronto"><Clock3 size={20}/></button></div></div></div>
    {wine.wishlist?<div className="wishlist-actions-modal"><button className="primary modal-main-action" onClick={()=>onMoveToCellar(wine)}><ShoppingBag size={20}/> Ya lo tengo</button><button className="secondary modal-main-action" onClick={()=>onPatch(wine.id,{wishlist:false,tried:true,status:'tried',quantity:0,lastTastedAt:new Date().toISOString()})}><CheckCircle2 size={20}/> Ya lo he probado</button></div>:<><div className="score-stock"><div><span>Tu nota</span><strong>{wine.score??'—'}<small>/10</small></strong></div><div><span>En casa</span><strong>{wine.quantity}<small>{wine.quantity===1?' botella':' botellas'}</small></strong></div></div>{wine.quantity>0&&<div className="modal-actions"><div className="qty-control"><button onClick={()=>onPatch(wine.id,{quantity:Math.max(0,wine.quantity-1),status:wine.quantity<=1?'tried':'cellar',tried:wine.quantity<=1?true:wine.tried})}><Minus/></button><strong>{wine.quantity}</strong><button onClick={()=>onPatch(wine.id,{quantity:wine.quantity+1,status:'cellar',wishlist:false})}><Plus/></button></div><button className="primary drink-button" onClick={()=>onConsume(wine)}><GlassWater size={19}/> He bebido una</button></div>}<button className="secondary tasting-action" onClick={()=>setShowTasting(!showTasting)}><Star size={18}/>{wine.tried?'Registrar otra cata':'Marcar como probado'}</button>{showTasting&&<div className="tasting-editor"><div className="two-cols"><Field label="Nota (0–10)"><input type="number" min="0" max="10" step="0.1" value={tasteScore} onChange={e=>setTasteScore(e.target.value)}/></Field><Field label="Fecha"><input type="text" value={new Date().toLocaleDateString('es-ES')} readOnly/></Field></div><Field label="Comentario"><textarea rows={3} value={tasteNotes} onChange={e=>setTasteNotes(e.target.value)} placeholder="Qué te ha parecido…"/></Field><button className="primary" onClick={addTasting}>Guardar cata</button></div>}</>}
    <div className="details-card"><Info label="Tipo" value={wine.type}/><Info label="Uva / variedades" value={wine.grapes.join(', ')||'—'}/><Info label="Envejecimiento" value={displayAging(wine)}/><Info label="Denominación / Appellation" value={wine.denomination||'—'}/>{wine.region&&<Info label="Región" value={wine.region}/>} {wine.country&&<Info label="País" value={wine.country}/>} {wine.pairing&&<Info label="Maridaje" value={wine.pairing}/>} {wine.price!=null&&<Info label="Precio" value={`${wine.price.toFixed(2)} €`}/>} {wine.shop&&<Info label={shopLabelForStatus(wine.shopContext || (wine.wishlist?'wishlist':wine.quantity>0?'cellar':'tried'))} value={wine.shop}/>} {wine.alcohol!=null&&<Info label="Graduación" value={`${wine.alcohol}% vol.`}/>}</div>
    {wine.gifted&&<div className="gift-card"><Gift size={19}/><div><strong>Esta botella fue un regalo</strong><span>{wine.giftedBy?`De ${wine.giftedBy}`:'Sin indicar quién'}{wine.giftDate?` · ${formatDate(wine.giftDate)}`:''}</span></div></div>}
    {(wine.notes||wine.rebuy)&&<div className="notes-card">{wine.notes&&<><span>Tu opinión</span><p>{wine.notes}</p></>}{wine.rebuy&&<div className="rebuy"><Check size={17}/> Lo compraría otra vez: <b>{wine.rebuy}</b></div>}</div>}
    {wine.tastings?.length>0&&<div className="history-card"><span>Historial de catas</span>{[...wine.tastings].reverse().slice(0,4).map(t=><div key={t.id} className="history-row"><div><Clock3 size={15}/><strong>{formatDate(t.date)}</strong></div>{t.score!=null&&<b>{t.score}/10</b>}{t.notes&&<p>{t.notes}</p>}</div>)}</div>}
    {similar.length>0&&<div className="similar-card"><span>Parecidos en tu colección</span><div className="similar-list">{similar.map(w=><button key={w.id} onClick={()=>onOpenWine(w)}><BottleVisual wine={w} compact/><div><strong>{w.name}</strong><small>{w.denomination||w.grapes[0]||w.type}</small></div></button>)}</div></div>}
    <button className="danger-link" onClick={()=>{if(confirm('¿Eliminar este vino?'))onDelete(wine.id)}}><Trash2 size={17}/> Eliminar vino</button>
  </article></div>;
}

function Info({label,value}:{label:string;value:string}){return <div className="info-row"><span>{label}</span><strong>{value}</strong></div>;}
function formatDate(value:string){try{return new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value));}catch{return value;}}

function SettingsScreen({wines,cloudStatus,onBack,onReset,onImport}:{wines:Wine[];cloudStatus:CloudStatus;onBack:()=>void;onReset:()=>void;onImport:(data:unknown)=>void}) {
  const cloudCopy=cloudStatus==='synced'?'Guardado en la nube':cloudStatus==='saving'?'Guardando…':cloudStatus==='connecting'?'Conectando…':cloudStatus==='local'?'Solo en este dispositivo':'Pendiente de sincronizar';
  const scored=wines.filter(w=>w.score!=null); const avg=scored.length?(scored.reduce((n,w)=>n+(w.score||0),0)/scored.length).toFixed(1):'—';
  const countries=new Set(wines.map(w=>w.country).filter(Boolean)).size;
  const topValue=(values:string[])=>{const counts=new Map<string,number>();values.filter(Boolean).forEach(v=>counts.set(v,(counts.get(v)||0)+1));return [...counts.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';};
  const topDenomination=topValue(wines.map(w=>w.denomination)); const topGrape=topValue(wines.flatMap(w=>w.grapes));
  function exportCsv(){const esc=(v:unknown)=>`"${String(v??'').replace(/"/g,'""')}"`;const head=['Nombre','Bodega','Añada','Tipo','Uvas','Envejecimiento','Denominación/Appellation','Región','País','Maridaje','Botellas','Probado','Por probar','Regalo','Regalado por','Precio','Dónde lo compré/probé/vi','Graduación','Nota','Volvería a comprar','Notas'];const rows=wines.map(w=>[w.name,w.winery,w.vintage||'',w.type,w.grapes.join(' / '),displayAging(w),w.denomination,w.region,w.country,w.pairing,w.quantity,w.tried?'Sí':'No',w.wishlist?'Sí':'No',w.gifted?'Sí':'No',w.giftedBy,w.price??'',w.shop,w.alcohol??'',w.score??'',w.rebuy,w.notes]);const csv='\uFEFF'+[head,...rows].map(r=>r.map(esc).join(';')).join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='celler-roig-vinos.csv';a.click();URL.revokeObjectURL(url);}
  function exportJson(){const blob=new Blob([JSON.stringify({app:'Celler Roig',version:15,exportedAt:new Date().toISOString(),wines},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='celler-roig-copia-seguridad.json';a.click();URL.revokeObjectURL(url);}
  async function importJson(file?:File){if(!file)return;try{const data=JSON.parse(await file.text());onImport(Array.isArray(data)?data:data.wines);}catch{alert('No he podido leer esa copia de seguridad.');}}
  return <div className="page settings-page"><Header eyebrow="CELLER ROIG" title="Ajustes" right={<button className="icon-button" onClick={onBack}><X/></button>}/>
    <div className="settings-card"><div className="settings-line"><div><strong>Pedro</strong><span>{wines.length} vinos guardados</span></div><WineIcon/></div><div className="settings-line"><div><strong>Sincronización</strong><span>{cloudCopy} · móvil y PC se actualizan automáticamente</span></div><Archive/></div></div>
    <div className="settings-card stats-settings"><div className="settings-title"><BarChart3 size={18}/><strong>Tus números</strong></div><div className="mini-stats"><div><b>{avg}</b><span>nota media</span></div><div><b>{countries}</b><span>países</span></div><div><b>{topDenomination}</b><span>denominación más repetida</span></div><div><b>{topGrape}</b><span>uva más repetida</span></div></div></div>
    <div className="settings-card"><button className="settings-line" onClick={exportCsv}><div><strong>Exportar a CSV</strong><span>Para abrir la colección en Excel</span></div><ExternalLink/></button><button className="settings-line" onClick={exportJson}><div><strong>Guardar copia completa</strong><span>Incluye fichas, notas e imágenes guardadas</span></div><Download/></button><label className="settings-line import-line"><div><strong>Restaurar copia completa</strong><span>Importar un archivo JSON de Celler Roig</span></div><Upload/><input type="file" accept="application/json,.json" onChange={e=>void importJson(e.target.files?.[0])}/></label><button className="settings-line" onClick={onReset}><div><strong>Restaurar ejemplo</strong><span>Vuelve a cargar los vinos de muestra</span></div><RotateCcw/></button></div>
    <p className="settings-note">Si no hay cobertura, puedes seguir usando Celler Roig. Los cambios se guardan en el móvil y se sincronizan con Neon al recuperar conexión.</p></div>;
}

function BottomNav({tab,setTab,onAdd}:{tab:Tab;setTab:(t:Tab)=>void;onAdd:()=>void}) {
  return <nav className="bottom-nav"><NavButton active={tab==='home'} icon={<Home/>} label="Inicio" onClick={()=>setTab('home')}/><NavButton active={tab==='cellar'} icon={<WineIcon/>} label="Vinoteca" onClick={()=>setTab('cellar')}/><button className="nav-add" onClick={onAdd}><Plus/><span>Añadir</span></button><NavButton active={tab==='tried'} icon={<CheckCircle2/>} label="Probados" onClick={()=>setTab('tried')}/><NavButton active={tab==='wishlist'} icon={<Heart/>} label="Por probar" onClick={()=>setTab('wishlist')}/></nav>;
}
function NavButton({active,icon,label,onClick}:{active:boolean;icon:React.ReactNode;label:string;onClick:()=>void}){return <button className={active?'nav-button active':'nav-button'} onClick={onClick}>{icon}<span>{label}</span></button>;}
function EmptyState({title,text,action,onAction}:{title:string;text:string;action?:string;onAction?:()=>void}){return <div className="empty-state"><div className="empty-icon"><WineIcon/></div><h2>{title}</h2><p>{text}</p>{action&&<button className="primary" onClick={onAction}>{action}</button>}</div>;}

export default App;
