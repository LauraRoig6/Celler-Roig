export type WineStatus = 'cellar' | 'tried' | 'wishlist';
export type WineType = 'Tinto' | 'Blanco' | 'Rosado' | 'Espumoso' | 'Sin indicar';
export type Aging = 'Joven' | 'Roble' | 'Crianza' | 'Reserva' | 'Gran Reserva' | 'Otro' | 'Sin indicar';
export type Protection = 'DOP' | 'IGP' | 'Sin indicación';
export type Rebuy = 'Sí' | 'Quizá' | 'No' | '';

export type Tasting = {
  id: string;
  date: string;
  score?: number;
  notes: string;
};

export type Wine = {
  id: string;
  name: string;
  winery: string;
  vintage?: number;
  type: WineType;
  grapes: string[];
  aging: Aging;
  customAging: string;
  protection: Protection;
  classification: string;
  denomination: string;
  region: string;
  country: string;
  alcohol?: number;
  price?: number;
  priceSource?: 'media-internet' | 'manual' | '';
  priceMin?: number;
  priceMax?: number;
  priceCount?: number;
  shop: string;
  shopContext: WineStatus;
  quantity: number;
  status: WineStatus;
  tried: boolean;
  wishlist: boolean;
  favorite: boolean;
  score?: number;
  notes: string;
  rebuy: Rebuy;
  imageUrl: string;
  gifted: boolean;
  openSoon: boolean;
  pairing: string;
  pairingSource: string;
  giftedBy: string;
  giftDate: string;
  tastings: Tasting[];
  lastTastedAt?: string;
  createdAt: string;
  manualOrder: number;
};

export type SortMode = 'manual' | 'type' | 'grape' | 'vintage' | 'aging' | 'denomination' | 'score' | 'name';
