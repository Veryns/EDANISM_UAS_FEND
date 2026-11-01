"use client";

import AdminImageManager from "@/components/admin/AdminImageManager";
import { parseImageList, type FieldDef } from "@/lib/adminConfig";

export default function FieldInput({
  def, value, onChange, stores,
}: {
  def: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  stores?: { id: number; nama: string }[];
}) {
  const v = value === undefined || value === null ? "" : String(value);

  let input;
  if (def.type === "image") {
    input = <AdminImageManager images={parseImageList(value)} onChange={onChange} />;
  } else if (def.type === "textarea") {
    input = <textarea rows={3} value={v} onChange={(e) => onChange(e.target.value)} />;
  } else if (def.type === "store-select") {
    input = (
      <select value={v} onChange={(e) => onChange(e.target.value)}>
        <option value="">— Pilih Toko —</option>
        {(stores || []).map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
      </select>
    );
  } else if (def.type === "select") {
    input = (
      <select value={v || def.options?.[0]} onChange={(e) => onChange(e.target.value)}>
        {def.options?.map((o) => <option key={o} value={o}>{def.optionLabels?.[o] || o}</option>)}
      </select>
    );
  } else {
    input = (
      <input type={def.type} value={v} required={def.required} step={def.step} min={def.min} max={def.max}
        onChange={(e) => onChange(e.target.value)} />
    );
  }

  return (
    <>
      <label>{def.label}</label>
      {input}
    </>
  );
}