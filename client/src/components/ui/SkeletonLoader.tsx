import { cn } from '../../utils/cn';

interface SkeletonLoaderProps {
  variant?: 'card' | 'table' | 'chart' | 'text';
  count?: number;
}

function SkeletonPulse({ className }: { className?: string }) {
  return <div className={cn('bg-gray-200 rounded animate-pulse', className)} />;
}

export default function SkeletonLoader({ variant = 'card', count = 1 }: SkeletonLoaderProps) {
  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card p-6 space-y-3">
            <SkeletonPulse className="h-4 w-1/2" />
            <SkeletonPulse className="h-8 w-3/4" />
            <SkeletonPulse className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <SkeletonPulse className="h-4 w-1/4" />
            <SkeletonPulse className="h-4 w-1/5" />
            <SkeletonPulse className="h-4 w-1/6" />
            <SkeletonPulse className="h-4 w-1/6" />
            <SkeletonPulse className="h-4 w-1/8" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className="card p-6 space-y-4">
        <SkeletonPulse className="h-5 w-1/3" />
        <SkeletonPulse className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPulse key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

