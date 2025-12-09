import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { CustomerPanel } from './components/CustomerPanel';
import { PasswordModal } from './components/PasswordModal';
import { PrescriptionsScrollCards } from './components/PrescriptionsScrollCards';
import { PrescriptionDetails } from './components/PrescriptionDetails';
import { PaymentPanel } from './components/PaymentPanel';
import { AddCustomerModal } from './components/AddCustomerModal';
import { AddCustomerCard } from './components/AddCustomerCard';

import { ManagementView } from './components/ManagementView';
import { BranchesView } from './components/BranchesView';
import { CustomersView } from './components/CustomersView';
import { PrescriptionsView } from './components/PrescriptionsView';
import { ReportsView } from './components/ReportsView';
import { LoginButton } from './components/LoginButton';
import { GlobalSearch } from './components/GlobalSearch';
import { useAuth } from './contexts/AuthContext';
import { customersApi } from './api/customers';
import type { Customer, Prescription } from './types';

function App() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeView, setActiveView] = useState('main');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [showAddCustomerCard, setShowAddCustomerCard] = useState(false);
  const [isDuplicatedCustomer, setIsDuplicatedCustomer] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);

  // Reset isDuplicatedCustomer flag when customer changes (not during duplication)
  useEffect(() => {
    if (selectedCustomer && !isDuplicatedCustomer) {
      // Customer changed naturally, not from duplication
      setIsDuplicatedCustomer(false);
    }
  }, [selectedCustomer?.id]);

  // Fetch all customers sorted by lastName for navigation
  useEffect(() => {
    const fetchAllCustomers = async () => {
      try {
        const customers = await customersApi.getAll({ limit: 10000 });
        // Sort by lastName (Hebrew)
        const sorted = customers.sort((a, b) => {
          const lastNameA = a.lastName || '';
          const lastNameB = b.lastName || '';
          return lastNameA.localeCompare(lastNameB, 'he');
        });
        setAllCustomers(sorted);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      }
    };
    fetchAllCustomers();
  }, [selectedCustomer]); // Refresh when customer changes

  const handleCustomerSelect = async (customer: Customer | null) => {
    // Reset duplication flag when manually selecting a different customer
    if (customer && selectedCustomer && customer.id !== selectedCustomer.id && !isDuplicatedCustomer) {
      setIsDuplicatedCustomer(false);
    }
    if (customer) {
      // Refresh customer data from server to get latest updates
      try {
        const refreshedCustomer = await customersApi.getById(customer.id);
        setSelectedCustomer(refreshedCustomer);
        // Auto-select the latest prescription if available
        if (refreshedCustomer.prescriptions && refreshedCustomer.prescriptions.length > 0) {
          const latestPrescription = refreshedCustomer.prescriptions.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];
          setSelectedPrescription(latestPrescription);
        } else {
          setSelectedPrescription(null);
        }
      } catch (error) {
        // Fallback to provided customer if refresh fails
        setSelectedCustomer(customer);
        if (customer?.prescriptions && customer.prescriptions.length > 0) {
          const latestPrescription = customer.prescriptions.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];
          setSelectedPrescription(latestPrescription);
        } else {
          setSelectedPrescription(null);
        }
      }
    } else {
      setSelectedCustomer(null);
      setSelectedPrescription(null);
    }
  };

  const handlePrescriptionSelect = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
  };

  const handleAddCustomerSuccess = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsAddCustomerModalOpen(false);
  };



  const handleViewChange = (view: string) => {
    // Reset branch filter when navigating to customers from menu
    if (view === 'customers') {
      setSelectedBranchId(null);
    }
    setActiveView(view);
  };

  const renderMainView = () => {
    if (showAddCustomerCard) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <AddCustomerCard
                onSuccess={(customer) => {
                  handleCustomerSelect(customer);
                  setShowAddCustomerCard(false);
                  // Create a new empty prescription for the customer
                  setTimeout(() => {
                    const newPrescription: Partial<Prescription> = {
                      customerId: customer.id,
                      date: new Date().toISOString().split('T')[0],
                      type: 'מרחק',
                    };
                    setSelectedPrescription(newPrescription as Prescription);
                  }, 100);
                }}
                onCancel={() => setShowAddCustomerCard(false)}
              />
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
              בחר מרשם כדי לראות פרטים
            </div>
          </div>
        </div>
      );
    } else if (selectedCustomer) {
      return (
        <div className="space-y-6">
          {/* Customer Info and Latest Prescription */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Customer Panel - Left Side */}
            <div className="lg:col-span-4 space-y-4">
              <CustomerPanel
                customer={selectedCustomer}
                onUpdate={(updatedCustomer) => {
                  handleCustomerSelect(updatedCustomer);
                  // Reset duplication flag after update
                  setIsDuplicatedCustomer(false);
                }}
                onDelete={(customer) => {
                  setCustomerToDelete(customer);
                  setShowDeleteModal(true);
                }}
                onNavigate={(direction) => {
                  if (!selectedCustomer || allCustomers.length === 0) return;
                  
                  const currentIndex = allCustomers.findIndex(c => c.id === selectedCustomer.id);
                  if (currentIndex === -1) return;
                  
                  let nextIndex;
                  if (direction === 'prev') {
                    nextIndex = currentIndex - 1;
                    if (nextIndex < 0) nextIndex = allCustomers.length - 1; // Wrap to end
                  } else {
                    nextIndex = currentIndex + 1;
                    if (nextIndex >= allCustomers.length) nextIndex = 0; // Wrap to start
                  }
                  
                  handleCustomerSelect(allCustomers[nextIndex]);
                }}
                onNavigateToCustomer={(customerId) => {
                  const targetCustomer = allCustomers.find(c => c.id === customerId);
                  if (targetCustomer) {
                    handleCustomerSelect(targetCustomer);
                  }
                }}
                startInEditMode={isDuplicatedCustomer}
onDuplicate={async (customer) => {
                  try {
                    // Create a duplicate customer with the same details (excluding id, idNumber, and prescriptions)
                    const duplicateData: Partial<Customer> = {
                      firstName: customer.firstName,
                      lastName: customer.lastName,
                      // idNumber is intentionally excluded so user can enter a new one
                      isPassport: customer.isPassport,
                      birthDate: customer.birthDate,
                      phone: customer.phone,
                      street: customer.street,
                      houseNumber: customer.houseNumber,
                      entrance: customer.entrance,
                      apartment: customer.apartment,
                      city: customer.city,
                      healthFund: customer.healthFund,
                      branchId: customer.branchId,
                    };
                    
                    // Create the duplicate customer
                    const newCustomer = await customersApi.create(duplicateData);
                    
                    // Select the new customer and mark as duplicated to open in edit mode
                    setIsDuplicatedCustomer(true);
                    handleCustomerSelect(newCustomer);
                    
                    // Create a new empty prescription for the duplicated customer
                    setTimeout(() => {
                      const newPrescription: Partial<Prescription> = {
                        customerId: newCustomer.id,
                        date: new Date().toISOString().split('T')[0],
                        type: 'מרחק',
                      };
                      setSelectedPrescription(newPrescription as Prescription);
                    }, 100);
                  } catch (error) {
                    console.error('Failed to duplicate customer:', error);
                    alert('שגיאה בשכפול הלקוח');
                  }
                }}
              />
              {/* Payment Panel - Moved below Customer Panel */}
              <PaymentPanel customer={selectedCustomer} />
            </div>
            
            {/* Prescription Details - Middle, Expanded */}
            <div className="lg:col-span-8 space-y-4">
              {selectedPrescription ? (
                <PrescriptionDetails
                  prescription={selectedPrescription}
                  customer={selectedCustomer}
                  onUpdate={async (updated) => {
                    setSelectedPrescription(updated);
                    // Refresh customer data to get updated prescriptions list, but keep the selected prescription
                    if (selectedCustomer) {
                      try {
                        const refreshedCustomer = await customersApi.getById(selectedCustomer.id);
                        setSelectedCustomer(refreshedCustomer);
                        // Don't auto-select latest prescription - keep the one we just selected
                      } catch (error) {
                        console.error('Error refreshing customer:', error);
                        // Keep current customer if refresh fails
                      }
                    }
                  }}
                  onClose={() => setSelectedPrescription(null)}
                  onAddNew={() => {
                    // Create a new inline editable prescription
                    const newPrescription: Partial<Prescription> = {
                      customerId: selectedCustomer.id,
                      date: new Date().toISOString().split('T')[0],
                      type: 'מרחק',
                    };
                    setSelectedPrescription(newPrescription as Prescription);
                  }}
                />
              ) : (
                <div className="card">
                  <p className="text-gray-500 text-center py-4">
                    בחר מרשם כדי לראות פרטים
                  </p>
                </div>
              )}
              {/* Additional Prescriptions - Moved below Prescription Details */}
              <PrescriptionsScrollCards
                customerId={selectedCustomer.id}
                selectedPrescription={selectedPrescription}
                onSelect={handlePrescriptionSelect}
                onAddNew={() => {
                  // Create a new inline editable prescription
                  const newPrescription: Partial<Prescription> = {
                    customerId: selectedCustomer.id,
                    date: new Date().toISOString().split('T')[0],
                    type: 'מרחק',
                  };
                  setSelectedPrescription(newPrescription as Prescription);
                }}
              />
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">חפש לקוח כדי להתחיל</p>
        </div>
      );
    }
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">טוען...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center" dir="rtl">
        <div className="card max-w-md w-full mx-4 text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">ניהול חנות אופטיקה</h1>
          <p className="text-slate-600 mb-6">אנא התחבר כדי להמשיך</p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Top Header with Navigation */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="רשת משקפיים 280" 
                className="h-9 w-auto"
              />
              <Sidebar activeView={activeView} onViewChange={handleViewChange} />
            </div>
            <div className="flex items-center gap-3">
              <LoginButton />
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar - Full Width Below Header */}
      {activeView === 'main' && isAuthenticated && (
        <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200/60 sticky top-[45px] z-40">
          <div className="max-w-7xl mx-auto px-4 py-1.5">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <GlobalSearch
                  onCustomerSelect={handleCustomerSelect}
                  onPrescriptionSelect={(prescription) => {
                    setSelectedPrescription(prescription);
                  }}
                />
              </div>
              <button
                onClick={() => {
                  // Clear current selection and show add customer form
                  setSelectedCustomer(null);
                  setSelectedPrescription(null);
                  setShowAddCustomerCard(true);
                }}
                className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-all shadow-sm whitespace-nowrap"
              >
                + לקוח חדש
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-3">
          {activeView === 'main' && renderMainView()}
          {activeView === 'management' && (
            <ManagementView
              onCustomerSelect={async (customer) => {
                // Fetch full customer data with prescriptions
                try {
                  const fullCustomer = await customersApi.getById(customer.id);
                  handleCustomerSelect(fullCustomer);
                  setActiveView('main');
                } catch (error) {
                  console.error('Error fetching customer:', error);
                  handleCustomerSelect(customer);
                  setActiveView('main');
                }
              }}
              onPrescriptionSelect={async (prescription) => {
                // Fetch full customer data with prescriptions
                try {
                  const customer = await customersApi.getById(prescription.customerId);
                  handleCustomerSelect(customer);
                  // Find the prescription in the customer's prescriptions
                  const fullPrescription = customer.prescriptions?.find(
                    (p) => p.id === prescription.id
                  ) || prescription;
                  setSelectedPrescription(fullPrescription);
                  setActiveView('main');
                } catch (error) {
                  console.error('Error fetching customer for prescription:', error);
                  if (prescription.customer) {
                    handleCustomerSelect(prescription.customer as Customer);
                    setSelectedPrescription(prescription);
                    setActiveView('main');
                  }
                }
              }}
              onNavigateToCustomers={() => {
                setSelectedBranchId(null);
                setActiveView('customers');
              }}
              onNavigateToPrescriptions={() => {
                setActiveView('prescriptions');
              }}
            />
          )}
          {activeView === 'customers' && (
            <CustomersView
              branchId={selectedBranchId}
              onBackToBranches={() => {
                setSelectedBranchId(null);
                setActiveView('branches');
              }}
              onCustomerSelect={async (customer) => {
                // Fetch full customer data with prescriptions
                try {
                  const fullCustomer = await customersApi.getById(customer.id);
                  handleCustomerSelect(fullCustomer);
                  setActiveView('main');
                } catch (error) {
                  console.error('Error fetching customer:', error);
                  handleCustomerSelect(customer);
                  setActiveView('main');
                }
              }}
              onAddCustomer={() => {
                setShowAddCustomerCard(true);
                setActiveView('main');
              }}
            />
          )}
          {activeView === 'prescriptions' && (
            <PrescriptionsView
              onPrescriptionSelect={async (prescription) => {
                // Fetch full customer data with prescriptions
                try {
                  const customer = await customersApi.getById(prescription.customerId);
                  handleCustomerSelect(customer);
                  // Find the prescription in the customer's prescriptions
                  const fullPrescription = customer.prescriptions?.find(
                    (p) => p.id === prescription.id
                  ) || prescription;
                  setSelectedPrescription(fullPrescription);
                  setActiveView('main');
                } catch (error) {
                  console.error('Error fetching customer for prescription:', error);
                  if (prescription.customer) {
                    handleCustomerSelect(prescription.customer as Customer);
                    setSelectedPrescription(prescription);
                    setActiveView('main');
                  }
                }
              }}
            />
          )}
          {activeView === 'branches' && (
            <BranchesView
              onBranchClick={(branchId) => {
                setSelectedBranchId(branchId);
                setActiveView('customers');
              }}
            />
          )}
          {activeView === 'reports' && <ReportsView />}
        </main>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        onSuccess={handleAddCustomerSuccess}
      />

      {/* Add Prescription Modal */}


      {/* Delete Customer Modal */}
      <PasswordModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCustomerToDelete(null);
        }}
        onConfirm={async (password) => {
          if (!customerToDelete) return;
          
          try {
            await customersApi.delete(customerToDelete.id, password);
            setShowDeleteModal(false);
            setCustomerToDelete(null);
            // Clear selection and refresh
            setSelectedCustomer(null);
            setSelectedPrescription(null);
            alert('הלקוח נמחק בהצלחה');
          } catch (error: any) {
            if (error.response?.status === 403) {
              alert('סיסמה שגויה');
            } else {
              alert('שגיאה במחיקת הלקוח');
            }
            console.error('Failed to delete customer:', error);
          }
        }}
        title="מחיקת לקוח"
        message="האם אתה בטוח שברצונך למחוק לקוח זה? פעולה זו אינה ניתנת לביטול."
      />
    </div>
  );
}

export default App;

