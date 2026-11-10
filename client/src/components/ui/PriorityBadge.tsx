import { PRIORITY_COLORS } from '../../utils/constants';
import { cn } from '../../utils/cn';

interface PriorityBadgeProps {
  priority: string;
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const colors = PRIORITY_COLORS[priority] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  return (
    <span className={cn('badge', colors.bg, colors.text)}>
      {priority}
    </span>
  );
}

