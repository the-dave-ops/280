import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { customersApi } from '../api/customers';
import type { Customer } from '../types';
import { formatPhoneNumber } from '../utils/phoneFormatting';

interface SearchBarProps {
  onCustomerSelect: (customer: Customer | null) => void;
}

export function SearchBar({ onCustomerSelect }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', 'search', debouncedQuery],
    queryFn: () => customersApi.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const handleCustomerClick = async (customer: Customer) => {
    // Load full customer data with prescriptions
    try {
      const fullCustomer = await customersApi.getById(customer.id);
      onCustomerSelect(fullCustomer);
    } catch (error) {
      // Fallback to basic customer data if API call fails
      onCustomerSelect(customer);
    }
    setSearchQuery('');
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חפש לפי שם, תעודת זהות או טלפון..."
          className="input pr-10 w-full"
          dir="rtl"
        />
        {isLoading && (
          <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
        )}
      </div>

      {/* Search Results */}
      {debouncedQuery.length >= 2 && customers.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {customers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => handleCustomerClick(customer)}
              className="w-full text-right px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="font-medium">
                {customer.firstName} {customer.lastName}
              </div>
              <div className="text-sm text-gray-500">
                {customer.idNumber && `ת.ז: ${customer.idNumber}`}
                {customer.phone && ` | טלפון: ${formatPhoneNumber(customer.phone)}`}
              </div>
            </button>
          ))}
        </div>
      )}

      {debouncedQuery.length >= 2 && !isLoading && customers.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          לא נמצאו תוצאות
        </div>
      )}
    </div>
  );
}

