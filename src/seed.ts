import type { Wine } from './types';

function makeWine(w: Partial<Wine> & Pick<Wine,'id'|'name'|'winery'|'type'|'quantity'|'status'|'createdAt'|'manualOrder'>): Wine {
  return {
    vintage: undefined, grapes: [], aging: 'Sin indicar', customAging: '', protection: 'Sin indicación', classification: '',
    denomination: '', region: '', country: '', alcohol: undefined, price: undefined, shop: '', tried: false, wishlist: false,
    favorite: false, openSoon: false, score: undefined, notes: '', rebuy: '', imageUrl: '', location: '', gifted: false, giftedBy: '', giftDate: '',
    tastings: [], lastTastedAt: undefined,
    ...w,
  };
}

export const seedWines: Wine[] = [
  makeWine({
    id: '1', name: 'Viña Ardanza', winery: 'La Rioja Alta', vintage: 2017, type: 'Tinto',
    grapes: ['Tempranillo', 'Garnacha'], aging: 'Reserva', protection: 'DOP', classification: 'DOCa', denomination: 'Rioja',
    region: 'La Rioja', country: 'España', alcohol: 14.5, price: 29.9, shop: 'Vinoteca', quantity: 2,
    status: 'cellar', tried: true, favorite: true, score: 9.1, notes: 'Elegante, redondo y muy fácil de beber.', rebuy: 'Sí',
    createdAt: '2026-10-01T10:00:00Z', manualOrder: 0,
  }),
  makeWine({
    id: '2', name: 'Muga Crianza', winery: 'Bodegas Muga', vintage: 2021, type: 'Tinto',
    grapes: ['Tempranillo'], aging: 'Crianza', protection: 'DOP', classification: 'DOCa', denomination: 'Rioja', region: 'La Rioja',
    country: 'España', price: 16.5, shop: 'Supermercado', quantity: 3, status: 'cellar', tried: true, favorite: false,
    score: 8.4, notes: 'Muy equilibrado. Buena compra.', rebuy: 'Sí', createdAt: '2026-09-20T10:00:00Z', manualOrder: 1,
  }),
  makeWine({
    id: '3', name: 'Protos 27', winery: 'Protos', vintage: 2020, type: 'Tinto', grapes: ['Tempranillo'],
    aging: 'Crianza', protection: 'DOP', classification: 'DOP', denomination: 'Ribera del Duero', region: 'Castilla y León',
    country: 'España', price: 22.9, shop: 'Bodega', quantity: 1, status: 'cellar', tried: true, favorite: true,
    score: 8.9, notes: 'Potente pero muy agradable.', rebuy: 'Sí', createdAt: '2026-09-01T10:00:00Z', manualOrder: 2,
  }),
  makeWine({
    id: '4', name: 'Mar de Frades', winery: 'Mar de Frades', vintage: 2024, type: 'Blanco', grapes: ['Albariño'],
    aging: 'Joven', protection: 'DOP', classification: 'DOP', denomination: 'Rías Baixas', region: 'Galicia', country: 'España',
    price: 18.9, shop: 'Tienda online', quantity: 1, status: 'cellar', tried: true, score: 8.2,
    notes: 'Fresco, perfecto con marisco.', rebuy: 'Quizá', createdAt: '2026-08-11T10:00:00Z', manualOrder: 3,
  }),
  makeWine({
    id: '5', name: 'Les Alcusses', winery: 'Celler del Roure', vintage: 2022, type: 'Tinto', grapes: ['Monastrell', 'Garnacha'],
    aging: 'Roble', protection: 'DOP', classification: 'DOP', denomination: 'Valencia', region: 'Comunitat Valenciana', country: 'España',
    price: 12.5, shop: 'Tienda local', quantity: 2, status: 'cellar', tried: true, score: 8.0,
    notes: 'Muy buena relación calidad/precio.', rebuy: 'Sí', createdAt: '2026-07-24T10:00:00Z', manualOrder: 4,
  }),
  makeWine({
    id: '6', name: 'Finca Terrerazo', winery: 'Mustiguillo', vintage: 2021, type: 'Tinto', grapes: ['Bobal'],
    aging: 'Reserva', protection: 'DOP', classification: 'DOP', denomination: 'El Terrerazo', region: 'Comunitat Valenciana', country: 'España',
    price: 27, quantity: 0, status: 'wishlist', wishlist: true, notes: 'Me lo recomendaron.', createdAt: '2026-10-03T10:00:00Z', manualOrder: 5,
  }),
];
