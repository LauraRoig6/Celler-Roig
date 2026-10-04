import { useEffect, useMemo, useState } from 'react';
import {
  Archive, BarChart3, Camera, ChevronDown, CirclePlus, Heart, Home, ImagePlus,
  List, Minus, Pencil, Plus, Search, Settings, SlidersHorizontal, Star, Trash2,
  Wine as WineIcon, X, Check, ShoppingBag, GlassWater, GripVertical, ExternalLink,
  RotateCcw,
} from 'lucide-react';
import {
  DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, rectSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Aging, Protection, SortMode, Wine, WineStatus, WineType } from './types';
import { seedWines } from './seed';
import { fileToDataUrl, groupLabel, sortWines } from './utils';

type Tab = 'home' | 'cellar' | 'add' | 'wishlist' | 'settings';
type ViewMode = 'shelf' | 'list';
type CloudStatus = 'connecting' | 'synced' | 'saving' | 'local' | 'error';

const STORAGE_KEY = 'celler-roig:wines:v1';
const typeOptions: WineType[] = ['Tinto','Blanco','Rosado','Espumoso','Generoso','Otro'];
const agingOptions: Aging[] = ['Joven','Roble','Crianza','Reserva','Gran Reserva','Sin indicar'];
const protectionOptions: Protection[] = ['DOP','IGP','Sin indicación'];
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

const emptyForm = (): Omit<Wine, 'id' | 'createdAt' | 'manualOrder'> => ({
  name: '', winery: '', vintage: undefined, type: 'Tinto', grapes: [], aging: 'Sin indicar',
  protection: 'DOP', denomination: '', region: '', country: 'España', alcohol: undefined, price: undefined,
  shop: '', quantity: 1, status: 'cellar', favorite: false, score: undefined, notes: '', rebuy: '', imageUrl: '',
});

