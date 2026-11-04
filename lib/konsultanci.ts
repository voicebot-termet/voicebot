export const KONSULTANCI = [
  'Anna Kowalska',
  'Piotr Nowak',
  'Maria Wiśniewska',
  'Tomasz Kowalczyk',
  'Agnieszka Kamińska',
] as const;

export type Konsultant = typeof KONSULTANCI[number];
