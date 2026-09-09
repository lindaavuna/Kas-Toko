import { NextResponse, type NextRequest } from "next/server";
import { NAMA_COOKIE } from "@/lib/server/konstanta";
import { bacaToken } from "@/lib/server/kredensial";

// Cek optimistis di tepi jaringan: cookie sesi ada & tanda tangan sah.
// Otorisasi final tetap di layout/action (tabel app_sessions + store_members).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(NAMA_COOKIE)?.value;
  const isi = token ? bacaToken(token) : null;

  const areaKasir = pathname.startsWith("/kasir");
  const areaMilik = pathname.startsWith("/dashboard");

  if (!isi && (areaKasir || areaMilik)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("dari", pathname);
    return NextResponse.redirect(url);
  }
  if (isi && areaMilik && isi.role !== "owner") {
    return NextResponse.redirect(new URL("/kasir", request.url));
  }
  if (isi && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(
      new URL(isi.role === "owner" ? "/dashboard" : "/kasir", request.url)
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/kasir/:path*", "/dashboard/:path*", "/login", "/register"],
};
