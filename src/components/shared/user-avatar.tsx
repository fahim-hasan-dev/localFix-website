import { cn } from "@/lib/cn";
import type { User } from "@/types";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserAvatar({
  user,
  size = "md",
  className,
}: {
  user: Pick<User, "name" | "avatar">;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-16 w-16 text-lg",
  };

  if (user.avatar) {
    return (
      <span
        className={cn(
          "relative block shrink-0 overflow-hidden rounded-full bg-smoke ring-1 ring-black/5",
          sizes[size],
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-primary font-display font-bold text-white ring-1 ring-black/5",
        sizes[size],
        className,
      )}
    >
      {initials(user.name)}
    </span>
  );
}
