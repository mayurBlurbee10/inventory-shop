"use client";

import { Briefcase, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/app/lib/utils";

export const REPORT_DOCUMENT_OPTIONS = [
  {
    id: "holdings",
    label: "Client, Sample Charitable Fund (0000000001, Holdings)",
    type: "Holdings",
  },
  {
    id: "sector_returns",
    label: "Client, Sample (0000000001, Performance)",
    type: "Sector Returns",
  },
];

export default function ReportDocumentSelector({
  value,
  onChange,
  holdingsFile,
  sectorReturnsFile,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const filesByType = {
    holdings: holdingsFile,
    sector_returns: sectorReturnsFile,
  };

  const selectedOption =
    REPORT_DOCUMENT_OPTIONS.find((option) => option.id === value) ||
    REPORT_DOCUMENT_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex w-full items-center gap-4 border-b border-border bg-muted/50 px-4 py-3 md:px-6"
    >
      <span className="shrink-0 text-sm text-muted-foreground">Find data for</span>

      <div className="relative min-w-0 flex-1 max-w-xl">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-10 w-full items-center gap-3 rounded-md border border-border bg-background px-3 text-left text-sm text-foreground shadow-sm transition-colors hover:border-ring/50 hover:bg-accent/30"
        >
          <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{selectedOption.label}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {open && (
          <div className="absolute top-[calc(100%+4px)] z-50 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
            {REPORT_DOCUMENT_OPTIONS.map((option) => {
              const isSelected = option.id === value;
              const file = filesByType[option.id];

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-accent/50",
                    isSelected && "bg-accent/50",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">
                      {option.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {file?.name
                        ? `Uploaded file: ${file.name}`
                        : `No ${option.type.toLowerCase()} file uploaded yet`}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="mt-0.5 shrink-0 text-sm text-foreground">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
