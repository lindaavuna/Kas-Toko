"use client";

export interface TitikTren {
  label: string;
  nilai: number;
  nilai2?: number;
}

export function GrafikBatang({
  data,
  formatNilai,
  warna = "bg-primary",
  warna2,
}: {
  data: TitikTren[];
  formatNilai?: (n: number) => string;
  warna?: string;
  warna2?: string;
}) {
  const maks = Math.max(...data.map((d) => Math.max(d.nilai, d.nilai2 ?? 0)), 1);
  return (
    <div>
      <div className="flex h-40 items-end gap-1.5 sm:gap-3">
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full min-w-0 flex-1 items-end justify-center gap-0.5">
            <div
              className={`w-1/2 max-w-8 rounded-t ${warna} transition-all group-hover:opacity-80`}
              style={{ height: `${Math.max((d.nilai / maks) * 100, 2)}%` }}
            >
              <span className="pointer-events-none absolute inset-x-0 -top-6 hidden text-center text-[10px] font-semibold text-foreground group-hover:block">
                {formatNilai ? formatNilai(d.nilai) : d.nilai}
              </span>
            </div>
            {d.nilai2 !== undefined && warna2 && (
              <div
                className={`w-1/2 max-w-8 rounded-t ${warna2}`}
                style={{ height: `${Math.max((d.nilai2 / maks) * 100, 2)}%` }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5 sm:gap-3">
        {data.map((d) => (
          <p key={d.label} className="min-w-0 flex-1 truncate text-center text-[10px] text-muted-foreground">
            {d.label}
          </p>
        ))}
      </div>
    </div>
  );
}