function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [wines, setWines] = useState<Wine[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || seedWines; }
    catch { return seedWines; }
  });
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [editingWine, setEditingWine] = useState<Wine | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('manual');
  const [viewMode, setViewMode] = useState<ViewMode>('shelf');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'Todos' | WineType>('Todos');
  const [sortOpen, setSortOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [moreInfo, setMoreInfo] = useState(false);
  const [editingShelf, setEditingShelf] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('connecting');

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(wines)), [wines]);

  useEffect(() => {
    let cancelled = false;
    async function loadCloud() {
      try {
        const res = await fetch('/api/wines');
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setCloudStatus(data.code === 'DATABASE_NOT_CONFIGURED' ? 'local' : 'error');
          return;
        }
        const remoteWines: Wine[] = Array.isArray(data.wines) ? data.wines : [];
        if (cancelled) return;
        if (remoteWines.length) {
          setWines(remoteWines);
        } else if (wines.length) {
          await fetch('/api/wines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wines }) });
        }
        if (!cancelled) setCloudStatus('synced');
      } catch {
        if (!cancelled) setCloudStatus('error');
      }
    }
    loadCloud();
    return () => { cancelled = true; };
    // We intentionally use the initial local collection only for first-time migration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function persistWine(wine: Wine) {
    if (cloudStatus === 'local') return;
    setCloudStatus('saving');
    try {
      const res = await fetch('/api/wines', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wine }) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCloudStatus(data.code === 'DATABASE_NOT_CONFIGURED' ? 'local' : 'error');
        return;
      }
      setCloudStatus('synced');
    } catch { setCloudStatus('error'); }
  }

  async function persistOrder(list: Wine[]) {
    if (cloudStatus === 'local') return;
    setCloudStatus('saving');
    try {
      const order = list.map(w => ({ id: w.id, manualOrder: w.manualOrder }));
      const res = await fetch('/api/wines', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order }) });
      if (!res.ok) throw new Error('order');
      setCloudStatus('synced');
    } catch { setCloudStatus('error'); }
  }

  async function deleteRemoteWine(id: string) {
    if (cloudStatus === 'local') return;
    setCloudStatus('saving');
    try {
      const res = await fetch('/api/wines', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error('delete');
      setCloudStatus('synced');
    } catch { setCloudStatus('error'); }
  }

  async function replaceCloud(list: Wine[]) {
    if (cloudStatus === 'local') return;
    setCloudStatus('saving');
    try {
      const res = await fetch('/api/wines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wines: list, replace: true }) });
      if (!res.ok) throw new Error('replace');
      setCloudStatus('synced');
    } catch { setCloudStatus('error'); }
  }

  const cellarWines = useMemo(() => wines.filter(w => w.status !== 'wishlist'), [wines]);
  const wishlist = useMemo(() => wines.filter(w => w.status === 'wishlist'), [wines]);
  const bottleCount = cellarWines.reduce((n, w) => n + w.quantity, 0);
  const favorites = cellarWines.filter(w => w.favorite);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cellarWines.filter(w => {
      const haystack = [w.name,w.winery,w.type,w.aging,w.protection,w.denomination,w.region,w.country,...w.grapes,String(w.vintage || '')].join(' ').toLowerCase();
      return (!q || haystack.includes(q)) && (typeFilter === 'Todos' || w.type === typeFilter);
    });
  }, [cellarWines, search, typeFilter]);

  const sorted = useMemo(() => sortWines(filtered, sortMode), [filtered, sortMode]);
  const groups = useMemo(() => {
    const map = new Map<string, Wine[]>();
    sorted.forEach(w => {
      const label = groupLabel(w, sortMode);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(w);
    });
    return [...map.entries()];
  }, [sorted, sortMode]);

  function saveForm() {
    if (!form.name.trim()) return;
    if (editingWine) {
      const updated: Wine = { ...editingWine, ...form };
      setWines(prev => prev.map(w => w.id === editingWine.id ? updated : w));
      setSelectedWine(updated);
      void persistWine(updated);
    } else {
      const wine: Wine = {
        ...form,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        manualOrder: Math.max(-1, ...wines.map(w => w.manualOrder)) + 1,
      };
      setWines(prev => [...prev, wine]);
      setSelectedWine(wine);
      void persistWine(wine);
    }
    setForm(emptyForm());
    setEditingWine(null);
    setMoreInfo(false);
    setTab(form.status === 'wishlist' ? 'wishlist' : 'cellar');
  }

  function startEdit(wine: Wine) {
    const { id: _id, createdAt: _created, manualOrder: _order, ...editable } = wine;
    setForm(editable);
    setEditingWine(wine);
    setSelectedWine(null);
    setMoreInfo(true);
    setTab('add');
  }

  function resetAdd(status: WineStatus = 'cellar') {
    setEditingWine(null);
    setForm({ ...emptyForm(), status, quantity: status === 'wishlist' ? 0 : 1 });
    setMoreInfo(false);
    setTab('add');
  }

  function patchWine(id: string, patch: Partial<Wine>) {
    const current = wines.find(w => w.id === id);
    if (!current) return;
    const updated = { ...current, ...patch };
    setWines(prev => prev.map(w => w.id === id ? updated : w));
    setSelectedWine(prev => prev?.id === id ? updated : prev);
    void persistWine(updated);
  }

  function removeWine(id: string) {
    setWines(prev => prev.filter(w => w.id !== id));
    setSelectedWine(null);
    void deleteRemoteWine(id);
  }

  function moveWishlistToCellar(wine: Wine) {
    patchWine(wine.id, { status: 'cellar', quantity: Math.max(1, wine.quantity) });
    setSelectedWine(null);
    setTab('cellar');
  }

  return (
    <div className="app-shell">
      <main className="screen">
        {tab === 'home' && <HomeScreen wines={cellarWines} favorites={favorites} bottleCount={bottleCount} onOpen={setSelectedWine} onGo={setTab} onAdd={() => resetAdd('cellar')} />}
        {tab === 'cellar' && (
          <CellarScreen
            wines={sorted} groups={groups} sortMode={sortMode} setSortMode={setSortMode} sortOpen={sortOpen} setSortOpen={setSortOpen}
            viewMode={viewMode} setViewMode={setViewMode} search={search} setSearch={setSearch} typeFilter={typeFilter} setTypeFilter={setTypeFilter}
            onOpen={setSelectedWine}
            editingShelf={editingShelf} setEditingShelf={setEditingShelf}
            onReorder={(ids) => {
              const updated = wines.map(w => ({ ...w, manualOrder: ids.indexOf(w.id) >= 0 ? ids.indexOf(w.id) : w.manualOrder }));
              setWines(updated);
              void persistOrder(updated);
            }}
          />
        )}
        {tab === 'wishlist' && <WishlistScreen wines={wishlist} onOpen={setSelectedWine} onAdd={() => resetAdd('wishlist')} />}
        {tab === 'add' && <AddScreen form={form} setForm={setForm} save={saveForm} editing={!!editingWine} moreInfo={moreInfo} setMoreInfo={setMoreInfo} onCancel={() => { setEditingWine(null); setForm(emptyForm()); setTab('cellar'); }} />}
        {tab === 'settings' && <SettingsScreen wineCount={wines.length} cloudStatus={cloudStatus} onReset={() => { if (confirm('¿Restaurar los vinos de ejemplo?')) { setWines(seedWines); void replaceCloud(seedWines); } }} />}
      </main>

      {tab !== 'add' && <BottomNav tab={tab} setTab={setTab} onAdd={() => resetAdd('cellar')} />}
      {selectedWine && <WineModal wine={selectedWine} onClose={() => setSelectedWine(null)} onPatch={patchWine} onEdit={startEdit} onDelete={removeWine} onMoveToCellar={moveWishlistToCellar} />}
    </div>
  );
}

function Header({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: React.ReactNode }) {
  return <header className="page-header"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1></div>{right}</header>;
}

