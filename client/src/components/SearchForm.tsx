import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, Loader2, X } from 'lucide-react';

interface SearchFormProps {
  onSearch: (companyName: string) => void;
  isLoading: boolean;
  status: string;
}

export function SearchForm({ onSearch, isLoading, status }: SearchFormProps) {
  const [companyName, setCompanyName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName.trim()) {
      onSearch(companyName.trim());
    }
  };

  const clearSearch = () => {
    setCompanyName('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center space-x-3">
      <div className="relative flex-1 group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)] opacity-50 group-focus-within:opacity-100 transition-opacity" />
        <Input
          type="text"
          placeholder="Analyze company..."
          className="pl-10 pr-10 bg-white/5 border-[var(--sidebar-border)] focus:ring-[var(--apple-blue)]/30"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          disabled={isLoading}
          required
        />
        {companyName && !isLoading && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-[var(--text-secondary)] opacity-60 hover:opacity-100 transition-all"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <Button 
        type="submit" 
        disabled={isLoading || !companyName.trim()} 
        className="min-w-[110px] h-10 rounded-xl bg-[var(--apple-blue)] hover:bg-[#0062cc] text-white font-bold transition-all shadow-lg shadow-blue-500/10 active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
      >
        {isLoading ? (
          <div className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span className="text-[12px] uppercase tracking-wide">{status || 'Searching'}</span>
          </div>
        ) : (
          'Analyze'
        )}
      </Button>
    </form>
  );
}
