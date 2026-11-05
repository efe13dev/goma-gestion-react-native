export interface RubberColor {
  id: string;
  name: string;
  quantity: number;
}

export function formatColorName(name: string): string {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

const COLOR_MAP: readonly [string, string][] = [
  ['aguamar', '#2DD4BF'],
  ['turques', '#14B8A6'],
  ['celest', '#38BDF8'],
  ['marin', '#1E3A6D'],
  ['negr', '#26292E'],
  ['blanc', '#F8FAFC'],
  ['crud', '#E8DFCA'],
  ['beig', '#D6C29F'],
  ['arena', '#D8C39E'],
  ['camel', '#C19A6B'],
  ['ocre', '#CC7722'],
  ['mostaz', '#D4A017'],
  ['dorad', '#D4AF37'],
  ['oro', '#D4AF37'],
  ['plat', '#CBD5E1'],
  ['gris', '#94A3B8'],
  ['fucsi', '#D946EF'],
  ['coral', '#FB7185'],
  ['salm', '#FDA4AF'],
  ['rosa', '#F472B6'],
  ['burde', '#7F1D1D'],
  ['granat', '#881337'],
  ['vino', '#7F1D1D'],
  ['teja', '#B45309'],
  ['terracot', '#C2410C'],
  ['naranj', '#F97316'],
  ['amarill', '#EAB308'],
  ['oliv', '#65A30D'],
  ['caqui', '#848860'],
  ['menta', '#34D399'],
  ['verd', '#22C55E'],
  ['azul', '#3B82F6'],
  ['morad', '#7C3AED'],
  ['violet', '#8B5CF6'],
  ['lila', '#C084FC'],
  ['lavand', '#A78BFA'],
  ['marr', '#78350F'],
  ['chocolat', '#5C2C16'],
  ['cafe', '#6F4E37'],
  ['roj', '#EF4444'],
];

function adjustHexBrightness(hex: string, delta: number): string {
  const num = Number.parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((num >> 16) + delta);
  const g = clamp(((num >> 8) & 0xff) + delta);
  const b = clamp((num & 0xff) + delta);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function getColorSwatch(name: string): string {
  const n = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  for (const [key, hex] of COLOR_MAP) {
    if (n.includes(key)) {
      if (n.includes('clar')) return adjustHexBrightness(hex, 38);
      if (n.includes('oscur')) return adjustHexBrightness(hex, -38);
      return hex;
    }
  }

  let hash = 0;
  for (let i = 0; i < n.length; i++) {
    hash = n.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 52%)`;
}
