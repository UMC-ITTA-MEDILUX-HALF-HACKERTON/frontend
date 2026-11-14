import { cn } from "@common/utils/cn";

export type AvatarColor = "primary" | "mint" | "amber" | "rose";

const COLOR_CLASS: Record<AvatarColor, string> = {
  primary: "bg-primary",
  mint: "bg-mint",
  amber: "bg-amber",
  rose: "bg-rose",
};

type AvatarProps = {
  name: string;
  color?: AvatarColor;
  className?: string;
};

export function Avatar({ name, color = "primary", className }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
        COLOR_CLASS[color],
        className,
      )}
    >
      {name.charAt(0)}
    </span>
  );
}
