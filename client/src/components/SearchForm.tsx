import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, Loader2 } from 'lucide-react';

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

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm items-center space-x-2">
      <div className="relative w-full">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Enter company name..."
          className="pl-8 w-full"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>
      <Button type="submit" disabled={isLoading} className="min-w-[120px]">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {status || 'Searching'}
          </>
        ) : (
          'Analyze'
        )}
      </Button>
    </form>
  );
}
