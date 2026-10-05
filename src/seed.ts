import type { Wine } from './types';

function makeWine(w: Partial<Wine> & Pick<Wine,'id'|'name'|'winery'|'type'|'quantity'|'status'|'createdAt'|'manualOrder'>): Wine {
  return {
    vintage: undefined, grapes: [], aging: 'Sin indicar', customAging: '', protection: 'Sin indicación', classification: '',
    denomination: '', region: '', country: '', alcohol: undefined, price: undefined, shop: '', shopContext: 'cellar', tried: false, wishlist: false,
    favorite: false, openSoon: false, pairing: '', pairingSource: '', score: undefined, notes: '', rebuy: '', imageUrl: '', gifted: false, giftedBy: '', giftDate: '',
    tastings: [], lastTastedAt: undefined,
    ...w,
  };
}

// Cinco fichas de demostración completas. Son vinos ficticios para que la app
// pueda enseñarse sin depender de marcas, precios o fichas comerciales reales.
export const seedWines: Wine[] = [
  makeWine({
    id: 'demo-v14-1', name: 'Château Belle Rive', winery: 'Maison Belle Rive', vintage: 2019, type: 'Tinto',
    grapes: ['Merlot', 'Cabernet Franc'], aging: 'Otro', customAging: '12 meses en roble francés', protection: 'DOP', classification: 'AOC',
    denomination: 'Bordeaux Supérieur', region: 'Bordeaux', country: 'Francia', alcohol: 13.5, price: 24.90, shop: 'Regalo', shopContext: 'cellar',
    quantity: 1, status: 'cellar', tried: true, favorite: true, score: 8.8, rebuy: 'Sí', gifted: true, giftedBy: 'Carlos', giftDate: '2026-09-18',
    pairing: 'Cordero al horno, carnes asadas, setas y quesos semicurados', pairingSource: 'ficha',
    notes: 'Fruta negra, especias suaves y final largo. Muy agradable con asados.', imageUrl: '/demo-belle-rive.svg',
    tastings: [{id:'taste-demo-1',date:'2026-09-21T20:30:00Z',score:8.8,notes:'Equilibrado y muy fácil de beber con cordero.'}], lastTastedAt:'2026-09-21T20:30:00Z',
    createdAt: '2026-09-18T10:00:00Z', manualOrder: 0,
  }),
  makeWine({
    id: 'demo-v14-2', name: 'Llum de Mar', winery: 'Adega do Norte', vintage: 2024, type: 'Blanco',
    grapes: ['Albariño'], aging: 'Joven', protection: 'DOP', classification: 'DOP', denomination: 'Rías Baixas', region: 'Galicia', country: 'España',
    alcohol: 12.5, price: 17.50, shop: 'Vinoteca del barrio', shopContext: 'cellar', quantity: 2, status: 'cellar', tried: false, favorite: false, rebuy: '',
    pairing: 'Marisco, pescado blanco, sushi y arroces marineros', pairingSource: 'ficha',
    notes: 'Comprado para probarlo con una comida de pescado.', imageUrl: '/demo-llum-mar.svg', createdAt:'2026-09-28T10:00:00Z', manualOrder:1,
  }),
  makeWine({
    id: 'demo-v14-3', name: 'Finca del Cierzo Reserva', winery: 'Bodega Valdemora', vintage: 2020, type: 'Tinto',
    grapes: ['Tempranillo', 'Garnacha'], aging: 'Reserva', protection: 'DOP', classification: 'DOCa', denomination: 'Rioja', region: 'La Rioja', country: 'España',
    alcohol: 14.0, price: 21.95, shop: 'Bodeboca', shopContext: 'cellar', quantity: 2, status: 'cellar', tried: true, favorite: true, score: 9.0, rebuy:'Sí',
    pairing: 'Cordero, carnes rojas, guisos, embutidos y quesos curados', pairingSource:'ficha',
    notes:'Redondo, con buena fruta y madera bien integrada. Repetiría.', imageUrl:'/demo-cierzo.svg',
    tastings:[{id:'taste-demo-3',date:'2026-10-01T19:45:00Z',score:9.0,notes:'Muy bueno con carne al horno.'}], lastTastedAt:'2026-10-01T19:45:00Z',
    createdAt:'2026-09-30T10:00:00Z', manualOrder:2,
  }),
  makeWine({
    id:'demo-v14-4', name:'Monte Sereno Brut Nature', winery:'Caves Monte Sereno', vintage:2021, type:'Espumoso',
    grapes:['Macabeo','Xarel·lo','Parellada'], aging:'Otro', customAging:'Más de 24 meses sobre lías', protection:'DOP', classification:'DOP', denomination:'Cava', region:'Catalunya', country:'España',
    alcohol:11.5, price:15.90, shop:'Restaurante El Mirador', shopContext:'tried', quantity:0, status:'tried', tried:true, favorite:false, score:8.5, rebuy:'Sí',
    pairing:'Aperitivos, marisco, frituras, arroces y quesos suaves', pairingSource:'ficha', notes:'Seco, fresco y con burbuja fina. Muy versátil para comer.', imageUrl:'/demo-monte-sereno.svg',
    tastings:[{id:'taste-demo-4',date:'2026-08-30T13:30:00Z',score:8.5,notes:'Funcionó muy bien durante toda la comida.'}], lastTastedAt:'2026-08-30T13:30:00Z',
    createdAt:'2026-08-30T14:30:00Z', manualOrder:3,
  }),
  makeWine({
    id:'demo-v14-5', name:'Domaine du Soleil Rosé', winery:'Domaine du Soleil', vintage:2024, type:'Rosado',
    grapes:['Grenache','Cinsault'], aging:'Joven', protection:'DOP', classification:'AOP', denomination:'Côtes de Provence', region:'Provence', country:'Francia',
    alcohol:12.5, price:18.90, shop:'Petit Celler', shopContext:'wishlist', quantity:0, status:'wishlist', wishlist:true, tried:false, favorite:false, rebuy:'',
    pairing:'Aperitivos, paella, cocina mediterránea, pescado y ensaladas', pairingSource:'ficha', notes:'Lo vi recomendado y quiero probarlo este verano.', imageUrl:'/demo-soleil.svg',
    createdAt:'2026-10-03T10:00:00Z', manualOrder:4,
  }),
];
