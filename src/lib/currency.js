export const CURRENCIES = [
  { code: 'ILS', symbol: '₪', label: 'שקל' },
  { code: 'USD', symbol: '$', label: 'דולר' },
  { code: 'EUR', symbol: '€', label: 'יורו' },
  { code: 'THB', symbol: '฿', label: 'באט תאילנדי' },
  { code: 'HUF', symbol: 'Ft', label: 'פורינט הונגרי' },
];

export const DEFAULT_RATES = { ILS: 1, USD: 3.7, EUR: 4, THB: 0.1, HUF: 0.01 };

export const currencySymbol = (code) =>
  ({ ILS: '₪', USD: '$', EUR: '€', THB: '฿', HUF: 'Ft', GBP: '£', JPY: '¥' }[code] || code);

// Rates live on the trip document (Base44 kept them in each browser's localStorage, so devices disagreed).
export const getRates = (trip) => ({ ...DEFAULT_RATES, ...(trip?.rates || {}) });

export const convertToILS = (amount, currency, trip) => amount * (getRates(trip)[currency] ?? 1);
