import { Car, Dumbbell, Gamepad2, Laptop, PawPrint, Shirt, ShoppingBag, Sofa, Sparkles, UtensilsCrossed } from 'lucide-react';

/**
 * Website domains for well-known brands → their site icon is used as the logo.
 * Brands not listed fall back to a monogram tile (never a guessed/wrong logo).
 */
const BRAND_DOMAINS = {
  apple: 'apple.com',
  samsung: 'samsung.com',
  sony: 'sony.co.in',
  lg: 'lg.com',
  xiaomi: 'mi.com',
  oneplus: 'oneplus.in',
  oppo: 'oppo.com',
  vivo: 'vivo.com',
  realme: 'realme.com',
  motorola: 'motorola.com',
  nokia: 'nokia.com',
  google: 'store.google.com',
  hp: 'hp.com',
  dell: 'dell.com',
  lenovo: 'lenovo.com',
  asus: 'asus.com',
  acer: 'acer.com',
  boat: 'boat-lifestyle.com',
  jbl: 'jbl.com',
  bose: 'bose.com',
  nike: 'nike.com',
  adidas: 'adidas.co.in',
  puma: 'puma.com',
  reebok: 'reebok.com',
  zara: 'zara.com',
  'h&m': 'hm.com',
  levis: 'levi.in',
  "levi's": 'levi.in',
  'tommy hilfiger': 'tommyhilfiger.com',
  lakme: 'lakmeindia.com',
  maybelline: 'maybelline.com',
  loreal: 'loreal.com',
  "l'oreal": 'loreal.com',
  nykaa: 'nykaa.com',
  mamaearth: 'mamaearth.in',
  ikea: 'ikea.com',
  philips: 'philips.co.in',
  prestige: 'ttkprestige.com',
  milton: 'milton.in',
  nestle: 'nestle.in',
  amul: 'amul.com',
  decathlon: 'decathlon.in',
  lego: 'lego.com',
  pedigree: 'pedigree.com',
  whiskas: 'whiskas.com',
};

export const brandLogo = (name = '') => {
  const domain = BRAND_DOMAINS[String(name).trim().toLowerCase()];
  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=256` : null;
};

/** Icon + emoji per catalog category (category rail and section headings). */
const CATEGORY_META = {
  electronics: { icon: Laptop, emoji: '💻' },
  fashion: { icon: Shirt, emoji: '👗' },
  beauty: { icon: Sparkles, emoji: '💄' },
  home: { icon: Sofa, emoji: '🏠' },
  'food & beverage': { icon: UtensilsCrossed, emoji: '🍕' },
  food: { icon: UtensilsCrossed, emoji: '🍕' },
  sports: { icon: Dumbbell, emoji: '⚽' },
  automotive: { icon: Car, emoji: '🚗' },
  toys: { icon: Gamepad2, emoji: '🧸' },
  pets: { icon: PawPrint, emoji: '🐾' },
};

export const categoryMeta = (name = '') => CATEGORY_META[String(name).trim().toLowerCase()] || { icon: ShoppingBag, emoji: '🛍️' };
