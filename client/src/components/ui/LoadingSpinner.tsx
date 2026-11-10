import { cn } from '../../utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ size = 'md', text, className }: LoadingSpinnerProps) {
  const sizes = { sm: 'w-5 h-5 border-2', md: 'w-8 h-8 border-3', lg: 'w-12 h-12 border-4' };
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className={cn('rounded-full border-royal-200 border-t-royal-600 animate-spin', sizes[size])} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}

