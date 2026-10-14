import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      // Halaman dinamis yang baru dikunjungi dipakai ulang dari cache router selama 60 detik,
      // jadi pindah tab bolak-balik terasa instan. Setiap mutasi (server action) memanggil
      // revalidatePath, yang mengosongkan cache ini, jadi data setelah simpan tetap terbaru.
      dynamic: 60,
    },
  },
}

export default nextConfig