function HomeScreen({ wines, favorites, bottleCount, onOpen, onGo, onAdd }: {
  wines: Wine[]; favorites: Wine[]; bottleCount: number; onOpen: (w: Wine) => void; onGo: (t: Tab) => void; onAdd: () => void;
}) {
  const recent = [...wines].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const top = [...favorites].sort((a,b) => (b.score || 0) - (a.score || 0)).slice(0, 3);
  return <div className="page home-page">
    <section className="brand-hero">
      <div className="brand-mark"><WineIcon size={28}/></div>
      <div className="brand-copy"><div className="brand-name">CELLER ROIG</div><div className="brand-sub">La vinoteca de Pedro Roig</div></div>
    </section>

    <section className="stats-grid">
      <button className="stat-card" onClick={() => onGo('cellar')}><strong>{wines.length}</strong><span>vinos</span></button>
      <button className="stat-card" onClick={() => onGo('cellar')}><strong>{bottleCount}</strong><span>botellas en casa</span></button>
      <button className="stat-card" onClick={() => onGo('cellar')}><strong>{favorites.length}</strong><span>favoritos</span></button>
    </section>

    <button className="primary big-action" onClick={onAdd}><CirclePlus size={23}/> Añadir un vino</button>

    <SectionTitle title="Últimos vinos" action="Ver vinoteca" onAction={() => onGo('cellar')} />
    <div className="horizontal-cards">{recent.map(w => <WineCard key={w.id} wine={w} onClick={() => onOpen(w)} />)}</div>

    {top.length > 0 && <><SectionTitle title="Tus favoritos"/><div className="mini-list">{top.map(w => <button key={w.id} className="mini-row" onClick={() => onOpen(w)}><BottleVisual wine={w} compact/><div className="mini-copy"><strong>{w.name}</strong><span>{w.denomination || w.winery}</span></div><span className="score-pill"><Star size={14} fill="currentColor"/> {w.score ?? '—'}</span></button>)}</div></>}
  </div>;
}

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <div className="section-title"><h2>{title}</h2>{action && <button onClick={onAction}>{action}</button>}</div>;
}

function CellarScreen(props: {
  wines: Wine[]; groups: [string, Wine[]][]; sortMode: SortMode; setSortMode: (m: SortMode) => void; sortOpen: boolean; setSortOpen: (v:boolean)=>void;
  viewMode: ViewMode; setViewMode: (m:ViewMode)=>void; search:string; setSearch:(s:string)=>void; typeFilter:'Todos'|WineType; setTypeFilter:(t:'Todos'|WineType)=>void;
  onOpen:(w:Wine)=>void;
  editingShelf:boolean; setEditingShelf:(v:boolean)=>void; onReorder:(ids:string[])=>void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }));
  function dragEnd(event: DragEndEvent) {
    if (props.sortMode !== 'manual') return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = props.wines.map(w => w.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    props.onReorder(arrayMove(ids, oldIndex, newIndex));
  }
  return <div className="page cellar-page">
    <Header eyebrow="TU COLECCIÓN" title="Mi vinoteca" right={<div className="view-toggle"><button className={props.viewMode==='shelf'?'active':''} onClick={()=>props.setViewMode('shelf')}><Archive size={18}/></button><button className={props.viewMode==='list'?'active':''} onClick={()=>props.setViewMode('list')}><List size={18}/></button></div>} />
    <div className="searchbox"><Search size={20}/><input value={props.search} onChange={e=>props.setSearch(e.target.value)} placeholder="Buscar vino, uva, denominación…"/></div>
    <div className="filter-scroll">
      {(['Todos','Tinto','Blanco','Rosado','Espumoso'] as const).map(x => <button key={x} className={props.typeFilter===x?'chip active':'chip'} onClick={()=>props.setTypeFilter(x)}>{x}</button>)}
    </div>
    <div className="filter-row">
      <div className="sort-wrap">
        <button className="sort-button" onClick={()=>props.setSortOpen(!props.sortOpen)}><SlidersHorizontal size={18}/>{sortOptions.find(x=>x.value===props.sortMode)?.label}<ChevronDown size={17}/></button>
        {props.sortOpen && <div className="sort-menu">{sortOptions.map(o=><button key={o.value} onClick={()=>{props.setSortMode(o.value);props.setSortOpen(false);props.setEditingShelf(false)}} className={props.sortMode===o.value?'chosen':''}>{o.label}{props.sortMode===o.value&&<Check size={17}/>}</button>)}</div>}
      </div>
    </div>
    {props.sortMode==='manual' && props.viewMode==='shelf' && <button className={props.editingShelf?'edit-shelf active':'edit-shelf'} onClick={()=>props.setEditingShelf(!props.editingShelf)}><GripVertical size={18}/>{props.editingShelf?'Terminar de ordenar':'Ordenar estantería'}</button>}

    {props.wines.length === 0 ? <EmptyState title="No encuentro vinos" text="Prueba con otro filtro o término de búsqueda."/> : props.viewMode === 'shelf' ? (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}>
        <div className="shelf-groups">
          {props.groups.map(([label, ws]) => <ShelfGroup key={label} label={label} wines={ws} onOpen={props.onOpen} draggable={props.sortMode==='manual'&&props.editingShelf}/>) }
        </div>
      </DndContext>
    ) : <div className="wine-list">{props.wines.map(w=><WineListRow key={w.id} wine={w} onClick={()=>props.onOpen(w)}/>)}</div>}
  </div>;
}

