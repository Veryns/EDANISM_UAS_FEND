import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const blocks: Record<string, unknown> = {
  site: { site_title: "Pisang Ijo", logo_text: "Pisang Ijo" },
  hero: {
    badge: "Platform Kuliner Makassar",
    heading: "Temukan Es Pisang Ijo Favorit Kamu",
    subheading: "Jelajahi pilihan es pisang ijo dan temukan menu kesukaanmu",
    search_placeholder: "Cari toko atau menu es pisang ijo",
    cta_primary: "Cari Toko",
    cta_secondary: "Lihat Menu",
  },
  toko_populer: {
    heading: "Toko Populer & Rating",
    subheading: "Temukan toko yang sesuai dengan citarasa kesukaanmu.",
    link_text: "Lihat semua toko",
  },
  menu_section: {
    heading: "Menu Unggulan",
    subheading: "Pilih paduan rasa favorit untuk anda coba nanti",
  },
  about: {
    eyebrow: "Tentang Platform",
    heading: "Merayakan segarnya rasa yang akrab",
    description:
      "Pisang Ijo Kita adalah platform yang menghubungkan para pecinta kuliner tradisional Makassar dengan mitra UMKM dan kedai lokal terbaik di seluruh Jabodetabek. Kami berkomitmen untuk melestarikan cita rasa nusantara melalui kemudahan pemesanan online, jaminan kebersihan, serta standar kualitas bahan baku kelapa dan pisang pilihan yang selalu segar setiap hari.",
    media_text: "Ceritanya Gambar Bahan Bahan Pisang Ijo",
    images: [],
    image_url: "",
    pill_1: "Pisang Segar Pilihan",
    pill_2: "Santan Lembut",
    pill_3: "Layanan Penuh Perhatian",
  },
  history: {
    heading: "Sejarah Pisang Ijo",
    text: "Berawal dari kecintaan mendalam terhadap kuliner tradisional, Pisang Ijo Kita hadir untuk menyajikan kelezatan Es Pisang Ijo otentik khas Makassar langsung ke hadapan Anda. Sejak pertama kali berdiri, kami konsisten menjaga kualitas rasa melalui pemilihan pisang pilihan yang matang pas, adonan lembut berbalut daun suji alami, dipadu dengan gurihnya vla santan dan es yang menyegarkan. Kini, kami terus berkembang dan memperluas jangkauan melalui kemitraan di berbagai titik strategis agar dapat melayani pelanggan setia dengan lebih dekat dan cepat.",
  },
  testimonial_section: {
    eyebrow: "Kota Mereka #MerekaBicara",
    heading: "Testimoni Pelanggan",
    cta: "Tulis Ulasan",
  },
  cari_toko: {
    eyebrow: "Pencarian Lokasi",
    heading: "Cari Toko Es Pisang Ijo",
    subheading: "Masukkan nama toko atau menu dan area/kota secara manual",
  },
  faq_section: {
    eyebrow: "Butuh Bantuan?",
    heading: "Pertanyaan Yang Sering Ditanyakan",
  },
  contact: {
    eyebrow: "Kontak",
    heading: "Mari ngobrol tentang rasa favoritmu",
    email: "halo@pisangijokita.com",
    whatsapp: "+62 700 0000 0000",
    note: "Butuh bantuan menggunakan halaman demo ini? Hubungi kanal contoh berikut pada jam layanan umum.",
    hours: "Senin - Sabtu, 09.00 - 18.00",
  },
  footer: {
    tagline: "Platform demo untuk menjelajahi menu dan toko es pisang ijo",
    social_text: "Sosial demo : Instagram - TikTok - Facebook",
    help_email: "halo@pisangijokita.com",
    help_whatsapp: "+62 800 0000 0000",
    legal_terms_label: "Syarat & Ketentuan",
    legal_privacy_label: "Kebijakan Privasi",
    copyright: "2026 Pisang Ijo",
  },
};

