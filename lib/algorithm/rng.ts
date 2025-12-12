// Deterministic RNG (Mulberry32) for reproducible schedules.

export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function randInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

export function weightedChoice<T>(
  rand: () => number,
  choices: Array<{ item: T; weight: number }>
): T {
  const total = choices.reduce((s, c) => s + c.weight, 0);
  let r = rand() * total;
  for (const c of choices) {
    r -= c.weight;
    if (r <= 0) return c.item;
  }
  return choices[choices.length - 1].item;
}
