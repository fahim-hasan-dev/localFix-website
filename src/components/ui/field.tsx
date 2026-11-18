import { cn } from "@/lib/cn";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const required = /\*\s*$/.test(label);
  const text = required ? label.replace(/\s*\*\s*$/, "") : label;
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="block font-display text-sm font-semibold text-title">
        {text}
        {required ? <span className="text-error"> *</span> : null}
      </span>
      {children}
      {error ? (
        <span data-field-error="" className="block text-xs font-medium text-error">
          {error}
        </span>
      ) : null}
      {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

const controlClass =
  "w-full min-h-[44px] rounded-[10px] border border-line bg-white px-3.5 text-sm sm:text-[15px] text-title outline-none transition-colors placeholder:text-sm placeholder:text-muted focus:border-primary disabled:cursor-not-allowed disabled:bg-smoke disabled:text-muted";

export function TextField(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return <input {...props} className={cn(controlClass, "h-11", props.className)} />;
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={cn(controlClass, "min-h-28 resize-y py-2.5", props.className)}
    />
  );
}

export function NativeSelect(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return <select {...props} className={cn(controlClass, "h-11 pr-10 cursor-pointer", props.className)} />;
}