async function main() {
  for (const [key, data] of Object.entries(blocks)) {
    await prisma.contentBlock.upsert({
      where: { key },
      update: {},
      create: { key, data: JSON.stringify(data) },
    });
  }

  if ((await prisma.store.count()) === 0) {
    await prisma.store.createMany({
      data: [
        { nama: "Es Pisang Ijo Bu Ida", alamat: "Jl. Pengayoman, Makassar", jam_buka: "08:00", jam_tutup: "21:00", rating: 4.8, ulasan_count: 128, sort_order: 1 },
        { nama: "Pisang Ijo Daeng Sija", alamat: "Jl. Boulevard, Makassar", jam_buka: "09:00", jam_tutup: "20:00", rating: 4.6, ulasan_count: 96, sort_order: 2 },
        { nama: "Pisang Ijo Ratu Rasa", alamat: "Jl. Sultan Alauddin, Makassar", jam_buka: "10:00", jam_tutup: "18:00", rating: 4.5, ulasan_count: 54, sort_order: 3 },
      ],
    });
  }

  if ((await prisma.menuItem.count()) === 0) {
    await prisma.menuItem.createMany({
      data: [
        { nama: "Pisang Ijo Original", deskripsi: "Saus santan, bubur sumsum", harga: "Rp 15.000", sort_order: 1, store_id: 1 },
        { nama: "Pisang Ijo Cokelat", deskripsi: "Topping cokelat leleh", harga: "Rp 17.000", sort_order: 2, store_id: 1 },
        { nama: "Pisang Ijo Durian", deskripsi: "Dengan durian asli", harga: "Rp 20.000", sort_order: 3, store_id: 2 },
        { nama: "Pisang Ijo Keju", deskripsi: "Taburan keju parut", harga: "Rp 18.000", sort_order: 4, store_id: 3 },
      ],
    });
  }

  if ((await prisma.testimonial.count()) === 0) {
    await prisma.testimonial.createMany({
      data: [
        { nama: "Rangga", ulasan: "Pisang ijonya segar, santannya lembut dan manisnya pas. Pasti balik lagi.", waktu: "2 hari yang lalu", stars: 5, sort_order: 1, approved: 1 },
        { nama: "Salsabila", ulasan: "Topping cokelatnya enak banget, porsinya pas dan tokonya bersih.", waktu: "5 hari yang lalu", stars: 5, sort_order: 2, approved: 1 },
        { nama: "Fajar", ulasan: "Cocok buat siang hari yang panas. Pelayanannya ramah dan cepat.", waktu: "1 minggu yang lalu", stars: 5, sort_order: 3, approved: 1 },
      ],
    });
  }

  if ((await prisma.faq.count()) === 0) {
    await prisma.faq.createMany({
      data: [
        { question: "Bagaimana Cara Pesan?", answer: "Pilih toko atau menu favoritmu, lalu hubungi toko langsung melalui kontak yang tersedia di halaman detail toko.", sort_order: 1 },
        { question: "Apakah tersedia pilihan varian?", answer: "Ya, sebagian besar toko menyediakan beberapa varian topping dan tingkat kemanisan.", sort_order: 2 },
        { question: "Berapa estimasi proses pesanan?", answer: "Estimasi waktu bervariasi tergantung toko, umumnya 15-30 menit setelah pesanan dikonfirmasi.", sort_order: 3 },
        { question: "Bagaimana cara daftar akun?", answer: "Klik tombol Login / Sign In di bagian atas halaman, lalu ikuti langkah pendaftaran akun baru.", sort_order: 4 },
        { question: "Bagaimana cara memberi ulasan?", answer: "Setelah login, kamu dapat menekan tombol Tulis Ulasan pada bagian testimoni pelanggan.", sort_order: 5 },
        { question: "Apakah semua toko menerima pesanan online?", answer: "Tidak semua, status penerimaan pesanan online ditampilkan pada masing-masing halaman toko.", sort_order: 6 },
      ],
    });
  }

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD;
  if (password) {
    const hash = await bcrypt.hash(password, 12);
    await prisma.adminUser.upsert({
      where: { username },
      update: { password_hash: hash },
      create: { username, password_hash: hash },
    });
    console.log(`Admin "${username}" siap.`);
  } else {
    console.log("ADMIN_PASSWORD tidak ditemukan, admin tidak dibuat.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());