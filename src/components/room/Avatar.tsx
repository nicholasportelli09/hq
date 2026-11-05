import { initials } from "@/lib/room/time";

interface AvatarProps {
  name: string;
  tone?: "solid" | "outline";
  size?: "sm" | "md";
}

export function Avatar({ name, tone = "outline", size = "md" }: AvatarProps) {
  const dims = size === "sm" ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-[11px]";
  const look =
    tone === "solid"
      ? "bg-ink text-paper border-ink"
      : "bg-paper text-ink border-ink/25";
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full border font-semibold tracking-wide ${dims} ${look}`}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
