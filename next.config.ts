import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Izinkan akses mode dev dari perangkat lain di jaringan LAN
  allowedDevOrigins: ["172.22.22.18", "*.172.22.22.18", "kastoko.lan", "*.kastoko.lan"],
  async headers() {
    return [
      {
        // Data privat toko tidak boleh terindeks mesin pencari
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