const SHELF_CAPACITY = 3;

function ShelfGroup({ label, wines, onOpen, draggable }: { label:string; wines:Wine[]; onOpen:(w:Wine)=>void; draggable:boolean }) {
  const shelves: Wine[][] = [];
  for (let i = 0; i < wines.length; i += SHELF_CAPACITY) shelves.push(wines.slice(i, i + SHELF_CAPACITY));

  return <section className="shelf-section">
    <div className="shelf-heading"><h2>{label}</h2><span>{wines.length} {wines.length===1?'vino':'vinos'} · {shelves.length} {shelves.length===1?'balda':'baldas'}</span></div>
    <SortableContext items={wines.map(w=>w.id)} strategy={rectSortingStrategy}>
      <div className="shelf-stack">
        {shelves.map((row, index) => <div className="shelf-row" key={`${label}-${index}`}>
          <div className="shelf-grid">{row.map(w=><SortableBottle key={w.id} wine={w} onOpen={onOpen} enabled={draggable}/>)}</div>
          <div className="wood-shelf" aria-hidden="true"><div/></div>
        </div>)}
      </div>
    </SortableContext>
  </section>;
}

function SortableBottle({ wine, onOpen, enabled }: { wine:Wine; onOpen:(w:Wine)=>void; enabled:boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: wine.id, disabled: !enabled });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging?20:1 };
  return <button ref={setNodeRef} style={style} {...(enabled?attributes:{})} {...(enabled?listeners:{})} className={`shelf-bottle ${isDragging?'dragging':''} ${enabled?'reorder':''}`} onClick={()=>!enabled&&onOpen(wine)}>
    {enabled && <span className="drag-dot"><GripVertical size={18}/></span>}
    <BottleVisual wine={wine}/><span className="bottle-name">{wine.name}</span><span className="bottle-meta">{wine.vintage || 's/a'} · {wine.quantity} ud.</span>
  </button>;
}

function BottleVisual({ wine, compact=false }: { wine:Wine; compact?:boolean }) {
  if (wine.imageUrl) return <div className={compact?'bottle-image compact':'bottle-image'}><img src={wine.imageUrl} alt={wine.name}/></div>;
  return <div className={compact?'bottle-placeholder compact':'bottle-placeholder'} aria-label="Botella sin imagen">
    <div className="bottle-neck"/><div className="bottle-body"><div className="fake-label"><span>{wine.name.split(' ')[0]}</span><small>{wine.vintage || ''}</small></div></div>
  </div>;
}

function WineCard({ wine, onClick }: { wine:Wine; onClick:()=>void }) {
  return <button className="wine-card" onClick={onClick}><div className="wine-card-image"><BottleVisual wine={wine}/>{wine.favorite&&<span className="heart-float"><Heart size={15} fill="currentColor"/></span>}</div><strong>{wine.name}</strong><span>{wine.denomination || wine.winery}{wine.vintage ? ` · ${wine.vintage}`:''}</span><div className="card-bottom"><span>{wine.quantity} {wine.quantity===1?'botella':'botellas'}</span>{wine.score&&<b><Star size={13} fill="currentColor"/>{wine.score}</b>}</div></button>;
}

function WineListRow({ wine, onClick }: { wine:Wine; onClick:()=>void }) {
  return <button className="wine-list-row" onClick={onClick}><BottleVisual wine={wine} compact/><div className="wine-list-copy"><strong>{wine.name}</strong><span>{wine.protection !== 'Sin indicación' ? `${wine.protection} · `:''}{wine.denomination || wine.winery}</span><small>{wine.vintage || 'Sin añada'} · {wine.aging}</small></div><div className="wine-list-side">{wine.score&&<span><Star size={13} fill="currentColor"/>{wine.score}</span>}<b>{wine.quantity}</b></div></button>;
}

function WishlistScreen({ wines, onOpen, onAdd }: { wines:Wine[]; onOpen:(w:Wine)=>void; onAdd:()=>void }) {
  return <div className="page wishlist-page"><Header eyebrow="PARA EL FUTURO" title="Me gustaría probar" right={<button className="circle-action" onClick={onAdd}><Plus/></button>}/>
    <p className="page-intro">Guarda aquí vinos que hayas visto o te hayan recomendado.</p>
    {wines.length===0?<EmptyState title="Tu lista está vacía" text="Añade vinos que quieras probar más adelante." action="Añadir vino" onAction={onAdd}/>:<div className="wishlist-grid">{wines.map(w=><button className="wish-card" key={w.id} onClick={()=>onOpen(w)}><div className="wish-image"><BottleVisual wine={w}/></div><div><strong>{w.name}</strong><span>{w.winery}</span>{w.denomination&&<small>{w.protection !== 'Sin indicación' ? `${w.protection} · `:''}{w.denomination}</small>}</div></button>)}</div>}
  </div>;
}

