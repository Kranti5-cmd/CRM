import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Column } from '../../types';

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onSort?: (field: string) => void;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onRowClick?: (item: T) => void;
  keyExtractor?: (item: T) => string;
}

export default function DataTable<T extends { _id?: string }>({
  columns,
  data,
  onSort,
  sortField,
  sortOrder,
  onRowClick,
  keyExtractor,
}: DataTableProps<T>) {
  const getKey = (item: T, index: number) => {
    if (keyExtractor) return keyExtractor(item);
    if (item._id) return item._id;
    return String(index);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider',
                  col.sortable && 'cursor-pointer select-none hover:text-gray-700',
                  col.className
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortField === col.key && (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-royal-600" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-royal-600" />
                    )
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((item, index) => (
            <tr
              key={getKey(item, index)}
              className={cn(
                'transition-colors hover:bg-gray-50/80',
                index % 2 === 1 && 'bg-gray-50/40',
                onRowClick && 'cursor-pointer'
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3 text-sm text-gray-700', col.className)}>
                  {col.render
                    ? col.render(item)
                    : String((item as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="py-12 text-center text-gray-400 text-sm">No data to display</div>
      )}
    </div>
  );
}
