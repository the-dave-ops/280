import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import Fuse from 'fuse.js';
import { prescriptionsApi } from '../api/prescriptions';
import { customersApi } from '../api/customers';
import type { Prescription, Customer } from '../types';
import { format } from 'date-fns';

interface PrescriptionsViewProps {
  onPrescriptionSelect?: (prescription: Prescription) => void;
}

type SortColumn = 'prescriptionNumber' | 'customer' | 'idNumber' | 'type' | 'date' | 'price' | 'balance' | 'healthFund';
type SortDirection = 'asc' | 'desc' | null;

export function PrescriptionsView({ onPrescriptionSelect }: PrescriptionsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const getHealthFundColor = (healthFund: string) => {
    switch (healthFund) {
      case 'מאוחדת':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'כללית':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'מכבי':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'לאומית':
        return 'bg-lime-100 text-lime-700 border-lime-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['prescriptions', 'all'],
    queryFn: () => prescriptionsApi.getAll({ limit: '1000' }),
  });

  const handlePrescriptionClick = async (prescription: Prescription) => {
    if (!onPrescriptionSelect) return;

    // If customer data is not complete, fetch it
    if (!prescription.customer || !prescription.customer.prescriptions) {
      try {
        const customer = await customersApi.getById(prescription.customerId);
        const prescriptionWithCustomer = { ...prescription, customer };
        onPrescriptionSelect(prescriptionWithCustomer);
      } catch (error) {
        console.error('Error fetching customer for prescription:', error);
        onPrescriptionSelect(prescription);
      }
    } else {
      onPrescriptionSelect(prescription);
    }
  };

  // Handle column sort
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Create Fuse.js instance for fast searching
  const prescriptionsFuse = useMemo(() => {
    if (prescriptions.length === 0) return null;
    
    // Prepare data for Fuse.js with flattened customer fields
    const searchableData = prescriptions.map(p => ({
      ...p,
      customerFirstName: p.customer?.firstName || '',
      customerLastName: p.customer?.lastName || '',
      customerFullName: `${p.customer?.firstName || ''} ${p.customer?.lastName || ''}`.trim(),
      customerIdNumber: p.customer?.idNumber || '',
      prescriptionNumberStr: p.prescriptionNumber?.toString() || '',
    }));

    return new Fuse(searchableData, {
      keys: [
        { name: 'prescriptionNumberStr', weight: 3 },
        { name: 'customerFirstName', weight: 2 },
        { name: 'customerLastName', weight: 2 },
        { name: 'customerFullName', weight: 2.5 },
        { name: 'customerIdNumber', weight: 1.5 },
        { name: 'type', weight: 1 },
        { name: 'healthFund', weight: 0.8 },
      ],
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 1,
    });
  }, [prescriptions]);

  // Filter prescriptions based on search query
  const filteredPrescriptions = useMemo(() => {
    let filtered = prescriptions;

    // Fast search with Fuse.js
    if (searchQuery.trim() && prescriptionsFuse) {
      filtered = prescriptionsFuse
        .search(searchQuery)
        .map(result => result.item);
    }

    // Sort prescriptions
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortColumn) {
          case 'prescriptionNumber':
            aValue = a.prescriptionNumber ?? 0;
            bValue = b.prescriptionNumber ?? 0;
            break;
          case 'customer':
            aValue = `${a.customer?.firstName || ''} ${a.customer?.lastName || ''}`.toLowerCase();
            bValue = `${b.customer?.firstName || ''} ${b.customer?.lastName || ''}`.toLowerCase();
            break;
          case 'idNumber':
            aValue = a.customer?.idNumber || '';
            bValue = b.customer?.idNumber || '';
            break;
          case 'type':
            aValue = a.type;
            bValue = b.type;
            break;
          case 'date':
            aValue = new Date(a.date).getTime();
            bValue = new Date(b.date).getTime();
            break;
          case 'price':
            aValue = a.price ?? 0;
            bValue = b.price ?? 0;
            break;
          case 'balance':
            aValue = a.balance ?? 0;
            bValue = b.balance ?? 0;
            break;
          case 'healthFund':
            aValue = (a.healthFund || '').toLowerCase();
            bValue = (b.healthFund || '').toLowerCase();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [prescriptions, searchQuery, sortColumn, sortDirection]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">מרשמים</h1>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="חפש לפי שם לקוח, תעודת זהות, סוג מרשם, או מספר מרשם..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pr-10 w-full"
            dir="rtl"
          />
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th
                  className="text-right p-3 cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                  onClick={() => handleSort('prescriptionNumber')}
                >
                  <div className="flex items-center gap-1">
                    <span>מספר מרשם</span>
                    {sortColumn === 'prescriptionNumber' ? (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4 text-primary-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-primary-600" />
                      )
                    ) : (
                      <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </th>
                <th
                  className="text-right p-3 cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                  onClick={() => handleSort('customer')}
                >
                  <div className="flex items-center gap-1">
                    <span>לקוח</span>
                    {sortColumn === 'customer' ? (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4 text-primary-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-primary-600" />
                      )
                    ) : (
                      <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </th>
                <th
                  className="text-right p-3 cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                  onClick={() => handleSort('idNumber')}
                >
                  <div className="flex items-center gap-1">
                    <span>תעודת זהות</span>
                    {sortColumn === 'idNumber' ? (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4 text-primary-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-primary-600" />
                      )
                    ) : (
                      <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </th>
                <th
                  className="text-right p-3 cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-1">
                    <span>סוג</span>
                    {sortColumn === 'type' ? (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4 text-primary-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-primary-600" />
                      )
                    ) : (
                      <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </th>
                <th
                  className="text-right p-3 cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    <span>תאריך</span>
                    {sortColumn === 'date' ? (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4 text-primary-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-primary-600" />
                      )
                    ) : (
                      <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </th>
                <th
                  className="text-right p-3 cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center gap-1">
                    <span>מחיר</span>
                    {sortColumn === 'price' ? (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4 text-primary-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-primary-600" />
                      )
                    ) : (
                      <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </th>
                <th
                  className="text-right p-3 cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                  onClick={() => handleSort('healthFund')}
                >
                  <div className="flex items-center gap-1">
                    <span>קופת חולים</span>
                    {sortColumn === 'healthFund' ? (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4 text-primary-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-primary-600" />
                      )
                    ) : (
                      <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </th>
                <th
                  className="text-right p-3 cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                  onClick={() => handleSort('balance')}
                >
                  <div className="flex items-center gap-1">
                    <span>יתרה</span>
                    {sortColumn === 'balance' ? (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4 text-primary-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-primary-600" />
                      )
                    ) : (
                      <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPrescriptions.length > 0 ? (
                filteredPrescriptions.map((prescription) => (
                  <tr
                    key={prescription.id}
                    onClick={() => handlePrescriptionClick(prescription)}
                    className="border-b hover:bg-slate-50/60 cursor-pointer transition-colors"
                  >
                    <td className="p-1.5">
                      <span className="font-medium text-primary-600">
                        {prescription.prescriptionNumber || '-'}
                      </span>
                    </td>
                    <td className="p-1.5">
                      <div className="font-medium">
                        {prescription.customer?.firstName} {prescription.customer?.lastName}
                      </div>
                    </td>
                    <td className="p-1.5 text-gray-600">{prescription.customer?.idNumber || '-'}</td>
                    <td className="p-1.5">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          prescription.type === 'מרחק'
                            ? 'bg-blue-100 text-blue-700'
                            : prescription.type === 'קריאה'
                              ? 'bg-green-100 text-green-700'
                              : prescription.type === 'עדשות מגע'
                                ? 'bg-purple-100 text-purple-700'
                                : prescription.type === 'מולטיפוקל'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {prescription.type}
                      </span>
                    </td>
                    <td className="p-1.5 text-gray-600">
                      {format(new Date(prescription.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="p-1.5">
                      <span className="font-medium">{prescription.price || 0} ₪</span>
                    </td>
                    <td className="p-1.5">
                      {prescription.healthFund ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getHealthFundColor(prescription.healthFund)}`}>
                          {prescription.healthFund}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-1.5">
                      <span
                        className={`font-medium ${
                          prescription.balance && prescription.balance > 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {prescription.balance || 0} ₪
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    {searchQuery ? 'לא נמצאו מרשמים התואמים לחיפוש' : 'אין מרשמים'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredPrescriptions.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              סה"כ מרשמים: <span className="font-medium">{filteredPrescriptions.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

