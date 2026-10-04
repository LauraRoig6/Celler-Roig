import type { Wine } from './types';

export const seedWines: Wine[] = [
  {
    id: '1', name: 'Viña Ardanza', winery: 'La Rioja Alta', vintage: 2017, type: 'Tinto',
    grapes: ['Tempranillo', 'Garnacha'], aging: 'Reserva', protection: 'DOP', denomination: 'Rioja',
    region: 'La Rioja', country: 'España', alcohol: 14.5, price: 29.9, shop: 'Vinoteca', quantity: 2,
    status: 'cellar', favorite: true, score: 9.1, notes: 'Elegante, redondo y muy fácil de beber.', rebuy: 'Sí',
    imageUrl: '', createdAt: '2026-10-01T10:00:00Z', manualOrder: 0,
  },
  {
    id: '2', name: 'Muga Crianza', winery: 'Bodegas Muga', vintage: 2021, type: 'Tinto',
    grapes: ['Tempranillo'], aging: 'Crianza', protection: 'DOP', denomination: 'Rioja', region: 'La Rioja',
    country: 'España', price: 16.5, shop: 'Supermercado', quantity: 3, status: 'cellar', favorite: false,
    score: 8.4, notes: 'Muy equilibrado. Buena compra.', rebuy: 'Sí', imageUrl: '',
    createdAt: '2026-09-20T10:00:00Z', manualOrder: 1,
  },
  {
    id: '3', name: 'Protos 27', winery: 'Protos', vintage: 2020, type: 'Tinto', grapes: ['Tempranillo'],
    aging: 'Crianza', protection: 'DOP', denomination: 'Ribera del Duero', region: 'Castilla y León',
    country: 'España', price: 22.9, shop: 'Bodega', quantity: 1, status: 'cellar', favorite: true,
    score: 8.9, notes: 'Potente pero muy agradable.', rebuy: 'Sí', imageUrl: '',
    createdAt: '2026-09-01T10:00:00Z', manualOrder: 2,
  },
  {
    id: '4', name: 'Mar de Frades', winery: 'Mar de Frades', vintage: 2024, type: 'Blanco', grapes: ['Albariño'],
    aging: 'Joven', protection: 'DOP', denomination: 'Rías Baixas', region: 'Galicia', country: 'España',
    price: 18.9, shop: 'Tienda online', quantity: 1, status: 'cellar', favorite: false, score: 8.2,
    notes: 'Fresco, perfecto con marisco.', rebuy: 'Quizá', imageUrl: '', createdAt: '2026-08-11T10:00:00Z', manualOrder: 3,
  },
  {
    id: '5', name: 'Les Alcusses', winery: 'Celler del Roure', vintage: 2022, type: 'Tinto', grapes: ['Monastrell', 'Garnacha'],
    aging: 'Roble', protection: 'DOP', denomination: 'Valencia', region: 'Comunitat Valenciana', country: 'España',
    price: 12.5, shop: 'Tienda local', quantity: 2, status: 'cellar', favorite: false, score: 8.0,
    notes: 'Muy buena relación calidad/precio.', rebuy: 'Sí', imageUrl: '', createdAt: '2026-07-24T10:00:00Z', manualOrder: 4,
  },
  {
    id: '6', name: 'Finca Terrerazo', winery: 'Mustiguillo', vintage: 2021, type: 'Tinto', grapes: ['Bobal'],
    aging: 'Reserva', protection: 'DOP', denomination: 'El Terrerazo', region: 'Comunitat Valenciana', country: 'España',
    price: 27, shop: '', quantity: 0, status: 'wishlist', favorite: false, notes: 'Me lo recomendaron.', rebuy: '',
    imageUrl: '', createdAt: '2026-10-03T10:00:00Z', manualOrder: 5,
  },
];
