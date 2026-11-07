/** Display width: Hangul and other full-width chars take two columns. */
export const width = (s: string) =>
  Array.from(s).reduce(
    (w, ch) => w + (/[ᄀ-ᇿ　-鿿가-힯＀-￯]/.test(ch) ? 2 : 1),
    0
  );

export const padEnd = (s: string, n: number) =>
  s + ' '.repeat(Math.max(0, n - width(s)));

export const padStart = (s: string, n: number) =>
  ' '.repeat(Math.max(0, n - width(s))) + s;
