"use client";

export default function ReportFormatError({ title, message, fileName }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center">
      <p className="text-sm font-medium text-destructive">{title}</p>
      {fileName && (
        <p className="mt-2 text-sm text-foreground">
          File: <span className="font-medium">{fileName}</span>
        </p>
      )}
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <p className="mt-4 text-xs text-muted-foreground">
        Please delete this file from Tools → Reports and upload a file that
        matches the expected format.
      </p>
    </div>
  );
}
