export function HeartIcon({ size = 24, fill = "#FFFAEB", filled = true }: { size?: number; fill?: string; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? fill : "none"} stroke={fill} strokeWidth={filled ? 0 : 2} aria-hidden="true">
      <path d="M12 21s-7-4.6-9.3-9C.9 8.3 3 5 6.3 5c2 0 3.7 1.1 4.7 2.7C12 6.1 13.7 5 15.7 5 19 5 21.1 8.3 19.3 12 17 16.4 12 21 12 21z" />
    </svg>
  );
}

export function ChevronIcon({ dir, size = 16, stroke = "#17381B", width = 3.5 }: { dir: "left" | "right"; size?: number; stroke?: string; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}