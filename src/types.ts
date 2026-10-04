export type WineStatus = 'cellar' | 'tried' | 'wishlist';
export type WineType = 'Tinto' | 'Blanco' | 'Rosado' | 'Espumoso' | 'Generoso' | 'Otro';
export type Aging = 'Joven' | 'Roble' | 'Crianza' | 'Reserva' | 'Gran Reserva' | 'Sin indicar';
export type Protection = 'DOP' | 'IGP' | 'Sin indicación';
export type Rebuy = 'Sí' | 'Quizá' | 'No' | '';

export type Wine = {
  id: string;
  name: string;
  winery: string;
  vintage?: number;
  type: WineType;
  grapes: string[];
  aging: Aging;
  protection: Protection;
  denomination: string;
  region: string;
  country: string;
  alcohol?: number;
  price?: number;
  shop: string;
  quantity: number;
  status: WineStatus;
  favorite: boolean;
  score?: number;
  notes: string;
  rebuy: Rebuy;
  imageUrl: string;
  createdAt: string;
  manualOrder: number;
};

export type SortMode = 'manual' | 'type' | 'grape' | 'vintage' | 'aging' | 'denomination' | 'score' | 'name';
