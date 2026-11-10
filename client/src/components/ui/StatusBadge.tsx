import { STATUS_COLORS, DEAL_STAGE_COLORS } from '../../utils/constants';
import { cn } from '../../utils/cn';

interface StatusBadgeProps {
  status: string;
  variant?: 'lead' | 'deal';
}

export default function StatusBadge({ status, variant = 'lead' }: StatusBadgeProps) {
  const colors = variant === 'deal'
    ? DEAL_STAGE_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' }
    : STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };

  return (
    <span className={cn('badge', colors.bg, colors.text)}>
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', colors.dot)} />
      {status}
    </span>
  );
}
