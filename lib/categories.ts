export const CATEGORIES = [
  "ROPA",
  "JUGUETES",
  "HIGIENE",
  "ALIMENTACION",
  "PASEO",
  "HABITACION",
  "OTROS",
] as const;

export type ItemCategory = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  ROPA: "Ropa",
  JUGUETES: "Juguetes",
  HIGIENE: "Higiene y cuidado",
  ALIMENTACION: "Alimentación",
  PASEO: "Paseo",
  HABITACION: "Habitación",
  OTROS: "Otros",
};
