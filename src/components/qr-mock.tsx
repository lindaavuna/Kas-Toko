"use client";

function hash(seed: string): number[] {
  const out: number[] = [];
  let h = 2166136261;
  for (const ch of seed) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
    out.push(h >>> 0);
  }
  return out;
}

/** Pola ala QR (dummy, bukan QR sungguhan) untuk simulasi QRIS Tahap 1 */
export function QrMock({ seed, size = 176 }: { seed: string; size?: number }) {
  const modules = 25;
  const h = hash(seed);
  const sel: boolean[][] = [];
  let x = h.reduce((a, b) => a ^ b, 0) >>> 0;
  for (let r = 0; r < modules; r++) {
    sel[r] = [];
    for (let c = 0; c < modules; c++) {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      x >>>= 0;
      sel[r][c] = (x & 3) === 0;
    }
  }
  const finder = (r: number, c: number) => {
    const areas = [
      [0, 0],
      [0, modules - 7],
      [modules - 7, 0],
    ];
    for (const [ar, ac] of areas) {
      const rr = r - ar;
      const cc = c - ac;
      if (rr >= 0 && rr < 7 && cc >= 0 && cc < 7) {
        const tepi = rr === 0 || rr === 6 || cc === 0 || cc === 6;
        const tengah = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
        return tepi || tengah;
      }
    }
    return null;
  };
  const s = size / modules;
  const rects = [];
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      const f = finder(r, c);
      const on = f === null ? sel[r][c] : f;
      if (on) rects.push(<rect key={`${r}-${c}`} x={c * s} y={r * s} width={s} height={s} />);
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="bg-white text-black" role="img" aria-label="Kode QR">
      {rects}
    </svg>
  );
}
