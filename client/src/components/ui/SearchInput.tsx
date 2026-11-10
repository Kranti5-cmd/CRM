import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchInputProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  className?: string;
  defaultValue?: string;
}

export default function SearchInput({
  placeholder = 'Search...',
  onSearch,
  className,
  defaultValue = '',
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const debouncedValue = useDebounce(value, 300);

  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  });

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    onSearchRef.current(debouncedValue);
  }, [debouncedValue]);

  const handleClear = () => {
    setValue('');
    onSearchRef.current('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchRef.current(value);
    }
  };

  return (
    <div className={`relative ${className || ''}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none select-none z-10" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{ paddingLeft: '2.5rem', paddingRight: '2.25rem' }}
        className="input-field !pl-10 !pr-9 h-[42px] bg-white focus:bg-white text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:border-[#013A2B] focus:ring-2 focus:ring-[#013A2B]/10 rounded-lg outline-none transition-all shadow-2xs"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer z-10"
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