type ImportedWineData = {
  name?: string;
  winery?: string;
  vintage?: number;
  type?: WineType;
  grapes?: string[];
  aging?: Aging;
  protection?: Protection;
  denomination?: string;
  region?: string;
  country?: string;
  alcohol?: number;
  price?: number;
  imageUrl?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  fieldsFound?: number;
  categories?: string;
  rawText?: string;
};

type WineSearchResult = {
  id: string;
  title: string;
  url: string;
  snippet?: string;
  source?: string;
  provider?: 'web';
};

type WineImageResult = {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  pageUrl?: string;
  source?: string;
};

function inferWineType(categories = ''): WineType | undefined {
  const value = categories.toLowerCase();
  if (value.includes('sparkling') || value.includes('espumoso') || value.includes('champagne') || value.includes('cava')) return 'Espumoso';
  if (value.includes('rosé') || value.includes('rose wine') || value.includes('rosado')) return 'Rosado';
  if (value.includes('white wine') || value.includes('vino blanco') || value.includes('white wines') || /\bblanco\b/.test(value)) return 'Blanco';
  if (value.includes('red wine') || value.includes('vino tinto') || value.includes('red wines') || /\btinto\b/.test(value)) return 'Tinto';
  return undefined;
}

function inferAgingText(text = ''): Aging | undefined {
  const value = text.toLowerCase();
  if (value.includes('gran reserva')) return 'Gran Reserva';
  if (/\breserva\b/.test(value)) return 'Reserva';
  if (/\bcrianza\b/.test(value)) return 'Crianza';
  if (/\broble\b|barrica/.test(value)) return 'Roble';
  if (/\bjoven\b/.test(value)) return 'Joven';
  return undefined;
}

