/* Ateş Kebap ortak veriler */
const ALLERGENS = [
  { id: 'fistik', tr: 'Yer fıstığı', e: '🥜', c: '#f0b73e' },
  { id: 'kabuklu', tr: 'Sert kabuklu yemişler', e: '🌰', c: '#ee9a3f' },
  { id: 'kabuklular', tr: 'Kabuklu deniz ürünleri', e: '🦀', c: '#2f7fd6' },
  { id: 'yumusakcalar', tr: 'Yumuşakçalar', e: '🐚', c: '#3bb5a8' },
  { id: 'balik', tr: 'Balık', e: '🐟', c: '#25a0dc' },
  { id: 'yumurta', tr: 'Yumurta', e: '🥚', c: '#e8cd12' },
  { id: 'sut', tr: 'Süt', e: '🥛', c: '#d9a2cc' },
  { id: 'gluten', tr: 'Gluten', e: '🌾', c: '#a5532e' },
  { id: 'soya', tr: 'Soya', e: '🫘', c: '#32a852' },
  { id: 'susam', tr: 'Susam', e: '✿', c: '#ef8a25' },
  { id: 'kereviz', tr: 'Kereviz', e: '🥬', c: '#8fcb7a' },
  { id: 'hardal', tr: 'Hardal', e: '🌭', c: '#c9993c' },
  { id: 'lupen', tr: 'Acı bakla', e: '🌼', c: '#9a84c8' },
  { id: 'sulfit', tr: 'Sülfitler', e: '🍷', c: '#8c1c24' }
];
const AL = Object.fromEntries(ALLERGENS.map(a => [a.id, a]));
const KEY = 'ates_menu_v1';
const TL = n => new Intl.NumberFormat('tr-TR').format(n) + ' ₺';

async function baseMenu() {
  const r = await fetch('/menu.json', { cache: 'no-store' });
  return r.json();
}
async function loadMenu() {
  const base = await baseMenu();
  try {
    const l = localStorage.getItem(KEY);
    if (l) return JSON.parse(l);
  } catch (e) {}
  return base;
}
const FLAME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c.6 3.2-1.4 4.8-3 6.8C7.4 10.6 6 12.4 6 15a6 6 0 0 0 12 0c0-2-1-3.6-2-4.8-.3 1.2-1 2-2 2.3.9-3.6-.2-7.5-2-10.5Z" fill="currentColor"/></svg>';
