import Link from "next/link";
import { txt, type Content } from "@/lib/home";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa6";

export default function Footer({ content = {} }: { content?: Content }) {
  return (
    <footer className="pj-sec pj-footer">
      <div className="pj-stage" style={{ height: 380 }}>
        <p className="pj-fh pj-f-brand">{txt(content, "site.logo_text", "Pisang Ijo")}</p>
        <p className="pj-ft pj-f-desc">
          {txt(content, "footer.tagline", "Platform untuk menjelajahi menu dan toko es pisang ijo").replace(/\s*\bdemo\b/gi, "")}
          <span className="pj-social">
            <a href="#" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" aria-label="TikTok"><FaTiktok /></a>
            <a href="#" aria-label="Facebook"><FaFacebook /></a>
          </span>
        </p>
        <div className="pj-f-col pj-f-c1">
          <p className="pj-fh">Tautan Cepat</p>
          <ul className="pj-ft">
            <li><Link href="/menu">Menu</Link></li>
            <li><Link href="/cari-toko">Cari Toko</Link></li>
            <li><Link href="/tentang">Tentang Kami</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
          </ul>
        </div>
        <div className="pj-f-col pj-f-c2">
          <p className="pj-fh">Bantuan &amp; Kontak</p>
          <ul className="pj-ft">
            <li>{txt(content, "footer.help_email", "halo@pisangijokita.com")}</li>
            <li>WhatsApp CS : {txt(content, "footer.help_whatsapp", "+62 800 0000 0000")}</li>
          </ul>
        </div>
        <div className="pj-f-col pj-f-c3">
          <p className="pj-fh">Legal</p>
          <ul className="pj-ft">
            <li><a href="#">{txt(content, "footer.legal_terms_label", "Syarat & Ketentuan")}</a></li>
            <li><a href="#">{txt(content, "footer.legal_privacy_label", "Kebijakan Privasi")}</a></li>
          </ul>
        </div>
        <div className="pj-f-line" />
        <p className="pj-ft pj-f-copy">&copy; {txt(content, "footer.copyright", "2026 Pisang Ijo")}</p>
      </div>
    </footer>
  );
}