function AddScreen({ form, setForm, save, editing, moreInfo, setMoreInfo, onCancel }: {
  form: Omit<Wine,'id'|'createdAt'|'manualOrder'>; setForm: React.Dispatch<React.SetStateAction<Omit<Wine,'id'|'createdAt'|'manualOrder'>>>; save:()=>void; editing:boolean; moreInfo:boolean; setMoreInfo:(v:boolean)=>void; onCancel:()=>void;
}) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  async function pickImage(file?: File) {
    if (!file) return;
    const data = await fileToDataUrl(file);
    setForm(f=>({...f,imageUrl:data}));
  }
  function useImportedWine(product: ImportedWineData) {
    const raw = `${product.name || ''} ${product.categories || ''} ${product.rawText || ''}`;
    const inferredVintage = product.vintage || Number(product.name?.match(/\b(19|20)\d{2}\b/)?.[0]) || undefined;
    const inferredType = product.type || inferWineType(raw);
    const inferredAging = product.aging && product.aging !== 'Sin indicar' ? product.aging : inferAgingText(raw);
    setForm(f => ({
      ...f,
      name: product.name?.trim() || f.name,
      winery: product.winery?.trim() || f.winery,
      vintage: inferredVintage || f.vintage,
      type: inferredType || f.type,
      grapes: product.grapes?.length ? product.grapes : f.grapes,
      aging: inferredAging || f.aging,
      protection: product.protection || f.protection,
      denomination: product.denomination?.trim() || f.denomination,
      region: product.region?.trim() || f.region,
      country: product.country?.trim() || f.country,
      alcohol: product.alcohol || f.alcohol,
      price: product.price || f.price,
      imageUrl: product.imageUrl || f.imageUrl,
    }));
    setMoreInfo(true);
    setCatalogOpen(false);
  }
  return <div className="page add-page"><div className="add-top"><button className="icon-button" onClick={onCancel}><X/></button><div><div className="eyebrow">{editing?'EDITAR':'NUEVO VINO'}</div><h1>{editing?'Editar vino':'Añadir vino'}</h1></div><button className="save-top" onClick={save}>Guardar</button></div>

    <div className="image-picker">
      <BottleVisual wine={{...form,id:'preview',createdAt:'',manualOrder:0}} />
      <div className="image-actions">
        <label className="secondary"><Camera size={18}/> Hacer / elegir foto<input type="file" accept="image/*" capture="environment" onChange={e=>pickImage(e.target.files?.[0])}/></label>
        <button type="button" className="ghost-button" onClick={()=>setCatalogOpen(true)}><Search size={18}/> Buscar botella y datos</button>
      </div>
      <p>Busca el vino y elige su botella. Celler Roig intentará completar automáticamente la información que encuentre.</p>
    </div>

    <div className="form-card">
      <Field label="Nombre del vino *"><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ej. Muga Reserva"/></Field>
      <div className="two-cols"><Field label="Añada"><input type="number" inputMode="numeric" value={form.vintage || ''} onChange={e=>setForm(f=>({...f,vintage:e.target.value?Number(e.target.value):undefined}))}/></Field><Field label="Bodega"><input value={form.winery} onChange={e=>setForm(f=>({...f,winery:e.target.value}))} placeholder="Bodegas Muga"/></Field></div>
      <Field label="Tipo"><div className="choice-grid">{typeOptions.slice(0,4).map(t=><button type="button" key={t} className={form.type===t?'choice active':'choice'} onClick={()=>setForm(f=>({...f,type:t}))}>{t}</button>)}</div></Field>
      <Field label="¿Dónde lo guardamos?"><div className="choice-grid three"><button className={form.status==='cellar'?'choice active':'choice'} onClick={()=>setForm(f=>({...f,status:'cellar',quantity:Math.max(1,f.quantity)}))}>En casa</button><button className={form.status==='tried'?'choice active':'choice'} onClick={()=>setForm(f=>({...f,status:'tried',quantity:0}))}>Probado</button><button className={form.status==='wishlist'?'choice active':'choice'} onClick={()=>setForm(f=>({...f,status:'wishlist',quantity:0}))}>Por probar</button></div></Field>
      {form.status==='cellar' && <Field label="Botellas en casa"><div className="qty-control"><button onClick={()=>setForm(f=>({...f,quantity:Math.max(0,f.quantity-1)}))}><Minus/></button><strong>{form.quantity}</strong><button onClick={()=>setForm(f=>({...f,quantity:f.quantity+1}))}><Plus/></button></div></Field>}
    </div>

    <button className="more-toggle" onClick={()=>setMoreInfo(!moreInfo)}><span><SlidersHorizontal size={19}/> Más información</span><ChevronDown className={moreInfo?'rotated':''}/></button>
    {moreInfo && <div className="form-card advanced">
      <Field label="Uva / variedades"><input value={form.grapes.join(', ')} onChange={e=>setForm(f=>({...f,grapes:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)}))} placeholder="Tempranillo, Garnacha"/></Field>
      <div className="two-cols"><Field label="Envejecimiento"><select value={form.aging} onChange={e=>setForm(f=>({...f,aging:e.target.value as Aging}))}>{agingOptions.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Protección"><select value={form.protection} onChange={e=>setForm(f=>({...f,protection:e.target.value as Protection}))}>{protectionOptions.map(x=><option key={x}>{x}</option>)}</select></Field></div>
      <Field label={form.protection==='DOP'?'DOP / Denominación':form.protection==='IGP'?'IGP / Indicación geográfica':'Zona / denominación'}><input value={form.denomination} onChange={e=>setForm(f=>({...f,denomination:e.target.value}))} placeholder="Ej. Rioja, Utiel-Requena…"/></Field>
      <div className="two-cols"><Field label="Región"><input value={form.region} onChange={e=>setForm(f=>({...f,region:e.target.value}))}/></Field><Field label="País"><input value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))}/></Field></div>
      <div className="two-cols"><Field label="Precio (€)"><input type="number" inputMode="decimal" step="0.01" value={form.price ?? ''} onChange={e=>setForm(f=>({...f,price:e.target.value?Number(e.target.value):undefined}))}/></Field><Field label="Dónde lo compré"><input value={form.shop} onChange={e=>setForm(f=>({...f,shop:e.target.value}))}/></Field></div>
      <Field label="Graduación (% vol.)"><input type="number" inputMode="decimal" step="0.1" value={form.alcohol ?? ''} onChange={e=>setForm(f=>({...f,alcohol:e.target.value?Number(e.target.value):undefined}))}/></Field>
      <Field label="Puntuación (0–10)"><input type="number" inputMode="decimal" min="0" max="10" step="0.1" value={form.score ?? ''} onChange={e=>setForm(f=>({...f,score:e.target.value?Math.min(10,Math.max(0,Number(e.target.value))):undefined}))}/></Field>
      <Field label="¿Lo comprarías otra vez?"><div className="choice-grid three">{(['Sí','Quizá','No'] as const).map(x=><button key={x} className={form.rebuy===x?'choice active':'choice'} onClick={()=>setForm(f=>({...f,rebuy:x}))}>{x}</button>)}</div></Field>
      <Field label="Notas"><textarea rows={4} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Qué te pareció, con qué lo tomaste…"/></Field>
    </div>}
    <button className="primary save-bottom" onClick={save}>{editing?'Guardar cambios':'Guardar vino'}</button>
    {catalogOpen && <CatalogSearchModal initialQuery={[form.name, form.winery, (form.name || form.winery) ? form.vintage : undefined].filter(Boolean).join(' ')} onClose={()=>setCatalogOpen(false)} onSelect={useImportedWine} />}
  </div>;
}

