export type WasteCat = 'recyclable' | 'organic' | 'inorganic';
export type RecordStatus = 'validado' | 'pendiente' | 'rechazado';

export interface WasteRecord {
  id: string;
  edif: string;
  cat: WasteCat;
  kg: number;
  when: string;
  user: string;
  fecha: string;
  estado: RecordStatus;
}

export const FIXTURE_RECORDS: WasteRecord[] = [
  { id: 'R-2401', edif: 'Edif. 2 · Cafetería',      cat: 'recyclable', kg: 8.4,  when: 'hace 12 min', user: 'M. Hernández', fecha: '09/05/2026', estado: 'validado' },
  { id: 'R-2400', edif: 'Edif. 4 · Lab cómputo',    cat: 'inorganic',  kg: 3.2,  when: 'hace 38 min', user: 'J. Ramírez',   fecha: '09/05/2026', estado: 'pendiente' },
  { id: 'R-2399', edif: 'Patio central',              cat: 'organic',    kg: 12.1, when: 'hace 1 h',   user: 'A. Gómez',    fecha: '09/05/2026', estado: 'pendiente' },
  { id: 'R-2398', edif: 'Edif. 1 · Aulas',           cat: 'recyclable', kg: 5.7,  when: 'hace 2 h',   user: 'M. Hernández', fecha: '09/05/2026', estado: 'validado' },
  { id: 'R-2397', edif: 'Cafetería externa',          cat: 'organic',    kg: 9.3,  when: 'hace 3 h',   user: 'L. Ortiz',    fecha: '09/05/2026', estado: 'validado' },
  { id: 'R-2396', edif: 'Edif. 3 · Administración',  cat: 'inorganic',  kg: 2.1,  when: 'hace 4 h',   user: 'C. Mendoza',  fecha: '08/05/2026', estado: 'validado' },
  { id: 'R-2395', edif: 'Edif. 2 · Cafetería',       cat: 'organic',    kg: 15.3, when: 'hace 5 h',   user: 'A. Gómez',    fecha: '08/05/2026', estado: 'pendiente' },
  { id: 'R-2394', edif: 'Patio central',              cat: 'recyclable', kg: 7.8,  when: 'hace 6 h',   user: 'J. Ramírez',  fecha: '08/05/2026', estado: 'validado' },
];
