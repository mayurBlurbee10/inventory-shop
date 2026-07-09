import { FileIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const TableSkeleton = ({ rows = 10 }) => (
  <div className="w-full">
    {/* Header */}
    <div className="flex items-center gap-4 border-b border-border px-4 py-3">
      <div className="w-4" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="ml-auto h-4 w-20" />
      <Skeleton className="h-4 w-16" />
      <div className="w-6" />
    </div>

    {/* Rows */}
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={index}
        className="flex items-center gap-4 border-b border-border px-6 py-4"
      >
        <Skeleton className="h-4 w-4 rounded-sm" />
        <Skeleton className="h-5 w-5 rounded-sm" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="ml-auto h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    ))}
  </div>
);

const EmptyState = ({ checkLoading }) => {
  if (checkLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="flex flex-col w-full items-center justify-center py-12 text-muted-foreground">
      <FileIcon size={48} className="mb-4 opacity-50" />
      <p>No files or folders found</p>
    </div>
  );
};

export default EmptyState;