function CatalogSearchModal({ initialQuery, onClose, onSelect }: { initialQuery:string; onClose:()=>void; onSelect:(p:ImportedWineData)=>void }) {
  const [query, setQuery] = useState(initialQuery);
  const [images, setImages] = useState<WineImageResult[]>([]);
  const [foundWine, setFoundWine] = useState<ImportedWineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notConfigured, setNotConfigured] = useState(false);

  async function searchCatalog() {
    const q = query.trim();
    if (!q) return;
    setLoading(true); setError(''); setNotConfigured(false); setImages([]); setFoundWine(null);
    try {
      const res = await fetch(`/api/wine-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'SEARCH_NOT_CONFIGURED') setNotConfigured(true);
        throw new Error(data.error || 'No se pudo buscar');
      }
      const foundImages = Array.isArray(data.images) ? data.images : [];
      setImages(foundImages);
      setFoundWine(data.wine || null);
      if (!foundImages.length) setError('He encontrado información del vino, pero ninguna foto clara. Puedes probar otra búsqueda o subir una foto desde el móvil.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'La búsqueda no está disponible ahora mismo.');
    } finally { setLoading(false); }
  }

  function chooseImage(result: WineImageResult) {
    onSelect({ ...(foundWine || {}), imageUrl: result.imageUrl });
  }

  function useDataWithoutPhoto() {
    if (foundWine) onSelect(foundWine);
  }

  useEffect(() => { if (/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(initialQuery)) searchCatalog(); }, []);

  const summary = foundWine ? [
    foundWine.vintage ? String(foundWine.vintage) : '',
    foundWine.aging && foundWine.aging !== 'Sin indicar' ? foundWine.aging : '',
    foundWine.denomination || '',
    foundWine.grapes?.length ? foundWine.grapes.join(', ') : '',
    foundWine.alcohol ? `${foundWine.alcohol}% vol.` : '',
  ].filter(Boolean) : [];

  return <div className="modal-backdrop catalog-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}>
    <article className="catalog-modal image-first-modal">
      <div className="modal-handle"/>
      <div className="catalog-head"><div><div className="eyebrow">BUSCAR EN INTERNET</div><h2>¿Cuál es tu vino?</h2></div><button className="icon-button" onClick={onClose}><X/></button></div>
      <p className="catalog-help">Escribe el nombre y la añada. Primero te enseñamos las botellas: toca la correcta y Celler Roig pondrá la foto y los datos que haya podido identificar.</p>
      <div className="catalog-search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')searchCatalog()}} placeholder="Ej. Protos Crianza 2021"/><button onClick={searchCatalog} disabled={loading}>{loading?'Buscando…':'Buscar'}</button></div>

      {error && <div className="catalog-error">{error}</div>}
      {notConfigured && <div className="catalog-setup"><strong>Falta conectar el buscador</strong><span>En Vercel añade <code>SERPER_API_KEY</code> en Environment Variables y vuelve a desplegar.</span></div>}

      {foundWine && summary.length > 0 && <div className="found-data-card">
        <div><Check size={18}/><strong>Datos encontrados</strong></div>
        <p>{summary.join(' · ')}</p>
        <small>Los podrás corregir antes de guardar.</small>
      </div>}

      {loading && <div className="catalog-loading">
        <div className="search-loader"/><strong>Buscando botellas…</strong><span>Un momento.</span>
      </div>}

      {!loading && images.length > 0 && <>
        <div className="catalog-section-title image-title"><strong>Elige la botella correcta</strong><span>Tócala una vez. Se añadirá directamente a la ficha.</span></div>
        <div className="catalog-image-grid bottle-search-grid">
          {images.map(img => <button key={img.id} className="catalog-image-choice bottle-choice" onClick={()=>chooseImage(img)}>
            <div><img src={img.thumbnailUrl || img.imageUrl} alt={img.title || query}/></div>
            <strong>{img.title || query}</strong><span>{img.source || 'Internet'}</span>
            <small>Elegir esta botella</small>
          </button>)}
        </div>
      </>}

      {!loading && foundWine && images.length === 0 && <button className="secondary use-data-only" onClick={useDataWithoutPhoto}><Check size={18}/> Usar los datos sin foto</button>}

      <div className="catalog-tip"><Camera size={18}/><div><strong>¿No sale la botella correcta?</strong><span>Cierra esta ventana y usa “Hacer / elegir foto”. La búsqueda es una ayuda, no hace falta usarla.</span></div></div>
    </article>
  </div>;
}
function Field({ label, children }: { label:string; children:React.ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }

function WineModal({ wine, onClose, onPatch, onEdit, onDelete, onMoveToCellar }: { wine:Wine; onClose:()=>void; onPatch:(id:string,p:Partial<Wine>)=>void; onEdit:(w:Wine)=>void; onDelete:(id:string)=>void; onMoveToCellar:(w:Wine)=>void }) {
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}><article className="wine-modal">
    <div className="modal-handle"/><div className="modal-top"><button className="icon-button" onClick={onClose}><X/></button><button className="icon-button" onClick={()=>onEdit(wine)}><Pencil/></button></div>
    <div className="modal-hero"><div className="modal-bottle"><BottleVisual wine={wine}/></div><div className="modal-title"><span>{wine.protection !== 'Sin indicación' ? `${wine.protection} · `:''}{wine.denomination || wine.type}</span><h2>{wine.name}</h2><p>{wine.winery}{wine.vintage?` · ${wine.vintage}`:''}</p><button className={wine.favorite?'favorite-button active':'favorite-button'} onClick={()=>onPatch(wine.id,{favorite:!wine.favorite})}><Heart size={19} fill={wine.favorite?'currentColor':'none'}/>{wine.favorite?'Favorito':'Añadir a favoritos'}</button></div></div>
    {wine.status==='wishlist' ? <button className="primary modal-main-action" onClick={()=>onMoveToCellar(wine)}><ShoppingBag size={20}/> Lo he comprado</button> : <>
      <div className="score-stock"><div><span>Tu nota</span><strong>{wine.score ?? '—'}<small>/10</small></strong></div><div><span>En casa</span><strong>{wine.quantity}<small>{wine.quantity===1?' botella':' botellas'}</small></strong></div></div>
      {wine.status==='cellar' && <div className="modal-actions"><div className="qty-control"><button onClick={()=>onPatch(wine.id,{quantity:Math.max(0,wine.quantity-1)})}><Minus/></button><strong>{wine.quantity}</strong><button onClick={()=>onPatch(wine.id,{quantity:wine.quantity+1})}><Plus/></button></div><button className="primary drink-button" onClick={()=>onPatch(wine.id,{quantity:Math.max(0,wine.quantity-1),status:wine.quantity<=1?'tried':'cellar'})}><GlassWater size={19}/> He bebido una</button></div>}
    </>}
    <div className="details-card"><Info label="Tipo" value={wine.type}/><Info label="Uva" value={wine.grapes.join(', ')||'—'}/><Info label="Envejecimiento" value={wine.aging}/><Info label="Protección" value={wine.protection}/><Info label="DOP / IGP" value={wine.denomination||'—'}/><Info label="Región" value={wine.region||'—'}/>{wine.price!=null&&<Info label="Precio" value={`${wine.price.toFixed(2)} €`}/>}</div>
    {(wine.notes || wine.rebuy) && <div className="notes-card">{wine.notes&&<><span>Tu opinión</span><p>{wine.notes}</p></>}{wine.rebuy&&<div className="rebuy"><Check size={17}/> Lo compraría otra vez: <b>{wine.rebuy}</b></div>}</div>}
    <button className="danger-link" onClick={()=>{if(confirm('¿Eliminar este vino?'))onDelete(wine.id)}}><Trash2 size={17}/> Eliminar vino</button>
  </article></div>;
}
function Info({label,value}:{label:string;value:string}) {return <div className="info-row"><span>{label}</span><strong>{value}</strong></div>}

function SettingsScreen({ wineCount, cloudStatus, onReset }: { wineCount:number; cloudStatus:CloudStatus; onReset:()=>void }) {
  const cloudCopy = cloudStatus === 'synced' ? 'Guardado en la nube' : cloudStatus === 'saving' ? 'Guardando…' : cloudStatus === 'connecting' ? 'Conectando…' : cloudStatus === 'local' ? 'Solo en este dispositivo' : 'Sin conexión con la nube';
  return <div className="page settings-page"><Header eyebrow="CELLER ROIG" title="Ajustes"/><div className="settings-card"><div className="settings-line"><div><strong>Pedro</strong><span>{wineCount} vinos guardados</span></div><WineIcon/></div><div className="settings-line"><div><strong>Copia de seguridad</strong><span>{cloudCopy}</span></div><Archive/></div></div><div className="settings-card"><button className="settings-line"><div><strong>Exportar colección</strong><span>Próxima fase: CSV / PDF</span></div><ExternalLink/></button><button className="settings-line" onClick={onReset}><div><strong>Restaurar ejemplo</strong><span>Vuelve a cargar los vinos de muestra</span></div><RotateCcw/></button></div><p className="settings-note">Celler Roig mantiene una copia local para que la app siga siendo rápida y, cuando Neon está conectado, guarda también la colección en la nube.</p></div>;
}

function BottomNav({ tab, setTab, onAdd }: { tab:Tab; setTab:(t:Tab)=>void; onAdd:()=>void }) {
  return <nav className="bottom-nav"><NavButton active={tab==='home'} icon={<Home/>} label="Inicio" onClick={()=>setTab('home')}/><NavButton active={tab==='cellar'} icon={<WineIcon/>} label="Vinoteca" onClick={()=>setTab('cellar')}/><button className="nav-add" onClick={onAdd}><Plus/><span>Añadir</span></button><NavButton active={tab==='wishlist'} icon={<Heart/>} label="Por probar" onClick={()=>setTab('wishlist')}/><NavButton active={tab==='settings'} icon={<Settings/>} label="Ajustes" onClick={()=>setTab('settings')}/></nav>;
}
function NavButton({active,icon,label,onClick}:{active:boolean;icon:React.ReactNode;label:string;onClick:()=>void}) {return <button className={active?'nav-button active':'nav-button'} onClick={onClick}>{icon}<span>{label}</span></button>}

function EmptyState({title,text,action,onAction}:{title:string;text:string;action?:string;onAction?:()=>void}) {return <div className="empty-state"><div className="empty-icon"><WineIcon/></div><h2>{title}</h2><p>{text}</p>{action&&<button className="primary" onClick={onAction}>{action}</button>}</div>}

export default App;
