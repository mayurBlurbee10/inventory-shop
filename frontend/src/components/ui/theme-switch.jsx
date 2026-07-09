"use client";

import { cn } from "@/app/lib/utils";

function ThemeSwitch({
  checked = false,
  onCheckedChange,
  disabled = false,
  className,
  onClick,
  ...props
}) {
  const handleClick = (event) => {
    if (disabled) return;
    onClick?.(event);
    if (!event.defaultPrevented) {
      onCheckedChange?.(!checked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent p-0 transition-colors duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-foreground" : "bg-muted-foreground/40",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

export { ThemeSwitch };
