import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, ChevronUp, ChevronDown, ChevronsUpDown, ArrowRight } from 'lucide-react';
import { customersApi } from '../api/customers';
import { branchesApi } from '../api/branches';
import { prescriptionsApi } from '../api/prescriptions';
import type { Customer } from '../types';
import { format } from 'date-fns';
import { formatPhoneNumber } from '../utils/phoneFormatting';

interface CustomersViewProps {
  onCustomerSelect?: (customer: Customer) => void;
  branchId?: number | null;
  onBackToBranches?: () => void;
  onAddCustomer?: () => void;
}

type SortColumn = 'firstName' | 'lastName' | 'idNumber' | 'phone' | 'mobile1' | 'city' | 'admissionDate' | 'branch' | 'healthFund' | 'insuranceType';
type SortDirection = 'asc' | 'desc' | null;

export function CustomersView({ onCustomerSelect, branchId, onBackToBranches, onAddCustomer }: CustomersViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Get all customers (optionally filtered by branch)
  const { data: allCustomers = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ['customers', 'all', branchId],
    queryFn: () => customersApi.getAll({ limit: 1000, branchId: branchId || undefined }),
  });

  // Get branch name if branchId is provided
  const { data: branch } = useQuery({
    queryKey: ['branches', branchId],
    queryFn: () => branchesApi.getById(branchId!),
    enabled: !!branchId,
  });

  // Get total balance for branch if branchId is provided
  const { data: totalBalance } = useQuery({
    queryKey: ['prescriptions', 'branch', branchId, 'balance'],
    queryFn: () => prescriptionsApi.getBranchBalance(branchId!),
    enabled: !!branchId,
  });

  const isLoading = isLoadingAll;
  const customers = allCustomers;

  const handleCustomerClick = async (customer: Customer) => {
    if (!onCustomerSelect) return;

    // Fetch full customer data with prescriptions
    try {
      const fullCustomer = await customersApi.getById(customer.id);
      onCustomerSelect(fullCustomer);
    } catch (error) {
      console.error('Error fetching customer:', error);
      // Fallback to the customer we have
      onCustomerSelect(customer);
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

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter((customer) => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const firstName = customer.firstName?.toLowerCase() || '';
      const lastName = customer.lastName?.toLowerCase() || '';
      const idNumber = customer.idNumber?.toLowerCase() || '';
      const phone = customer.phone?.toLowerCase() || '';
      const mobile1 = customer.mobile1?.toLowerCase() || '';
      const city = customer.city?.toLowerCase() || '';

      return (
        firstName.includes(query) ||
        lastName.includes(query) ||
        idNumber.includes(query) ||
        phone.includes(query) ||
        mobile1.includes(query) ||
        city.includes(query)
      );
    });

    // Sort customers
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortColumn) {
          case 'firstName':
            aValue = (a.firstName || '').toLowerCase();
            bValue = (b.firstName || '').toLowerCase();
            break;
          case 'lastName':
            aValue = (a.lastName || '').toLowerCase();
            bValue = (b.lastName || '').toLowerCase();
            break;
          case 'idNumber':
            aValue = a.idNumber || '';
            bValue = b.idNumber || '';
            break;
          case 'phone':
            aValue = a.phone || '';
            bValue = b.phone || '';
            break;
          case 'mobile1':
            aValue = a.mobile1 || '';
            bValue = b.mobile1 || '';
            break;
          case 'city':
            aValue = (a.city || '').toLowerCase();
            bValue = (b.city || '').toLowerCase();
            break;
          case 'admissionDate':
            aValue = a.admissionDate ? new Date(a.admissionDate).getTime() : 0;
            bValue = b.admissionDate ? new Date(b.admissionDate).getTime() : 0;
            break;
          case 'branch':
            aValue = (a.branch?.name || '').toLowerCase();
            bValue = (b.branch?.name || '').toLowerCase();
            break;
          case 'healthFund':
            aValue = (a.healthFund || '').toLowerCase();
            bValue = (b.healthFund || '').toLowerCase();
            break;
          case 'insuranceType':
            const aLatestPrescription = a.prescriptions && a.prescriptions.length > 0
              ? a.prescriptions.sort((p1, p2) => new Date(p2.date).getTime() - new Date(p1.date).getTime())[0]
              : null;
            const bLatestPrescription = b.prescriptions && b.prescriptions.length > 0
              ? b.prescriptions.sort((p1, p2) => new Date(p2.date).getTime() - new Date(p1.date).getTime())[0]
              : null;
            aValue = (aLatestPrescription?.insuranceType || '').toLowerCase();
            bValue = (bLatestPrescription?.insuranceType || '').toLowerCase();
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
  }, [customers, searchQuery, sortColumn, sortDirection]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {branchId && onBackToBranches && (
          <button
            onClick={onBackToBranches}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
            title="חזור לסניפים"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-2xl font-bold text-slate-800">
          {branchId && branch ? `לקוחות - ${branch.name}` : 'לקוחות'}
        </h1>
      </div>

      {/* Total Balance Display for Branch */}
      {branchId && totalBalance !== undefined && (
        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-orange-600 mb-1">
                יתרה כוללת שטרם שולמה{branch ? ` בסניף ${branch.name}` : ''}
              </div>
              <div className="text-3xl font-bold text-orange-700">
                {Math.round(totalBalance).toLocaleString('he-IL')} ₪
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="card">
        <div className="flex items-center gap-4">
          {onAddCustomer && (
            <button
              onClick={onAddCustomer}
              className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-all shadow-sm whitespace-nowrap flex-shrink-0"
            >
              + לקוח חדש
            </button>
          )}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="חפש לפי שם, תעודת זהות, טלפון, או עיר..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pr-10 w-full"
              dir="rtl"
            />
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[11%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="border-b">
                <th
                  className="text-right p-3 cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                  onClick={() => handleSort('firstName')}
                >
                  <div className="flex items-center gap-1">
                    <span>שם פרטי</span>
                    {sortColumn === 'firstName' ? (
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
                  onClick={() => handleSort('lastName')}
                >
                  <div className="flex items-center gap-1">
                    <span>שם משפחה</span>
                    {sortColumn === 'lastName' ? (
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
                  onClick={() => handleSort('phone')}
                >
                  <div className="flex items-center gap-1">
                    <span>טלפון</span>
                    {sortColumn === 'phone' ? (
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
                  onClick={() => handleSort('mobile1')}
                >
                  <div className="flex items-center gap-1">
                    <span>נייד</span>
                    {sortColumn === 'mobile1' ? (
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
                  onClick={() => handleSort('city')}
                >
                  <div className="flex items-center gap-1">
                    <span>עיר</span>
                    {sortColumn === 'city' ? (
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
                  onClick={() => handleSort('admissionDate')}
                >
                  <div className="flex items-center gap-1">
                    <span>תאריך הצטרפות</span>
                    {sortColumn === 'admissionDate' ? (
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
                  onClick={() => handleSort('insuranceType')}
                >
                  <div className="flex items-center gap-1">
                    <span>סוג ביטוח</span>
                    {sortColumn === 'insuranceType' ? (
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
                  onClick={() => handleSort('branch')}
                >
                  <div className="flex items-center gap-1">
                    <span>סניף</span>
                    {sortColumn === 'branch' ? (
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
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => handleCustomerClick(customer)}
                    className="border-b hover:bg-slate-50/60 cursor-pointer transition-colors"
                  >
                    <td className="p-3 truncate">
                      <span className="font-medium">{customer.firstName || '-'}</span>
                    </td>
                    <td className="p-3 truncate">
                      <span className="font-medium">{customer.lastName || '-'}</span>
                    </td>
                    <td className="p-3 text-gray-600 truncate">{customer.idNumber || '-'}</td>
                    <td className="p-3 text-gray-600 truncate">{formatPhoneNumber(customer.phone) || '-'}</td>
                    <td className="p-3 text-gray-600 truncate">{formatPhoneNumber(customer.mobile1) || '-'}</td>
                    <td className="p-3 text-gray-600 truncate">{customer.city || '-'}</td>
                    <td className="p-3 text-gray-600 truncate">
                      {customer.admissionDate
                        ? format(new Date(customer.admissionDate), 'dd/MM/yyyy')
                        : '-'}
                    </td>
                    <td className="p-3 text-gray-600 truncate">{customer.healthFund || '-'}</td>
                    <td className="p-3 text-gray-600 truncate">
                      {customer.prescriptions && customer.prescriptions.length > 0
                        ? customer.prescriptions
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                            .insuranceType || '-'
                        : '-'}
                    </td>
                    <td className="p-3 text-gray-600 truncate">{customer.branch?.name || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500">
                    {searchQuery ? 'לא נמצאו לקוחות התואמים לחיפוש' : 'אין לקוחות'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredCustomers.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              סה"כ לקוחות: <span className="font-medium">{filteredCustomers.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

