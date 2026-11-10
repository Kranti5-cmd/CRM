import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  prefix?: string;
  suffix?: string;
}

export default function StatCard({ title, value, change, icon: Icon, iconColor = 'text-royal-600', iconBg = 'bg-royal-50', prefix, suffix }: StatCardProps) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <div className="card-hover p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', isPositive ? 'text-green-600' : 'text-red-600')}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
              <span className="text-gray-400 font-normal">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>
      </div>
    </div>
  );
}

