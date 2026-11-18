import { cn } from "@/lib/cn";

/** Renders sanitized rule content (see `ruleContentToHtml`) with basic typography. */
export function RuleHtml({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn(
        "font-sans text-[15.5px] sm:text-[16px] leading-[1.8] text-[#444]",
        "[&_h1]:mt-8 [&_h1]:font-display [&_h1]:text-[26px] [&_h1]:font-bold [&_h1]:text-title",
        "[&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-[20px] [&_h2]:font-bold [&_h2]:text-title sm:[&_h2]:text-[22px]",
        "[&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:text-title",
        "[&_p]:mt-3.5 [&_ul]:mt-3.5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-3.5 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_li]:mt-1.5 [&_a]:font-semibold [&_a]:text-primary [&_a:hover]:underline [&_strong]:text-title",
        "[&>:first-child]:mt-0",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
