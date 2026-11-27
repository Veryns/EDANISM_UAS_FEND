"use client";

import { useState } from "react";
import type { Faq } from "@/lib/home";

// Gelembung percakapan: klik pertanyaan untuk membuka jawabannya
export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openId, setOpenId] = useState<number | null | undefined>(undefined);
  const current = openId === undefined ? (faqs[0]?.id ?? null) : openId;
  return (
    <div className="pj-faq-list">
      {faqs.map((f) => {
        const open = current === f.id;
        return (
          <div key={f.id} className={"pj-faq-item" + (open ? " open" : "")}>
            <button
              className="pj-q"
              type="button"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : f.id)}
            >
              {f.question}
            </button>
            {open && <div className="pj-a"><p>{f.answer}</p></div>}
          </div>
        );
      })}
    </div>
  );
}