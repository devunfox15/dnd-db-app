export const DIE_ORDER = [20, 12, 100, 10, 8, 6, 4] as const;

export type DieSides = (typeof DIE_ORDER)[number];

export function randomRoll(sides: number) {
  return 1 + Math.floor(Math.random() * sides);
}
