import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  description,
  actionLabel,
  href,
  className,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  href?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[16px] border border-line/80 bg-white px-5 py-9 text-center shadow-xs",
        className,
      )}
    >
      <h3 className="font-display text-base sm:text-lg font-bold text-title">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-xs sm:text-sm leading-relaxed text-muted">{description}</p>
      {actionLabel && href ? (
        <div className="mt-4">
          <Button href={href} size="sm" className="rounded-full text-xs font-semibold">
            {actionLabel.endsWith("↗") || actionLabel.startsWith("←")
              ? actionLabel
              : `${actionLabel} ↗`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
