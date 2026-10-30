import Link from "next/link";
import { txt, type Content } from "@/lib/home";

export default function Footer({ content = {} }: { content?: Content }) {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <span className="logo light">{txt(content, "site.logo_text", "Pisang Ijo")}</span>
          <p>{txt(content, "footer.tagline", "Platform demo untuk menjelajahi menu dan toko es pisang ijo")}</p>
          <p className="footer-social">{txt(content, "footer.social_text", "Sosial demo : Instagram - TikTok - Facebook")}</p>
        </div>
        <div>
          <h4>Tautan Cepat</h4>
          <ul>
            <li><Link href="/#menu">Menu</Link></li>
            <li><Link href="/#cari-toko">Cari Toko</Link></li>
            <li><Link href="/#tentang">Tentang Kami</Link></li>
            <li><Link href="/#faq">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4>Bantuan &amp; Kontak</h4>
          <ul>
            <li>{txt(content, "footer.help_email", "halo@pisangijokita.com")}</li>
            <li>WhatsApp CS demo: {txt(content, "footer.help_whatsapp", "+62 800 0000 0000")}</li>
          </ul>
        </div>
        <div>
          <h4>Legal</h4>
          <ul>
            <li><a href="#">{txt(content, "footer.legal_terms_label", "Syarat & Ketentuan")}</a></li>
            <li><a href="#">{txt(content, "footer.legal_privacy_label", "Kebijakan Privasi")}</a></li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>&copy; {txt(content, "footer.copyright", "2026 Pisang Ijo")}</p>
      </div>
    </footer>
  );
}