import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { prescriptionsApi } from '../api/prescriptions';
import { customersApi } from '../api/customers';
import { EmployeesManagement } from './EmployeesManagement';
import type { Customer, Prescription } from '../types';

type Tab = 'overview' | 'employees';

interface ManagementViewProps {
  onCustomerSelect?: (customer: Customer) => void;
  onPrescriptionSelect?: (prescription: Prescription) => void;
  onNavigateToCustomers?: () => void;
  onNavigateToPrescriptions?: () => void;
}

export function ManagementView({ 
  onCustomerSelect, 
  onPrescriptionSelect,
  onNavigateToCustomers,
  onNavigateToPrescriptions,
}: ManagementViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  // Get all customers count
  const { data: allCustomers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers', 'count'],
    queryFn: () => customersApi.getAll({ limit: 50000 }),
  });

  // Get all prescriptions count
  const { data: prescriptions = [], isLoading: prescriptionsLoading } = useQuery({
    queryKey: ['prescriptions', 'all'],
    queryFn: () => prescriptionsApi.getAll({ limit: '50000' }),
  });

  const isLoading = prescriptionsLoading || customersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Get actual counts
  const totalCustomers = allCustomers.length;
  const totalPrescriptions = prescriptions.length;
  const totalRevenue = prescriptions.reduce((sum, p) => sum + (p.price || 0), 0);
  const totalPaid = prescriptions.reduce((sum, p) => sum + (p.paid || 0), 0);
  const totalBalance = prescriptions.reduce((sum, p) => sum + (p.balance || 0), 0);

  // Get recent customers - sort by most recent and get unique customers
  const recentCustomers = allCustomers
    .sort((a, b) => {
      const dateA = a.admissionDate ? new Date(a.admissionDate).getTime() : 0;
      const dateB = b.admissionDate ? new Date(b.admissionDate).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">ניהול</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 pb-0">
        <nav className="flex gap-0">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-6 py-3 rounded-t-lg font-medium transition-all ${
              activeTab === 'employees'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            עובדים
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-t-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            סקירה כללית
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'employees' ? (
        <EmployeesManagement />
      ) : (
        <OverviewTab
          prescriptions={prescriptions}
          totalCustomers={totalCustomers}
          totalPrescriptions={totalPrescriptions}
          totalRevenue={totalRevenue}
          totalBalance={totalBalance}
          recentCustomers={recentCustomers}
          onCustomerSelect={onCustomerSelect}
          onPrescriptionSelect={onPrescriptionSelect}
          onNavigateToCustomers={onNavigateToCustomers}
          onNavigateToPrescriptions={onNavigateToPrescriptions}
        />
      )}
    </div>
  );
}

function OverviewTab({
  prescriptions,
  totalCustomers,
  totalPrescriptions,
  totalRevenue,
  totalBalance,
  recentCustomers,
  onCustomerSelect,
  onPrescriptionSelect,
  onNavigateToCustomers,
  onNavigateToPrescriptions,
}: {
  prescriptions: any[];
  totalCustomers: number;
  totalPrescriptions: number;
  totalRevenue: number;
  totalBalance: number;
  recentCustomers: any[];
  onCustomerSelect?: (customer: Customer) => void;
  onPrescriptionSelect?: (prescription: Prescription) => void;
  onNavigateToCustomers?: () => void;
  onNavigateToPrescriptions?: () => void;
}) {
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
  return (
    <>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          className="card bg-blue-50 border-blue-200 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigateToCustomers && onNavigateToCustomers()}
        >
          <div className="text-sm text-blue-600 mb-1">סה"כ לקוחות</div>
          <div className="text-3xl font-bold text-blue-700">{totalCustomers.toLocaleString('he-IL')}</div>
        </div>
        <div 
          className="card bg-green-50 border-green-200 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigateToPrescriptions && onNavigateToPrescriptions()}
        >
          <div className="text-sm text-green-600 mb-1">סה"כ מרשמים</div>
          <div className="text-3xl font-bold text-green-700">{totalPrescriptions.toLocaleString('he-IL')}</div>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <div className="text-sm text-purple-600 mb-1">סה"כ הכנסות</div>
          <div className="text-3xl font-bold text-purple-700">{Math.round(totalRevenue).toLocaleString('he-IL')} ₪</div>
        </div>
        <div className="card bg-orange-50 border-orange-200">
          <div className="text-sm text-orange-600 mb-1">יתרה כוללת</div>
          <div className="text-3xl font-bold text-orange-700">{Math.round(totalBalance).toLocaleString('he-IL')} ₪</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-3">מרשמים אחרונים</h2>
          <div className="space-y-1">
            {prescriptions.slice(0, 10).map((prescription) => (
              <div
                key={prescription.id}
                onClick={() => handlePrescriptionClick(prescription)}
                className="flex items-center justify-between gap-2 p-1.5 bg-slate-50/40 rounded border border-gray-200 hover:bg-slate-100/60 hover:border-primary-300 cursor-pointer transition-all text-xs"
                dir="rtl"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-medium text-slate-800 px-1.5 py-0.5 border border-gray-300 rounded">
                    {prescription.customer?.firstName} {prescription.customer?.lastName}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                    {prescription.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs" dir="ltr">
                  {prescription.price !== null && prescription.price !== undefined && (
                    <span className="font-bold text-primary-600">₪ {prescription.price || 0}</span>
                  )}
                  <span className="text-slate-500">PD: {prescription.pdTotal?.toFixed(2) || '-'}</span>
                  {prescription.add && (
                    <span className="text-slate-500">ADD: {prescription.add.toFixed(2)}</span>
                  )}
                  <span className="text-slate-500">R: {prescription.r?.toFixed(2) || '-'}</span>
                  <span className="text-slate-500">L: {prescription.l?.toFixed(2) || '-'}</span>
                  <span className="text-slate-600 font-medium">
                    {new Date(prescription.date).toLocaleDateString('he-IL')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-3">לקוחות אחרונים</h2>
          <div className="space-y-1">
            {recentCustomers.length > 0 ? (
              recentCustomers.map((customer) => (
                customer && (
                  <div
                    key={customer.id}
                    onClick={() => handleCustomerClick(customer)}
                    className="flex items-center justify-between gap-2 p-1.5 bg-slate-50/40 rounded border border-gray-200 hover:bg-slate-100/60 hover:border-primary-300 cursor-pointer transition-all text-xs"
                    dir="rtl"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-medium text-slate-800 px-1.5 py-0.5 border border-gray-300 rounded">
                        {customer.firstName} {customer.lastName}
                      </span>
                      <span className="text-slate-500">{customer.idNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {customer.mobile1 && (
                        <span className="text-slate-500" dir="ltr">☎ {customer.mobile1}</span>
                      )}
                      {customer.mobile2 && (
                        <span className="text-slate-500" dir="ltr">☎ {customer.mobile2}</span>
                      )}
                      {(customer.city || customer.street || customer.houseNumber) && (
                        <span className="text-slate-500">
                          {customer.city}{customer.city && (customer.street || customer.houseNumber) ? ', ' : ''}{customer.street}{customer.street && customer.houseNumber ? ' ' : ''}{customer.houseNumber}
                        </span>
                      )}
                    </div>
                  </div>
                )
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">אין נתונים</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

