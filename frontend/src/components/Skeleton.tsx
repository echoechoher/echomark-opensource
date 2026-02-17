interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

export function MarkCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      <div className="mb-3">
        <Skeleton className="h-4 w-24 mb-3" />
      </div>

      <div className="space-y-2 mb-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      <div className="bg-gray-100 rounded-lg p-3 mb-3">
        <Skeleton className="h-4 w-full" />
      </div>

      <div className="flex items-start gap-2">
        <Skeleton className="h-3.5 w-3.5 rounded mt-0.5" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    </div>
  );
}

export function EpisodeCardSkeleton() {
  return (
    <div className="bg-white px-4 py-4 flex items-center gap-3">
      <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />

      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>

      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
    </div>
  );
}

export function TranscriptSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  );
}

export function MarkDetailSkeleton() {
  return (
    <div className="px-4 py-6 space-y-6">
      {/* Time badge */}
      <div className="flex justify-center">
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>

      {/* Context */}
      <div className="bg-white rounded-lg p-4 space-y-3">
        <Skeleton className="h-5 w-20" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>

      {/* Thought */}
      <div className="bg-white rounded-lg p-4 space-y-3">
        <Skeleton className="h-5 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      {/* Source */}
      <div className="bg-white rounded-lg p-4 space-y-3">
        <Skeleton className="h-5 w-16" />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Skeleton className="w-5 h-5 rounded mt-0.5" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}
