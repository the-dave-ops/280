import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import { searchApi, SearchIndexCustomer, SearchIndexPrescription } from '../api/search';

interface UseInstantSearchOptions {
  type?: 'all' | 'customers' | 'prescriptions';
  limit?: number;
}

interface SearchResults {
  customers: SearchIndexCustomer[];
  prescriptions: SearchIndexPrescription[];
}

export function useInstantSearch(options: UseInstantSearchOptions = {}) {
  const { type = 'all', limit = 50 } = options;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Load search index once
  const { data: searchIndex, isLoading } = useQuery({
    queryKey: ['search-index', type],
    queryFn: () => searchApi.getIndex(type),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (renamed from cacheTime in v5)
  });

  // Create Fuse.js instances for fuzzy search
  const customersFuse = useMemo(() => {
    if (!searchIndex?.customers || searchIndex.customers.length === 0) return null;

    return new Fuse(searchIndex.customers, {
      keys: [
        { name: 'firstName', weight: 2 },
        { name: 'lastName', weight: 2 },
        { name: 'fullName', weight: 2.5 },
        { name: 'idNumber', weight: 1.5 },
        { name: 'phone', weight: 1 },
        { name: 'mobile1', weight: 1 },
        { name: 'mobile2', weight: 0.8 },
        { name: 'city', weight: 0.5 },
      ],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 1,
      ignoreLocation: true,
    });
  }, [searchIndex?.customers]);

  const prescriptionsFuse = useMemo(() => {
    if (!searchIndex?.prescriptions || searchIndex.prescriptions.length === 0) return null;

    return new Fuse(searchIndex.prescriptions, {
      keys: [
        { name: 'prescriptionNumber', weight: 3 },
        { name: 'customerName', weight: 2 },
        { name: 'customerFirstName', weight: 1.5 },
        { name: 'customerLastName', weight: 1.5 },
        { name: 'idNumber', weight: 1.5 },
        { name: 'type', weight: 1 },
        { name: 'healthFund', weight: 0.8 },
      ],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 1,
      ignoreLocation: true,
    });
  }, [searchIndex?.prescriptions]);

  // Instant search results
  const results: SearchResults = useMemo(() => {
    const emptyResults = { customers: [], prescriptions: [] };

    if (!searchQuery || searchQuery.trim().length < 1) {
      return emptyResults;
    }

    const query = searchQuery.trim();

    const customerResults: SearchIndexCustomer[] =
      customersFuse?.search(query).slice(0, limit).map((r) => r.item) || [];

    const prescriptionResults: SearchIndexPrescription[] =
      prescriptionsFuse?.search(query).slice(0, limit).map((r) => r.item) || [];

    return {
      customers: customerResults,
      prescriptions: prescriptionResults,
    };
  }, [searchQuery, customersFuse, prescriptionsFuse, limit]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery]);

  // Calculate total results for navigation
  const totalResults = results.customers.length + results.prescriptions.length;

  return {
    searchQuery,
    setSearchQuery,
    results,
    isLoading,
    totalCustomers: searchIndex?.customers?.length || 0,
    totalPrescriptions: searchIndex?.prescriptions?.length || 0,
    resultCount: {
      customers: results.customers.length,
      prescriptions: results.prescriptions.length,
    },
    selectedIndex,
    setSelectedIndex,
    totalResults,
  };
}
