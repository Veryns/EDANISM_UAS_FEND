"use client";

import { useState } from "react";
import type { Faq } from "@/lib/home";

export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openId, setOpenId] = useState<number | null>(null);
  return (
    <div className="accordion">
      {faqs.map((f) => {
        const open = openId === f.id;
        return (
          <div key={f.id} className={"accordion-item" + (open ? " open" : "")}>
            <button
              className="accordion-trigger"
              type="button"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : f.id)}
            >
              {f.question}
            </button>
            <div className="accordion-panel">
              <div className="accordion-panel-inner">
                <p>{f.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}