import { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2, User, FileText, Clock, Trash2 } from 'lucide-react';
import { useInstantSearch } from '../hooks/useInstantSearch';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { highlightText } from '../utils/highlightText';
import type { Customer, Prescription } from '../types';

interface GlobalSearchProps {
  onCustomerSelect?: (customer: Customer) => void;
  onPrescriptionSelect?: (prescription: Prescription) => void;
}

export function GlobalSearch({ onCustomerSelect, onPrescriptionSelect }: GlobalSearchProps) {
  const { 
    searchQuery, 
    setSearchQuery, 
    results, 
    isLoading, 
    resultCount,
    selectedIndex,
    setSelectedIndex,
    totalResults,
  } = useInstantSearch({
    type: 'all',
    limit: 10,
  });

  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } = useRecentSearches();

  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keys if dropdown is open
      if (!showResults) return;

      // Escape to close
      if (e.key === 'Escape') {
        setShowResults(false);
        inputRef.current?.blur();
        setSelectedIndex(-1);
        return;
      }

      // Arrow navigation (only when there are results)
      if (totalResults > 0 && searchQuery.trim().length >= 1) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev < totalResults - 1 ? prev + 1 : prev
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
          e.preventDefault();
          handleSelectByIndex(selectedIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResults, totalResults, searchQuery, selectedIndex]);

  const handleCustomerClick = (customer: any) => {
    // Save to recent searches
    if (searchQuery) {
      addRecentSearch(searchQuery);
    }

    if (onCustomerSelect) {
      // Create a full Customer object from search index data
      const fullCustomer: Customer = {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        idNumber: customer.idNumber,
        phone: customer.phone,
        mobile1: customer.mobile1,
        mobile2: customer.mobile2,
        city: customer.city,
        street: customer.street,
        houseNumber: null,
        birthDate: null,
        admissionDate: null,
        healthFund: null,
        branchId: null,
        branch: undefined,
        prescriptions: [],
        isPassport: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onCustomerSelect(fullCustomer);
    }
    setSearchQuery('');
    setShowResults(false);
  };

  const handlePrescriptionClick = (prescription: any) => {
    // Save to recent searches
    if (searchQuery) {
      addRecentSearch(searchQuery);
    }

    if (onPrescriptionSelect) {
      // Create a minimal Prescription object for navigation
      const minimalPrescription: Prescription = {
        id: prescription.id,
        prescriptionNumber: prescription.prescriptionNumber,
        customerId: prescription.customerId,
        type: prescription.type,
        date: prescription.date,
        healthFund: prescription.healthFund,
        price: prescription.price,
        balance: prescription.balance,
        // Add other required fields with defaults
        r: null,
        l: null,
        cylR: null,
        cylL: null,
        axR: null,
        axL: null,
        vaR: null,
        vaL: null,
        prismR: null,
        prismL: null,
        inOutR: null,
        inOutL: null,
        upDownR: null,
        upDownL: null,
        pdR: null,
        pdL: null,
        pdTotal: null,
        heightR: null,
        heightL: null,
        add: null,
        index: null,
        color: null,
        colorPercentage: null,
        frameName: null,
        frameModel: null,
        frameColor: null,
        frameBridge: null,
        frameSku: null,
        frameWidth: null,
        frameNotes: null,
        insuranceType: null,
        discountSource: null,
        prescriptionSource: null,
        campaign280: null,
        optometristId: null,
        branchId: null,
        source: null,
        notes: null,
        amountToPay: null,
        paid: null,
        receiptNumber: null,
        customer: undefined,
        optometrist: undefined,
        branch: undefined,
        createdAt: new Date().toISOString(),
        updateDate: new Date().toISOString(),
      };
      onPrescriptionSelect(minimalPrescription);
    }
    setSearchQuery('');
    setShowResults(false);
  };

  const hasResults = resultCount.customers > 0 || resultCount.prescriptions > 0;
  const showRecentSearches = !searchQuery && recentSearches.length > 0;

  // Handle selection by index (for keyboard navigation)
  const handleSelectByIndex = (index: number) => {
    if (index < results.customers.length) {
      // Select customer
      handleCustomerClick(results.customers[index]);
    } else {
      // Select prescription
      const prescriptionIndex = index - results.customers.length;
      handlePrescriptionClick(results.prescriptions[prescriptionIndex]);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder="חפש לפי שם, תעודת זהות, טלפון, מספר מרשם..."
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          dir="rtl"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              inputRef.current?.focus();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isLoading && (
          <div className="absolute left-10 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && (searchQuery.trim().length >= 1 || showRecentSearches) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-auto z-50">
          {/* Recent Searches */}
          {showRecentSearches && (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1 mb-1">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                  <Clock className="w-3 h-3" />
                  <span>חיפושים אחרונים</span>
                </div>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1"
                  title="נקה הכל"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>נקה</span>
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors group"
                    dir="rtl"
                  >
                    <div
                      onClick={() => {
                        setSearchQuery(item.query);
                        inputRef.current?.focus();
                      }}
                      className="flex-1 flex items-center gap-2"
                    >
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-700">{item.query}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentSearch(item.query);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                      title="הסר"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasResults ? (
            <>
              {/* Customers Section */}
              {results.customers.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-gray-500 uppercase">
                    <User className="w-3 h-3" />
                    <span>לקוחות ({resultCount.customers})</span>
                  </div>
                  <div className="space-y-1">
                    {results.customers.map((customer, idx) => {
                      const isSelected = selectedIndex === idx;
                      return (
                        <div
                          key={customer.id}
                          onClick={() => handleCustomerClick(customer)}
                          className={`p-2 rounded cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-primary-100 ring-2 ring-primary-500' 
                              : 'hover:bg-blue-50'
                          }`}
                          dir="rtl"
                        >
                          <div className="font-medium text-slate-800">
                            {highlightText(`${customer.firstName} ${customer.lastName}`, searchQuery)}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            {customer.idNumber && <span>ת.ז: {highlightText(customer.idNumber, searchQuery)}</span>}
                            {customer.mobile1 && (
                              <>
                                <span>•</span>
                                <span dir="ltr">{highlightText(customer.mobile1, searchQuery)}</span>
                              </>
                            )}
                            {customer.city && (
                              <>
                                <span>•</span>
                                <span>{highlightText(customer.city, searchQuery)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Prescriptions Section */}
              {results.prescriptions.length > 0 && (
                <div className={`p-2 ${results.customers.length > 0 ? 'border-t' : ''}`}>
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-gray-500 uppercase">
                    <FileText className="w-3 h-3" />
                    <span>מרשמים ({resultCount.prescriptions})</span>
                  </div>
                  <div className="space-y-1">
                    {results.prescriptions.map((prescription, idx) => {
                      const globalIndex = results.customers.length + idx;
                      const isSelected = selectedIndex === globalIndex;
                      return (
                        <div
                          key={prescription.id}
                          onClick={() => handlePrescriptionClick(prescription)}
                          className={`p-2 rounded cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-primary-100 ring-2 ring-primary-500' 
                              : 'hover:bg-blue-50'
                          }`}
                          dir="rtl"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-primary-600">
                              #{highlightText(String(prescription.prescriptionNumber || prescription.id), searchQuery)}
                            </span>
                            <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                              {prescription.type}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <span>{highlightText(prescription.customerName, searchQuery)}</span>
                            {prescription.idNumber && (
                              <>
                                <span>•</span>
                                <span>ת.ז: {prescription.idNumber}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{new Date(prescription.date).toLocaleDateString('he-IL')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>מחפש...</span>
                </div>
              ) : (
                <div>
                  <div className="text-2xl mb-2">🔍</div>
                  <div>לא נמצאו תוצאות עבור "{searchQuery}"</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
